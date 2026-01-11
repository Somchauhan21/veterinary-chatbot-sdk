/**
 * VetChat SDK - Embeddable Veterinary Chatbot
 *
 * Usage:
 * <script src="https://your-domain.com/chatbot.js"></script>
 *
 * With config:
 * <script>
 *   window.VetChatbotConfig = {
 *     userId: "user_123",
 *     userName: "John Doe",
 *     petName: "Buddy",
 *     source: "marketing-website"
 *   };
 * </script>
 * <script src="https://your-domain.com/chatbot.js"></script>
 */

// Lightweight virtual DOM implementation
function h(type, props, ...children) {
  return { type, props: props || {}, children: children.flat() }
}

function Fragment(props) {
  return props.children
}

function render(vnode, container) {
  if (typeof vnode === "string" || typeof vnode === "number") {
    return document.createTextNode(vnode)
  }

  if (!vnode) return document.createTextNode("")

  const el = document.createElement(vnode.type)

  // Set props
  Object.entries(vnode.props).forEach(([key, value]) => {
    if (key === "className") {
      el.className = value
    } else if (key === "style" && typeof value === "object") {
      Object.assign(el.style, value)
    } else if (key.startsWith("on")) {
      el.addEventListener(key.slice(2).toLowerCase(), value)
    } else if (key === "dangerouslySetInnerHTML") {
      el.innerHTML = value.__html
    } else {
      el.setAttribute(key, value)
    }
  })

  // Render children
  vnode.children.forEach((child) => {
    const childEl = render(child)
    if (childEl) el.appendChild(childEl)
  })

  return el
}

// SDK State Management
class ChatbotState {
  constructor() {
    this.isOpen = false
    this.messages = []
    this.isLoading = false
    this.error = null
    this.sessionId = null
    this.listeners = []
  }

  subscribe(listener) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  notify() {
    this.listeners.forEach((l) => l(this))
  }

  setState(updates) {
    Object.assign(this, updates)
    this.notify()
  }
}

// API Client
class VetChatAPI {
  constructor(baseUrl) {
    this.baseUrl = baseUrl
  }

  async initSession(context) {
    const res = await fetch(`${this.baseUrl}/api/chat/init`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ context }),
    })
    return res.json()
  }

  async sendMessage(sessionId, message, context) {
    const res = await fetch(`${this.baseUrl}/api/chat/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, message, context }),
    })
    return res.json()
  }
}

// Main Chatbot Class
class VetChatbot {
  constructor() {
    this.config = window.VetChatbotConfig || {}
    this.state = new ChatbotState()
    this.container = null
    this.api = null
  }

  init(options = {}) {
    // Merge config
    this.config = { ...this.config, ...options }

    // Determine API URL
    const scriptTag = document.currentScript || document.querySelector('script[src*="chatbot.js"]')
    const scriptUrl = scriptTag?.src || ""
    const urlMatch = scriptUrl.match(/^(https?:\/\/[^/]+)/)
    this.config.apiUrl = this.config.apiUrl || (urlMatch ? urlMatch[1] : "http://localhost:3001")

    this.api = new VetChatAPI(this.config.apiUrl)

    // Create container
    this.createContainer()

    // Initialize session
    this.initSession()

    // Subscribe to state changes
    this.state.subscribe(() => this.renderUI())

    // Initial render
    this.renderUI()
  }

  createContainer() {
    this.container = document.createElement("div")
    this.container.id = "vetchat-widget"
    document.body.appendChild(this.container)

    // Inject styles
    const styles = document.createElement("style")
    styles.textContent = this.getStyles()
    document.head.appendChild(styles)
  }

  async initSession() {
    try {
      const result = await this.api.initSession({
        userId: this.config.userId,
        userName: this.config.userName,
        petName: this.config.petName,
        source: this.config.source,
      })

      if (result.success) {
        this.state.setState({
          sessionId: result.data.sessionId,
          messages: [
            {
              role: "assistant",
              content: result.data.message,
              timestamp: new Date(),
            },
          ],
        })
      }
    } catch (error) {
      this.state.setState({ error: "Failed to initialize chat. Please refresh the page." })
    }
  }

  async sendMessage(message) {
    if (!message.trim() || this.state.isLoading) return

    // Add user message
    const userMessage = {
      role: "user",
      content: message,
      timestamp: new Date(),
    }

    this.state.setState({
      messages: [...this.state.messages, userMessage],
      isLoading: true,
      error: null,
    })

    try {
      const result = await this.api.sendMessage(this.state.sessionId, message, {
        userId: this.config.userId,
        userName: this.config.userName,
        petName: this.config.petName,
      })

      if (result.success) {
        const botMessage = {
          role: "assistant",
          content: result.data.response,
          timestamp: new Date(),
        }

        this.state.setState({
          messages: [...this.state.messages, botMessage],
          isLoading: false,
        })
      } else {
        throw new Error(result.error || "Failed to get response")
      }
    } catch (error) {
      this.state.setState({
        isLoading: false,
        error: "Something went wrong. Please try again.",
      })
    }
  }

  toggle() {
    this.state.setState({ isOpen: !this.state.isOpen })
  }

  renderUI() {
    const { isOpen, messages, isLoading, error } = this.state

    // Clear container
    this.container.innerHTML = ""

    // Widget button (always visible)
    const button = render(
      h(
        "button",
        {
          className: "vetchat-toggle",
          onClick: () => this.toggle(),
          "aria-label": isOpen ? "Close chat" : "Open chat",
        },
        isOpen ? "✕" : "🐾",
      ),
    )
    this.container.appendChild(button)

    // Chat window (when open)
    if (isOpen) {
      const chatWindow = render(
        h(
          "div",
          { className: "vetchat-window" },
          // Header
          h(
            "div",
            { className: "vetchat-header" },
            h(
              "div",
              { className: "vetchat-header-content" },
              h("span", { className: "vetchat-icon" }, "🏥"),
              h(
                "div",
                {},
                h("div", { className: "vetchat-title" }, "Vet Assistant"),
                h("div", { className: "vetchat-subtitle" }, "Ask about pet health or book an appointment"),
              ),
            ),
          ),

          // Messages
          h(
            "div",
            { className: "vetchat-messages", id: "vetchat-messages" },
            ...messages.map((msg) =>
              h(
                "div",
                {
                  className: `vetchat-message vetchat-message-${msg.role}`,
                },
                h("div", {
                  className: "vetchat-message-content",
                  dangerouslySetInnerHTML: { __html: this.formatMessage(msg.content) },
                }),
              ),
            ),
            isLoading
              ? h(
                  "div",
                  { className: "vetchat-message vetchat-message-assistant" },
                  h("div", { className: "vetchat-typing" }, h("span", {}), h("span", {}), h("span", {})),
                )
              : null,
            error ? h("div", { className: "vetchat-error" }, error) : null,
          ),

          // Input
          h(
            "form",
            {
              className: "vetchat-input-form",
              onSubmit: (e) => {
                e.preventDefault()
                const input = e.target.querySelector("input")
                this.sendMessage(input.value)
                input.value = ""
              },
            },
            h("input", {
              type: "text",
              className: "vetchat-input",
              placeholder: "Type your message...",
              disabled: isLoading,
            }),
            h(
              "button",
              {
                type: "submit",
                className: "vetchat-send",
                disabled: isLoading,
              },
              "→",
            ),
          ),
        ),
      )
      this.container.appendChild(chatWindow)

      // Scroll to bottom
      setTimeout(() => {
        const messagesEl = document.getElementById("vetchat-messages")
        if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight
      }, 0)
    }
  }

  formatMessage(content) {
    // Convert markdown-style formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br>")
      .replace(/📋|📅|🐾|🏥/g, (match) => `<span class="emoji">${match}</span>`)
  }

  getStyles() {
    return `
      #vetchat-widget {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 999999;
      }
      
      .vetchat-toggle {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        border: none;
        background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
        color: white;
        font-size: 24px;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(79, 70, 229, 0.4);
        transition: transform 0.2s, box-shadow 0.2s;
        position: absolute;
        bottom: 0;
        right: 0;
      }
      
      .vetchat-toggle:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 25px rgba(79, 70, 229, 0.5);
      }
      
      .vetchat-window {
        position: absolute;
        bottom: 80px;
        right: 0;
        width: 380px;
        height: 520px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      
      @media (max-width: 480px) {
        .vetchat-window {
          width: calc(100vw - 40px);
          height: calc(100vh - 120px);
          bottom: 80px;
          right: 0;
        }
      }
      
      .vetchat-header {
        background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
        color: white;
        padding: 16px;
      }
      
      .vetchat-header-content {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .vetchat-icon {
        font-size: 28px;
      }
      
      .vetchat-title {
        font-weight: 600;
        font-size: 16px;
      }
      
      .vetchat-subtitle {
        font-size: 12px;
        opacity: 0.9;
      }
      
      .vetchat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        background: #F9FAFB;
      }
      
      .vetchat-message {
        max-width: 85%;
        animation: fadeIn 0.2s ease;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .vetchat-message-user {
        align-self: flex-end;
      }
      
      .vetchat-message-assistant {
        align-self: flex-start;
      }
      
      .vetchat-message-content {
        padding: 12px 16px;
        border-radius: 16px;
        font-size: 14px;
        line-height: 1.5;
      }
      
      .vetchat-message-user .vetchat-message-content {
        background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
        color: white;
        border-bottom-right-radius: 4px;
      }
      
      .vetchat-message-assistant .vetchat-message-content {
        background: white;
        color: #374151;
        border: 1px solid #E5E7EB;
        border-bottom-left-radius: 4px;
      }
      
      .vetchat-typing {
        display: flex;
        gap: 4px;
        padding: 12px 16px;
        background: white;
        border-radius: 16px;
        border: 1px solid #E5E7EB;
      }
      
      .vetchat-typing span {
        width: 8px;
        height: 8px;
        background: #9CA3AF;
        border-radius: 50%;
        animation: typing 1.4s infinite ease-in-out both;
      }
      
      .vetchat-typing span:nth-child(1) { animation-delay: -0.32s; }
      .vetchat-typing span:nth-child(2) { animation-delay: -0.16s; }
      
      @keyframes typing {
        0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
        40% { transform: scale(1); opacity: 1; }
      }
      
      .vetchat-error {
        background: #FEE2E2;
        color: #DC2626;
        padding: 12px;
        border-radius: 8px;
        font-size: 13px;
        text-align: center;
      }
      
      .vetchat-input-form {
        display: flex;
        padding: 12px;
        gap: 8px;
        background: white;
        border-top: 1px solid #E5E7EB;
      }
      
      .vetchat-input {
        flex: 1;
        padding: 12px 16px;
        border: 1px solid #E5E7EB;
        border-radius: 24px;
        font-size: 14px;
        outline: none;
        transition: border-color 0.2s;
      }
      
      .vetchat-input:focus {
        border-color: #4F46E5;
      }
      
      .vetchat-input:disabled {
        background: #F9FAFB;
      }
      
      .vetchat-send {
        width: 44px;
        height: 44px;
        border: none;
        background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
        color: white;
        border-radius: 50%;
        font-size: 18px;
        cursor: pointer;
        transition: transform 0.2s;
      }
      
      .vetchat-send:hover:not(:disabled) {
        transform: scale(1.05);
      }
      
      .vetchat-send:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      
      .emoji {
        font-family: "Apple Color Emoji", "Segoe UI Emoji", sans-serif;
      }
    `
  }
}

// Auto-initialize when script loads
const chatbot = new VetChatbot()

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => chatbot.init())
} else {
  chatbot.init()
}

// Export for manual initialization
export default chatbot
