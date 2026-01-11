import { Appointment } from "../models/appointment.model.js"
import { logger } from "../utils/logger.js"

class AppointmentService {
  async createAppointment(data) {
    const appointment = new Appointment({
      sessionId: data.sessionId,
      ownerName: data.ownerName,
      petName: data.petName,
      phone: data.phone,
      preferredDateTime: new Date(data.preferredDateTime),
      notes: data.notes || "",
    })

    await appointment.save()
    logger.info(`Created appointment for ${data.petName} with ${data.ownerName}`)
    return appointment
  }

  async getAppointments(filters = {}, limit = 50, skip = 0) {
    const query = {}

    if (filters.status) {
      query.status = filters.status
    }

    if (filters.fromDate) {
      query.preferredDateTime = { $gte: new Date(filters.fromDate) }
    }

    return await Appointment.find(query).sort({ preferredDateTime: 1 }).limit(limit).skip(skip).lean()
  }

  async getAppointmentById(id) {
    return await Appointment.findById(id)
  }

  async updateAppointmentStatus(id, status) {
    const appointment = await Appointment.findById(id)
    if (!appointment) {
      throw new Error("Appointment not found")
    }

    appointment.status = status
    await appointment.save()
    return appointment
  }

  async getAppointmentsBySession(sessionId) {
    return await Appointment.find({ sessionId }).sort({ createdAt: -1 })
  }

  async getStats() {
    const total = await Appointment.countDocuments()
    const pending = await Appointment.countDocuments({ status: "pending" })
    const confirmed = await Appointment.countDocuments({ status: "confirmed" })
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayCount = await Appointment.countDocuments({
      preferredDateTime: { $gte: today },
    })

    return { total, pending, confirmed, todayCount }
  }
}

export const appointmentService = new AppointmentService()
