import { appointmentService } from "../services/appointment.service.js"
import { logger } from "../utils/logger.js"

export const appointmentController = {
  async getAppointments(req, res, next) {
    try {
      const { status, limit = 50, skip = 0, fromDate } = req.query

      const appointments = await appointmentService.getAppointments(
        { status, fromDate },
        Number.parseInt(limit),
        Number.parseInt(skip),
      )

      const stats = await appointmentService.getStats()

      res.json({
        success: true,
        data: {
          appointments,
          stats,
          pagination: {
            limit: Number.parseInt(limit),
            skip: Number.parseInt(skip),
            count: appointments.length,
          },
        },
      })
    } catch (error) {
      logger.error("Get appointments error:", error)
      next(error)
    }
  },

  async getAppointmentById(req, res, next) {
    try {
      const { id } = req.params
      const appointment = await appointmentService.getAppointmentById(id)

      if (!appointment) {
        return res.status(404).json({
          success: false,
          error: "Appointment not found",
        })
      }

      res.json({
        success: true,
        data: appointment,
      })
    } catch (error) {
      logger.error("Get appointment error:", error)
      next(error)
    }
  },

  async updateStatus(req, res, next) {
    try {
      const { id } = req.params
      const { status } = req.body

      if (!["pending", "confirmed", "cancelled", "completed"].includes(status)) {
        return res.status(400).json({
          success: false,
          error: "Invalid status",
        })
      }

      const appointment = await appointmentService.updateAppointmentStatus(id, status)

      res.json({
        success: true,
        data: appointment,
      })
    } catch (error) {
      logger.error("Update appointment error:", error)
      next(error)
    }
  },

  async getStats(req, res, next) {
    try {
      const stats = await appointmentService.getStats()
      res.json({
        success: true,
        data: stats,
      })
    } catch (error) {
      logger.error("Get stats error:", error)
      next(error)
    }
  },
}
