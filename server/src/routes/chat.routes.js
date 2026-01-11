import { Router } from "express"
import { chatController } from "../controllers/chat.controller.js"

const router = Router()

// POST /api/chat/message - Send a message and get AI response
router.post("/message", chatController.sendMessage)

// POST /api/chat/init - Initialize a new chat session
router.post("/init", chatController.initSession)

// GET /api/chat/status - Check AI and server status
router.get("/status", chatController.getStatus)

export default router
