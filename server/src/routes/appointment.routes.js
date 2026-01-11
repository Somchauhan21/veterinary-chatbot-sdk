import { Router } from "express"
import { appointmentController } from "../controllers/appointment.controller.js"
import { adminAuth } from "../middleware/adminAuth.js"

const router = Router()

// GET /api/appointments - Get all appointments (admin only)
router.get("/", adminAuth, appointmentController.getAppointments)

// GET /api/appointments/stats - Get appointment statistics
router.get("/stats", adminAuth, appointmentController.getStats)

// GET /api/appointments/:id - Get single appointment
router.get("/:id", adminAuth, appointmentController.getAppointmentById)

// PATCH /api/appointments/:id/status - Update appointment status
router.patch("/:id/status", adminAuth, appointmentController.updateStatus)

export default router
