/**
 * Simple admin authentication middleware
 * In production, use JWT or OAuth
 */
export function adminAuth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "")

  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
    })
  }

  next()
}
