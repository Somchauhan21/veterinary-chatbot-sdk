import { Conversation } from "../models/conversation.model.js"
import { logger } from "../utils/logger.js"

class ConversationService {
  async getOrCreateConversation(sessionId, context = {}) {
    try {
      logger.info(`[v0] getOrCreateConversation called for sessionId: ${sessionId}`)

      let conversation = await Conversation.findOne({ sessionId })
      logger.info(`[v0] Existing conversation found: ${!!conversation}`)

      if (!conversation) {
        conversation = new Conversation({
          sessionId,
          messages: [],
          context: {
            userId: context.userId || null,
            userName: context.userName || null,
            petName: context.petName || null,
            source: context.source || null,
          },
        })
        await conversation.save()
        logger.info(`[v0] Created new conversation in MongoDB: ${conversation._id}`)
      } else if (context && Object.keys(context).length > 0) {
        conversation.context = { ...conversation.context, ...context }
        await conversation.save()
        logger.info(`[v0] Updated conversation context: ${conversation._id}`)
      }

      return conversation
    } catch (error) {
      logger.error(`[v0] Error in getOrCreateConversation: ${error.message}`)
      throw error
    }
  }

  async addMessage(sessionId, role, content) {
    try {
      logger.info(`[v0] addMessage called - sessionId: ${sessionId}, role: ${role}`)

      const conversation = await Conversation.findOne({ sessionId })
      if (!conversation) {
        logger.error(`[v0] Conversation not found for sessionId: ${sessionId}`)
        throw new Error("Conversation not found")
      }

      conversation.messages.push({
        role,
        content,
        timestamp: new Date(),
      })

      await conversation.save()
      logger.info(`[v0] Message saved to MongoDB - conversation now has ${conversation.messages.length} messages`)
      return conversation
    } catch (error) {
      logger.error(`[v0] Error in addMessage: ${error.message}`)
      throw error
    }
  }

  async getConversation(sessionId) {
    try {
      const conversation = await Conversation.findOne({ sessionId })
      logger.info(`[v0] getConversation - found: ${!!conversation}`)
      return conversation
    } catch (error) {
      logger.error(`[v0] Error in getConversation: ${error.message}`)
      throw error
    }
  }

  async updateBookingState(sessionId, bookingState) {
    try {
      const conversation = await Conversation.findOne({ sessionId })
      if (!conversation) {
        throw new Error("Conversation not found")
      }

      conversation.bookingState = { ...conversation.bookingState, ...bookingState }
      await conversation.save()
      logger.info(`[v0] Booking state updated for sessionId: ${sessionId}`)
      return conversation
    } catch (error) {
      logger.error(`[v0] Error in updateBookingState: ${error.message}`)
      throw error
    }
  }

  async getAllConversations(limit = 50, skip = 0) {
    try {
      const conversations = await Conversation.find().sort({ updatedAt: -1 }).limit(limit).skip(skip).lean()
      logger.info(`[v0] getAllConversations - found ${conversations.length} conversations`)
      return conversations
    } catch (error) {
      logger.error(`[v0] Error in getAllConversations: ${error.message}`)
      throw error
    }
  }
}

export const conversationService = new ConversationService()
