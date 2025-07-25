'use client'

import { useState, useEffect, useRef } from 'react'
import PulseCard from '@/components/PulseCard'
import MiniMap from '@/components/MiniMap'
import LiveStatusBar from '@/components/LiveStatusBar'

interface DashboardCard {
  id: string
  type: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  title: string
  summary: string
  action: string
  confidence: number
  distance_km?: number
  synthesis_meta?: {
    event_count: number
    topic: string
    key_insight: string
  }
  created_at: string
  user_id: string
  expandable?: boolean
  expansion_url?: string
}

interface DashboardResponse {
  success: boolean
  cards: DashboardCard[]
  total_cards: number
  generated_at: string
  user_id: string
  ai_synthesis?: string
}

interface SSEUpdate {
  type: 'dashboard_update' | 'heartbeat' | 'error'
  cards?: DashboardCard[]
  timestamp: string
  user_id: string
  high_priority_count?: number
}

export default function HomePage() {
  const [cards, setCards] = useState<DashboardCard[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const [updateCount, setUpdateCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [backendAvailable, setBackendAvailable] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // User configuration - matches your test dashboard
  const userId = 'arjun_user_id'
  const userLocation = {
    lat: 12.9120,
    lng: 77.6365,
    address: 'HSR Layout, Bengaluru'
  }

  useEffect(() => {
    // Load initial dashboard data
    loadInitialDashboard()
    
    // Set up real-time connection
    connectToSSEStream()
    
    // Cleanup on unmount
    return () => {
      cleanupConnections()
    }
  }, [])

  const loadInitialDashboard = async () => {
    try {
      setIsLoading(true)
      
      // First, try to load from your backend
      const response = await fetch(
        `http://localhost:8000/dashboard/${userId}?lat=${userLocation.lat}&lng=${userLocation.lng}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.ok) {
        const data: DashboardResponse = await response.json()
        
        if (data.success && data.cards && Array.isArray(data.cards)) {
          console.log('📋 Initial dashboard loaded from backend')
          setCards(data.cards)
          setLastUpdate(new Date().toLocaleTimeString())
          setBackendAvailable(true)
          setIsConnected(true)
          
          // Log the structure for debugging
          console.log('Dashboard cards received:', data.cards.length)
          data.cards.forEach((card, index) => {
            console.log(`Card ${index + 1}:`, {
              id: card.id,
              type: card.type,
              title: card.title,
              priority: card.priority,
              synthesis: card.synthesis_meta
            })
          })
        } else {
          throw new Error('Invalid dashboard response structure')
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.log('Backend not available, loading mock data:', error)
      setBackendAvailable(false)
      loadMockData()
    } finally {
      setIsLoading(false)
    }
  }

  const connectToSSEStream = () => {
    // Don't connect if backend is not available
    if (!backendAvailable) {
      return
    }

    try {
      // Close existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }

      // Create SSE connection - matches your test dashboard exactly
      const streamUrl = `http://localhost:8000/dashboard/${userId}/stream?lat=${userLocation.lat}&lng=${userLocation.lng}`
      console.log('🔄 Connecting to SSE stream:', streamUrl)
      
      eventSourceRef.current = new EventSource(streamUrl)

      eventSourceRef.current.onopen = (event) => {
        console.log('✅ Dashboard stream connected')
        setIsConnected(true)
        
        // Clear any reconnection timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = null
        }
      }

      eventSourceRef.current.onmessage = (event) => {
        try {
          const data: SSEUpdate = JSON.parse(event.data)
          console.log('📊 Dashboard update received:', data.type)

          if (data.type === 'dashboard_update' && data.cards) {
            setCards(data.cards)
            setLastUpdate(new Date().toLocaleTimeString())
            setUpdateCount(prev => prev + 1)
            
            // Log high-priority alerts
            if (data.high_priority_count && data.high_priority_count > 0) {
              console.log(`🚨 ${data.high_priority_count} high-priority alerts`)
            }
          } else if (data.type === 'heartbeat') {
            console.log('💓 Heartbeat received')
            // Update connection status on heartbeat
            setIsConnected(true)
          }
        } catch (error) {
          console.error('Error parsing SSE data:', error)
        }
      }

      eventSourceRef.current.onerror = (event) => {
        console.error('❌ Dashboard stream error:', event)
        setIsConnected(false)
        
        // Attempt to reconnect after 5 seconds (matches your test dashboard)
        if (!reconnectTimeoutRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('🔄 Attempting to reconnect dashboard stream...')
            connectToSSEStream()
          }, 5000)
        }
      }

    } catch (error) {
      console.error('Failed to create SSE connection:', error)
      setIsConnected(false)
    }
  }

  const loadMockData = () => {
    // Fallback mock data when backend is unavailable
    const mockCards: DashboardCard[] = [
      {
        id: 'mock_1',
        type: 'traffic_synthesis',
        priority: 'critical',
        title: '3 Accidents on ORR - Heavy Delays',
        summary: 'Multiple incidents causing 45min delays. Alternative routes available via Sarjapur Road.',
        action: 'Get AI assistance',
        confidence: 0.92,
        distance_km: 2.3,
        synthesis_meta: {
          event_count: 3,
          topic: 'traffic',
          key_insight: 'ORR completely blocked, use alternatives'
        },
        created_at: new Date().toISOString(),
        user_id: userId
      },
      {
        id: 'mock_2',
        type: 'weather_warning',
        priority: 'high',
        title: 'Rain Expected - Evening Commute',
        summary: '80% chance of rain from 5-7 PM. Plan accordingly for your evening commute.',
        action: 'Ask about alternatives',
        confidence: 0.85,
        distance_km: 0.5,
        created_at: new Date().toISOString(),
        user_id: userId
      },
      {
        id: 'mock_3',
        type: 'event_recommendation',
        priority: 'low',
        title: 'Weekend Tech Meetups',
        summary: '5 tech events in Koramangala this weekend. Perfect for networking and learning.',
        action: 'Show me details',
        confidence: 0.78,
        distance_km: 1.8,
        created_at: new Date().toISOString(),
        user_id: userId
      }
    ]
    
    setCards(mockCards)
    setLastUpdate(new Date().toLocaleTimeString())
    console.log('📋 Mock dashboard data loaded')
  }

  const cleanupConnections = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
  }

  // Retry backend connection
  const retryBackendConnection = async () => {
    setIsLoading(true)
    await loadInitialDashboard()
    if (backendAvailable) {
      connectToSSEStream()
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading city intelligence...</p>
          <p className="text-sm text-gray-500 mt-2">Connecting to backend...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold">Urban Intelligence</h1>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <span className="text-xs text-blue-100">
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
          </div>
          
          <p className="text-blue-100 text-sm sm:text-base mb-2">
            📍 {userLocation.address}
          </p>
          
          {!backendAvailable && (
            <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-300">⚠️</span>
                  <span className="text-sm">Backend unavailable - using mock data</span>
                </div>
                <button 
                  onClick={retryBackendConnection}
                  className="text-xs bg-white/20 px-2 py-1 rounded hover:bg-white/30 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          )}
          
          <LiveStatusBar 
            isConnected={isConnected}
            lastUpdate={lastUpdate}
            updateCount={updateCount}
          />
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Mini Map */}
        <MiniMap 
          location={userLocation}
          incidentCount={cards.length}
        />

        {/* Live City Pulse Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              🏙️ Live City Pulse
              {cards.length > 0 && (
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                  {cards.length} updates
                </span>
              )}
            </h2>
            
            {backendAvailable && (
              <div className="text-xs text-gray-500">
                {isConnected ? '🟢 Real-time updates' : '🔴 Connection lost'}
              </div>
            )}
          </div>
          
          {cards.length > 0 ? (
            <div className="space-y-3">
              {cards.map((card, index) => (
                <PulseCard 
                  key={card.id} 
                  card={card}
                  animationDelay={index * 100}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-6 text-center">
              <div className="text-4xl mb-3">🌟</div>
              <h3 className="text-lg font-semibold mb-2">All Clear!</h3>
              <p className="text-gray-600">No active incidents in your area. Enjoy your day!</p>
            </div>
          )}
        </div>

        {/* Debug Info (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-100 rounded-lg p-4">
            <h3 className="font-semibold text-gray-700 mb-2">🔧 Debug Info</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <div>Backend Available: {backendAvailable ? '✅' : '❌'}</div>
              <div>SSE Connected: {isConnected ? '✅' : '❌'}</div>
              <div>Total Cards: {cards.length}</div>
              <div>Last Update: {lastUpdate || 'Never'}</div>
              <div>Update Count: {updateCount}</div>
              <div>User ID: {userId}</div>
              <div>Location: {userLocation.lat}, {userLocation.lng}</div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <button className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="text-2xl mb-2">🚗</div>
            <div className="text-sm font-medium text-gray-700">Traffic</div>
          </button>
          <button className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="text-2xl mb-2">🌧️</div>
            <div className="text-sm font-medium text-gray-700">Weather</div>
          </button>
          <button className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="text-2xl mb-2">🎉</div>
            <div className="text-sm font-medium text-gray-700">Events</div>
          </button>
          <button className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="text-2xl mb-2">⚡</div>
            <div className="text-sm font-medium text-gray-700">Utilities</div>
          </button>
        </div>
      </div>
    </div>
  )
}
