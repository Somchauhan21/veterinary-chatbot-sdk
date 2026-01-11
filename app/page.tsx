import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-16">
        <nav className="flex justify-between items-center mb-16">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🐾</span>
            <span className="text-xl font-bold text-gray-900">VetChat SDK</span>
          </div>
          <div className="flex gap-4">
            <Link href="/admin" className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors">
              Admin Dashboard
            </Link>
            <Link
              href="/demo"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Live Demo
            </Link>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Embeddable Veterinary Chatbot
            <br />
            <span className="text-indigo-600">for Any Website</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            AI-powered veterinary assistant that answers pet health questions and books appointments. Single script tag
            integration.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link
              href="/demo"
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
            >
              Try Live Demo
            </Link>
            <a
              href="#integration"
              className="px-6 py-3 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors border border-gray-200"
            >
              View Integration
            </a>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Key Features</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <FeatureCard
              icon="🤖"
              title="AI-Powered Q&A"
              description="Answers pet health questions using Google Gemini, restricted to veterinary topics only."
            />
            <FeatureCard
              icon="📅"
              title="Appointment Booking"
              description="Conversational multi-step booking flow with validation and confirmation."
            />
            <FeatureCard
              icon="⚡"
              title="Easy Integration"
              description="Single script tag - works immediately with optional configuration."
            />
            <FeatureCard
              icon="💾"
              title="Full Persistence"
              description="MongoDB storage for conversations and appointments with session tracking."
            />
            <FeatureCard
              icon="🔒"
              title="Context Aware"
              description="Pass user/pet context for personalized responses and pre-filled booking."
            />
            <FeatureCard
              icon="📊"
              title="Admin Dashboard"
              description="View and manage all appointments and conversations."
            />
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section id="integration" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Integration</h2>
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Basic Integration (No Config)</h3>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                {`<script src="https://your-domain.com/chatbot.js"></script>`}
              </pre>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">With Configuration</h3>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                {`<script>
  window.VetChatbotConfig = {
    userId: "user_123",
    userName: "John Doe",
    petName: "Buddy",
    source: "marketing-website"
  };
</script>
<script src="https://your-domain.com/chatbot.js"></script>`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-white border-t border-gray-100">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>VetChat SDK - Built with MERN Stack + Google Gemini</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string
  title: string
  description: string
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow border border-gray-100">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}
