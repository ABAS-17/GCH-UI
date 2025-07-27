'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, ChevronRight, MapPin, X, ArrowLeft } from 'lucide-react'

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
    individual_events?: Array<{
      title: string
      distance: string
      severity: string
    }>
  }
  created_at: string
  user_id: string
  expandable?: boolean
  expansion_url?: string
}

interface ExpansionData {
  success: boolean
  expanded_topic: string
  ai_summary?: string
  recommendations?: string[]
  individual_events: Array<{
    title: string
    severity: string
    distance: string
    impact?: string
    expanded_details?: {
      full_description: string
      event_id: string
      exact_distance: string
    }
  }>
  summary: string
}

export default function Dashboard() {
  const [cards, setCards] = useState<DashboardCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [expandedCard, setExpandedCard] = useState<DashboardCard | null>(null)
  const [expansionData, setExpansionData] = useState<ExpansionData | null>(null)
  const [isExpanding, setIsExpanding] = useState(false)
  
  const router = useRouter()

  const API_BASE = 'http://localhost:8000'
  const userId = 'arjun_user_id'
  const userLocation = {
    lat: 12.9120,
    lng: 77.6365,
    address: 'HSR Layout, Bengaluru'
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      setIsRefreshing(true)
      
      const response = await fetch(
        `${API_BASE}/dashboard/${userId}?lat=${userLocation.lat}&lng=${userLocation.lng}`
      )

      if (response.ok) {
        const data = await response.json()
        
        if (data.success && data.cards) {
          setCards(data.cards.slice(0, 4))
        }
      } else {
        await loadBasicEvents()
      }
    } catch (error) {
      console.error('Dashboard load error:', error)
      await loadBasicEvents()
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const loadBasicEvents = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/events/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}&radius_km=5&max_results=4`
      )

      if (response.ok) {
        const data = await response.json()
        
        if (data.success && data.events) {
          const basicCards: DashboardCard[] = data.events.map((event: any) => ({
            id: event.event_id,
            type: `${event.topic}_alert`,
            priority: event.severity || 'medium',
            title: cleanTitle(event.document || 'Recent Update'),
            summary: `${event.topic} incident ${formatDistance(event.distance_km)} away`,
            action: 'Learn More',
            confidence: 0.8,
            distance_km: event.distance_km,
            created_at: event.created_at || new Date().toISOString(),
            user_id: userId,
            expandable: false
          }))

          setCards(basicCards)
        }
      }
    } catch (error) {
      console.error('Basic events load failed:', error)
    }
  }

  // View Details Handler - Shows AI summary and recommendations
  const handleViewDetails = async (card: DashboardCard) => {
    if (!card.expandable) return
    
    setIsExpanding(true)
    try {
      const response = await fetch(
        `${API_BASE}/dashboard/${userId}/expand/${card.id}?lat=${userLocation.lat}&lng=${userLocation.lng}`
      )
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setExpansionData(data)
          setExpandedCard(card)
        }
      }
    } catch (error) {
      console.error('Error expanding card:', error)
    } finally {
      setIsExpanding(false)
    }
  }

  // Ask AI Handler - Navigates to chat with context
  const handleAskAI = (card: DashboardCard) => {
    const context = {
      card_context: {
        id: card.id,
        title: card.title,
        summary: card.summary,
        topic: card.synthesis_meta?.topic || extractTopicFromType(card.type),
        priority: card.priority,
        insight: card.synthesis_meta?.key_insight,
        event_count: card.synthesis_meta?.event_count,
        user_location: userLocation.address
      },
      topic_focus: card.synthesis_meta?.topic || extractTopicFromType(card.type),
      user_intent: `Asking about ${card.title}`,
      chat_starter: generateChatStarter(card)
    }
    
    const contextParam = encodeURIComponent(JSON.stringify(context))
    router.push(`/chat?context=${contextParam}`)
  }

  const extractTopicFromType = (type: string): string => {
    if (type.includes('traffic')) return 'traffic'
    if (type.includes('weather')) return 'weather'
    if (type.includes('infrastructure')) return 'infrastructure'
    if (type.includes('events')) return 'events'
    return 'general'
  }

  const generateChatStarter = (card: DashboardCard): string => {
    const topic = card.synthesis_meta?.topic || extractTopicFromType(card.type)
    
    switch (topic) {
      case 'traffic':
        return `I'm seeing traffic issues: "${card.title}". Can you help me understand the impact and suggest alternatives?`
      case 'weather':
        return `There's a weather update: "${card.title}". How will this affect my day and what should I prepare for?`
      case 'infrastructure':
        return `I noticed an infrastructure update: "${card.title}". What does this mean for my daily routine?`
      case 'events':
        return `I see there's an event: "${card.title}". Tell me more about this and how it might affect the area.`
      default:
        return `I'd like to know more about: "${card.title}". Can you provide more details and relevant advice?`
    }
  }

  const cleanTitle = (title: string): string => {
    if (!title) return 'Recent Update'
    
    // Remove test prefixes and clean up
    if (title.startsWith('Test ')) {
      title = title.substring(5)
    }
    
    // Truncate long titles
    if (title.length > 60) {
      return title.substring(0, 57) + '...'
    }
    
    return title
  }

  const formatDistance = (distance?: number): string => {
    if (!distance) return ''
    return distance >= 1 ? `${distance.toFixed(1)}km` : `${Math.round(distance * 1000)}m`
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-50 border-red-200 text-red-800'
      case 'high': return 'bg-orange-50 border-orange-200 text-orange-800'
      case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'low': return 'bg-green-50 border-green-200 text-green-800'
      default: return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return '🚨'
      case 'high': return '⚠️'
      case 'medium': return '📢'
      case 'low': return 'ℹ️'
      default: return '📌'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your city insights...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Clean Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-blue-200/50">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">City Pulse</h1>
              <p className="text-gray-600 flex items-center gap-2 mt-1">
                <MapPin className="w-4 h-4" />
                {userLocation.address}
              </p>
            </div>
            
            <button 
              onClick={loadDashboard}
              disabled={isRefreshing}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isRefreshing ? 'Updating...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {cards.length > 0 ? (
          <div className="space-y-4">
            {cards.map((card) => (
              <div 
                key={card.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{getPriorityIcon(card.priority)}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                        {cleanTitle(card.title)}
                      </h3>
                      {card.distance_km && (
                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {formatDistance(card.distance_km)} away
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(card.priority)}`}>
                    {card.priority}
                  </span>
                </div>
                
                <p className="text-gray-700 mb-6 leading-relaxed">
                  {card.summary}
                </p>

                {/* Key Insight for synthesized cards */}
                {card.synthesis_meta?.key_insight && (
                  <div className="bg-blue-50 border-l-4 border-blue-200 p-4 mb-6 rounded-r-lg">
                    <p className="text-blue-800 text-sm font-medium">
                      💡 {card.synthesis_meta.key_insight}
                    </p>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex gap-3">
                    {/* View Details Button - Shows AI analysis */}
                    {card.expandable && (
                      <button
                        onClick={() => handleViewDetails(card)}
                        disabled={isExpanding}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        {isExpanding ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Loading...
                          </>
                        ) : (
                          <>
                            <ChevronRight className="w-4 h-4" />
                            View Details
                          </>
                        )}
                      </button>
                    )}
                    
                    {/* Ask AI Button - Goes to chat */}
                    <button
                      onClick={() => handleAskAI(card)}
                      className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all flex items-center gap-2 shadow-sm"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Ask AI
                    </button>
                  </div>

                  {/* Event count for synthesized cards */}
                  {card.synthesis_meta?.event_count && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {card.synthesis_meta.event_count} events
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-4xl mb-4">🌟</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">All Clear!</h3>
            <p className="text-gray-600 mb-6">
              No active incidents in your area. Enjoy your day!
            </p>
            <button 
              onClick={loadDashboard}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Check for Updates
            </button>
          </div>
        )}
      </div>

      {/* Expanded Card Modal - AI Summary & Recommendations */}
      {expandedCard && expansionData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getPriorityIcon(expandedCard.priority)}</span>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {expandedCard.synthesis_meta?.topic?.charAt(0).toUpperCase() + 
                       expandedCard.synthesis_meta?.topic?.slice(1)} Situation Analysis
                    </h2>
                    <p className="text-sm text-gray-500">{expansionData.summary}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setExpandedCard(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* AI Summary */}
                {expansionData.ai_summary && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      🤖 AI Analysis
                    </h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-blue-900 leading-relaxed">{expansionData.ai_summary}</p>
                    </div>
                  </div>
                )}
                
                {/* Recommendations */}
                {expansionData.recommendations && expansionData.recommendations.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      💡 Recommendations
                    </h3>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <ul className="space-y-2">
                        {expansionData.recommendations.map((rec, index) => (
                          <li key={index} className="text-green-900 flex items-start gap-2">
                            <span className="text-green-600 mt-1">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                
                {/* Individual Incidents */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    📍 Individual Incidents ({expansionData.individual_events?.length || 0})
                  </h3>
                  <div className="space-y-3">
                    {expansionData.individual_events?.map((event, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-1">
                              {cleanTitle(event.title)}
                            </h4>
                            {event.expanded_details?.full_description && (
                              <p className="text-sm text-gray-600 mb-2">
                                {event.expanded_details.full_description.length > 100 
                                  ? event.expanded_details.full_description.substring(0, 100) + '...'
                                  : event.expanded_details.full_description
                                }
                              </p>
                            )}
                            {event.impact && (
                              <p className="text-sm font-medium text-orange-600">{event.impact}</p>
                            )}
                          </div>
                          <div className="ml-4 text-right">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(event.severity)}`}>
                              {event.severity}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">{event.distance}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setExpandedCard(null)
                      handleAskAI(expandedCard)
                    }}
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-6 py-3 rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all flex items-center gap-2 font-medium"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Discuss with AI
                  </button>
                  <button
                    onClick={() => setExpandedCard(null)}
                    className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}