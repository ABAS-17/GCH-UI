'use client'

import { useState, useEffect, useRef } from 'react'
import GoogleMapView from '@/components/Maps/GoogleMapView'
import IncidentList from '@/components/Maps/IncidentList'
import MapFilters from '@/components/Maps/MapFilters'
import { useGeolocation } from '@/lib/hooks/useGeolocation'
import { useIncidents, type ProcessedIncident } from '@/lib/hooks/useIncidents'
import { incidentsAPI } from '@/lib/api/incidents'
import { RefreshCw, MapPin, AlertCircle, Navigation, Loader, Database, Globe, Crosshair, Locate } from 'lucide-react'

const INCIDENT_TYPES = [
  { key: 'all', label: 'All', icon: '🌟', color: 'bg-gray-500' },
  { key: 'traffic', label: 'Traffic', icon: '🚗', color: 'bg-orange-500' },
  { key: 'weather', label: 'Weather', icon: '🌧️', color: 'bg-blue-500' },
  { key: 'infrastructure', label: 'Infrastructure', icon: '⚡', color: 'bg-red-500' },
  { key: 'events', label: 'Events', icon: '🎉', color: 'bg-green-500' },
  { key: 'safety', label: 'Safety', icon: '🚨', color: 'bg-purple-500' },
]

export default function MapsPageContent() {
  const [filteredIncidents, setFilteredIncidents] = useState<ProcessedIncident[]>([])
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [selectedIncident, setSelectedIncident] = useState<ProcessedIncident | null>(null)
  const [searchRadius, setSearchRadius] = useState(15)
  const [currentLocationName, setCurrentLocationName] = useState<string>('')
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)

  // Refs for debouncing
  const geocodingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const filterChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastLocationRef = useRef<{ lat: number | null; lng: number | null }>({ lat: null, lng: null })

  // PURE LIVE LOCATION TRACKING - No fallbacks, no hardcoded coordinates
  const {
    latitude,
    longitude,
    accuracy,
    heading,
    speed,
    error: locationError,
    loading: locationLoading,
    permissionStatus,
    isTracking,
    requestLocation,
    stopTracking,
    startTracking
  } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 30000,
    enableTracking: true, // Continuous live tracking
    trackingInterval: 5000
  });

  // LIVE LOCATION BASED INCIDENT FETCHING
  const {
    incidents,
    isLoading: incidentsLoading,
    error: incidentsError,
    lastUpdated,
    totalCount,
    refetch: refetchIncidents,
    fetchByTopic,
    searchIncidents,
    isLiveTracking
  } = useIncidents({
    latitude,
    longitude,
    radiusKm: searchRadius,
    maxResults: 100,
    autoRefresh: true,
    refreshInterval: 45000, // 45 seconds
    enableLiveUpdates: true // Follow user as they move
  });

  // Live reverse geocoding - debounced
  useEffect(() => {
    if (geocodingTimeoutRef.current) {
      clearTimeout(geocodingTimeoutRef.current);
    }

    if (!latitude || !longitude) {
      setCurrentLocationName('');
      return;
    }

    // Check if location changed significantly (50m threshold)
    const lastLat = lastLocationRef.current.lat;
    const lastLng = lastLocationRef.current.lng;
    
    if (lastLat && lastLng) {
      const distance = calculateDistance(lastLat, lastLng, latitude, longitude);
      if (distance < 0.05) { // Less than 50 meters
        return; // Don't reverse geocode for small movements
      }
    }

    lastLocationRef.current = { lat: latitude, lng: longitude };

    // Debounce geocoding by 3 seconds
    geocodingTimeoutRef.current = setTimeout(async () => {
      setIsLoadingLocation(true);
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.results && data.results.length > 0) {
            const result = data.results[0];
            const addressComponents = result.address_components;
            
            let locationName = '';
            const locality = addressComponents.find((comp: any) => 
              comp.types.includes('locality') || comp.types.includes('sublocality_level_1')
            );
            const area = addressComponents.find((comp: any) => 
              comp.types.includes('administrative_area_level_2')
            );
            
            if (locality) {
              locationName = locality.long_name;
            } else if (area) {
              locationName = area.long_name;
            } else {
              const parts = result.formatted_address.split(',');
              locationName = parts[0] || 'Current Location';
            }
            
            setCurrentLocationName(locationName);
            console.log('✅ Live location geocoded:', locationName);
          } else {
            setCurrentLocationName('Current Location');
          }
        } else {
          setCurrentLocationName('Current Location');
        }
      } catch (error) {
        console.error('Geocoding error:', error);
        setCurrentLocationName('Current Location');
      } finally {
        setIsLoadingLocation(false);
      }
    }, 3000);

    return () => {
      if (geocodingTimeoutRef.current) {
        clearTimeout(geocodingTimeoutRef.current);
      }
    };
  }, [latitude, longitude]);

  // Helper function to calculate distance
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Filter incidents (client-side only)
  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredIncidents(incidents)
    } else {
      setFilteredIncidents(incidents.filter(incident => incident.type === activeFilter))
    }
  }, [incidents, activeFilter])

  // Debounced filter change handler
  const handleFilterChange = async (filterKey: string) => {
    setActiveFilter(filterKey);
    
    if (filterChangeTimeoutRef.current) {
      clearTimeout(filterChangeTimeoutRef.current);
    }

    // For topic-specific searches, use API
    if (filterKey !== 'all' && latitude && longitude) {
      filterChangeTimeoutRef.current = setTimeout(async () => {
        console.log(`🎯 Live location filter: ${filterKey}`);
        await fetchByTopic(filterKey);
      }, 1000);
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
    console.log('🔄 Manual refresh with live location');
    await refetchIncidents();
  }

  const handleRadiusChange = (newRadius: number) => {
    console.log(`📏 Search radius changed to: ${newRadius}km`);
    setSearchRadius(newRadius);
  }

  // Populate demo data if no incidents found
  const handlePopulateDemoData = async () => {
    if (!latitude || !longitude) {
      console.warn('❌ Cannot populate demo data without live location');
      return;
    }

    try {
      console.log('🎭 Populating demo data for live location...');
      const success = await incidentsAPI.populateDemoData(15);
      if (success) {
        setTimeout(() => {
          refetchIncidents();
        }, 3000);
      }
    } catch (error) {
      console.error('Failed to populate demo data:', error);
    }
  }

  const getLocationAccuracy = () => {
    if (!accuracy) return 'GPS';
    if (accuracy < 10) return 'High Precision';
    if (accuracy < 50) return 'GPS';
    if (accuracy < 100) return 'Network';
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
              <h1 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
                🗺️ Live City Map
                {isTracking && (
                  <span className="flex items-center gap-1 text-green-600 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Live
                  </span>
                )}
              </h1>
              
              <div className="flex items-center gap-2 text-sm">
                {/* Live Location Area */}
                {isLoadingLocation ? (
                  <span className="flex items-center gap-1 text-blue-600">
                    <Loader className="w-4 h-4 animate-spin" />
                    Getting area...
                  </span>
                ) : currentLocationName ? (
                  <span className="flex items-center gap-1 text-green-700">
                    <Globe className="w-4 h-4" />
                    {currentLocationName}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-gray-600">
                    <Globe className="w-4 h-4" />
                    Location Unknown
                  </span>
                )}
                
                <span className="text-gray-400">•</span>
                
                {/* Live GPS Status */}
                {locationLoading ? (
                  <span className="flex items-center gap-1 text-blue-600">
                    <Crosshair className="w-4 h-4 animate-spin" />
                    Locating...
                  </span>
                ) : latitude && longitude ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <Navigation className="w-4 h-4" />
                    {getLocationAccuracy()}: {latitude.toFixed(4)}, {longitude.toFixed(4)}
                    {speed && speed > 0 && (
                      <span className="text-xs">• {Math.round(speed * 3.6)}km/h</span>
                    )}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-600">
                    <Locate className="w-4 h-4" />
                    GPS Required
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Live Tracking Status */}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                isLiveTracking 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isLiveTracking ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
                }`}></div>
                {isLiveTracking ? 'Live Tracking' : 'Waiting for Location'}
              </div>

              {/* Radius Control */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
                <span className="text-sm text-gray-600">Radius:</span>
                <select
                  value={searchRadius}
                  onChange={(e) => handleRadiusChange(Number(e.target.value))}
                  className="bg-transparent text-sm font-medium text-gray-800 border-none outline-none"
                >
                  <option value={5}>5km</option>
                  <option value={10}>10km</option>
                  <option value={15}>15km</option>
                  <option value={20}>20km</option>
                  <option value={30}>30km</option>
                  <option value={50}>50km</option>
                </select>
              </div>

              {/* Demo Data Button - Only if we have location and no incidents */}
              {latitude && longitude && totalCount === 0 && !incidentsLoading && (
                <button
                  onClick={handlePopulateDemoData}
                  className="flex items-center gap-2 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                >
                  <Database className="w-4 h-4" />
                  Add Demo Data
                </button>
              )}

              {/* Location Request Button */}
              {(!latitude || !longitude) && (
                <button
                  onClick={requestLocation}
                  disabled={locationLoading}
                  className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
                >
                  {locationLoading ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Locate className="w-4 h-4" />
                  )}
                  {locationLoading ? 'Getting GPS...' : 'Enable GPS'}
                </button>
              )}

              {/* Manual Refresh */}
              <button
                onClick={handleRefresh}
                disabled={incidentsLoading || !latitude || !longitude}
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
              <span className="text-gray-700 font-medium">
                📍 {totalCount} incident{totalCount !== 1 ? 's' : ''} found
              </span>
              
              {currentLocationName && (
                <span className="text-gray-600">
                  within {searchRadius}km of {currentLocationName}
                </span>
              )}
              
              <span className="text-gray-500">
                Updated: {formatLastUpdated(lastUpdated)}
              </span>
              
              {accuracy && (
                <span className="text-green-600 text-xs">
                  ±{Math.round(accuracy)}m accuracy
                </span>
              )}
            </div>

            {/* Error Display */}
            {(incidentsError || locationError) && (
              <div className="flex items-center gap-1 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs">{incidentsError || locationError}</span>
              </div>
            )}
          </div>

          {/* Location Permission Required */}
          {permissionStatus === 'denied' && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Locate className="w-5 h-5 text-red-600" />
                <div className="flex-1">
                  <p className="text-sm text-red-800 font-medium">
                    Location permission denied
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    Please enable location access in your browser settings to use live maps.
                  </p>
                </div>
                <button
                  onClick={requestLocation}
                  className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* No Location State */}
          {(!latitude || !longitude) && permissionStatus !== 'denied' && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Crosshair className="w-5 h-5 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm text-blue-800 font-medium">
                    {locationLoading ? 'Getting your live location...' : 'Live location required'}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Enable GPS to see incidents around you in real-time.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* No Incidents State */}
          {latitude && longitude && totalCount === 0 && !incidentsLoading && !incidentsError && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-2xl">✨</span>
                <div className="flex-1">
                  <p className="text-sm text-green-800 font-medium">
                    All clear in your area!
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    No incidents found within {searchRadius}km of {currentLocationName || 'your location'}. 
                    Try expanding the search radius or add demo data for testing.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Filters - Only show if we have location */}
      {latitude && longitude && (
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
      )}

      {/* Main Content - Only render if we have live location */}
      {latitude && longitude ? (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Map */}
          <div className="flex-1 relative">
            <GoogleMapView
              incidents={filteredIncidents}
              selectedIncident={selectedIncident}
              onIncidentClick={handleMapIncidentClick}
              isLoading={incidentsLoading || locationLoading}
              userLocation={{ lat: latitude, lng: longitude }}
              userHeading={heading}
              userSpeed={speed}
            />
          </div>

          {/* Incident List */}
          <div className="lg:w-80 bg-white border-l border-gray-200 flex flex-col max-h-96 lg:max-h-none">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">
                {activeFilter === 'all' ? 'All Incidents' : INCIDENT_TYPES.find(f => f.key === activeFilter)?.label}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {filteredIncidents.length} incident{filteredIncidents.length !== 1 ? 's' : ''} 
                {currentLocationName && (
                  <span> near {currentLocationName}</span>
                )}
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
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <Locate className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Live Location Required</h3>
            <p className="text-gray-600 mb-4">
              Enable GPS location access to view live incidents around you.
            </p>
            <button
              onClick={requestLocation}
              disabled={locationLoading}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {locationLoading ? (
                <span className="flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  Getting Location...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Locate className="w-4 h-4" />
                  Enable Live Location
                </span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}