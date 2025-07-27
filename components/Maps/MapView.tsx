'use client'

interface MapViewProps {
  center: {
    lat: number
    lng: number
  }
  incidents: Array<{
    id: string
    type: string
    title: string
    location: {
      lat: number
      lng: number
    }
    severity: string
  }>
  selectedIncident: any
  onIncidentClick: (incidentId: string) => void
  isLoading: boolean
}

export default function MapView({ 
  center, 
  incidents, 
  selectedIncident, 
  onIncidentClick, 
  isLoading 
}: MapViewProps) {
  const getIncidentColor = (type: string, severity: string) => {
    const colors = {
      traffic: severity === 'critical' ? '#dc2626' : '#ea580c',
      weather: '#3b82f6',
      infrastructure: '#dc2626',
      events: '#16a34a',
      safety: '#7c3aed'
    }
    return colors[type as keyof typeof colors] || '#6b7280'
  }

  const getIncidentIcon = (type: string) => {
    const icons = {
      traffic: '🚗',
      weather: '🌧️',
      infrastructure: '⚡',
      events: '🎉',
      safety: '🚨'
    }
    return icons[type as keyof typeof icons] || '📍'
  }

  if (isLoading) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-blue-400 via-purple-500 to-teal-400 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading live map data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-blue-400 via-purple-500 to-teal-400 overflow-hidden">
      {/* Mock Map Background */}
      <div className="absolute inset-0">
        {/* Grid pattern to simulate map */}
        <div className="absolute inset-0 opacity-20">
          <div className="grid grid-cols-8 grid-rows-6 h-full w-full">
            {Array.from({ length: 48 }).map((_, i) => (
              <div key={i} className="border border-white/20"></div>
            ))}
          </div>
        </div>

        {/* Center marker (user location) */}
        <div 
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
          style={{ 
            left: '50%', 
            top: '50%'
          }}
        >
          <div className="relative">
            <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/75 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
              You are here
            </div>
          </div>
        </div>

        {/* Incident markers */}
        {incidents.map((incident, index) => {
          // Calculate position relative to center (mock positioning)
          const offsetX = (incident.location.lng - center.lng) * 800 // Scale factor
          const offsetY = (center.lat - incident.location.lat) * 800 // Scale factor
          const left = Math.max(10, Math.min(90, 50 + (offsetX / 10))) // Percentage
          const top = Math.max(10, Math.min(90, 50 + (offsetY / 10))) // Percentage
          
          const isSelected = selectedIncident?.id === incident.id

          return (
            <div
              key={incident.id}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 z-20 ${
                isSelected ? 'scale-125' : 'hover:scale-110'
              }`}
              style={{ 
                left: `${left}%`, 
                top: `${top}%`
              }}
              onClick={() => onIncidentClick(incident.id)}
            >
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white ${
                  isSelected ? 'ring-4 ring-white/50' : ''
                }`}
                style={{ 
                  backgroundColor: getIncidentColor(incident.type, incident.severity)
                }}
              >
                <span className="text-xs">
                  {getIncidentIcon(incident.type)}
                </span>
              </div>

              {/* Incident popup on hover/select */}
              {isSelected && (
                <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-3 min-w-48 z-30">
                  <div className="text-sm font-semibold text-gray-900 mb-1">
                    {incident.title}
                  </div>
                  <div className="text-xs text-gray-600 capitalize">
                    {incident.type} • {incident.severity} severity
                  </div>
                  
                  {/* Arrow */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
                    <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <div className="text-sm font-semibold mb-2">Live Incidents</div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span>Traffic</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Weather</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Infrastructure</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Events</span>
            </div>
          </div>
        </div>

        {/* Stats overlay */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <div className="text-sm font-semibold text-gray-900">
            {incidents.length} Active Incidents
          </div>
          <div className="text-xs text-gray-600">
            Updated live
          </div>
        </div>
      </div>
    </div>
  )
}
