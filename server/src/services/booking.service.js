import { conversationService } from "./conversation.service.js"
import { appointmentService } from "./appointment.service.js"
import { logger } from "../utils/logger.js"

const BOOKING_STEPS = {
  idle: "idle",
  collecting_owner: "collecting_owner",
  collecting_pet: "collecting_pet",
  collecting_phone: "collecting_phone",
  collecting_datetime: "collecting_datetime",
  confirming: "confirming",
}

const STEP_PROMPTS = {
  collecting_owner:
    "I'd be happy to help you book an appointment! Let's get started. What is the pet owner's full name?",
  collecting_pet: "Great! And what is your pet's name?",
  collecting_phone: "Perfect! What phone number can we reach you at for appointment confirmation?",
  collecting_datetime:
    "Almost done! When would you prefer to schedule the appointment? Please provide a date and time (e.g., 'January 15th at 2pm' or '2024-01-15 14:00').",
  confirming: null, // Dynamic based on collected data
}

class BookingService {
  async startBookingFlow(sessionId, context) {
    // Pre-fill from context if available
    const collectedData = {
      ownerName: context.userName || null,
      petName: context.petName || null,
      phone: null,
      preferredDateTime: null,
    }

    // Determine starting step based on what we already have
    let currentStep = BOOKING_STEPS.collecting_owner

    if (collectedData.ownerName) {
      currentStep = BOOKING_STEPS.collecting_pet
    }
    if (collectedData.ownerName && collectedData.petName) {
      currentStep = BOOKING_STEPS.collecting_phone
    }

    await conversationService.updateBookingState(sessionId, {
      isActive: true,
      collectedData,
      currentStep,
    })

    return this.getStepPrompt(currentStep, collectedData)
  }

  async processBookingInput(sessionId, userInput) {
    const conversation = await conversationService.getConversation(sessionId)
    if (!conversation?.bookingState?.isActive) {
      return { response: null, isComplete: false }
    }

    const { currentStep, collectedData } = conversation.bookingState
    let response = ""
    let nextStep = currentStep
    let isComplete = false

    switch (currentStep) {
      case BOOKING_STEPS.collecting_owner:
        if (this.validateName(userInput)) {
          collectedData.ownerName = userInput.trim()
          nextStep = collectedData.petName ? BOOKING_STEPS.collecting_phone : BOOKING_STEPS.collecting_pet
          response = this.getStepPrompt(nextStep, collectedData)
        } else {
          response = "Please provide a valid name (at least 2 characters)."
        }
        break

      case BOOKING_STEPS.collecting_pet:
        if (this.validateName(userInput)) {
          collectedData.petName = userInput.trim()
          nextStep = BOOKING_STEPS.collecting_phone
          response = this.getStepPrompt(nextStep, collectedData)
        } else {
          response = "Please provide your pet's name (at least 2 characters)."
        }
        break

      case BOOKING_STEPS.collecting_phone:
        if (this.validatePhone(userInput)) {
          collectedData.phone = userInput.trim()
          nextStep = BOOKING_STEPS.collecting_datetime
          response = this.getStepPrompt(nextStep, collectedData)
        } else {
          response = "Please provide a valid phone number (e.g., 555-123-4567 or 5551234567)."
        }
        break

      case BOOKING_STEPS.collecting_datetime:
        const parsedDate = this.parseDateTime(userInput)
        if (parsedDate) {
          collectedData.preferredDateTime = parsedDate.toISOString()
          nextStep = BOOKING_STEPS.confirming
          response = this.getConfirmationMessage(collectedData)
        } else {
          response =
            "I couldn't understand that date/time. Please try again (e.g., 'January 15th at 2pm' or 'tomorrow at 10am')."
        }
        break

      case BOOKING_STEPS.confirming:
        const lowerInput = userInput.toLowerCase()
        if (lowerInput.includes("yes") || lowerInput.includes("confirm") || lowerInput.includes("correct")) {
          // Create the appointment
          await appointmentService.createAppointment({
            sessionId,
            ...collectedData,
          })

          // Reset booking state
          await conversationService.updateBookingState(sessionId, {
            isActive: false,
            currentStep: BOOKING_STEPS.idle,
            collectedData: {},
          })

          response = `Wonderful! Your appointment has been booked successfully!\n\n📅 **Appointment Details:**\n- Pet Owner: ${collectedData.ownerName}\n- Pet: ${collectedData.petName}\n- Phone: ${collectedData.phone}\n- Date/Time: ${new Date(collectedData.preferredDateTime).toLocaleString()}\n\nWe'll contact you at ${collectedData.phone} to confirm. Is there anything else I can help you with?`
          isComplete = true
        } else if (lowerInput.includes("no") || lowerInput.includes("cancel") || lowerInput.includes("restart")) {
          await conversationService.updateBookingState(sessionId, {
            isActive: false,
            currentStep: BOOKING_STEPS.idle,
            collectedData: {},
          })
          response =
            "No problem! The booking has been cancelled. Feel free to ask any veterinary questions or start a new booking whenever you're ready."
          isComplete = true
        } else {
          response = "Please confirm by saying 'yes' to book this appointment, or 'no' to cancel and start over."
        }
        break
    }

    if (!isComplete) {
      await conversationService.updateBookingState(sessionId, {
        isActive: true,
        collectedData,
        currentStep: nextStep,
      })
    }

    return { response, isComplete }
  }

  getStepPrompt(step, collectedData) {
    if (step === BOOKING_STEPS.collecting_owner && collectedData.ownerName) {
      return STEP_PROMPTS.collecting_pet
    }
    return STEP_PROMPTS[step]
  }

  getConfirmationMessage(data) {
    return `Perfect! Let me confirm your appointment details:\n\n📋 **Booking Summary:**\n- Pet Owner: ${data.ownerName}\n- Pet: ${data.petName}\n- Phone: ${data.phone}\n- Preferred Date/Time: ${new Date(data.preferredDateTime).toLocaleString()}\n\nIs this information correct? (Reply 'yes' to confirm or 'no' to start over)`
  }

  validateName(input) {
    return input && input.trim().length >= 2
  }

  validatePhone(input) {
    // Accept various phone formats
    const cleaned = input.replace(/[\s\-$$$$.]/g, "")
    return /^\+?[\d]{7,15}$/.test(cleaned)
  }

  parseDateTime(input) {
    try {
      // Try native Date parsing first
      let date = new Date(input)

      // If invalid, try some common patterns
      if (isNaN(date.getTime())) {
        const now = new Date()
        const lowerInput = input.toLowerCase()

        // Handle relative dates
        if (lowerInput.includes("tomorrow")) {
          date = new Date(now)
          date.setDate(date.getDate() + 1)
        } else if (lowerInput.includes("next week")) {
          date = new Date(now)
          date.setDate(date.getDate() + 7)
        }

        // Try to extract time
        const timeMatch = input.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i)
        if (timeMatch && !isNaN(date.getTime())) {
          let hours = Number.parseInt(timeMatch[1])
          const minutes = Number.parseInt(timeMatch[2] || "0")
          const period = timeMatch[3]?.toLowerCase()

          if (period === "pm" && hours < 12) hours += 12
          if (period === "am" && hours === 12) hours = 0

          date.setHours(hours, minutes, 0, 0)
        }
      }

      // Validate the date is in the future
      if (!isNaN(date.getTime()) && date > new Date()) {
        return date
      }

      return null
    } catch (e) {
      logger.warn("Date parsing failed:", input)
      return null
    }
  }

  isBookingActive(conversation) {
    return conversation?.bookingState?.isActive === true
  }
}

export const bookingService = new BookingService()
