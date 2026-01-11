import { v4 as uuidv4 } from "uuid"
import { aiService } from "../services/ai.service.js"
import { conversationService } from "../services/conversation.service.js"
import { bookingService } from "../services/booking.service.js"
import { logger } from "../utils/logger.js"

export const chatController = {
  async sendMessage(req, res, next) {
    try {
      const { sessionId: providedSessionId, message, context } = req.body

      logger.info(`[v0] sendMessage called - sessionId: ${providedSessionId}, message: ${message?.substring(0, 50)}...`)

      if (!message || typeof message !== "string" || message.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "Message is required",
        })
      }

      // Use provided session ID or generate new one
      const sessionId = providedSessionId || uuidv4()
      logger.info(`[v0] Using sessionId: ${sessionId}`)

      // Get or create conversation
      const conversation = await conversationService.getOrCreateConversation(sessionId, context)
      logger.info(`[v0] Conversation retrieved/created: ${conversation._id}`)

      // Add user message to conversation
      await conversationService.addMessage(sessionId, "user", message.trim())
      logger.info(`[v0] User message saved to database`)

      let botResponse
      let isBookingFlow = false

      // Check if we're in an active booking flow
      if (bookingService.isBookingActive(conversation)) {
        logger.info(`[v0] Processing booking flow`)
        const bookingResult = await bookingService.processBookingInput(sessionId, message)
        botResponse = bookingResult.response
        isBookingFlow = !bookingResult.isComplete
      } else {
        // Get AI response
        logger.info(`[v0] Getting AI response`)
        const updatedConversation = await conversationService.getConversation(sessionId)
        botResponse = await aiService.generateResponse(updatedConversation.messages, updatedConversation.context)
        logger.info(`[v0] AI response generated: ${botResponse?.substring(0, 50)}...`)

        // Check if AI detected booking intent
        if (aiService.checkBookingIntent(botResponse)) {
          logger.info(`[v0] Booking intent detected, starting booking flow`)
          botResponse = await bookingService.startBookingFlow(sessionId, conversation.context || {})
          isBookingFlow = true
        }
      }

      // Add bot response to conversation
      await conversationService.addMessage(sessionId, "assistant", botResponse)
      logger.info(`[v0] Bot response saved to database`)

      res.json({
        success: true,
        data: {
          response: botResponse,
          sessionId,
          isBookingFlow,
        },
      })
    } catch (error) {
      logger.error("Chat error:", error)
      next(error)
    }
  },

  async initSession(req, res, next) {
    try {
      const { context } = req.body
      const sessionId = uuidv4()

      logger.info(`[v0] initSession called - creating session: ${sessionId}`)

      const conversation = await conversationService.getOrCreateConversation(sessionId, context)
      logger.info(`[v0] Session created in database: ${conversation._id}`)

      res.json({
        success: true,
        data: {
          sessionId,
          message:
            "Hello! I'm your veterinary assistant. I can help you with questions about pet care, vaccinations, nutrition, and common health concerns. I can also help you book an appointment with our veterinary team. How can I assist you today?",
        },
      })
    } catch (error) {
      logger.error("Session init error:", error)
      next(error)
    }
  },

  async getStatus(req, res) {
    const aiStatus = aiService.getStatus()
    res.json({
      success: true,
      data: {
        ai: aiStatus,
        server: "running",
      },
    })
  },
}
