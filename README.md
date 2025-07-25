# Urban Intelligence - Web UI

## 🏙️ AI-Powered City Intelligence Platform

A responsive web application built with Next.js that provides real-time city insights for Bengaluru residents. Features include live incident tracking, AI-powered chat assistance, interactive maps, and personalized dashboards.

## ✨ Features

### 🏠 Live Dashboard
- **Real-time pulse cards** with AI synthesis
- **Server-sent events** for live updates
- **Personalized content** based on user location
- **Priority-based alerts** (low, medium, high, critical)
- **Mini map overview** with incident markers

### 🤖 AI Chat Assistant
- **Context-aware conversations** with Perplexity-style UI
- **Card context integration** - click any pulse card to chat about it
- **Suggested prompts** for quick interactions
- **Voice input support** (where available)
- **Real-time responses** from your FastAPI backend

### 🗺️ Interactive Maps
- **Live incident visualization** with real-time data
- **Filterable by type** (traffic, weather, infrastructure, events, safety)
- **Click-to-chat functionality** for any incident
- **Distance-aware sorting** and display
- **Detailed incident popups**

### 👤 User Profile
- **Personalization settings** for interests and notifications
- **Location preferences** (home, work, radius)
- **Notification controls** with granular settings
- **Usage statistics** and insights

## 🎯 User Journey Flow

```
📱 Home Dashboard → 🤖 AI Chat (with context)
     ↓               ↗️
🗺️ Interactive Maps → 👤 User Profile
```

1. **Home → AI Chat**: Click any pulse card to chat about that specific incident
2. **Home → Maps**: Click mini-map to explore full interactive map
3. **Maps → AI Chat**: Click any map incident to discuss it with AI
4. **Profile**: Personalize experience across all screens

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Your FastAPI backend running on `http://localhost:8000`

### Installation

```bash
# Navigate to the project directory
cd /Users/apoorvasarvade/Documents/Personal/GCH/UrbanIntelligence-WebUi

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`

### Backend Integration

The app expects your FastAPI backend to be running at `http://localhost:8000` with these endpoints:

#### Dashboard Endpoints
- `GET /dashboard/{user_id}` - Get current dashboard state
- `GET /dashboard/{user_id}/stream` - Server-sent events for real-time updates

#### Chat Endpoints  
- `POST /adk/chat` - Send message to AI assistant
- `GET /adk/chat/{user_id}/history` - Get conversation history

#### Events Endpoints
- `GET /events/nearby` - Get nearby incidents
- `GET /events/search` - Search events semantically

#### User Endpoints
- `GET /users/{user_id}` - Get user profile
- `PUT /users/{user_id}` - Update user profile

## 📱 Responsive Design

### Mobile First (360px+)
- **Touch-optimized** navigation and interactions
- **Card-based layout** for easy thumb navigation
- **Full-screen chat experience**
- **Swipe-friendly** maps and lists

### Tablet (768px+)
- **Two-column layouts** where appropriate
- **Enhanced map experience** with sidebar
- **Larger touch targets**
- **Better text readability**

### Desktop (1024px+)
- **Multi-column dashboard** for more content
- **Larger map with detailed sidebar**
- **Keyboard shortcuts** support
- **Hover states** and transitions

## 🎨 Design System

### Colors
- **Primary**: `#007acc` (Urban Intelligence Blue)
- **Success**: `#16a34a` (Green)
- **Warning**: `#ea580c` (Orange)  
- **Danger**: `#dc2626` (Red)
- **Gray Scale**: 50-900 for text and backgrounds

### Typography
- **Font**: Inter (system fallback: -apple-system, BlinkMacSystemFont)
- **Scales**: xs(12px), sm(14px), base(16px), lg(18px), xl(20px)

### Components
- **Cards**: Rounded corners, subtle shadows, hover effects
- **Buttons**: Primary, secondary, ghost variants
- **Inputs**: Consistent styling with focus states
- **Navigation**: Bottom tab bar for mobile, persistent

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=Urban Intelligence
```

### API Configuration

Edit `lib/constants.ts` to modify:
- API endpoints
- Default user location
- Animation timings
- UI constants

## 📁 Project Structure

```
UrbanIntelligence-WebUi/
├── app/                    # Next.js 13+ app directory
│   ├── page.tsx           # Home dashboard
│   ├── chat/page.tsx      # AI chat assistant  
│   ├── maps/page.tsx      # Interactive maps
│   ├── profile/page.tsx   # User profile
│   └── layout.tsx         # Root layout
├── components/            # Reusable UI components
│   ├── Navigation.tsx     # Bottom tab navigation
│   ├── PulseCard.tsx     # Dashboard cards
│   ├── ChatMessage.tsx   # Chat bubbles
│   ├── MapView.tsx       # Map visualization
│   └── ...
├── lib/                  # Utilities and API
│   ├── api.ts           # API client
│   ├── constants.ts     # App constants
│   └── utils.ts         # Helper functions
└── public/              # Static assets
```

## 🔗 Backend Integration

### Expected API Responses

#### Dashboard Cards
```json
{
  "success": true,
  "cards": [
    {
      "id": "card_123",
      "type": "traffic_synthesis",
      "priority": "high",
      "title": "3 Accidents on ORR",
      "summary": "Heavy delays, use alternatives",
      "action": "Get AI assistance",
      "confidence": 0.92,
      "distance_km": 2.3,
      "synthesis_meta": {
        "event_count": 3,
        "topic": "traffic"
      }
    }
  ]
}
```

#### Chat Responses
```json
{
  "success": true,
  "response": "Traffic to Electronic City is heavy...",
  "suggested_actions": [
    {"text": "Alternative routes", "type": "navigation"}
  ],
  "conversation_id": "conv_123"
}
```

## 🎯 Key Features Showcase

### 1. Context-Aware AI Chat
- Click any dashboard card → AI chat opens with full context
- "I see you're interested in the traffic situation on ORR..."
- Contextual follow-up suggestions

### 2. Real-Time Updates
- Server-sent events for live dashboard updates
- No polling, efficient real-time data
- Automatic reconnection on connection loss

### 3. Progressive Enhancement
- Works offline with cached data
- Graceful degradation when backend unavailable
- Loading states and error handling

### 4. Accessibility
- Keyboard navigation support
- Screen reader friendly
- High contrast support
- Touch accessibility for mobile

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Environment Setup
1. Backend must be running at configured URL
2. CORS enabled for your domain
3. WebSocket/SSE support for real-time features

## 🔄 Backend Connection Status

The app handles different backend states:

- ✅ **Connected**: Full features, real-time updates
- ⚠️ **Degraded**: Mock data, limited functionality  
- ❌ **Offline**: Cached data only

## 🎊 Perfect for Demo

This UI perfectly showcases your sophisticated FastAPI backend:

- **Real-time city intelligence** in action
- **AI synthesis** clearly visible to users
- **Professional polish** that impresses judges
- **Full user journey** from discovery to action
- **Mobile-first** for modern expectations

## 📞 Troubleshooting

### Common Issues

1. **Backend not connecting**: Check CORS and URL configuration
2. **SSE not working**: Ensure backend supports EventSource
3. **Slow loading**: Check network and API response times
4. **Mobile layout issues**: Test on actual devices

### Debug Mode

Add to your `.env.local`:
```env
NEXT_PUBLIC_DEBUG=true
```

This enables additional console logging and debug information.

---

**🏆 Ready to win your hackathon!** This professional-grade UI demonstrates the full power of your Urban Intelligence platform.
