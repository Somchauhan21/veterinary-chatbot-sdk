import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/db"

const DEMO_TOKEN = "vetchat-demo-2024"

function validateToken(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization")
  const token = authHeader?.replace("Bearer ", "")

  // Check against env var first, then fall back to demo token
  const adminToken = process.env.ADMIN_TOKEN || DEMO_TOKEN

  return token === adminToken
}

export async function GET(request: NextRequest) {
  if (!validateToken(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized - Invalid token" }, { status: 401 })
  }

  try {
    const appointmentsCollection = await getCollection("appointments")
    const appointments = await appointmentsCollection.find({}).sort({ createdAt: -1 }).limit(100).toArray()

    // Calculate stats
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const stats = {
      total: appointments.length,
      pending: appointments.filter((a: any) => a.status === "pending").length,
      confirmed: appointments.filter((a: any) => a.status === "confirmed").length,
      todayCount: appointments.filter((a: any) => {
        const aptDate = new Date(a.preferredDateTime)
        return aptDate >= today && aptDate < tomorrow
      }).length,
    }

    console.log(`[v0] Admin fetched ${appointments.length} appointments from MongoDB`)

    return NextResponse.json({
      success: true,
      data: {
        appointments,
        stats,
        pagination: {
          limit: 100,
          skip: 0,
          count: appointments.length,
        },
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching appointments:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch appointments" }, { status: 500 })
  }
}
