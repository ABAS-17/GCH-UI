'use client'
import React, { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { useGeolocation } from '@/lib/hooks/useGeolocation';
import { MapPin, Navigation, AlertCircle, Mountain, Crosshair, Locate } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Incident {
  id: string;
  type: 'traffic' | 'weather' | 'infrastructure' | 'events' | 'safety';
  title: string;
  description: string;
  location: {
    lat: number;
    lng: number;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  distance_km: number;
  created_at: string;
  affected_count?: number;
  confidence_score: number;
  sub_topic: string;
}

interface GoogleMapViewProps {
  incidents: Incident[];
  selectedIncident: Incident | null;
  onIncidentClick: (incidentId: string) => void;
  isLoading: boolean;
}

// Enhanced 3D configuration
const GOOGLE_MAPS_3D_CONFIG = {
  libraries: ['places', 'geometry'] as ('places' | 'geometry')[],
  defaultCenter: {
    lat: 12.9120,
    lng: 77.6365
  },
  defaultZoom: 16,
  default3DTilt: 60,
  defaultHeading: 0,
};

const INCIDENT_MARKER_STYLES = {
  traffic: { color: '#ea580c', icon: '🚗', bgColor: '#fed7aa' },
  weather: { color: '#3b82f6', icon: '🌧️', bgColor: '#dbeafe' },
  infrastructure: { color: '#dc2626', icon: '⚡', bgColor: '#fecaca' },
  events: { color: '#16a34a', icon: '🎉', bgColor: '#dcfce7' },
  safety: { color: '#7c3aed', icon: '🚨', bgColor: '#ede9fe' }
};

export default function GoogleMapView({
  incidents,
  selectedIncident,
  onIncidentClick,
  isLoading
}: GoogleMapViewProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);
  const [is3DMode, setIs3DMode] = useState(true);
  const [mapTilt, setMapTilt] = useState(GOOGLE_MAPS_3D_CONFIG.default3DTilt);
  const [mapHeading, setMapHeading] = useState(GOOGLE_MAPS_3D_CONFIG.defaultHeading);

  // FIXED: Remove animation that was causing continuous re-renders
  // const [animationPhase, setAnimationPhase] = useState(0);

  // FIXED: Remove animation interval that was causing continuous SVG regeneration
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setAnimationPhase(prev => (prev + 1) % 100);
  //   }, 50); 
  //   return () => clearInterval(interval);
  // }, []);

  // FIXED: Add icon cache to prevent regenerating SVG icons
  const iconCache = useRef<Map<string, google.maps.Icon>>(new Map());

  // Load Google Maps
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: GOOGLE_MAPS_3D_CONFIG.libraries,
  });

  // Get user location
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
    timeout: 10000,
    maximumAge: 300000
  });

  // Map center
  const mapCenter = useMemo(() => {
    if (latitude && longitude) {
      return { lat: latitude, lng: longitude };
    }
    return GOOGLE_MAPS_3D_CONFIG.defaultCenter;
  }, [latitude, longitude]);

  // Enhanced map options
  const mapOptions = useMemo(() => {
    if (!isLoaded) return {};
    
    return {
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: true,
      scaleControl: true,
      streetViewControl: true,
      rotateControl: true,
      fullscreenControl: true,
      gestureHandling: 'auto',
      clickableIcons: true,
      mapTypeId: 'roadmap',
      tilt: is3DMode ? mapTilt : 0,
      heading: mapHeading,
      
      // Enhanced styling
      styles: [
        {
          featureType: 'poi.business',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'poi.park',
          elementType: 'labels',
          stylers: [{ visibility: 'simplified' }]
        },
        {
          featureType: 'transit.station',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'road.highway',
          elementType: 'geometry',
          stylers: [
            { color: '#ffffff' },
            { weight: 4 },
            { lightness: 10 }
          ]
        },
        {
          featureType: 'road.arterial',
          elementType: 'geometry',
          stylers: [
            { color: '#ffffff' },
            { weight: 3 },
            { lightness: 5 }
          ]
        },
        {
          featureType: 'road.local',
          elementType: 'geometry',
          stylers: [
            { color: '#f8f9fa' },
            { weight: 2 }
          ]
        },
        {
          featureType: 'landscape.man_made',
          elementType: 'geometry.fill',
          stylers: [
            { color: '#e8e8e8' },
            { lightness: 25 },
            { saturation: -10 }
          ]
        },
        {
          featureType: 'water',
          elementType: 'geometry',
          stylers: [
            { color: '#a3d5ff' },
            { lightness: 15 },
            { saturation: 20 }
          ]
        },
        {
          featureType: 'landscape.natural',
          elementType: 'geometry',
          stylers: [
            { color: '#d8e8d0' },
            { lightness: 10 },
            { saturation: 5 }
          ]
        },
        {
          featureType: 'all',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#2d3748' }]
        },
        {
          featureType: 'all',
          elementType: 'labels.text.stroke',
          stylers: [
            { color: '#ffffff' },
            { weight: 3 },
            { lightness: 20 }
          ]
        }
      ]
    };
  }, [isLoaded, is3DMode, mapTilt, mapHeading]);

  // Handle map load
  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    
    const enable3DBuildings = () => {
      if (window.google && map) {
        map.setTilt(mapTilt);
        map.setHeading(mapHeading);
      }
    };

    setTimeout(enable3DBuildings, 1000);
    
    if (incidents.length > 0 && window.google) {
      const bounds = new window.google.maps.LatLngBounds();
      
      if (latitude && longitude) {
        bounds.extend({ lat: latitude, lng: longitude });
      }
      
      incidents.forEach(incident => {
        bounds.extend({
          lat: incident.location.lat,
          lng: incident.location.lng
        });
      });
      
      map.fitBounds(bounds);
      
      setTimeout(() => {
        if (is3DMode) {
          map.setTilt(mapTilt);
          map.setHeading(mapHeading);
        }
      }, 1500);
    }
  }, [incidents, latitude, longitude, mapTilt, mapHeading, is3DMode]);

  const onMapUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // 3D Controls
  const toggle3DMode = useCallback(() => {
    if (map) {
      const newMode = !is3DMode;
      setIs3DMode(newMode);
      
      if (newMode) {
        map.setTilt(mapTilt);
        map.setHeading(mapHeading);
      } else {
        map.setTilt(0);
        map.setHeading(0);
      }
    }
  }, [map, is3DMode, mapTilt, mapHeading]);

  const adjustTilt = useCallback((newTilt: number) => {
    if (map && is3DMode) {
      setMapTilt(newTilt);
      map.setTilt(newTilt);
    }
  }, [map, is3DMode]);

  const adjustHeading = useCallback((newHeading: number) => {
    if (map) {
      setMapHeading(newHeading);
      map.setHeading(newHeading);
    }
  }, [map]);

  // FIXED: Cached marker icon creation - NO MORE CONTINUOUS SVG GENERATION
  const createMarkerIcon = useCallback((incident: Incident) => {
    if (!isLoaded || !window.google) return undefined;
    
    // CRITICAL FIX: Create a stable cache key that doesn't change on every render
    const isSelected = selectedIncident?.id === incident.id;
    const isHovered = hoveredMarker === incident.id;
    
    // FIXED: Create stable cache key without animation phase
    const cacheKey = `${incident.type}-${incident.severity}-${isSelected ? 'selected' : ''}-${isHovered ? 'hovered' : ''}`;
    
    // FIXED: Return cached icon if available
    if (iconCache.current.has(cacheKey)) {
      return iconCache.current.get(cacheKey)!;
    }
    
    const style = INCIDENT_MARKER_STYLES[incident.type];
    const baseSize = 42;
    const size = isSelected ? baseSize * 1.3 : isHovered ? baseSize * 1.15 : baseSize;
    const height = incident.severity === 'critical' ? 40 : 
                   incident.severity === 'high' ? 35 : 
                   incident.severity === 'medium' ? 30 : 25;

    // FIXED: Remove floating animation that was causing continuous re-renders
    // const floatOffset = Math.sin(animationPhase * 0.2) * 2;
    const floatOffset = 0; // Static position

    const icon = {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg width="${size + 20}" height="${size + height + 20}" viewBox="0 0 ${size + 20} ${size + height + 20}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad${cacheKey}" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:${style.color};stop-opacity:1" />
              <stop offset="30%" style="stop-color:${style.color};stop-opacity:0.9" />
              <stop offset="70%" style="stop-color:${style.color};stop-opacity:0.7" />
              <stop offset="100%" style="stop-color:${style.color};stop-opacity:0.5" />
            </linearGradient>
            <radialGradient id="glow${cacheKey}" cx="50%" cy="50%" r="50%">
              <stop offset="0%" style="stop-color:${style.color};stop-opacity:0.6" />
              <stop offset="100%" style="stop-color:${style.color};stop-opacity:0" />
            </radialGradient>
            <filter id="shadow${cacheKey}" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="6" stdDeviation="6" flood-opacity="0.3"/>
            </filter>
          </defs>
          
          <!-- FIXED: Remove animated elements that cause continuous requests -->
          ${incident.severity === 'critical' ? `
            <circle cx="${(size + 20)/2}" cy="${(size + 20)/2 + floatOffset}" r="${size/2 + 15}" 
                    fill="${style.color}" opacity="0.2"/>
            <circle cx="${(size + 20)/2}" cy="${(size + 20)/2 + floatOffset}" r="${size/2 + 8}" 
                    fill="${style.color}" opacity="0.4"/>
          ` : ''}
          
          <!-- Floating glow background -->
          <circle cx="${(size + 20)/2}" cy="${(size + 20)/2 + floatOffset}" r="${size/2 + 8}" 
                  fill="url(#glow${cacheKey})" opacity="0.6"/>
          
          <!-- Base shadow -->
          <ellipse cx="${(size + 20)/2}" cy="${size + height + 15}" rx="${size/2}" ry="6" 
                   fill="black" opacity="0.2"/>
          
          <!-- Main container -->
          <g transform="translate(10, ${10 + floatOffset})">
            <!-- 3D Cylinder Body -->
            <rect x="${size/4}" y="${size/2}" width="${size/2}" height="${height}" 
                  fill="url(#grad${cacheKey})" filter="url(#shadow${cacheKey})" rx="6"/>
            
            <!-- 3D Top -->
            <ellipse cx="${size/2}" cy="${size/2}" rx="${size/4}" ry="8" 
                     fill="${style.color}" opacity="0.95"/>
            
            <!-- Side highlights -->
            <rect x="${size/4 + 3}" y="${size/2 + 3}" width="3" height="${height - 6}" 
                  fill="white" opacity="0.5" rx="1"/>
            <rect x="${size/4 + size/2 - 6}" y="${size/2 + 3}" width="3" height="${height - 6}" 
                  fill="black" opacity="0.2" rx="1"/>
            
            <!-- Icon -->
            <text x="${size/2}" y="${size/2 + height/2 + 6}" text-anchor="middle" 
                  font-size="${size/2.5}" fill="white" font-weight="bold">${style.icon}</text>
            
            <!-- Severity indicator ring -->
            <circle cx="${size/2}" cy="${size/2}" r="${size/4 + 4}" 
                    fill="none" stroke="${style.color}" stroke-width="2" opacity="0.8"/>
          </g>
          
          <!-- Selection indicator - FIXED: Remove animations -->
          ${isSelected ? `
            <circle cx="${(size + 20)/2}" cy="${(size + 20)/2 + floatOffset}" r="${size/2 + 12}" 
                    fill="none" stroke="#ffffff" stroke-width="4" opacity="0.9"/>
          ` : ''}
          
          <!-- Hover glow effect -->
          ${isHovered ? `
            <circle cx="${(size + 20)/2}" cy="${(size + 20)/2 + floatOffset}" r="${size/2 + 6}" 
                    fill="${style.color}" opacity="0.3"/>
          ` : ''}
        </svg>
      `)}`,
      scaledSize: new window.google.maps.Size(size + 20, size + height + 20),
      anchor: new window.google.maps.Point((size + 20)/2, size + height + 15)
    };

    // FIXED: Cache the icon to prevent regeneration
    iconCache.current.set(cacheKey, icon);
    
    return icon;
  }, [isLoaded, selectedIncident, hoveredMarker]); // REMOVED animationPhase dependency

  // FIXED: Cached user location icon
  const userLocationIcon = useMemo(() => {
    if (!isLoaded || !window.google) return undefined;
    
    // FIXED: Static user location icon without animations
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="userMainGrad" cx="50%" cy="30%" r="70%">
              <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
              <stop offset="40%" style="stop-color:#3b82f6;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />
            </radialGradient>
            <filter id="userShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.3"/>
            </filter>
          </defs>
          
          <!-- FIXED: Remove animated accuracy circle -->
          ${accuracy ? `
            <circle cx="30" cy="30" r="${Math.min(accuracy / 20, 25)}" 
                    fill="#3b82f6" opacity="0.1" stroke="#3b82f6" stroke-width="1" stroke-dasharray="3,2"/>
          ` : ''}
          
          <!-- FIXED: Static pulse rings -->
          <circle cx="30" cy="30" r="22" fill="#3b82f6" opacity="0.15"/>
          <circle cx="30" cy="30" r="18" fill="#3b82f6" opacity="0.25"/>
          
          <!-- Crosshair indicators -->
          <g stroke="#ffffff" stroke-width="2" opacity="0.8">
            <line x1="30" y1="8" x2="30" y2="18"/>
            <line x1="30" y1="42" x2="30" y2="52"/>
            <line x1="8" y1="30" x2="18" y2="30"/>
            <line x1="42" y1="30" x2="52" y2="30"/>
          </g>
          
          <!-- Main location indicator -->
          <circle cx="30" cy="30" r="12" fill="url(#userMainGrad)" filter="url(#userShadow)"/>
          
          <!-- Inner white ring -->
          <circle cx="30" cy="30" r="8" fill="white" opacity="0.9"/>
          
          <!-- Center dot -->
          <circle cx="30" cy="30" r="4" fill="#3b82f6"/>
          
          <!-- Status indicator ring -->
          <circle cx="30" cy="30" r="14" fill="none" stroke="#10b981" stroke-width="2" opacity="0.7"/>
        </svg>
      `)}`,
      scaledSize: new window.google.maps.Size(60, 60),
      anchor: new window.google.maps.Point(30, 30)
    };
  }, [isLoaded, accuracy]); // REMOVED animationPhase dependency

  // Handle marker interactions
  const handleMarkerClick = (incidentId: string) => {
    setSelectedMarker(incidentId);
    onIncidentClick(incidentId);
  };

  const handleInfoWindowClose = () => {
    setSelectedMarker(null);
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const created = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Loading state
  if (!isLoaded || locationLoading) {
    return (
      <motion.div 
        className="w-full h-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-center">
          <motion.div className="relative mb-6">
            <motion.div
              className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-2xl"
              animate={{ 
                scale: [1, 1.1, 1],
                rotateY: [0, 10, 0],
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut" 
              }}
            >
              <Mountain className="w-12 h-12 text-white" />
            </motion.div>
          </motion.div>
          
          <motion.h3 
            className="text-2xl font-bold text-gray-800 mb-2"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {!isLoaded ? 'Loading 3D City Map...' : 'Locating you...'}
          </motion.h3>
          
          <motion.p 
            className="text-gray-600 text-lg mb-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Preparing immersive experience
          </motion.p>
        </div>
      </motion.div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <motion.div 
        className="w-full h-full bg-red-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-center p-6">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5, repeat: 3 }}
          >
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          </motion.div>
          <h3 className="text-xl font-semibold text-red-800 mb-2">Failed to Load 3D Map</h3>
          <p className="text-red-600 mb-4">
            Unable to load Google Maps 3D view. Please check your connection.
          </p>
          <motion.button
            onClick={() => window.location.reload()}
            className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Retry
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={mapCenter}
        zoom={GOOGLE_MAPS_3D_CONFIG.defaultZoom}
        options={mapOptions}
        onLoad={onMapLoad}
        onUnmount={onMapUnmount}
      >
        {/* User Location Marker */}
        {latitude && longitude && userLocationIcon && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 20,
              duration: 1
            }}
          >
            <Marker
              position={{ lat: latitude, lng: longitude }}
              icon={userLocationIcon}
              title={`Your Location${accuracy ? ` (±${Math.round(accuracy)}m)` : ''}`}
              zIndex={1000}
            />
          </motion.div>
        )}

        {/* FIXED: Static incident markers with cached icons */}
        <AnimatePresence>
          {incidents.map((incident, index) => {
            const markerIcon = createMarkerIcon(incident);
            
            return (
              <motion.div
                key={incident.id}
                initial={{ 
                  scale: 0, 
                  y: -100, 
                  rotateX: 90,
                  opacity: 0 
                }}
                animate={{ 
                  scale: 1, 
                  y: 0, 
                  rotateX: 0,
                  opacity: 1 
                }}
                exit={{ 
                  scale: 0, 
                  y: -100, 
                  rotateX: 90,
                  opacity: 0 
                }}
                transition={{ 
                  delay: index * 0.15,
                  type: "spring", 
                  stiffness: 150,
                  damping: 20,
                  duration: 0.8
                }}
              >
                <Marker
                  position={{
                    lat: incident.location.lat,
                    lng: incident.location.lng
                  }}
                  icon={markerIcon}
                  title={incident.title}
                  onClick={() => handleMarkerClick(incident.id)}
                  onMouseOver={() => setHoveredMarker(incident.id)}
                  onMouseOut={() => setHoveredMarker(null)}
                  zIndex={selectedIncident?.id === incident.id ? 999 : 1}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Info Window */}
        {selectedMarker && incidents.find(i => i.id === selectedMarker) && (
          <InfoWindow
            position={{
              lat: incidents.find(i => i.id === selectedMarker)!.location.lat,
              lng: incidents.find(i => i.id === selectedMarker)!.location.lng
            }}
            onCloseClick={handleInfoWindowClose}
          >
            <motion.div 
              className="p-4 max-w-sm bg-white rounded-lg shadow-lg"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {(() => {
                const incident = incidents.find(i => i.id === selectedMarker)!;
                const style = INCIDENT_MARKER_STYLES[incident.type];
                return (
                  <>
                    <div className="flex items-center gap-3 mb-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                        style={{ backgroundColor: style.bgColor }}
                      >
                        {style.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{incident.title}</h3>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          incident.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          incident.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                          incident.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {incident.severity.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                      {incident.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-3">
                      <span className="flex items-center gap-1">
                        <Navigation className="w-3 h-3" />
                        {incident.distance_km.toFixed(1)}km away
                      </span>
                      <span>{formatTimeAgo(incident.created_at)}</span>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Controls and overlays remain the same but without animation dependencies */}
      <AnimatePresence>
        {permissionStatus === 'denied' && (
          <motion.div 
            className="absolute top-4 left-4 right-24 bg-gradient-to-r from-yellow-50 to-orange-50 backdrop-blur-sm border border-yellow-200 rounded-2xl p-4 shadow-lg"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-3">
              <Locate className="w-6 h-6 text-yellow-600" />
              <div className="flex-1">
                <p className="text-sm text-yellow-800 font-semibold">
                  Location access denied
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Enable location for precise incident tracking
                </p>
              </div>
              <motion.button
                onClick={requestLocation}
                className="bg-yellow-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-yellow-600 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Enable
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-gray-200"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
          >
            <div className="flex items-center gap-3">
              <motion.div 
                className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <span className="text-sm text-gray-700 font-semibold">Loading incidents...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info panel */}
      <motion.div 
        className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-gray-200 max-w-xs"
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.8 }}
      >
        <div className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          🏙️ 3D City View
        </div>
        <div className="text-sm text-gray-600 space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            {incidents.length} Active Incidents
          </div>
          <div className="flex items-center gap-2">
            <Navigation className="w-3 h-3 text-blue-500" />
            Live location tracking
          </div>
          <div className="flex items-center gap-2">
            <Crosshair className="w-3 h-3 text-purple-500" />
            {accuracy ? `±${Math.round(accuracy)}m accuracy` : 'GPS positioning'}
          </div>
          {latitude && longitude && (
            <div className="text-xs font-mono text-green-600 bg-green-50 px-2 py-1 rounded">
              📍 {latitude.toFixed(4)}, {longitude.toFixed(4)}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}