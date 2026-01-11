import { NextResponse } from "next/server"

// Inline SDK for demo purposes
// In production, this would serve the built SDK from server/dist/chatbot.js
const SDK_CODE = `
(function() {
  'use strict';

  // SDK State
  const state = {
    isOpen: false,
    messages: [],
    isLoading: false,
    error: null,
    sessionId: null
  };

  const config = window.VetChatbotConfig || {};
  const API_URL = config.apiUrl || window.location.origin;

  // API functions
  async function initSession() {
    try {
      const res = await fetch(API_URL + '/api/chat/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: config })
      });
      const data = await res.json();
      if (data.success) {
        state.sessionId = data.data.sessionId;
        state.messages = [{ role: 'assistant', content: data.data.message }];
        render();
      }
    } catch (e) {
      state.error = 'Failed to connect. Please refresh.';
      render();
    }
  }

  async function sendMessage(message) {
    if (!message.trim() || state.isLoading) return;
    
    state.messages.push({ role: 'user', content: message });
    state.isLoading = true;
    state.error = null;
    render();

    try {
      const res = await fetch(API_URL + '/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: state.sessionId,
          message: message,
          context: config
        })
      });
      const data = await res.json();
      if (data.success) {
        state.messages.push({ role: 'assistant', content: data.data.response });
      } else {
        state.error = data.error || 'Failed to get response';
      }
    } catch (e) {
      state.error = 'Something went wrong. Please try again.';
    }
    
    state.isLoading = false;
    render();
  }

  function formatMessage(content) {
    return content
      .replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>')
      .replace(/\\n/g, '<br>');
  }

  function render() {
    let container = document.getElementById('vetchat-widget');
    if (!container) {
      container = document.createElement('div');
      container.id = 'vetchat-widget';
      document.body.appendChild(container);
    }

    const { isOpen, messages, isLoading, error } = state;

    container.innerHTML = \`
      <button class="vetchat-toggle" onclick="window._vetchat.toggle()" aria-label="\${isOpen ? 'Close' : 'Open'} chat">
        \${isOpen ? '✕' : '🐾'}
      </button>
      \${isOpen ? \`
        <div class="vetchat-window">
          <div class="vetchat-header">
            <div class="vetchat-header-content">
              <span class="vetchat-icon">🏥</span>
              <div>
                <div class="vetchat-title">Vet Assistant</div>
                <div class="vetchat-subtitle">Pet health & appointments</div>
              </div>
            </div>
          </div>
          <div class="vetchat-messages" id="vetchat-messages">
            \${messages.map(m => \`
              <div class="vetchat-message vetchat-message-\${m.role}">
                <div class="vetchat-message-content">\${formatMessage(m.content)}</div>
              </div>
            \`).join('')}
            \${isLoading ? \`
              <div class="vetchat-message vetchat-message-assistant">
                <div class="vetchat-typing"><span></span><span></span><span></span></div>
              </div>
            \` : ''}
            \${error ? \`<div class="vetchat-error">\${error}</div>\` : ''}
          </div>
          <form class="vetchat-input-form" onsubmit="window._vetchat.submit(event)">
            <input type="text" class="vetchat-input" placeholder="Type your message..." \${isLoading ? 'disabled' : ''}>
            <button type="submit" class="vetchat-send" \${isLoading ? 'disabled' : ''}>→</button>
          </form>
        </div>
      \` : ''}
    \`;

    // Scroll to bottom
    const msgs = document.getElementById('vetchat-messages');
    if (msgs) msgs.scrollTop = msgs.scrollHeight;
  }

  // Inject styles
  const style = document.createElement('style');
  style.textContent = \`
    #vetchat-widget{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;position:fixed;bottom:20px;right:20px;z-index:999999}
    .vetchat-toggle{width:60px;height:60px;border-radius:50%;border:none;background:linear-gradient(135deg,#4F46E5 0%,#7C3AED 100%);color:#fff;font-size:24px;cursor:pointer;box-shadow:0 4px 20px rgba(79,70,229,.4);transition:transform .2s}
    .vetchat-toggle:hover{transform:scale(1.05)}
    .vetchat-window{position:absolute;bottom:80px;right:0;width:380px;height:520px;background:#fff;border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,.15);display:flex;flex-direction:column;overflow:hidden}
    @media(max-width:480px){.vetchat-window{width:calc(100vw - 40px);height:calc(100vh - 120px)}}
    .vetchat-header{background:linear-gradient(135deg,#4F46E5 0%,#7C3AED 100%);color:#fff;padding:16px}
    .vetchat-header-content{display:flex;align-items:center;gap:12px}
    .vetchat-icon{font-size:28px}
    .vetchat-title{font-weight:600;font-size:16px}
    .vetchat-subtitle{font-size:12px;opacity:.9}
    .vetchat-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;background:#F9FAFB}
    .vetchat-message{max-width:85%;animation:fadeIn .2s}
    @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    .vetchat-message-user{align-self:flex-end}
    .vetchat-message-assistant{align-self:flex-start}
    .vetchat-message-content{padding:12px 16px;border-radius:16px;font-size:14px;line-height:1.5}
    .vetchat-message-user .vetchat-message-content{background:linear-gradient(135deg,#4F46E5 0%,#7C3AED 100%);color:#fff;border-bottom-right-radius:4px}
    .vetchat-message-assistant .vetchat-message-content{background:#fff;color:#374151;border:1px solid #E5E7EB;border-bottom-left-radius:4px}
    .vetchat-typing{display:flex;gap:4px;padding:12px 16px;background:#fff;border-radius:16px;border:1px solid #E5E7EB}
    .vetchat-typing span{width:8px;height:8px;background:#9CA3AF;border-radius:50%;animation:typing 1.4s infinite}
    .vetchat-typing span:nth-child(1){animation-delay:-.32s}
    .vetchat-typing span:nth-child(2){animation-delay:-.16s}
    @keyframes typing{0%,80%,100%{transform:scale(.6);opacity:.5}40%{transform:scale(1);opacity:1}}
    .vetchat-error{background:#FEE2E2;color:#DC2626;padding:12px;border-radius:8px;font-size:13px;text-align:center}
    .vetchat-input-form{display:flex;padding:12px;gap:8px;background:#fff;border-top:1px solid #E5E7EB}
    .vetchat-input{flex:1;padding:12px 16px;border:1px solid #E5E7EB;border-radius:24px;font-size:14px;outline:none}
    .vetchat-input:focus{border-color:#4F46E5}
    .vetchat-input:disabled{background:#F9FAFB}
    .vetchat-send{width:44px;height:44px;border:none;background:linear-gradient(135deg,#4F46E5 0%,#7C3AED 100%);color:#fff;border-radius:50%;font-size:18px;cursor:pointer}
    .vetchat-send:disabled{opacity:.6;cursor:not-allowed}
  \`;
  document.head.appendChild(style);

  // Global handlers
  window._vetchat = {
    toggle: function() {
      state.isOpen = !state.isOpen;
      render();
    },
    submit: function(e) {
      e.preventDefault();
      const input = e.target.querySelector('input');
      sendMessage(input.value);
      input.value = '';
    }
  };

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      render();
      initSession();
    });
  } else {
    render();
    initSession();
  }
})();
`

export async function GET() {
  return new NextResponse(SDK_CODE, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=3600",
    },
  })
}
