import { type NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { getCollection } from "@/lib/db"
import { initializeGemini } from "@/lib/gemini"

// Initialize Gemini on first request
let geminiInitialized = false

export async function POST(request: NextRequest) {
  try {
    // Initialize Gemini if not done
    if (!geminiInitialized) {
      initializeGemini()
      geminiInitialized = true
    }

    const body = await request.json()
    const { context } = body

    const sessionId = uuidv4()

    const conversations = await getCollection("conversations")

    const conversationDoc = {
      sessionId,
      messages: [],
      context: context || {},
      bookingState: {
        isActive: false,
        collectedData: {},
        currentStep: "idle",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await conversations.insertOne(conversationDoc)
    console.log(`[v0] Created new conversation in MongoDB: ${sessionId}`)

    // Generate welcome message
    const welcomeMessage = context?.petName
      ? `Hello${context.userName ? ` ${context.userName}` : ""}! I'm your veterinary assistant. I can help you with questions about ${context.petName}'s health, vaccinations, nutrition, and common health concerns. I can also help you book an appointment. How can I assist you today?`
      : "Hello! I'm your veterinary assistant. I can help you with questions about pet care, vaccinations, nutrition, and common health concerns. I can also help you book an appointment with our veterinary team. How can I assist you today?"

    // Add welcome message to conversation
    await conversations.updateOne(
      { sessionId },
      {
        $push: {
          messages: {
            role: "assistant",
            content: welcomeMessage,
            timestamp: new Date(),
          },
        } as any,
        $set: { updatedAt: new Date() },
      },
    )

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        message: welcomeMessage,
      },
    })
  } catch (error) {
    console.error("[v0] Init session error:", error)
    return NextResponse.json({ success: false, error: "Failed to initialize session" }, { status: 500 })
  }
}
