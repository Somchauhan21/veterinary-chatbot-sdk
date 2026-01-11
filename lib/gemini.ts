import { GoogleGenerativeAI } from "@google/generative-ai"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ""

// System prompt for veterinary assistant
const SYSTEM_PROMPT = `You are a friendly and knowledgeable veterinary assistant chatbot. Your role is to help pet owners with questions about their pets' health and wellbeing.

IMPORTANT RULES:
1. ONLY answer questions related to veterinary and pet care topics including:
   - Pet health and wellness
   - Vaccinations and preventive care
   - Diet and nutrition for pets
   - Common illnesses and symptoms
   - Grooming and hygiene
   - Pet behavior
   - General pet care advice

2. If asked about non-veterinary topics (politics, weather, coding, math, general knowledge, etc.), politely decline and redirect:
   "I appreciate your question, but I'm specifically designed to help with veterinary and pet-related topics. Is there anything about your pet's health or care I can help with?"

3. If someone expresses intent to book an appointment (phrases like "book appointment", "schedule visit", "see a vet", "make appointment"), respond EXACTLY with: [BOOKING_INTENT]

4. Keep responses concise, friendly, and helpful (2-3 paragraphs max).

5. Always recommend consulting a veterinarian for serious health concerns.

6. If a pet name is mentioned in context, personalize your responses using that name.`

let genAI: GoogleGenerativeAI | null = null
let model: any = null

export function initializeGemini() {
  if (!GEMINI_API_KEY) {
    console.warn("[v0] GEMINI_API_KEY not set - AI responses will be mocked")
    return false
  }

  try {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" })
    console.log("[v0] Gemini AI initialized successfully")
    return true
  } catch (error) {
    console.error("[v0] Failed to initialize Gemini:", error)
    return false
  }
}

export async function generateResponse(
  userMessage: string,
  context?: { petName?: string; userName?: string },
  conversationHistory?: Array<{ role: string; content: string }>,
): Promise<string> {
  // Build context string
  let contextInfo = ""
  if (context?.userName) contextInfo += `User's name: ${context.userName}. `
  if (context?.petName) contextInfo += `Pet's name: ${context.petName}. `

  const fullPrompt = `${SYSTEM_PROMPT}

${contextInfo ? `Context: ${contextInfo}` : ""}

${
  conversationHistory && conversationHistory.length > 0
    ? `Previous conversation:\n${conversationHistory
        .slice(-6)
        .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
        .join("\n")}\n`
    : ""
}

User: ${userMessage}

Respond helpfully as the veterinary assistant:`

  // Check if Gemini is available
  if (!model) {
    // Try to initialize
    if (!initializeGemini()) {
      console.log("[v0] Using mock response - Gemini not available")
      return getMockResponse(userMessage, context)
    }
  }

  try {
    console.log("[v0] Calling Gemini API...")
    const result = await model.generateContent(fullPrompt)
    const response = await result.response
    const text = response.text()
    console.log("[v0] Gemini API response received successfully")
    return text
  } catch (error: any) {
    console.error("[v0] Gemini API error:", error?.message || error)
    return getMockResponse(userMessage, context)
  }
}

// Fallback mock responses
function getMockResponse(message: string, context?: { petName?: string }): string {
  const lowerMessage = message.toLowerCase()
  const petName = context?.petName

  // Check for booking intent
  if (lowerMessage.includes("book") || lowerMessage.includes("appointment") || lowerMessage.includes("schedule")) {
    return "[BOOKING_INTENT]"
  }

  // Check for non-vet topics
  const nonVetTopics = ["weather", "politics", "sports", "code", "programming", "math", "calculate", "news"]
  if (nonVetTopics.some((topic) => lowerMessage.includes(topic))) {
    return "I appreciate your question, but I'm specifically designed to help with veterinary and pet-related topics. I can answer questions about pet care, health, nutrition, vaccinations, and help you book appointments. Is there anything pet-related I can help you with?"
  }

  // Veterinary responses
  if (lowerMessage.includes("vaccine") || lowerMessage.includes("vaccination")) {
    return `Great question about vaccinations${petName ? ` for ${petName}` : ""}! Core vaccines for dogs typically include rabies, distemper, parvovirus, and adenovirus. For cats, core vaccines include rabies, feline panleukopenia, calicivirus, and herpesvirus.\n\nThe vaccination schedule depends on your pet's age, health, and lifestyle. I recommend consulting with your veterinarian for a personalized schedule. Would you like to book an appointment?`
  }

  if (lowerMessage.includes("food") || lowerMessage.includes("diet") || lowerMessage.includes("nutrition")) {
    return `Nutrition is crucial for your pet's health${petName ? ` for ${petName}` : ""}! A balanced diet should include high-quality protein as the main ingredient.\n\nFor dogs, look for real meat (chicken, beef, fish) as the first ingredient. For cats, they're obligate carnivores, so meat-based protein is essential.\n\nAlways provide fresh water and adjust portions based on age, size, and activity level.`
  }

  if (lowerMessage.includes("sick") || lowerMessage.includes("symptom") || lowerMessage.includes("vomit")) {
    return `I'm sorry to hear${petName ? ` ${petName}` : " your pet"} isn't feeling well. Common signs needing veterinary attention include:\n\n• Persistent vomiting or diarrhea\n• Lethargy or weakness\n• Loss of appetite over 24 hours\n• Difficulty breathing\n\nIf you're concerned, I recommend booking an appointment soon. Would you like help scheduling one?`
  }

  return `I'm here to help with veterinary and pet-related questions${petName ? ` about ${petName}` : ""}! I can assist with:\n\n• Pet care and grooming\n• Vaccination information\n• Diet and nutrition\n• Common health concerns\n• Booking appointments\n\nWhat would you like to know?`
}

export function isGeminiAvailable(): boolean {
  return model !== null
}
