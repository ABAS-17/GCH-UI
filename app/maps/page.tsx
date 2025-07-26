'use client'

import { useState, useEffect } from 'react'
import GoogleMapView from '@/components/GoogleMapView'
import IncidentList from '@/components/IncidentList'
import MapFilters from '@/components/MapFilters'
import { useGeolocation } from '@/lib/hooks/useGeolocation'
import { useIncidents, type ProcessedIncident } from '@/lib/hooks/useIncidents'
import { incidentsAPI } from '@/lib/api/incidents'
import { RefreshCw, MapPin, AlertCircle, Navigation, Loader, Database } from 'lucide-react'

const INCIDENT_TYPES = [
  { key: 'all', label: 'All', icon: '🌟', color: 'bg-gray-500' },
  { key: 'traffic', label: 'Traffic', icon: '🚗', color: 'bg-orange-500' },
  { key: 'weather', label: 'Weather', icon: '🌧️', color: 'bg-blue-500' },
  { key: 'infrastructure', label: 'Infrastructure', icon: '⚡', color: 'bg-red-500' },
  { key: 'events', label: 'Events', icon: '🎉', color: 'bg-green-500' },
  { key: 'safety', label: 'Safety', icon: '🚨', color: 'bg-purple-500' },
]

// Main component function
function MapsPage() {
  const [filteredIncidents, setFilteredIncidents] = useState<ProcessedIncident[]>([])
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [selectedIncident, setSelectedIncident] = useState<ProcessedIncident | null>(null)
  const [searchRadius, setSearchRadius] = useState(20)
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null)

  // Enhanced geolocation
  const {
    latitude,
    longitude,
    accuracy,
    error: locationError,
    loading: locationLoading,
    permissionStatus,
    requestLocation
  } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 300000,
    enableFallback: true
  });

  // PURE BACKEND incidents hook
  const {
    incidents,
    isLoading: incidentsLoading,
    error: incidentsError,
    lastUpdated,
    totalCount,
    refetch: refetchIncidents,
    fetchByTopic,
    searchIncidents
  } = useIncidents({
    latitude,
    longitude,
    radiusKm: searchRadius,
    maxResults: 100,
    autoRefresh: true,
    refreshInterval: 30000
  });

  // Check backend health on mount
  useEffect(() => {
    const checkBackend = async () => {
      const healthy = await incidentsAPI.healthCheck();
      setBackendHealthy(healthy);
    };
    checkBackend();
  }, []);

  // Filter incidents
  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredIncidents(incidents)
    } else {
      setFilteredIncidents(incidents.filter(incident => incident.type === activeFilter))
    }
  }, [incidents, activeFilter])

  // Handlers
  const handleFilterChange = async (filterKey: string) => {
    setActiveFilter(filterKey)
    if (filterKey !== 'all' && latitude && longitude) {
      await fetchByTopic(filterKey)
    } else if (filterKey === 'all') {
      await refetchIncidents()
    }
  }

  const handleIncidentSelect = (incident: ProcessedIncident) => {
    setSelectedIncident(incident)
  }

  const handleMapIncidentClick = (incidentId: string) => {
    const incident = incidents.find(i => i.id === incidentId)
    if (incident) {
      setSelectedIncident(incident)
    }
  }

  const navigateToChat = (incident: ProcessedIncident) => {
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

  const handleRefresh = async () => {
    await refetchIncidents()
  }

  // Populate demo data if no incidents found
  const handlePopulateDemoData = async () => {
    try {
      const success = await incidentsAPI.populateDemoData(15);
      if (success) {
        // Wait for indexing then refresh
        setTimeout(() => {
          refetchIncidents();
        }, 3000);
      }
    } catch (error) {
      console.error('Failed to populate demo data:', error);
    }
  }

  const getLocationSource = () => {
    if (!latitude || !longitude) return 'No location';
    if (accuracy && accuracy < 100) return 'GPS';
    if (accuracy && accuracy < 1000) return 'Network';
    if (accuracy && accuracy < 10000) return 'IP Location';
    return 'Approximate';
  };

  const formatLastUpdated = (date: Date | null) => {
    if (!date) return 'Never'
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const incidentCounts = incidents.reduce((acc, incident) => {
    acc[incident.type] = (acc[incident.type] || 0) + 1
    return acc
  }, {} as { [key: string]: number })

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4 shadow-sm">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 mb-2">🗺️ Live City Map</h1>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">PURE BACKEND DATA ONLY</span>
                <span className="text-gray-400">•</span>
                {locationLoading ? (
                  <span className="flex items-center gap-1 text-blue-600">
                    <Loader className="w-4 h-4 animate-spin" />
                    Getting location...
                  </span>
                ) : latitude && longitude ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <Navigation className="w-4 h-4" />
                    {getLocationSource()}: {latitude.toFixed(4)}, {longitude.toFixed(4)}
                  </span>
                ) : (
                  <span className="text-red-600">📍 Location required</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Populate Demo Data Button (only if no incidents) */}
              {totalCount === 0 && !incidentsLoading && (
                <button
                  onClick={handlePopulateDemoData}
                  className="flex items-center gap-2 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                >
                  <Database className="w-4 h-4" />
                  Add Demo Data
                </button>
              )}

              {/* Get Location Button */}
              {(!latitude || !longitude) && (
                <button
                  onClick={requestLocation}
                  disabled={locationLoading}
                  className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
                >
                  {locationLoading ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <MapPin className="w-4 h-4" />
                  )}
                  {locationLoading ? 'Getting Location...' : 'Get My Location'}
                </button>
              )}

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={incidentsLoading}
                className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${incidentsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Status Bar */}
          <div className="mt-3 flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className={`flex items-center gap-1 ${
                backendHealthy === false ? 'text-red-600' : 
                backendHealthy === true ? 'text-green-600' : 'text-yellow-600'
              }`}>
                <Database className="w-4 h-4" />
                {backendHealthy === false ? 'Backend Offline' : 
                 backendHealthy === true ? 'Backend Connected' : 'Checking Backend...'}
              </span>
              
              <span className="text-gray-600">
                {totalCount} backend incidents • {searchRadius}km radius
              </span>
              
              <span className="text-gray-500">
                Last fetch: {formatLastUpdated(lastUpdated)}
              </span>
            </div>

            {(incidentsError || locationError) && (
              <div className="flex items-center gap-1 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs">{incidentsError || locationError}</span>
              </div>
            )}
          </div>

          {/* No Data State */}
          {totalCount === 0 && !incidentsLoading && !incidentsError && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-yellow-600" />
                <div className="flex-1">
                  <p className="text-sm text-yellow-800">
                    No incidents found in backend within {searchRadius}km radius. Try populating demo data or check if your backend has incidents.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-6xl mx-auto">
          <MapFilters
            filters={INCIDENT_TYPES}
            activeFilter={activeFilter}
            onFilterChange={handleFilterChange}
            incidentCounts={incidentCounts}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative">
          <GoogleMapView
            incidents={filteredIncidents}
            selectedIncident={selectedIncident}
            onIncidentClick={handleMapIncidentClick}
            isLoading={incidentsLoading || locationLoading}
          />
        </div>

        {/* Incident List */}
        <div className="lg:w-80 bg-white border-l border-gray-200 flex flex-col max-h-96 lg:max-h-none">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">
              {activeFilter === 'all' ? 'All Backend Incidents' : INCIDENT_TYPES.find(f => f.key === activeFilter)?.label}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {filteredIncidents.length} incident{filteredIncidents.length !== 1 ? 's' : ''} from backend
              {lastUpdated && (
                <span className="text-gray-400"> • {formatLastUpdated(lastUpdated)}</span>
              )}
            </p>
          </div>
          
          <IncidentList
            incidents={filteredIncidents}
            selectedIncident={selectedIncident}
            onIncidentSelect={handleIncidentSelect}
            onChatClick={navigateToChat}
            isLoading={incidentsLoading}
          />
        </div>
      </div>
    </div>
  )
}

// REQUIRED: Default export for Next.js App Router
export default MapsPage;