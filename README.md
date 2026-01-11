# VetChat SDK - Embeddable Veterinary Chatbot

A production-ready, website-embeddable chatbot SDK for veterinary practices. Built with the MERN stack and Google Gemini AI.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Websites                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  <script src="https://api.vetchat.com/chatbot.js"/>     │   │
│  │  window.VetChatbotConfig = { userId, petName, ... }     │   │
│  └──────────────────────────────────────────��──────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      VetChat SDK (React)                        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐    │
│  │ Chat Widget  │ │ Message List │ │ Appointment Booking  │    │
│  └──────────────┘ └──────────────┘ └──────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ REST API
┌─────────────────────────────────────────────────────────────────┐
│                    Express Backend                              │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│  │ Controllers│ │  Services  │ │  AI Logic  │ │  DB Access │   │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────────┐
        │ MongoDB  │   │  Gemini  │   │ Admin Panel  │
        │ Database │   │   API    │   │  (React)     │
        └──────────┘   └──────────┘   └──────────────┘
```

## Features

- **Embeddable Widget**: Single `<script>` tag integration
- **Context-Aware**: Optional configuration for user/pet context
- **AI-Powered Q&A**: Veterinary-focused responses via Google Gemini
- **Appointment Booking**: Conversational multi-step booking flow
- **Admin Dashboard**: View and manage appointments
- **Full Persistence**: MongoDB storage for conversations and appointments

## Quick Start

### Basic Integration (No Config Required)

```html
<script src="https://your-domain.com/chatbot.js"></script>
```

### With Configuration

```html
<script>
  window.VetChatbotConfig = {
    userId: "user_123",
    userName: "John Doe",
    petName: "Buddy",
    source: "marketing-website"
  };
</script>
<script src="https://your-domain.com/chatbot.js"></script>
```

## Setup Instructions

### Prerequisites

- Node.js 18+
- MongoDB 6+
- Google Gemini API Key

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/vetchat-sdk.git
cd vetchat-sdk

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your values

# Start MongoDB (if local)
mongod --dbpath /data/db

# Run development server
npm run dev

# Build SDK for production
npm run build:sdk
```

### Docker Setup

```bash
# Build and run with Docker Compose
docker-compose up --build

# Or build individual images
docker build -t vetchat-api ./server
docker build -t vetchat-admin ./admin
```

## API Documentation

### POST /api/chat/message
Send a message and receive AI response.

**Request:**
```json
{
  "sessionId": "uuid-session-id",
  "message": "What vaccines does my puppy need?",
  "context": {
    "userId": "user_123",
    "userName": "John",
    "petName": "Buddy"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Great question about Buddy! Puppies typically need...",
    "sessionId": "uuid-session-id",
    "isBookingFlow": false
  }
}
```

### POST /api/appointments
Create a new appointment.

**Request:**
```json
{
  "sessionId": "uuid-session-id",
  "ownerName": "John Doe",
  "petName": "Buddy",
  "phone": "555-0123",
  "preferredDateTime": "2024-02-15T10:00:00Z"
}
```

### GET /api/appointments
Fetch all appointments (Admin only).

### GET /api/conversations/:sessionId
Fetch conversation history.

## Key Decisions & Trade-offs

| Decision | Rationale |
|----------|-----------|
| Stateless booking flow | Simpler than state machines, session-based tracking in DB |
| Single bundled JS file | Easy integration, no dependencies for end users |
| REST over WebSocket | Simpler, sufficient for chat use case, easier to debug |
| Gemini API | Free tier available, good for veterinary knowledge |
| MongoDB | Flexible schema for conversation history |
| Polling over push | More reliable, simpler implementation |

## Assumptions

1. Single veterinary practice per deployment (multi-tenant not required)
2. Appointments are requests, not confirmed bookings
3. Basic validation sufficient (no identity verification)
4. English language only
5. No file/image uploads required

## Future Improvements

- [ ] Multi-language support
- [ ] WebSocket for real-time updates
- [ ] Image upload for pet symptoms
- [ ] Calendar integration (Google Calendar, Calendly)
- [ ] SMS/Email notifications
- [ ] Analytics dashboard
- [ ] Multi-tenant support
- [ ] Rate limiting per session
- [ ] Webhook notifications for new appointments

## Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage
```

## License

MIT License - See LICENSE file
