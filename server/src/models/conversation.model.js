import mongoose from "mongoose"

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["user", "assistant", "system"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
})

const conversationSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  messages: [messageSchema],
  context: {
    userId: String,
    userName: String,
    petName: String,
    source: String,
  },
  bookingState: {
    isActive: { type: Boolean, default: false },
    collectedData: {
      ownerName: String,
      petName: String,
      phone: String,
      preferredDateTime: String,
    },
    currentStep: {
      type: String,
      enum: ["idle", "collecting_owner", "collecting_pet", "collecting_phone", "collecting_datetime", "confirming"],
      default: "idle",
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

conversationSchema.pre("save", function (next) {
  this.updatedAt = new Date()
  next()
})

export const Conversation = mongoose.model("Conversation", conversationSchema)
