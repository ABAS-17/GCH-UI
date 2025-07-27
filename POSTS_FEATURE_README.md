# 📱 Media-Enhanced Posts Feature

A comprehensive social media-style posting system integrated with your City Pulse Agent backend, featuring AI-powered media analysis and real-time city event integration.

## 🚀 Features

### ✨ **PostComponent** (`/components/PostComponent.tsx`)
- **Rich Media Upload**: Photos, videos, and audio with live preview
- **Real-time AI Analysis**: Automatic media analysis using your backend
- **Smart Location**: GPS integration with fallback
- **Topic Categories**: Traffic, Infrastructure, Weather, Safety, Events, Community
- **Priority Levels**: Low, Medium, High, Critical with color coding
- **Backend Integration**: Direct upload to your FastAPI `/events/enhanced` endpoint

### 📱 **PostFeed** (`/components/PostFeed.tsx`)
- **Live Data**: Fetches posts from your backend `/events/search` and `/events/nearby` endpoints
- **Interactive Posts**: Like, comment, share functionality
- **Media Grid**: Smart layout for multiple media types with video controls
- **AI Insights**: Displays analysis results from your enhanced processor
- **Distance Display**: Shows proximity to user location
- **Fallback Support**: Graceful degradation when backend is offline

### 🏠 **Posts Page** (`/app/posts/page.tsx`)
- **Advanced Filtering**: By topic, priority, location with live counts
- **Sorting Options**: Recent, trending, nearby, priority
- **Backend Status**: Real-time connection monitoring
- **Create Modal**: Full-screen post creation experience
- **Auto-refresh**: Live data updates

### 🧭 **Updated Navigation** (`/components/Navigation.tsx`)
- **New Tab**: "Community" tab with posts icon
- **Active States**: Visual feedback for current page

## 🔧 Backend Integration

### **Endpoints Used:**
```
POST /events/enhanced          # Create posts
POST /media/upload            # Upload media files  
POST /media/analyze           # AI media analysis
GET  /events/search           # Search posts/events
GET  /events/nearby           # Nearby events
GET  /health                  # Connection status
```

### **Data Flow:**
1. **Create Post**: `PostComponent` → `/events/enhanced` → Your event processing pipeline
2. **Media Upload**: Files → `/media/upload` → Storage client → `/media/analyze` → AI analysis
3. **Load Posts**: `PostFeed` → `/events/search` + `/events/nearby` → ChromaDB search
4. **Real-time Updates**: Posts automatically indexed in ChromaDB for search

## 🛠 Setup & Testing

### **1. Start Backend**
```bash
cd your-backend-directory
python main.py
# Backend runs on http://localhost:8000
```

### **2. Start Frontend**
```bash
cd /Users/ab/GCH-UI
npm run dev
# Frontend runs on http://localhost:3000
```

### **3. Test Integration**
```bash
cd /Users/ab/GCH-UI
./test-backend-integration.sh
```

### **4. Visit Posts Page**
```
http://localhost:3000/posts
```

## ✅ What's Working

- ✅ **Full Backend Integration**: Real API calls to your FastAPI endpoints
- ✅ **Media Upload**: Files uploaded to your storage client
- ✅ **AI Analysis**: Uses your enhanced processor for media analysis
- ✅ **Event Creation**: Posts become events in your system
- ✅ **Search Integration**: Posts searchable via your ChromaDB
- ✅ **Live Data**: Feeds from your existing events database
- ✅ **Offline Graceful**: Fallback to mock data when backend offline
- ✅ **Mobile Responsive**: Works on all screen sizes

## 🎯 Key Integration Points

### **PostComponent → Backend**
```typescript
// Creates events via your enhanced endpoint
const response = await fetch(`${API_BASE_URL}/events/enhanced`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    topic, title, description, location, severity, media_urls
  })
})
```

### **PostFeed → Backend**
```typescript
// Loads posts from your events system
const response = await fetch(
  `${API_BASE_URL}/events/search?query=${searchQuery}&lat=${lat}&lng=${lng}`
)
```

### **Media Upload → Backend**
```typescript
// Uploads via your media endpoint
const formData = new FormData()
files.forEach(file => formData.append('files', file))
const response = await fetch(`${API_BASE_URL}/media/upload`, {
  method: 'POST', body: formData
})
```

## 🔍 Testing Checklist

- [ ] **Backend Health**: Check `http://localhost:8000/health`
- [ ] **Posts Page**: Visit `http://localhost:3000/posts`
- [ ] **Create Post**: Click "Create Post" → Fill form → Submit
- [ ] **Media Upload**: Add photos/videos → See AI analysis
- [ ] **View Feed**: Posts load from backend events
- [ ] **Filtering**: Test topic and sort filters
- [ ] **Offline Mode**: Stop backend → See graceful fallback

## 🐛 Troubleshooting

### **Backend Not Connecting**
```bash
# Check if backend is running
curl http://localhost:8000/health

# Check backend logs for errors
# Ensure CORS is enabled (already configured)
```

### **Media Upload Issues**
```bash
# Check storage client configuration
# Verify file size limits (50MB max)
# Check media analysis endpoint
```

### **No Posts Loading**
```bash
# Check if events exist in ChromaDB
# Verify search endpoints working
# Check browser network tab for API errors
```

### **Frontend Issues**
```bash
# Clear browser cache
# Check console for JavaScript errors
# Verify all dependencies installed: npm install
```

## 📁 File Structure

```
/Users/ab/GCH-UI/
├── app/posts/page.tsx              # Main posts page
├── components/
│   ├── PostComponent.tsx           # Create post component
│   ├── PostFeed.tsx               # Posts feed component
│   └── Navigation.tsx             # Updated navigation
├── lib/constants.ts               # API configuration
└── test-backend-integration.sh    # Integration test script
```

## 🎉 Ready to Use!

Your media-enhanced posts feature is now fully integrated with your City Pulse Agent backend. Posts created here will:

1. **Become Events** in your event management system
2. **Be Indexed** in ChromaDB for semantic search
3. **Trigger AI Analysis** via your enhanced processor
4. **Appear in Dashboard** as city insights
5. **Support Media** with automatic analysis and storage

The system gracefully handles offline scenarios and provides a premium social media experience while leveraging your existing AI infrastructure.
