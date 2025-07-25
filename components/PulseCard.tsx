'use client'

import { useRouter } from 'next/navigation'
import { MessageCircle, Clock, MapPin, ChevronRight, Layers } from 'lucide-react'
import { useState } from 'react'
import { backendConnection, type BackendCardExpansion } from '@/lib/backend'

interface PulseCardProps {
  card: {
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
  }
  animationDelay?: number
}

const priorityStyles = {
  low: 'border-l-green-500 bg-gradient-to-r from-white to-green-50',
  medium: 'border-l-yellow-500 bg-gradient-to-r from-white to-yellow-50',
  high: 'border-l-orange-500 bg-gradient-to-r from-white to-orange-50',
  critical: 'border-l-red-500 bg-gradient-to-r from-white to-red-50'
}

const typeIcons: { [key: string]: string } = {
  traffic_synthesis: '🚗',
  traffic_alert: '🚗',
  weather_warning: '🌧️',
  weather_alert: '🌧️',
  event_recommendation: '🎉',
  infrastructure_update: '⚡',
  infrastructure_alert: '⚡',
  safety_alert: '🚨'
}

// Card expansion modal component
function CardExpansionModal({ 
  expansion, 
  onClose 
}: { 
  expansion: BackendCardExpansion; 
  onClose: () => void 
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              📊 {expansion.expanded_topic.toUpperCase()} Details
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ✕
            </button>
          </div>
          
          <p className="text-gray-600 mb-4">
            <strong>{expansion.total_events}</strong> individual incidents in your area:
          </p>
          
          <div className="space-y-3">
            {expansion.individual_events.map((event, index) => (
              <div key={event.event_id} className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">
                  {event.title}
                </h4>
                <p className="text-gray-600 text-sm mb-2">
                  {event.summary}
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>📍 {event.distance_km?.toFixed(2)}km away</span>
                  <span>🎯 {Math.round(event.confidence * 100)}% confidence</span>
                  {event.expanded_details?.severity && (
                    <span className="capitalize">⚠️ {event.expanded_details.severity} severity</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              {expansion.summary}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PulseCard({ card, animationDelay = 0 }: PulseCardProps) {
  const router = useRouter()
  const [showExpansion, setShowExpansion] = useState(false)
  const [expansion, setExpansion] = useState<BackendCardExpansion | null>(null)
  const [isExpanding, setIsExpanding] = useState(false)

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking the expand button
    if ((e.target as HTMLElement).closest('.expand-button')) {
      return
    }

    // Create context object for AI chat
    const context = {
      id: card.id,
      title: card.title,
      summary: card.summary,
      type: card.type,
      priority: card.priority
    }

    // Navigate to chat with context
    const contextParam = encodeURIComponent(JSON.stringify(context))
    router.push(`/chat?context=${contextParam}`)
  }

  const handleExpandCard = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!card.expandable || isExpanding) return

    try {
      setIsExpanding(true)
      console.log(`🔍 Expanding card: ${card.id}`)
      
      const expansionData = await backendConnection.expandCard(
        card.user_id,
        card.id,
        12.9120, // HSR Layout coordinates
        77.6365
      )

      if (expansionData.success) {
        setExpansion(expansionData)
        setShowExpansion(true)
        console.log('✅ Card expansion loaded:', expansionData.total_events, 'events')
      } else {
        console.error('❌ Card expansion failed')
      }
    } catch (error) {
      console.error('Error expanding card:', error)
      // Show a simple alert as fallback
      alert('Unable to load detailed information. Please try again later.')
    } finally {
      setIsExpanding(false)
    }
  }

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const created = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const formatDistance = (km?: number) => {
    if (!km) return null
    return km < 1 ? `${Math.round(km * 1000)}m away` : `${km.toFixed(1)}km away`
  }

  const typeIcon = typeIcons[card.type] || '📍'
  const isSynthesis = card.synthesis_meta && card.synthesis_meta.event_count > 1

  return (
    <>
      <div
        className={`bg-white rounded-xl p-4 shadow-sm border-l-4 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${priorityStyles[card.priority]}`}
        style={{ animationDelay: `${animationDelay}ms` }}
        onClick={handleCardClick}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{typeIcon}</span>
            <span className="text-xs uppercase font-semibold text-gray-600 tracking-wide">
              {card.type.replace('_', ' ')}
            </span>
            {isSynthesis && (
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                🤖 AI Summary
                {card.synthesis_meta && (
                  <span className="bg-blue-200 text-blue-800 px-1 rounded text-xs">
                    {card.synthesis_meta.event_count}
                  </span>
                )}
              </span>
            )}
          </div>
          
          {card.priority === 'critical' && (
            <div className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              URGENT
            </div>
          )}
        </div>

        {/* Content */}
        <div className="mb-3">
          <h3 className="font-semibold text-gray-900 mb-2">
            {card.title}
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            {card.summary}
          </p>
          
          {isSynthesis && card.synthesis_meta && (
            <div className="bg-gray-50 p-3 rounded-lg mb-3">
              <div className="text-xs text-gray-500 mb-1">
                AI Insight from {card.synthesis_meta.event_count} incidents:
              </div>
              <div className="text-sm font-medium text-gray-700">
                "{card.synthesis_meta.key_insight}"
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-600 text-sm font-medium">
            <MessageCircle className="w-4 h-4" />
            {card.action}
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500">
              {Math.round(card.confidence * 100)}% confidence
            </div>
            
            {/* Expand button for synthesis cards */}
            {card.expandable && isSynthesis && (
              <button
                onClick={handleExpandCard}
                disabled={isExpanding}
                className="expand-button flex items-center gap-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded-full text-xs font-medium transition-colors disabled:opacity-50"
              >
                {isExpanding ? (
                  <>
                    <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Layers className="w-3 h-3" />
                    View Details
                    <ChevronRight className="w-3 h-3" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {getTimeAgo(card.created_at)}
            </div>
            {card.distance_km && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {formatDistance(card.distance_km)}
              </div>
            )}
          </div>
          
          {isSynthesis && card.synthesis_meta && (
            <div className="text-xs text-gray-500">
              {card.synthesis_meta.event_count} incidents combined
            </div>
          )}
        </div>
      </div>

      {/* Expansion Modal */}
      {showExpansion && expansion && (
        <CardExpansionModal
          expansion={expansion}
          onClose={() => setShowExpansion(false)}
        />
      )}
    </>
  )
}
