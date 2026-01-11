import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/db"
import { generateResponse } from "@/lib/gemini"

// Booking flow steps
const BOOKING_STEPS = {
  idle: "idle",
  collecting_owner: "collecting_owner",
  collecting_pet: "collecting_pet",
  collecting_phone: "collecting_phone",
  collecting_datetime: "collecting_datetime",
  confirming: "confirming",
}

// Process booking step
function processBookingStep(
  bookingState: any,
  message: string,
  sessionId: string,
): { response: string; isComplete: boolean; newState: any; appointment?: any } {
  const { currentStep, collectedData } = bookingState
  let response = ""
  let nextStep = currentStep
  let isComplete = false
  let appointment = undefined
  const newCollectedData = { ...collectedData }

  switch (currentStep) {
    case BOOKING_STEPS.collecting_owner:
      if (message.trim().length >= 2) {
        newCollectedData.ownerName = message.trim()
        nextStep = newCollectedData.petName ? BOOKING_STEPS.collecting_phone : BOOKING_STEPS.collecting_pet
        response =
          nextStep === BOOKING_STEPS.collecting_phone
            ? "Great! What phone number can we reach you at?"
            : "And what is your pet's name?"
      } else {
        response = "Please provide a valid name (at least 2 characters)."
      }
      break

    case BOOKING_STEPS.collecting_pet:
      if (message.trim().length >= 2) {
        newCollectedData.petName = message.trim()
        nextStep = BOOKING_STEPS.collecting_phone
        response = "Perfect! What phone number can we reach you at?"
      } else {
        response = "Please provide your pet's name."
      }
      break

    case BOOKING_STEPS.collecting_phone:
      const cleaned = message.replace(/[\s\-().]/g, "")
      if (/^\+?[\d]{7,15}$/.test(cleaned)) {
        newCollectedData.phone = message.trim()
        nextStep = BOOKING_STEPS.collecting_datetime
        response =
          "When would you prefer to schedule the appointment? (e.g., 'January 15, 2026 at 2:00 PM' or '2026-01-15 14:00')"
      } else {
        response = "Please provide a valid phone number (7-15 digits)."
      }
      break

    case BOOKING_STEPS.collecting_datetime:
      const date = new Date(message)
      if (!isNaN(date.getTime()) && date > new Date()) {
        newCollectedData.preferredDateTime = date.toISOString()
        nextStep = BOOKING_STEPS.confirming
        response = `Let me confirm your appointment:\n\n**Booking Summary:**\n- Owner: ${newCollectedData.ownerName}\n- Pet: ${newCollectedData.petName}\n- Phone: ${newCollectedData.phone}\n- Date/Time: ${date.toLocaleString()}\n\nIs this correct? (Reply 'yes' to confirm or 'no' to cancel)`
      } else {
        response =
          "I couldn't understand that date or the date is in the past. Please try again (e.g., '2026-02-15 14:00' or 'February 15, 2026 at 2pm')."
      }
      break

    case BOOKING_STEPS.confirming:
      const lowerInput = message.toLowerCase()
      if (lowerInput.includes("yes") || lowerInput.includes("confirm")) {
        appointment = {
          sessionId,
          ownerName: newCollectedData.ownerName,
          petName: newCollectedData.petName,
          phone: newCollectedData.phone,
          preferredDateTime: new Date(newCollectedData.preferredDateTime),
          status: "pending",
          createdAt: new Date(),
        }

        response = `Your appointment has been booked successfully!\n\n**Confirmed Details:**\n- Owner: ${newCollectedData.ownerName}\n- Pet: ${newCollectedData.petName}\n- Phone: ${newCollectedData.phone}\n- Date/Time: ${new Date(newCollectedData.preferredDateTime).toLocaleString()}\n\nWe'll contact you to confirm. Is there anything else I can help with?`
        isComplete = true
      } else if (lowerInput.includes("no") || lowerInput.includes("cancel")) {
        response =
          "No problem! The booking has been cancelled. Feel free to ask any questions or start a new booking anytime."
        isComplete = true
      } else {
        response = "Please confirm by saying 'yes' or 'no'."
      }
      break
  }

  const newState = isComplete
    ? { isActive: false, collectedData: {}, currentStep: BOOKING_STEPS.idle }
    : { isActive: true, collectedData: newCollectedData, currentStep: nextStep }

  return { response, isComplete, newState, appointment }
}

// Start booking flow
function startBookingFlow(context: any): { response: string; newState: any } {
  const collectedData: any = {}

  // Pre-fill from context
  if (context?.userName) collectedData.ownerName = context.userName
  if (context?.petName) collectedData.petName = context.petName

  let currentStep = BOOKING_STEPS.collecting_owner
  let response = "I'd be happy to help you book an appointment! What is the pet owner's full name?"

  if (collectedData.ownerName && !collectedData.petName) {
    currentStep = BOOKING_STEPS.collecting_pet
    response = `Great ${collectedData.ownerName}! What is your pet's name?`
  } else if (collectedData.ownerName && collectedData.petName) {
    currentStep = BOOKING_STEPS.collecting_phone
    response = `Perfect! I have ${collectedData.petName} with ${collectedData.ownerName}. What phone number can we reach you at?`
  }

  return {
    response,
    newState: {
      isActive: true,
      collectedData,
      currentStep,
    },
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, message, context } = body

    if (!message?.trim()) {
      return NextResponse.json({ success: false, error: "Message is required" }, { status: 400 })
    }

    const conversations = await getCollection("conversations")
    const session = await conversations.findOne({ sessionId })

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Session not found. Please refresh the page." },
        { status: 404 },
      )
    }

    // Add user message to database
    await conversations.updateOne(
      { sessionId },
      {
        $push: {
          messages: {
            role: "user",
            content: message,
            timestamp: new Date(),
          },
        } as any,
        $set: { updatedAt: new Date() },
      },
    )

    let botResponse: string
    let isBookingFlow = false
    let newBookingState = session.bookingState

    // Check if in booking flow
    if (session.bookingState?.isActive) {
      const result = processBookingStep(session.bookingState, message, sessionId)
      botResponse = result.response
      newBookingState = result.newState
      isBookingFlow = result.newState.isActive

      if (result.appointment) {
        const appointments = await getCollection("appointments")
        await appointments.insertOne(result.appointment)
        console.log(`[v0] Appointment saved to MongoDB for session: ${sessionId}`)
      }
    } else {
      const conversationHistory = session.messages || []
      botResponse = await generateResponse(message, context || session.context, conversationHistory)

      // Check for booking intent
      if (botResponse.includes("[BOOKING_INTENT]")) {
        const bookingResult = startBookingFlow(context || session.context)
        botResponse = bookingResult.response
        newBookingState = bookingResult.newState
        isBookingFlow = true
      }
    }

    // Update session with bot response and booking state
    await conversations.updateOne(
      { sessionId },
      {
        $push: {
          messages: {
            role: "assistant",
            content: botResponse,
            timestamp: new Date(),
          },
        } as any,
        $set: {
          bookingState: newBookingState,
          updatedAt: new Date(),
        },
      },
    )

    console.log(`[v0] Message processed for session: ${sessionId}`)

    return NextResponse.json({
      success: true,
      data: {
        response: botResponse,
        sessionId,
        isBookingFlow,
      },
    })
  } catch (error) {
    console.error("[v0] Chat message error:", error)
    return NextResponse.json({ success: false, error: "Failed to process message" }, { status: 500 })
  }
}
