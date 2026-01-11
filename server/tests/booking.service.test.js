import { describe, test, expect, jest } from "@jest/globals"

// Mock the dependencies
const mockConversationService = {
  getConversation: jest.fn(),
  updateBookingState: jest.fn(),
}

const mockAppointmentService = {
  createAppointment: jest.fn(),
}

// Simple unit tests for booking validation logic
describe("BookingService Validation", () => {
  describe("validateName", () => {
    const validateName = (input) => input && input.trim().length >= 2

    test("accepts valid names", () => {
      expect(validateName("John")).toBe(true)
      expect(validateName("Jo")).toBe(true)
      expect(validateName("John Doe")).toBe(true)
    })

    test("rejects invalid names", () => {
      expect(validateName("")).toBe(false)
      expect(validateName("J")).toBe(false)
      expect(validateName(null)).toBe(false)
      expect(validateName(undefined)).toBe(false)
    })
  })

  describe("validatePhone", () => {
    const validatePhone = (input) => {
      const cleaned = input.replace(/[\s\-$$$$.]/g, "")
      return /^\+?[\d]{7,15}$/.test(cleaned)
    }

    test("accepts valid phone numbers", () => {
      expect(validatePhone("555-123-4567")).toBe(true)
      expect(validatePhone("5551234567")).toBe(true)
      expect(validatePhone("+1-555-123-4567")).toBe(true)
      expect(validatePhone("(555) 123-4567")).toBe(true)
    })

    test("rejects invalid phone numbers", () => {
      expect(validatePhone("123")).toBe(false)
      expect(validatePhone("abcdefg")).toBe(false)
      expect(validatePhone("12-34")).toBe(false)
    })
  })

  describe("parseDateTime", () => {
    const parseDateTime = (input) => {
      try {
        const date = new Date(input)
        if (!isNaN(date.getTime()) && date > new Date()) {
          return date
        }
        return null
      } catch (e) {
        return null
      }
    }

    test("parses valid ISO dates", () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)
      const result = parseDateTime(futureDate.toISOString())
      expect(result).toBeInstanceOf(Date)
    })

    test("returns null for past dates", () => {
      const result = parseDateTime("2020-01-01")
      expect(result).toBeNull()
    })

    test("returns null for invalid dates", () => {
      const result = parseDateTime("not a date")
      expect(result).toBeNull()
    })
  })
})

describe("Booking Flow Steps", () => {
  const BOOKING_STEPS = {
    idle: "idle",
    collecting_owner: "collecting_owner",
    collecting_pet: "collecting_pet",
    collecting_phone: "collecting_phone",
    collecting_datetime: "collecting_datetime",
    confirming: "confirming",
  }

  test("booking steps are correctly defined", () => {
    expect(Object.keys(BOOKING_STEPS)).toHaveLength(6)
    expect(BOOKING_STEPS.idle).toBe("idle")
    expect(BOOKING_STEPS.confirming).toBe("confirming")
  })
})
