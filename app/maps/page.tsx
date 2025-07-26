// app/maps/page.tsx - FIXED VERSION - NO MORE API SPAM
'use client'

import { useState, useEffect, useRef } from 'react'
import GoogleMapView from '@/components/GoogleMapView'
import IncidentList from '@/components/IncidentList'
import MapFilters from '@/components/MapFilters'
import { useGeolocation } from '@/lib/hooks/useGeolocation'
import { useIncidents, type ProcessedIncident } from '@/lib/hooks/useIncidents'
import { incidentsAPI } from '@/lib/api/incidents'
import { RefreshCw, MapPin, AlertCircle, Navigation, Loader, Database, Globe } from 'lucide-react'

const INCIDENT_TYPES = [
  { key: 'all', label: 'All', icon: '🌟', color: 'bg-gray-500' },
  { key: 'traffic', label: 'Traffic', icon: '🚗', color: 'bg-orange-500' },
  { key: 'weather', label: 'Weather', icon: '🌧️', color: 'bg-blue-500' },
  { key: 'infrastructure', label: 'Infrastructure', icon: '⚡', color: 'bg-red-500' },
  { key: 'events', label: 'Events', icon: '🎉', color: 'bg-green-500' },
  { key: 'safety', label: 'Safety', icon: '🚨', color: 'bg-purple-500' },
]

export default function MapsPage() {
  const [filteredIncidents, setFilteredIncidents] = useState<ProcessedIncident[]>([])
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [selectedIncident, setSelectedIncident] = useState<ProcessedIncident | null>(null)
  const [searchRadius, setSearchRadius] = useState(15)
  const [currentLocationName, setCurrentLocationName] = useState<string>('')
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)

  // FIXED: Add refs to prevent unnecessary API calls
  const lastRadiusChangeRef = useRef<number>(0)
  const geocodingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const filterChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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

  // FIXED: Controlled incidents hook with debounced radius
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
    refreshInterval: 60000 // FIXED: Increased to 60 seconds to reduce API calls
  });

  // FIXED: Debounced reverse geocoding
  useEffect(() => {
    if (geocodingTimeoutRef.current) {
      clearTimeout(geocodingTimeoutRef.current);
    }

    if (!latitude || !longitude) {
      setCurrentLocationName('');
      return;
    }

    // FIXED: Debounce geocoding requests by 2 seconds
    geocodingTimeoutRef.current = setTimeout(async () => {
      setIsLoadingLocation(true);
      try {
        console.log('🌍 Reverse geocoding:', latitude, longitude);
        
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
              comp.types.includes('administrative_area_level_2') || comp.types.includes('administrative_area_level_1')
            );
            
            if (locality) {
              locationName = locality.long_name;
            } else if (area) {
              locationName = area.long_name;
            } else {
              const parts = result.formatted_address.split(',');
              locationName = parts[0] || 'Unknown Area';
            }
            
            setCurrentLocationName(locationName);
            console.log('✅ Geocoded location:', locationName);
          } else {
            setCurrentLocationName('Unknown Area');
          }
        } else {
          // Fallback for Bengaluru area
          if (latitude >= 12.8 && latitude <= 13.2 && longitude >= 77.4 && longitude <= 77.8) {
            setCurrentLocationName('Bengaluru');
          } else {
            setCurrentLocationName(`${latitude.toFixed(3)}, ${longitude.toFixed(3)}`);
          }
        }
      } catch (error) {
        console.error('Geocoding error:', error);
        if (latitude >= 12.8 && latitude <= 13.2 && longitude >= 77.4 && longitude <= 77.8) {
          setCurrentLocationName('Bengaluru Area');
        } else {
          setCurrentLocationName('Current Location');
        }
      } finally {
        setIsLoadingLocation(false);
      }
    }, 2000); // 2 second debounce

    return () => {
      if (geocodingTimeoutRef.current) {
        clearTimeout(geocodingTimeoutRef.current);
      }
    };
  }, [latitude, longitude]);

  // FIXED: Remove auto-radius adjustment that was causing API spam
  // This was continuously triggering new requests!
  // useEffect(() => {
  //   if (incidents.length === 0 && searchRadius < 50) {
  //     setSearchRadius(prev => Math.min(prev + 5, 50));
  //   } else if (incidents.length > 20 && searchRadius > 10) {
  //     setSearchRadius(prev => Math.max(prev - 2, 10));
  //   }
  // }, [incidents.length, searchRadius]);

  // Filter incidents (client-side only)
  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredIncidents(incidents)
    } else {
      setFilteredIncidents(incidents.filter(incident => incident.type === activeFilter))
    }
  }, [incidents, activeFilter])

  // FIXED: Debounced filter change handler
  const handleFilterChange = async (filterKey: string) => {
    setActiveFilter(filterKey);
    
    // Clear any pending filter change
    if (filterChangeTimeoutRef.current) {
      clearTimeout(filterChangeTimeoutRef.current);
    }

    // FIXED: Don't make API calls for every filter change
    // Let the client-side filtering handle it unless it's a specific topic search
    if (filterKey !== 'all' && latitude && longitude) {
      // Debounce topic-specific API calls
      filterChangeTimeoutRef.current = setTimeout(async () => {
        console.log(`🎯 Filter changed to: ${filterKey}`);
        await fetchByTopic(filterKey);
      }, 1000); // 1 second debounce
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

  // FIXED: Manual refresh with debouncing
  const handleRefresh = async () => {
    const now = Date.now();
    
    // FIXED: Prevent spam clicking refresh button
    if (now - lastRadiusChangeRef.current < 2000) {
      console.log('🚫 Refresh throttled, please wait...');
      return;
    }
    
    lastRadiusChangeRef.current = now;
    console.log('🔄 Manual refresh triggered');
    await refetchIncidents();
  }

  // FIXED: Controlled radius change handler
  const handleRadiusChange = (newRadius: number) => {
    const now = Date.now();
    
    // FIXED: Throttle radius changes to prevent API spam
    if (now - lastRadiusChangeRef.current < 3000) {
      console.log('🚫 Radius change throttled, please wait...');
      return;
    }
    
    lastRadiusChangeRef.current = now;
    console.log(`📏 Radius changed to: ${newRadius}km`);
    setSearchRadius(newRadius);
  }

  // Populate demo data if no incidents found
  const handlePopulateDemoData = async () => {
    try {
      console.log('🎭 Populating demo data...');
      const success = await incidentsAPI.populateDemoData(15);
      if (success) {
        // Wait 3 seconds before refetching to allow backend processing
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
    if (accuracy < 50) return 'High Precision GPS';
    if (accuracy < 100) return 'GPS';
    if (accuracy < 1000) return 'Network Location';
    return 'Approximate Location';
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
                {isLoadingLocation ? (
                  <span className="flex items-center gap-1 text-blue-600">
                    <Loader className="w-4 h-4 animate-spin" />
                    Getting area info...
                  </span>
                ) : currentLocationName ? (
                  <span className="flex items-center gap-1 text-green-700">
                    <Globe className="w-4 h-4" />
                    Viewing: {currentLocationName}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-gray-600">
                    <Globe className="w-4 h-4" />
                    Area: Unknown
                  </span>
                )}
                
                <span className="text-gray-400">•</span>
                
                {locationLoading ? (
                  <span className="flex items-center gap-1 text-blue-600">
                    <Loader className="w-4 h-4 animate-spin" />
                    Locating...
                  </span>
                ) : latitude && longitude ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <Navigation className="w-4 h-4" />
                    {getLocationAccuracy()}: {latitude.toFixed(4)}, {longitude.toFixed(4)}
                  </span>
                ) : (
                  <span className="text-red-600">📍 Location needed</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* FIXED: Controlled radius control */}
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

              {/* Demo data button */}
              {totalCount === 0 && !incidentsLoading && (
                <button
                  onClick={handlePopulateDemoData}
                  className="flex items-center gap-2 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                >
                  <Database className="w-4 h-4" />
                  Add Demo Data
                </button>
              )}

              {/* Get location button */}
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

              {/* FIXED: Controlled refresh button */}
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

          {/* Status bar */}
          <div className="mt-3 flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-gray-700 font-medium">
                📍 {totalCount} incident{totalCount !== 1 ? 's' : ''} found
              </span>
              <span className="text-gray-600">
                within {searchRadius}km of {currentLocationName || 'your location'}
              </span>
              <span className="text-gray-500">
                Updated: {formatLastUpdated(lastUpdated)}
              </span>
              {accuracy && (
                <span className="text-green-600 text-xs">
                  ±{Math.round(accuracy)}m accuracy
                </span>
              )}
            </div>

            {(incidentsError || locationError) && (
              <div className="flex items-center gap-1 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs">{incidentsError || locationError}</span>
              </div>
            )}
          </div>

          {/* No data state */}
          {totalCount === 0 && !incidentsLoading && !incidentsError && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm text-blue-800">
                    No incidents found within {searchRadius}km of {currentLocationName || 'your location'}. 
                    Try expanding the search radius or populate demo data.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* FIXED: Controlled filters */}
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

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="flex-1 relative">
          <GoogleMapView
            incidents={filteredIncidents}
            selectedIncident={selectedIncident}
            onIncidentClick={handleMapIncidentClick}
            isLoading={incidentsLoading || locationLoading}
          />
        </div>

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
    </div>
  )
}