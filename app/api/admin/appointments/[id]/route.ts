import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getCollection } from "@/lib/db"

const DEMO_TOKEN = "vetchat-demo-2024"

function validateToken(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization")
  const token = authHeader?.replace("Bearer ", "")

  const adminToken = process.env.ADMIN_TOKEN || DEMO_TOKEN
  return token === adminToken
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!validateToken(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized - Invalid token" }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!["pending", "confirmed", "cancelled", "completed"].includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 })
    }

    const appointmentsCollection = await getCollection("appointments")

    // Try to parse as ObjectId, otherwise use string
    let query: any
    try {
      query = { _id: new ObjectId(id) }
    } catch {
      query = { _id: id }
    }

    const result = await appointmentsCollection.findOneAndUpdate(
      query,
      { $set: { status, updatedAt: new Date() } },
      { returnDocument: "after" },
    )

    if (!result) {
      return NextResponse.json({ success: false, error: "Appointment not found" }, { status: 404 })
    }

    console.log(`[v0] Appointment ${id} status updated to: ${status}`)

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error("[v0] Error updating appointment:", error)
    return NextResponse.json({ success: false, error: "Failed to update appointment" }, { status: 500 })
  }
}
