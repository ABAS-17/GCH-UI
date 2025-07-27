'use client'

import { MessageCircle, MapPin, Clock, Users } from 'lucide-react'

interface Incident {
  id: string
  type: string
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  distance_km: number
  created_at: string
  affected_count?: number
}

interface IncidentListProps {
  incidents: Incident[]
  selectedIncident: Incident | null
  onIncidentSelect: (incident: Incident) => void
  onChatClick: (incident: Incident) => void
  isLoading: boolean
}

const severityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
}

const typeIcons = {
  traffic: '🚗',
  weather: '🌧️',
  infrastructure: '⚡',
  events: '🎉',
  safety: '🚨'
}

export default function IncidentList({ 
  incidents, 
  selectedIncident, 
  onIncidentSelect, 
  onChatClick, 
  isLoading 
}: IncidentListProps) {
  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const created = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const formatDistance = (km: number) => {
    return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading incidents...</p>
        </div>
      </div>
    )
  }

  if (incidents.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-4xl mb-3">🌟</div>
          <h3 className="font-semibold text-gray-900 mb-2">All Clear!</h3>
          <p className="text-gray-600 text-sm">No incidents match your current filter.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="divide-y divide-gray-100">
        {incidents.map((incident) => {
          const isSelected = selectedIncident?.id === incident.id
          const typeIcon = typeIcons[incident.type as keyof typeof typeIcons] || '📍'

          return (
            <div
              key={incident.id}
              className={`p-4 cursor-pointer transition-colors duration-200 ${
                isSelected ? 'bg-primary-50 border-r-2 border-primary-500' : 'hover:bg-gray-50'
              }`}
              onClick={() => onIncidentSelect(incident)}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm">
                  {typeIcon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900 text-sm leading-tight">
                      {incident.title}
                    </h4>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      severityColors[incident.severity]
                    }`}>
                      {incident.severity}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {incident.description}
                  </p>

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {formatDistance(incident.distance_km)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(incident.created_at)}
                      </div>
                      {incident.affected_count && (
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {incident.affected_count}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onChatClick(incident)
                      }}
                      className="flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium"
                    >
                      <MessageCircle className="w-3 h-3" />
                      Ask AI
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
