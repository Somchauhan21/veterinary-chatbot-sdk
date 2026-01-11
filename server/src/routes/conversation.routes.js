import { Router } from "express"
import { conversationController } from "../controllers/conversation.controller.js"
import { adminAuth } from "../middleware/adminAuth.js"

const router = Router()

// GET /api/conversations - Get all conversations (admin only)
router.get("/", adminAuth, conversationController.getAllConversations)

// GET /api/conversations/:sessionId - Get single conversation
router.get("/:sessionId", conversationController.getConversation)

export default router
