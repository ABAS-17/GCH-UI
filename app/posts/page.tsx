'use client'

import { useState, useEffect } from 'react'
import { Plus, Filter, TrendingUp, MapPin, RefreshCw } from 'lucide-react'
import PostComponent from '@/components/PostComponent'
import PostFeed from '@/components/PostFeed'
import { API_BASE_URL, DEFAULT_USER_ID, DEFAULT_LOCATION } from '@/lib/constants'

// Updated to match backend EventTopic enum exactly
const TOPIC_FILTERS = [
  { value: 'all', label: 'All Posts', icon: '📱' },
  { value: 'traffic', label: 'Traffic', icon: '🚗' },
  { value: 'infrastructure', label: 'Infrastructure', icon: '⚡' },
  { value: 'weather', label: 'Weather', icon: '🌧️' },
  { value: 'safety', label: 'Safety', icon: '🚨' },
  { value: 'events', label: 'Events', icon: '🎉' }
]

const SORT_OPTIONS = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'trending', label: 'Trending' },
  { value: 'nearby', label: 'Nearby' },
  { value: 'priority', label: 'High Priority' }
]

export default function PostsPage() {
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all')
  const [sortBy, setSortBy] = useState('recent')
  const [posts, setPosts] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number, address: string} | null>(null)
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking')
  
  // NEW: Track newly created posts and feed refresh
  const [feedKey, setFeedKey] = useState(0)
  const [newPostEventId, setNewPostEventId] = useState<string | null>(null)
  const [lastCreatedPost, setLastCreatedPost] = useState<any>(null)

  // Check backend connection on mount
  useEffect(() => {
    checkBackendConnection()
    getCurrentLocation()
  }, [])

  const checkBackendConnection = async () => {
    try {
      setBackendStatus('checking')
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        timeout: 5000 as any
      })
      
      if (response.ok) {
        setBackendStatus('connected')
        console.log('✅ Backend connected successfully')
      } else {
        setBackendStatus('disconnected')
        console.log('❌ Backend health check failed')
      }
    } catch (error) {
      setBackendStatus('disconnected')
      console.error('❌ Backend connection error:', error)
    }
  }

  const getCurrentLocation = async () => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        })
      })

      const { latitude, longitude } = position.coords
      setUserLocation({
        lat: latitude,
        lng: longitude,
        address: 'HSR Layout, Bengaluru' // In real app, reverse geocode
      })
    } catch (error) {
      console.error('Location error:', error)
      // Fallback location
      setUserLocation(DEFAULT_LOCATION)
    }
  }

  // UPDATED: Better post creation handling
  const handleCreatePost = async (postData: any) => {
    console.log('📝 Creating post:', postData)
    
    try {
      // Extract event ID from backend response
      const eventId = postData.backend_response?.event_id || postData.id
      
      if (eventId) {
        console.log('✅ Post created successfully with event ID:', eventId)
        
        // Store the created post info
        setLastCreatedPost({
          ...postData,
          eventId,
          createdAt: new Date().toISOString()
        })
        
        // Notify PostFeed about the new post
        setNewPostEventId(eventId)
        
        // Also refresh the feed after a short delay
        setTimeout(() => {
          setFeedKey(prev => prev + 1)
        }, 1000)
        
        // Show success feedback
        showSuccessNotification(`Post created successfully! Event ID: ${eventId}`)
      }
      
      setShowCreatePost(false)
      
    } catch (error) {
      console.error('Error handling post creation:', error)
      throw error
    }
  }

  // NEW: Show success notification
  const showSuccessNotification = (message: string) => {
    // Create a temporary notification element
    const notification = document.createElement('div')
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300'
    notification.textContent = message
    document.body.appendChild(notification)
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)'
    }, 100)
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(400px)'
      setTimeout(() => {
        document.body.removeChild(notification)
      }, 300)
    }, 3000)
  }

  const refreshPosts = () => {
    console.log('🔄 Manually refreshing posts...')
    setFeedKey(prev => prev + 1)
    setNewPostEventId(null) // Clear the new post notification
  }

  const getFilteredPostsCount = () => {
    // This would come from backend in real implementation
    const counts: Record<string, number> = {
      all: 28,
      traffic: 12,
      infrastructure: 8,
      weather: 3,
      safety: 2,
      events: 1
    }
    return counts[activeFilter] || 0
  }

  const getBackendStatusIndicator = () => {
    switch (backendStatus) {
      case 'checking':
        return <span className="text-yellow-600">🔄 Checking...</span>
      case 'connected':
        return <span className="text-green-600">✅ Connected</span>
      case 'disconnected':
        return <span className="text-red-600">❌ Offline</span>
    }
  }

  // NEW: Clear new post notification after some time
  useEffect(() => {
    if (newPostEventId) {
      const timer = setTimeout(() => {
        setNewPostEventId(null)
      }, 10000) // Clear after 10 seconds
      
      return () => clearTimeout(timer)
    }
  }, [newPostEventId])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                📱 Community Posts
              </h1>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-gray-600 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {userLocation?.address || 'Getting location...'}
                </p>
                <div className="text-sm">
                  {getBackendStatusIndicator()}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={refreshPosts}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Refresh posts"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setShowCreatePost(true)}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all flex items-center gap-2 font-medium shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Create Post
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Backend Status Banner */}
      {backendStatus === 'disconnected' && (
        <div className="bg-yellow-50 border-b border-yellow-200">
          <div className="max-w-4xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-yellow-800">
                <span>⚠️</span>
                <span className="text-sm">
                  Backend offline - showing cached/mock data. Posts will sync when reconnected.
                </span>
              </div>
              <button
                onClick={checkBackendConnection}
                className="text-yellow-800 hover:text-yellow-900 text-sm font-medium"
              >
                Retry Connection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Success banner for new posts */}
      {newPostEventId && (
        <div className="bg-green-50 border-b border-green-200">
          <div className="max-w-4xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-800">
                <span>✅</span>
                <span className="text-sm font-medium">
                  Your post was created successfully! It may take a moment to appear in the feed.
                </span>
              </div>
              <button
                onClick={() => setNewPostEventId(null)}
                className="text-green-800 hover:text-green-900 text-sm font-medium"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          {/* Topic Filters */}
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
            {TOPIC_FILTERS.map(filter => (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  activeFilter === filter.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{filter.icon}</span>
                {filter.label}
                {filter.value !== 'all' && activeFilter === filter.value && (
                  <span className="bg-white bg-opacity-30 text-xs px-1.5 py-0.5 rounded-full">
                    {getFilteredPostsCount()}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Sort Options */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {SORT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <TrendingUp className="w-4 h-4" />
              <span>{getFilteredPostsCount()} posts</span>
              {backendStatus === 'connected' && (
                <span className="text-green-600">• Live</span>
              )}
              {newPostEventId && (
                <span className="text-blue-600">• New post added</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* Active Filters Display */}
        {activeFilter !== 'all' && (
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    Filtering by: {TOPIC_FILTERS.find(f => f.value === activeFilter)?.label}
                  </span>
                </div>
                <button
                  onClick={() => setActiveFilter('all')}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Clear Filter
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Posts Feed - UPDATED with new props */}
        <PostFeed
          key={feedKey} // Force re-render when this changes
          posts={posts}
          isLoading={isLoading}
          hasMore={false}
          topic={activeFilter}
          sortBy={sortBy}
          newPostAdded={newPostEventId} // NEW: Pass the new post event ID
          refreshTrigger={feedKey} // NEW: Pass refresh trigger
        />
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <PostComponent
              onSubmit={handleCreatePost}
              onClose={() => setShowCreatePost(false)}
            />
          </div>
        </div>
      )}

      {/* Quick Stats Bar */}
      <div className="fixed bottom-20 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-3 hidden md:block">
        <div className="text-xs text-gray-600 mb-1">Backend Status</div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span>API</span>
            <span className="font-medium">{getBackendStatusIndicator()}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Endpoint</span>
            <span className="font-medium text-xs">{API_BASE_URL.replace('http://', '')}</span>
          </div>
          {backendStatus === 'connected' && (
            <div className="flex items-center justify-between text-sm">
              <span>📍 Live Data</span>
              <span className="font-medium text-green-600">✓</span>
            </div>
          )}
          {newPostEventId && (
            <div className="flex items-center justify-between text-sm">
              <span>🆕 New Post</span>
              <span className="font-medium text-blue-600">✓</span>
            </div>
          )}
        </div>
        <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
          Valid topics: Traffic, Infrastructure, Weather, Safety, Events
        </div>
      </div>
    </div>
  )
}