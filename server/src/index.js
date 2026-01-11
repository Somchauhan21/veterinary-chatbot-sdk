import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import mongoose from "mongoose"
import rateLimit from "express-rate-limit"
import { fileURLToPath } from "url"
import { dirname, join } from "path"
import { aiService } from "./services/ai.service.js"
import chatRoutes from "./routes/chat.routes.js"
import appointmentRoutes from "./routes/appointment.routes.js"
import conversationRoutes from "./routes/conversation.routes.js"
import sdkRoutes from "./routes/sdk.routes.js"
import { errorHandler } from "./middleware/errorHandler.js"
import { logger } from "./utils/logger.js"

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

aiService.initialize()

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: { success: false, error: "Too many requests, please try again later." },
})

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGINS?.split(",") || "*",
    credentials: true,
  }),
)
app.use(express.json())
app.use(limiter)

// Static files for SDK
app.use("/sdk", express.static(join(__dirname, "../dist")))

// Routes
app.use("/api/chat", chatRoutes)
app.use("/api/appointments", appointmentRoutes)
app.use("/api/conversations", conversationRoutes)
app.use("/chatbot.js", sdkRoutes)

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() })
})

// Error handling
app.use(errorHandler)

// Database connection and server start
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/vetchat")
    logger.info("Connected to MongoDB")

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`)
    })
  } catch (error) {
    logger.error("Failed to start server:", error)
    process.exit(1)
  }
}

startServer()

export default app
