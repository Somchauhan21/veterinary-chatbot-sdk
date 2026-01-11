import { GoogleGenerativeAI } from "@google/generative-ai"
import { logger } from "../utils/logger.js"

const SYSTEM_PROMPT = `You are a friendly and knowledgeable veterinary assistant chatbot. Your role is to:

1. Answer questions ONLY about veterinary and pet-related topics, including:
   - Pet care and grooming
   - Vaccinations and preventive care
   - Diet and nutrition for pets
   - Common pet illnesses and symptoms
   - General pet health advice
   - Pet behavior questions

2. IMPORTANT RESTRICTIONS:
   - If asked about non-veterinary topics (politics, coding, math, general knowledge, etc.), politely decline and explain you can only help with pet and veterinary questions.
   - Never provide specific medical diagnoses - always recommend consulting a veterinarian for serious concerns.
   - Never prescribe medications or dosages.

3. When responding:
   - Be warm, friendly, and empathetic
   - Use simple language that pet owners can understand
   - If the user has provided their pet's name, use it in your responses
   - Keep responses concise but helpful (2-4 paragraphs max)

4. For appointment booking:
   - If the user wants to book an appointment, schedule a vet visit, or make a reservation, respond EXACTLY with: "[BOOKING_INTENT]"
   - This signals the system to start the booking flow

Remember: You are a helpful assistant, not a replacement for professional veterinary care.`

class AIService {
  constructor() {
    this.genAI = null
    this.model = null
    this.initialized = false
    this.usingMock = true
    this.apiKey = null
  }

  initialize() {
    if (this.initialized) {
      return
    }

    const apiKey = process.env.GEMINI_API_KEY

    logger.info(`[v0] Checking GEMINI_API_KEY...`)
    logger.info(`[v0] API Key exists: ${!!apiKey}`)
    logger.info(`[v0] API Key length: ${apiKey ? apiKey.length : 0}`)
    logger.info(`[v0] API Key starts with: ${apiKey ? apiKey.substring(0, 10) + "..." : "N/A"}`)

    if (!apiKey || apiKey.trim() === "" || apiKey === "your_gemini_api_key_here") {
      logger.warn("GEMINI_API_KEY not set or invalid - AI responses will be mocked")
      this.usingMock = true
      this.initialized = true
      return
    }

    try {
      this.apiKey = apiKey.trim()
      this.genAI = new GoogleGenerativeAI(this.apiKey)
      this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" })
      this.usingMock = false
      this.initialized = true
      logger.info("AI Service initialized successfully with Gemini API")
      logger.info(`[v0] usingMock set to: ${this.usingMock}`)
      logger.info(`[v0] model created: ${!!this.model}`)
    } catch (error) {
      logger.error("Failed to initialize Gemini AI:", error.message)
      this.usingMock = true
      this.initialized = true
    }
  }

  async generateResponse(messages, context = {}) {
    logger.info(`[v0] generateResponse called`)
    logger.info(`[v0] usingMock: ${this.usingMock}`)
    logger.info(`[v0] model exists: ${!!this.model}`)
    logger.info(`[v0] initialized: ${this.initialized}`)

    if (!this.initialized) {
      this.initialize()
    }

    // Build context string
    let contextStr = ""
    if (context.userName) contextStr += `User's name: ${context.userName}. `
    if (context.petName) contextStr += `Pet's name: ${context.petName}. `

    // Get the last user message
    const lastMessage = messages[messages.length - 1]?.content || ""

    // Build conversation history for context
    const conversationHistory = messages
      .slice(-10)
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n")

    const prompt = `${SYSTEM_PROMPT}

${contextStr ? `Context: ${contextStr}` : ""}

Conversation history:
${conversationHistory}

Please respond to the user's last message.`

    if (this.model && this.apiKey) {
      try {
        logger.info("[v0] Attempting to call Gemini API...")
        logger.info(`[v0] Prompt length: ${prompt.length}`)

        const result = await this.model.generateContent(prompt)
        const response = await result.response
        const text = response.text()

        logger.info("[v0] Gemini API call SUCCESS")
        logger.info(`[v0] Response length: ${text.length}`)
        logger.info(`[v0] Response preview: ${text.substring(0, 100)}...`)

        return text
      } catch (error) {
        logger.error("[v0] Gemini API call FAILED:", error.message)
        logger.error("[v0] Full error:", JSON.stringify(error, null, 2))

        if (error.message.includes("API_KEY_INVALID")) {
          logger.error("[v0] Your API key is invalid. Please check it in .env file")
        } else if (error.message.includes("QUOTA")) {
          logger.error("[v0] API quota exceeded. Please check your Google Cloud billing")
        }

        logger.info("[v0] Falling back to mock response")
        return this.getMockResponse(lastMessage)
      }
    } else {
      logger.info("[v0] Using mock response (no model/apiKey)")
      return this.getMockResponse(lastMessage)
    }
  }

  getMockResponse(message) {
    const lowerMessage = message.toLowerCase()

    if (lowerMessage.includes("book") || lowerMessage.includes("appointment") || lowerMessage.includes("schedule")) {
      return "[BOOKING_INTENT]"
    }

    if (lowerMessage.includes("vaccine") || lowerMessage.includes("vaccination")) {
      return "Vaccinations are crucial for your pet's health! Core vaccines for dogs typically include rabies, distemper, parvovirus, and adenovirus. For cats, core vaccines include rabies, feline panleukopenia, calicivirus, and herpesvirus. I recommend consulting with your veterinarian for a personalized vaccination schedule based on your pet's age, lifestyle, and health status."
    }

    if (lowerMessage.includes("food") || lowerMessage.includes("diet") || lowerMessage.includes("eat")) {
      return "A balanced diet is essential for your pet's wellbeing! The best diet depends on your pet's species, age, size, and any health conditions. Generally, look for high-quality pet food with real meat as the first ingredient. Avoid foods with excessive fillers or artificial additives. Fresh water should always be available. Would you like more specific dietary advice for your pet?"
    }

    return "I'm here to help with any veterinary or pet-related questions you might have! Feel free to ask about pet care, nutrition, vaccinations, common health concerns, or if you'd like to book an appointment with our veterinary team."
  }

  checkBookingIntent(response) {
    return response.includes("[BOOKING_INTENT]")
  }

  getStatus() {
    return {
      initialized: this.initialized,
      usingMock: this.usingMock,
      hasModel: !!this.model,
      hasApiKey: !!this.apiKey,
    }
  }
}

export const aiService = new AIService()
