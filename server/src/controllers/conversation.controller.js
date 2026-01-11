import { conversationService } from "../services/conversation.service.js"
import { logger } from "../utils/logger.js"

export const conversationController = {
  async getConversation(req, res, next) {
    try {
      const { sessionId } = req.params
      const conversation = await conversationService.getConversation(sessionId)

      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: "Conversation not found",
        })
      }

      res.json({
        success: true,
        data: conversation,
      })
    } catch (error) {
      logger.error("Get conversation error:", error)
      next(error)
    }
  },

  async getAllConversations(req, res, next) {
    try {
      const { limit = 50, skip = 0 } = req.query
      const conversations = await conversationService.getAllConversations(Number.parseInt(limit), Number.parseInt(skip))

      res.json({
        success: true,
        data: {
          conversations,
          pagination: {
            limit: Number.parseInt(limit),
            skip: Number.parseInt(skip),
            count: conversations.length,
          },
        },
      })
    } catch (error) {
      logger.error("Get conversations error:", error)
      next(error)
    }
  },
}
