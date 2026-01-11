"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"

interface Appointment {
  _id: string
  ownerName: string
  petName: string
  phone: string
  preferredDateTime: string
  status: "pending" | "confirmed" | "cancelled" | "completed"
  sessionId: string
  createdAt: string
}

interface Stats {
  total: number
  pending: number
  confirmed: number
  todayCount: number
}

const DEMO_TOKEN = "vetchat-demo-2024"

export default function AdminPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const fetchData = async (authToken: string) => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch("/api/admin/appointments", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      if (!res.ok) {
        if (res.status === 401) {
          setIsAuthenticated(false)
          localStorage.removeItem("adminToken")
          throw new Error("Invalid admin token. Please try again.")
        }
        throw new Error("Failed to fetch appointments")
      }

      const data = await res.json()
      setAppointments(data.data.appointments)
      setStats(data.data.stats)
      setIsAuthenticated(true)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/appointments/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      })

      if (!res.ok) throw new Error("Failed to update status")

      fetchData(token)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update")
    }
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (token.trim()) {
      localStorage.setItem("adminToken", token)
      fetchData(token)
    }
  }

  const handleDemoLogin = () => {
    setToken(DEMO_TOKEN)
    localStorage.setItem("adminToken", DEMO_TOKEN)
    fetchData(DEMO_TOKEN)
  }

  useEffect(() => {
    const storedToken = localStorage.getItem("adminToken")
    if (storedToken) {
      setToken(storedToken)
      fetchData(storedToken)
    } else {
      setLoading(false)
    }
  }, [])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card p-8 rounded-xl shadow-lg max-w-md w-full border border-border">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Admin Login</h1>
            <p className="text-muted-foreground mt-2">Enter your admin token to access the dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Admin Token"
              className="w-full px-4 py-3 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
            />
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-destructive text-sm text-center">{error}</p>
              </div>
            )}
            <button
              type="submit"
              className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Access Dashboard
            </button>
          </form>

          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">or</span>
              </div>
            </div>
            <button
              onClick={handleDemoLogin}
              type="button"
              className="w-full mt-4 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
            >
              Use Demo Token
            </button>
            <p className="text-center text-xs text-muted-foreground mt-2">
              Demo token: <code className="bg-muted px-1.5 py-0.5 rounded">{DEMO_TOKEN}</code>
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link href="/" className="text-primary hover:underline text-sm">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4.5 9.5a2 2 0 114 0 2 2 0 01-4 0zm11 0a2 2 0 114 0 2 2 0 01-4 0zM12 14c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
              <span className="font-bold text-foreground">VetChat Admin</span>
            </Link>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("adminToken")
              setIsAuthenticated(false)
              setToken("")
            }}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total" value={stats.total} variant="default" />
            <StatCard label="Pending" value={stats.pending} variant="warning" />
            <StatCard label="Confirmed" value={stats.confirmed} variant="success" />
            <StatCard label="Today" value={stats.todayCount} variant="info" />
          </div>
        )}

        {/* Appointments Table */}
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="p-4 border-b border-border flex justify-between items-center">
            <h2 className="text-lg font-semibold text-foreground">Appointments</h2>
            <button
              onClick={() => fetchData(token)}
              className="px-3 py-1 text-sm bg-secondary hover:bg-secondary/80 rounded-lg transition-colors text-secondary-foreground"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
              Loading...
            </div>
          ) : appointments.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>No appointments yet.</p>
              <p className="text-sm mt-1">Try booking one using the chatbot on the home page!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Owner</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Pet</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Phone</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date/Time</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {appointments.map((apt) => (
                    <tr key={apt._id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm text-foreground">{apt.ownerName}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{apt.petName}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{apt.phone}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(apt.preferredDateTime).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={apt.status} />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={apt.status}
                          onChange={(e) => updateStatus(apt._id, e.target.value)}
                          className="text-sm border border-input rounded px-2 py-1 bg-background text-foreground"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="completed">Completed</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function StatCard({
  label,
  value,
  variant,
}: {
  label: string
  value: number
  variant: "default" | "warning" | "success" | "info"
}) {
  const styles = {
    default: "bg-muted text-foreground",
    warning: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    success: "bg-green-500/10 text-green-600 dark:text-green-400",
    info: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  }

  return (
    <div className={`${styles[variant]} rounded-xl p-4`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    pending: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    confirmed: "bg-green-500/10 text-green-600 dark:text-green-400",
    cancelled: "bg-red-500/10 text-red-600 dark:text-red-400",
    completed: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  }

  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full ${
        styles[status as keyof typeof styles] || styles.pending
      }`}
    >
      {status}
    </span>
  )
}
