'use client'

import { useState, useEffect } from 'react'
import { Heart, MessageCircle, Share2, MapPin, Clock, MoreHorizontal, Play, Volume2, VolumeX } from 'lucide-react'
import { API_BASE_URL, DEFAULT_USER_ID, DEFAULT_LOCATION } from '@/lib/constants'

interface Post {
  id: string
  title: string
  description: string
  topic: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  location?: {
    lat: number
    lng: number
    address: string
  }
  mediaFiles: Array<{
    id: string
    type: 'image' | 'video' | 'audio'
    url: string
    analysis?: {
      description: string
      confidence: number
      objects: string[]
    }
  }>
  author: {
    id: string
    name: string
    avatar?: string
    verified?: boolean
  }
  timestamp: string
  likes: number
  comments: number
  shares: number
  user_liked?: boolean
  distance_km?: number
}

interface PostCardProps {
  post: Post
  onLike?: (postId: string) => void
  onComment?: (postId: string) => void
  onShare?: (postId: string) => void
}

// Updated to match backend EventTopic enum exactly
const TOPIC_ICONS: Record<string, string> = {
  traffic: '🚗',
  infrastructure: '⚡',
  weather: '🌧️',
  safety: '🚨',
  events: '🎉',
  community: '🎉' // Keep for backward compatibility with mock data
}

const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200'
}

function PostCard({ post, onLike, onComment, onShare }: PostCardProps) {
  const [isPlaying, setIsPlaying] = useState<Record<string, boolean>>({})
  const [isMuted, setIsMuted] = useState<Record<string, boolean>>({})

  const getTimeAgo = (timestamp: string) => {
    const now = new Date()
    const postTime = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - postTime.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const formatDistance = (km?: number) => {
    if (!km) return null
    return km < 1 ? `${Math.round(km * 1000)}m away` : `${km.toFixed(1)}km away`
  }

  const handleVideoPlay = (mediaId: string) => {
    setIsPlaying(prev => ({ ...prev, [mediaId]: true }))
  }

  const handleVideoPause = (mediaId: string) => {
    setIsPlaying(prev => ({ ...prev, [mediaId]: false }))
  }

  const toggleMute = (mediaId: string) => {
    setIsMuted(prev => ({ ...prev, [mediaId]: !prev[mediaId] }))
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
              {post.author.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">{post.author.name}</span>
                {post.author.verified && (
                  <span className="text-blue-500">✓</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-3 h-3" />
                <span>{getTimeAgo(post.timestamp)}</span>
                {post.distance_km && (
                  <>
                    <span>•</span>
                    <MapPin className="w-3 h-3" />
                    <span>{formatDistance(post.distance_km)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${SEVERITY_COLORS[post.severity]}`}>
              {post.severity}
            </span>
            <button className="p-1 hover:bg-gray-100 rounded-full">
              <MoreHorizontal className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{TOPIC_ICONS[post.topic] || '📍'}</span>
          <span className="text-sm font-medium text-gray-600 capitalize">
            {post.topic.replace('_', ' ')}
          </span>
        </div>
        
        <h3 className="font-semibold text-gray-900 mb-2 text-lg">
          {post.title}
        </h3>
        
        <p className="text-gray-700 leading-relaxed mb-3">
          {post.description}
        </p>

        {/* Location */}
        {post.location && (
          <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
            <MapPin className="w-3 h-3" />
            <span>{post.location.address}</span>
          </div>
        )}
      </div>

      {/* Media Grid */}
      {post.mediaFiles.length > 0 && (
        <div className={`grid gap-1 ${
          post.mediaFiles.length === 1 ? 'grid-cols-1' :
          post.mediaFiles.length === 2 ? 'grid-cols-2' :
          post.mediaFiles.length === 3 ? 'grid-cols-3' :
          'grid-cols-2'
        }`}>
          {post.mediaFiles.map((media, index) => (
            <div 
              key={media.id} 
              className={`relative bg-gray-100 ${
                post.mediaFiles.length === 1 ? 'aspect-video' :
                post.mediaFiles.length === 3 && index === 0 ? 'row-span-2 aspect-square' :
                'aspect-square'
              }`}
            >
              {media.type === 'image' && (
                <img
                  src={media.url}
                  alt="Post media"
                  className="w-full h-full object-cover"
                />
              )}
              
              {media.type === 'video' && (
                <div className="relative w-full h-full">
                  <video
                    src={media.url}
                    className="w-full h-full object-cover"
                    controls={isPlaying[media.id]}
                    muted={isMuted[media.id]}
                    onPlay={() => handleVideoPlay(media.id)}
                    onPause={() => handleVideoPause(media.id)}
                  />
                  {!isPlaying[media.id] && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                      <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                        <Play className="w-6 h-6 text-gray-800 ml-1" />
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => toggleMute(media.id)}
                    className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 text-white rounded-full"
                  >
                    {isMuted[media.id] ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                  </button>
                </div>
              )}
              
              {media.type === 'audio' && (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gray-50">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mb-2">
                    <Volume2 className="w-4 h-4 text-white" />
                  </div>
                  <audio src={media.url} controls className="w-full max-w-xs" />
                </div>
              )}

              {/* AI Analysis Overlay */}
              {media.analysis && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                  <div className="text-white">
                    <div className="text-xs opacity-75 mb-1">
                      🤖 AI Analysis ({Math.round(media.analysis.confidence * 100)}%)
                    </div>
                    <div className="text-sm font-medium">
                      {media.analysis.description.length > 60 
                        ? media.analysis.description.substring(0, 60) + '...'
                        : media.analysis.description
                      }
                    </div>
                    {media.analysis.objects.length > 0 && (
                      <div className="text-xs opacity-75 mt-1">
                        Detected: {media.analysis.objects.slice(0, 3).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Engagement Bar */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => onLike?.(post.id)}
              className={`flex items-center gap-2 transition-colors ${
                post.user_liked 
                  ? 'text-red-500' 
                  : 'text-gray-600 hover:text-red-500'
              }`}
            >
              <Heart className={`w-5 h-5 ${post.user_liked ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium">{post.likes}</span>
            </button>

            <button
              onClick={() => onComment?.(post.id)}
              className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm font-medium">{post.comments}</span>
            </button>

            <button
              onClick={() => onShare?.(post.id)}
              className="flex items-center gap-2 text-gray-600 hover:text-green-500 transition-colors"
            >
              <Share2 className="w-5 h-5" />
              <span className="text-sm font-medium">{post.shares}</span>
            </button>
          </div>

          <div className="text-xs text-gray-500">
            {post.likes + post.comments + post.shares} interactions
          </div>
        </div>
      </div>
    </div>
  )
}

interface PostFeedProps {
  posts?: Post[]
  isLoading?: boolean
  onLoadMore?: () => void
  hasMore?: boolean
  topic?: string
  sortBy?: string
  // NEW: Add these props to support real-time updates
  newPostAdded?: string  // Event ID of newly added post
  refreshTrigger?: number  // Increment to force refresh
}

export default function PostFeed({ 
  posts = [], 
  isLoading = false, 
  onLoadMore, 
  hasMore = false,
  topic = 'all',
  sortBy = 'recent',
  newPostAdded,  // NEW: Track new posts
  refreshTrigger = 0  // NEW: Force refresh mechanism
}: PostFeedProps) {
  const [localPosts, setLocalPosts] = useState<Post[]>(posts)
  const [backendPosts, setBackendPosts] = useState<Post[]>([])
  const [isLoadingFromBackend, setIsLoadingFromBackend] = useState(false)

  // NEW: Store newly created posts separately to show them immediately
  const [freshPosts, setFreshPosts] = useState<Post[]>([])

  // Load posts from backend using valid topic filters
  const loadPostsFromBackend = async (includeSpecificEvent?: string) => {
    try {
      setIsLoadingFromBackend(true)
      console.log('🔍 Loading posts from backend...', { topic, includeSpecificEvent })
      
      // Try multiple approaches to get events
      const promises = []
      
      // 1. Search for recent events
      let searchQuery = 'recent events incidents city pulse'
      if (topic !== 'all') {
        const validTopics = ['traffic', 'infrastructure', 'weather', 'events', 'safety']
        if (validTopics.includes(topic)) {
          searchQuery = `${topic} events incidents`
        }
      }
      
      promises.push(
        fetch(`${API_BASE_URL}/events/search?query=${encodeURIComponent(searchQuery)}&lat=${DEFAULT_LOCATION.lat}&lng=${DEFAULT_LOCATION.lng}&max_results=20`)
          .then(res => res.json())
          .then(result => ({ type: 'search', data: result }))
          .catch(err => ({ type: 'search', error: err }))
      )
      
      // 2. Get nearby events
      promises.push(
        fetch(`${API_BASE_URL}/events/nearby?lat=${DEFAULT_LOCATION.lat}&lng=${DEFAULT_LOCATION.lng}&radius_km=10&max_results=20`)
          .then(res => res.json())
          .then(result => ({ type: 'nearby', data: result }))
          .catch(err => ({ type: 'nearby', error: err }))
      )
      
      // 3. If we have a specific event ID, try to search for it specifically
      if (includeSpecificEvent) {
        promises.push(
          fetch(`${API_BASE_URL}/events/search?query=${includeSpecificEvent}&max_results=5`)
            .then(res => res.json())
            .then(result => ({ type: 'specific', data: result }))
            .catch(err => ({ type: 'specific', error: err }))
        )
      }

      const results = await Promise.all(promises)
      console.log('📡 Backend results:', results)

      let allEvents: any[] = []

      // Process search results
      const searchResult = results.find(r => r.type === 'search')
      if (searchResult?.data?.success && searchResult.data.results) {
        console.log(`✅ Found ${searchResult.data.results.length} events from search`)
        allEvents.push(...searchResult.data.results)
      }

      // Process nearby results  
      const nearbyResult = results.find(r => r.type === 'nearby')
      if (nearbyResult?.data?.success && nearbyResult.data.events) {
        console.log(`✅ Found ${nearbyResult.data.events.length} nearby events`)
        // Convert nearby events to search result format
        const nearbyAsSearchResults = nearbyResult.data.events.map((event: any) => ({
          event_id: event.event_id,
          title: `${event.topic} Update`,
          document: `${event.topic} incident in your area`,
          metadata: {
            topic: event.topic,
            severity: event.severity,
            latitude: event.location?.lat,
            longitude: event.location?.lng,
            created_at: event.created_at
          },
          distance_km: event.distance_km,
          similarity_score: 0.8
        }))
        allEvents.push(...nearbyAsSearchResults)
      }

      // Process specific event result
      const specificResult = results.find(r => r.type === 'specific')
      if (specificResult?.data?.success && specificResult.data.results) {
        console.log(`✅ Found ${specificResult.data.results.length} specific events`)
        allEvents.push(...specificResult.data.results)
      }

      // Remove duplicates and convert to posts
      const uniqueEvents = allEvents.filter((event, index, self) => 
        index === self.findIndex(e => e.event_id === event.event_id)
      )

      console.log(`🔄 Converting ${uniqueEvents.length} unique events to posts`)

      const convertedPosts: Post[] = uniqueEvents.map((event: any) => ({
        id: event.event_id,
        title: event.title || event.document?.split('.')[0] || 'City Update',
        description: event.document || 'Event reported in your area',
        topic: event.metadata?.topic || 'events',
        severity: event.metadata?.severity || 'medium',
        location: {
          lat: event.metadata?.latitude || DEFAULT_LOCATION.lat,
          lng: event.metadata?.longitude || DEFAULT_LOCATION.lng,
          address: 'Bengaluru, Karnataka'
        },
        mediaFiles: [], // Backend events don't have media files in search results yet
        author: {
          id: 'citizen_reporter',
          name: 'Community Reporter',
          verified: true
        },
        timestamp: event.metadata?.created_at || new Date().toISOString(),
        likes: Math.floor(Math.random() * 25) + 5,
        comments: Math.floor(Math.random() * 15) + 2,
        shares: Math.floor(Math.random() * 8) + 1,
        user_liked: false,
        distance_km: event.distance_km || 0
      }))

      console.log(`✅ Converted to ${convertedPosts.length} posts`)
      setBackendPosts(convertedPosts)
      return convertedPosts

    } catch (error) {
      console.error('❌ Error loading posts from backend:', error)
      return []
    } finally {
      setIsLoadingFromBackend(false)
    }
  }

  // NEW: Effect to handle new post notifications
  useEffect(() => {
    if (newPostAdded) {
      console.log('🆕 New post added, refreshing feed with specific event:', newPostAdded)
      // Add a small delay to allow backend indexing
      setTimeout(() => {
        loadPostsFromBackend(newPostAdded)
      }, 2000) // 2 second delay for indexing
    }
  }, [newPostAdded])

  // Main loading effect - triggered by refreshTrigger
  useEffect(() => {
    const loadAllPosts = async () => {
      // Don't load if we already have posts provided or currently loading
      if (posts.length > 0 || isLoading) {
        setLocalPosts(posts)
        return
      }

      console.log('🔄 Loading all posts...', { refreshTrigger, topic, sortBy })
      
      // Load from backend
      const backendResults = await loadPostsFromBackend()
      
      // Combine with fresh posts and mock data
      let allPosts = [
        ...freshPosts,  // NEW: Show fresh posts first
        ...backendResults,
        ...getMockPosts() // Fallback
      ]
      
      // Remove duplicates by ID
      const uniquePosts = allPosts.filter((post, index, self) => 
        index === self.findIndex(p => p.id === post.id)
      )
      
      // Filter by topic if specified
      const filteredPosts = topic === 'all' 
        ? uniquePosts 
        : uniquePosts.filter(post => post.topic === topic)
      
      // Sort posts
      const sortedPosts = sortPosts(filteredPosts, sortBy)
      
      setLocalPosts(sortedPosts)
    }
    
    loadAllPosts()
  }, [refreshTrigger, topic, sortBy]) // Now properly depends on refreshTrigger

  // Sort posts based on sortBy parameter
  const sortPosts = (postsToSort: Post[], sortMethod: string): Post[] => {
    switch (sortMethod) {
      case 'trending':
        return [...postsToSort].sort((a, b) => 
          (b.likes + b.comments + b.shares) - (a.likes + a.comments + a.shares)
        )
      case 'nearby':
        return [...postsToSort].sort((a, b) => 
          (a.distance_km || 999) - (b.distance_km || 999)
        )
      case 'priority':
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
        return [...postsToSort].sort((a, b) => 
          priorityOrder[a.severity] - priorityOrder[b.severity]
        )
      case 'recent':
      default:
        return [...postsToSort].sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
    }
  }

  // Fallback mock data with valid topics
  const getMockPosts = (): Post[] => [
    {
      id: 'mock_1',
      title: 'Heavy Traffic on Outer Ring Road',
      description: 'Major congestion near Electronic City due to ongoing construction work. Alternative routes recommended via Hosur Road.',
      topic: 'traffic',
      severity: 'high',
      location: {
        lat: 12.8456,
        lng: 77.6603,
        address: 'Electronic City, Bengaluru'
      },
      mediaFiles: [
        {
          id: 'm1',
          type: 'image',
          url: 'https://images.unsplash.com/photo-1570125909517-53cb21c89ff2?w=800&h=600&fit=crop',
          analysis: {
            description: 'Heavy traffic congestion with multiple vehicles stationary',
            confidence: 0.92,
            objects: ['cars', 'trucks', 'traffic_signs', 'road']
          }
        }
      ],
      author: {
        id: 'user1',
        name: 'Rajesh Kumar',
        verified: true
      },
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      likes: 24,
      comments: 8,
      shares: 3,
      user_liked: false,
      distance_km: 2.5
    }
  ]

  const handleLike = (postId: string) => {
    setLocalPosts(prev => prev.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            user_liked: !post.user_liked,
            likes: post.user_liked ? post.likes - 1 : post.likes + 1
          }
        : post
    ))
  }

  const handleComment = (postId: string) => {
    console.log('Comment on post:', postId)
  }

  const handleShare = (postId: string) => {
    setLocalPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, shares: post.shares + 1 }
        : post
    ))
    
    if (navigator.share) {
      navigator.share({
        title: 'City Update',
        text: 'Check out this important city update',
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  if ((isLoading || isLoadingFromBackend) && localPosts.length === 0) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {isLoadingFromBackend && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-800">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-medium">Loading latest updates...</span>
          </div>
        </div>
      )}

      {localPosts.map(post => (
        <PostCard
          key={post.id}
          post={post}
          onLike={handleLike}
          onComment={handleComment}
          onShare={handleShare}
        />
      ))}
      
      {hasMore && (
        <div className="text-center py-6">
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Load More Posts'}
          </button>
        </div>
      )}
      
      {localPosts.length === 0 && !isLoading && !isLoadingFromBackend && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-4">📱</div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900">No Posts Found</h3>
          <p className="text-gray-600 mb-4">
            Try creating a new post or refreshing to see the latest updates!
          </p>
          <div className="text-sm text-gray-500">
            Backend: {API_BASE_URL} • Topic: {topic} • Sort: {sortBy}
            <br />
            Showing {freshPosts.length} fresh + {backendPosts.length} backend posts
          </div>
        </div>
      )}
    </div>
  )
}