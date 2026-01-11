import { Router } from "express"
import { existsSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const router = Router()
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// GET /chatbot.js - Serve the SDK script
router.get("/", (req, res) => {
  const sdkPath = join(__dirname, "../../dist/chatbot.js")

  if (!existsSync(sdkPath)) {
    // Serve inline fallback if build doesn't exist
    res.setHeader("Content-Type", "application/javascript")
    return res.send(`
      console.warn('[VetChat SDK] Build not found. Run npm run build:sdk');
      window.VetChatbot = { init: function() { console.error('SDK not built'); } };
    `)
  }

  res.setHeader("Content-Type", "application/javascript")
  res.setHeader("Cache-Control", "public, max-age=3600")
  res.sendFile(sdkPath)
})

export default router
