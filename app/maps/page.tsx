'use client'

import { useState, useEffect } from 'react'
import MapView from '@/components/MapView'
import IncidentList from '@/components/IncidentList'
import MapFilters from '@/components/MapFilters'

interface Incident {
  id: string
  type: 'traffic' | 'weather' | 'infrastructure' | 'events' | 'safety'
  title: string
  description: string
  location: {
    lat: number
    lng: number
  }
  severity: 'low' | 'medium' | 'high' | 'critical'
  distance_km: number
  created_at: string
  affected_count?: number
}

const INCIDENT_TYPES = [
  { key: 'all', label: 'All', icon: '🌟', color: 'bg-gray-500' },
  { key: 'traffic', label: 'Traffic', icon: '🚗', color: 'bg-orange-500' },
  { key: 'weather', label: 'Weather', icon: '🌧️', color: 'bg-blue-500' },
  { key: 'infrastructure', label: 'Infrastructure', icon: '⚡', color: 'bg-red-500' },
  { key: 'events', label: 'Events', icon: '🎉', color: 'bg-green-500' },
  { key: 'safety', label: 'Safety', icon: '🚨', color: 'bg-purple-500' },
]

export default function MapsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([])
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)

  // User location (HSR Layout, Bengaluru)
  const userLocation = {
    lat: 12.9120,
    lng: 77.6365
  }

  useEffect(() => {
    loadIncidents()
  }, [])

  useEffect(() => {
    // Filter incidents based on active filter
    if (activeFilter === 'all') {
      setFilteredIncidents(incidents)
    } else {
      setFilteredIncidents(incidents.filter(incident => incident.type === activeFilter))
    }
  }, [incidents, activeFilter])

  const loadIncidents = async () => {
    try {
      setIsLoading(true)

      // Try to load real incidents from backend
      const response = await fetch(
        `http://localhost:8000/events/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}&radius_km=10&max_results=20`
      )

      if (response.ok) {
        const data = await response.json()
        
        if (data.success && data.events) {
          const mappedIncidents: Incident[] = data.events.map((event: any) => ({
            id: event.event_id,
            type: mapEventTopicToType(event.topic),
            title: event.document?.split('.')[0] || 'Unknown Incident',
            description: event.document || 'No description available',
            location: {
              lat: event.metadata?.latitude || userLocation.lat + (Math.random() - 0.5) * 0.1,
              lng: event.metadata?.longitude || userLocation.lng + (Math.random() - 0.5) * 0.1
            },
            severity: event.metadata?.severity || 'medium',
            distance_km: event.distance_km || Math.random() * 5,
            created_at: event.metadata?.created_at || new Date().toISOString(),
            affected_count: event.metadata?.affected_users || Math.floor(Math.random() * 500) + 50
          }))

          setIncidents(mappedIncidents)
        } else {
          loadMockIncidents()
        }
      } else {
        loadMockIncidents()
      }
    } catch (error) {
      console.error('Error loading incidents:', error)
      loadMockIncidents()
    } finally {
      setIsLoading(false)
    }
  }

  const mapEventTopicToType = (topic: string): Incident['type'] => {
    const mapping: { [key: string]: Incident['type'] } = {
      'traffic': 'traffic',
      'weather': 'weather',
      'infrastructure': 'infrastructure',
      'events': 'events',
      'safety': 'safety'
    }
    return mapping[topic] || 'traffic'
  }

  const loadMockIncidents = () => {
    const mockIncidents: Incident[] = [
      {
        id: '1',
        type: 'traffic',
        title: 'Accident on ORR Near Silk Board',
        description: 'Multi-vehicle collision causing heavy traffic delays. Emergency services on site.',
        location: { lat: 12.9176, lng: 77.6265 },
        severity: 'critical',
        distance_km: 2.3,
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        affected_count: 450
      },
      {
        id: '2',
        type: 'infrastructure',
        title: 'Power Outage - HSR Layout Sector 2',
        description: 'Scheduled maintenance causing power disruption. Expected restoration by 6 PM.',
        location: { lat: 12.9089, lng: 77.6388 },
        severity: 'high',
        distance_km: 0.8,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        affected_count: 120
      },
      {
        id: '3',
        type: 'weather',
        title: 'Heavy Rain Alert - South Bengaluru',
        description: 'Moderate to heavy rainfall expected in the next 2 hours. Possible waterlogging.',
        location: { lat: 12.8956, lng: 77.6302 },
        severity: 'medium',
        distance_km: 1.9,
        created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        affected_count: 2000
      },
      {
        id: '4',
        type: 'events',
        title: 'Tech Meetup - Koramangala',
        description: 'JavaScript meetup at 91SpringBoard. Registration required.',
        location: { lat: 12.9352, lng: 77.6245 },
        severity: 'low',
        distance_km: 3.2,
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        affected_count: 80
      },
      {
        id: '5',
        type: 'safety',
        title: 'Road Construction - Bannerghatta Road',
        description: 'Lane closure for metro construction work. Use alternative routes.',
        location: { lat: 12.8678, lng: 77.6103 },
        severity: 'medium',
        distance_km: 4.5,
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        affected_count: 300
      }
    ]

    setIncidents(mockIncidents)
  }

  const handleFilterChange = (filterKey: string) => {
    setActiveFilter(filterKey)
  }

  const handleIncidentSelect = (incident: Incident) => {
    setSelectedIncident(incident)
  }

  const handleMapIncidentClick = (incidentId: string) => {
    const incident = incidents.find(i => i.id === incidentId)
    if (incident) {
      setSelectedIncident(incident)
    }
  }

  const navigateToChat = (incident: Incident) => {
    const context = {
      id: incident.id,
      title: incident.title,
      summary: incident.description,
      type: `${incident.type}_incident`,
      priority: incident.severity
    }

    const contextParam = encodeURIComponent(JSON.stringify(context))
    window.location.href = `/chat?context=${contextParam}`
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4 shadow-sm">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">🗺️ Live City Map</h1>
          <p className="text-sm text-gray-600">
            Real-time incidents and data • 📍 HSR Layout, Bengaluru
          </p>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-6xl mx-auto">
          <MapFilters
            filters={INCIDENT_TYPES}
            activeFilter={activeFilter}
            onFilterChange={handleFilterChange}
            incidentCounts={incidents.reduce((acc, incident) => {
              acc[incident.type] = (acc[incident.type] || 0) + 1
              return acc
            }, {} as { [key: string]: number })}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative">
          <MapView
            center={userLocation}
            incidents={filteredIncidents}
            selectedIncident={selectedIncident}
            onIncidentClick={handleMapIncidentClick}
            isLoading={isLoading}
          />
        </div>

        {/* Incident List */}
        <div className="lg:w-80 bg-white border-l border-gray-200 flex flex-col max-h-96 lg:max-h-none">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">
              {activeFilter === 'all' ? 'All Incidents' : INCIDENT_TYPES.find(f => f.key === activeFilter)?.label}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {filteredIncidents.length} incident{filteredIncidents.length !== 1 ? 's' : ''} found
            </p>
          </div>
          
          <IncidentList
            incidents={filteredIncidents}
            selectedIncident={selectedIncident}
            onIncidentSelect={handleIncidentSelect}
            onChatClick={navigateToChat}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  )
}
