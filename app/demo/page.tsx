"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

export default function DemoPage() {
  const [configMode, setConfigMode] = useState<"basic" | "with-context">("basic")
  const [sdkLoaded, setSdkLoaded] = useState(false)

  useEffect(() => {
    // Set config before loading SDK
    if (configMode === "with-context") {
      ;(window as any).VetChatbotConfig = {
        userId: "demo_user_001",
        userName: "Demo User",
        petName: "Max",
        source: "demo-page",
      }
    } else {
      delete (window as any).VetChatbotConfig
    }

    // Remove existing widget if any
    const existingWidget = document.getElementById("vetchat-widget")
    if (existingWidget) {
      existingWidget.remove()
    }

    // Remove existing styles
    const existingStyles = document.querySelectorAll("style")
    existingStyles.forEach((style) => {
      if (style.textContent?.includes("vetchat")) {
        style.remove()
      }
    })

    // Load SDK script
    const script = document.createElement("script")
    // In production, this would be your deployed URL
    script.src = "/api/sdk"
    script.async = true
    script.onload = () => setSdkLoaded(true)
    document.body.appendChild(script)

    return () => {
      script.remove()
      const widget = document.getElementById("vetchat-widget")
      if (widget) widget.remove()
    }
  }, [configMode])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🐾</span>
            <span className="font-bold text-gray-900">VetChat SDK</span>
          </Link>
          <div className="flex gap-4">
            <Link href="/admin" className="px-4 py-2 text-gray-600 hover:text-gray-900">
              Admin
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Demo</h1>
          <p className="text-gray-600 mb-8">
            Experience the VetChat widget in action. Look for the purple button in the bottom-right corner.
          </p>

          {/* Config Toggle */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">SDK Configuration Mode</h2>
            <div className="flex gap-4">
              <button
                onClick={() => setConfigMode("basic")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  configMode === "basic" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Basic (No Config)
              </button>
              <button
                onClick={() => setConfigMode("with-context")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  configMode === "with-context"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                With Context
              </button>
            </div>

            {configMode === "with-context" && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Active Configuration:</p>
                <pre className="text-sm text-gray-800">
                  {JSON.stringify(
                    {
                      userId: "demo_user_001",
                      userName: "Demo User",
                      petName: "Max",
                      source: "demo-page",
                    },
                    null,
                    2,
                  )}
                </pre>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Try These Prompts</h2>
            <div className="space-y-3">
              <PromptExample prompt="What vaccines does my puppy need?" />
              <PromptExample prompt="My cat isn't eating, what should I do?" />
              <PromptExample prompt="How often should I groom my dog?" />
              <PromptExample prompt="I'd like to book an appointment" />
              <PromptExample prompt="What's the weather today?" label="(non-vet topic - will be declined)" />
            </div>
          </div>

          {/* Status */}
          <div className="mt-8 text-center">
            <span
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm ${
                sdkLoaded ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${sdkLoaded ? "bg-green-500" : "bg-yellow-500 animate-pulse"}`} />
              {sdkLoaded ? "SDK Loaded" : "Loading SDK..."}
            </span>
          </div>
        </div>
      </main>
    </div>
  )
}

function PromptExample({ prompt, label }: { prompt: string; label?: string }) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      <p className="text-gray-800">&quot;{prompt}&quot;</p>
      {label && <p className="text-sm text-gray-500 mt-1">{label}</p>}
    </div>
  )
}
