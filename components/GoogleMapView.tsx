'use client'
import React, { useCallback, useState, useEffect, useMemo } from 'react';
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
  const [animationPhase, setAnimationPhase] = useState(0);

  // Auto-increment animation phase for continuous animations
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 100);
    }, 50); 
    return () => clearInterval(interval);
  }, []);

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

  // Enhanced map options with Zomato-style animations
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
      
      // Zomato-style enhanced styling
      styles: [
        // Hide clutter for clean look
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
        
        // Enhanced roads with depth
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
        
        // Building styling for premium look
        {
          featureType: 'landscape.man_made',
          elementType: 'geometry.fill',
          stylers: [
            { color: '#e8e8e8' },
            { lightness: 25 },
            { saturation: -10 }
          ]
        },
        
        // Premium water styling
        {
          featureType: 'water',
          elementType: 'geometry',
          stylers: [
            { color: '#a3d5ff' },
            { lightness: 15 },
            { saturation: 20 }
          ]
        },
        
        // Natural landscape
        {
          featureType: 'landscape.natural',
          elementType: 'geometry',
          stylers: [
            { color: '#d8e8d0' },
            { lightness: 10 },
            { saturation: 5 }
          ]
        },
        
        // Enhanced labels
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

  // 3D Controls (same as before)
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

  // Enhanced Zomato-style markers with floating animations
  const createMarkerIcon = useCallback((incident: Incident) => {
    if (!isLoaded || !window.google) return undefined;
    
    const style = INCIDENT_MARKER_STYLES[incident.type];
    const isSelected = selectedIncident?.id === incident.id;
    const isHovered = hoveredMarker === incident.id;
    
    const baseSize = 42;
    const size = isSelected ? baseSize * 1.3 : isHovered ? baseSize * 1.15 : baseSize;
    const height = incident.severity === 'critical' ? 40 : 
                   incident.severity === 'high' ? 35 : 
                   incident.severity === 'medium' ? 30 : 25;

    // Floating animation offset
    const floatOffset = Math.sin(animationPhase * 0.2) * 2;

    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg width="${size + 20}" height="${size + height + 20}" viewBox="0 0 ${size + 20} ${size + height + 20}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad${incident.id}" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:${style.color};stop-opacity:1" />
              <stop offset="30%" style="stop-color:${style.color};stop-opacity:0.9" />
              <stop offset="70%" style="stop-color:${style.color};stop-opacity:0.7" />
              <stop offset="100%" style="stop-color:${style.color};stop-opacity:0.5" />
            </linearGradient>
            <radialGradient id="glow${incident.id}" cx="50%" cy="50%" r="50%">
              <stop offset="0%" style="stop-color:${style.color};stop-opacity:0.6" />
              <stop offset="100%" style="stop-color:${style.color};stop-opacity:0" />
            </radialGradient>
            <filter id="shadow${incident.id}" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="6" stdDeviation="6" flood-opacity="0.3"/>
            </filter>
            <filter id="pulse${incident.id}">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          <!-- Animated pulse rings for critical incidents -->
          ${incident.severity === 'critical' ? `
            <circle cx="${(size + 20)/2}" cy="${(size + 20)/2 + floatOffset}" r="${size/2 + 15}" 
                    fill="${style.color}" opacity="0.2">
              <animate attributeName="r" values="${size/2 + 10};${size/2 + 25};${size/2 + 10}" dur="2s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite"/>
            </circle>
            <circle cx="${(size + 20)/2}" cy="${(size + 20)/2 + floatOffset}" r="${size/2 + 8}" 
                    fill="${style.color}" opacity="0.4">
              <animate attributeName="r" values="${size/2 + 5};${size/2 + 18};${size/2 + 5}" dur="1.5s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.4;0;0.4" dur="1.5s" repeatCount="indefinite"/>
            </circle>
          ` : ''}
          
          <!-- Floating glow background -->
          <circle cx="${(size + 20)/2}" cy="${(size + 20)/2 + floatOffset}" r="${size/2 + 8}" 
                  fill="url(#glow${incident.id})" opacity="0.6"/>
          
          <!-- Base shadow (moves with floating) -->
          <ellipse cx="${(size + 20)/2}" cy="${size + height + 15}" rx="${size/2}" ry="6" 
                   fill="black" opacity="${0.2 - floatOffset * 0.02}"/>
          
          <!-- Main container with floating animation -->
          <g transform="translate(10, ${10 + floatOffset})">
            <!-- 3D Cylinder Body -->
            <rect x="${size/4}" y="${size/2}" width="${size/2}" height="${height}" 
                  fill="url(#grad${incident.id})" filter="url(#shadow${incident.id})" rx="6"/>
            
            <!-- 3D Top with premium finish -->
            <ellipse cx="${size/2}" cy="${size/2}" rx="${size/4}" ry="8" 
                     fill="${style.color}" opacity="0.95"/>
            
            <!-- Side highlights for 3D effect -->
            <rect x="${size/4 + 3}" y="${size/2 + 3}" width="3" height="${height - 6}" 
                  fill="white" opacity="0.5" rx="1"/>
            <rect x="${size/4 + size/2 - 6}" y="${size/2 + 3}" width="3" height="${height - 6}" 
                  fill="black" opacity="0.2" rx="1"/>
            
            <!-- Icon with floating effect -->
            <text x="${size/2}" y="${size/2 + height/2 + 6}" text-anchor="middle" 
                  font-size="${size/2.5}" fill="white" font-weight="bold" 
                  filter="url(#pulse${incident.id})">${style.icon}</text>
            
            <!-- Severity indicator ring -->
            <circle cx="${size/2}" cy="${size/2}" r="${size/4 + 4}" 
                    fill="none" stroke="${style.color}" stroke-width="2" opacity="0.8">
              ${isSelected ? `<animate attributeName="stroke-width" values="2;4;2" dur="1s" repeatCount="indefinite"/>` : ''}
            </circle>
          </g>
          
          <!-- Selection indicator -->
          ${isSelected ? `
            <circle cx="${(size + 20)/2}" cy="${(size + 20)/2 + floatOffset}" r="${size/2 + 12}" 
                    fill="none" stroke="#ffffff" stroke-width="3" opacity="0.9">
              <animate attributeName="stroke-width" values="3;6;3" dur="1s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.9;0.6;0.9" dur="1s" repeatCount="indefinite"/>
            </circle>
          ` : ''}
          
          <!-- Hover glow effect -->
          ${isHovered ? `
            <circle cx="${(size + 20)/2}" cy="${(size + 20)/2 + floatOffset}" r="${size/2 + 6}" 
                    fill="${style.color}" opacity="0.3" filter="url(#pulse${incident.id})"/>
          ` : ''}
        </svg>
      `)}`,
      scaledSize: new window.google.maps.Size(size + 20, size + height + 20),
      anchor: new window.google.maps.Point((size + 20)/2, size + height + 15)
    };
  }, [isLoaded, selectedIncident, hoveredMarker, animationPhase]);

  // Premium user location indicator (Zomato-style)
  const userLocationIcon = useMemo(() => {
    if (!isLoaded || !window.google) return undefined;
    
    const pulsePhase = animationPhase * 0.3;
    const breatheScale = 1 + Math.sin(pulsePhase) * 0.1;
    
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="userMainGrad" cx="50%" cy="30%" r="70%">
              <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
              <stop offset="40%" style="stop-color:#3b82f6;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />
            </radialGradient>
            <radialGradient id="userGlowGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:0.8" />
              <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:0" />
            </radialGradient>
            <filter id="userShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.3"/>
            </filter>
            <filter id="userGlow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          <!-- Animated accuracy circle -->
          ${accuracy ? `
            <circle cx="30" cy="30" r="${Math.min(accuracy / 20, 25)}" 
                    fill="#3b82f6" opacity="0.1" stroke="#3b82f6" stroke-width="1" stroke-dasharray="3,2">
              <animate attributeName="opacity" values="0.1;0.2;0.1" dur="3s" repeatCount="indefinite"/>
            </circle>
          ` : ''}
          
          <!-- Outer pulse rings with breathing effect -->
          <circle cx="30" cy="30" r="${22 * breatheScale}" fill="#3b82f6" opacity="0.15">
            <animate attributeName="r" values="20;28;20" dur="2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.2;0;0.2" dur="2s" repeatCount="indefinite"/>
          </circle>
          
          <circle cx="30" cy="30" r="${18 * breatheScale}" fill="#3b82f6" opacity="0.25">
            <animate attributeName="r" values="16;24;16" dur="1.5s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.3;0;0.3" dur="1.5s" repeatCount="indefinite"/>
          </circle>
          
          <!-- Crosshair indicators -->
          <g stroke="#ffffff" stroke-width="2" opacity="0.8">
            <line x1="30" y1="8" x2="30" y2="18">
              <animate attributeName="opacity" values="0.8;0.4;0.8" dur="2s" repeatCount="indefinite"/>
            </line>
            <line x1="30" y1="42" x2="30" y2="52">
              <animate attributeName="opacity" values="0.8;0.4;0.8" dur="2s" repeatCount="indefinite"/>
            </line>
            <line x1="8" y1="30" x2="18" y2="30">
              <animate attributeName="opacity" values="0.8;0.4;0.8" dur="2s" repeatCount="indefinite"/>
            </line>
            <line x1="42" y1="30" x2="52" y2="30">
              <animate attributeName="opacity" values="0.8;0.4;0.8" dur="2s" repeatCount="indefinite"/>
            </line>
          </g>
          
          <!-- Main location indicator -->
          <circle cx="30" cy="30" r="12" fill="url(#userMainGrad)" filter="url(#userShadow)"/>
          
          <!-- Inner white ring -->
          <circle cx="30" cy="30" r="8" fill="white" opacity="0.9"/>
          
          <!-- Center dot with pulse -->
          <circle cx="30" cy="30" r="4" fill="#3b82f6">
            <animate attributeName="r" values="4;6;4" dur="1s" repeatCount="indefinite"/>
          </circle>
          
          <!-- Directional indicator (if accuracy is good) -->
          ${accuracy && accuracy < 100 ? `
            <polygon points="30,25 33,30 30,35 27,30" fill="#1e40af" opacity="0.8">
              <animateTransform attributeName="transform" type="rotate" 
                               values="0 30 30;360 30 30" dur="4s" repeatCount="indefinite"/>
            </polygon>
          ` : ''}
          
          <!-- Premium glow effect -->
          <circle cx="30" cy="30" r="15" fill="url(#userGlowGrad)" filter="url(#userGlow)" opacity="0.6"/>
          
          <!-- Status indicator ring -->
          <circle cx="30" cy="30" r="14" fill="none" stroke="#10b981" stroke-width="2" opacity="0.7">
            <animate attributeName="stroke-width" values="2;3;2" dur="2s" repeatCount="indefinite"/>
          </circle>
        </svg>
      `)}`,
      scaledSize: new window.google.maps.Size(60, 60),
      anchor: new window.google.maps.Point(30, 30)
    };
  }, [isLoaded, animationPhase, accuracy]);

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

  // Enhanced loading state with Zomato-style animation
  if (!isLoaded || locationLoading) {
    return (
      <motion.div 
        className="w-full h-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-center">
          <motion.div className="relative mb-6">
            {/* Animated map icon */}
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
            
            {/* Floating particles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-blue-400 rounded-full"
                style={{
                  left: `${20 + Math.random() * 60}%`,
                  top: `${20 + Math.random() * 60}%`,
                }}
                animate={{
                  y: [-10, -30, -10],
                  opacity: [0.3, 0.8, 0.3],
                  scale: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2 + Math.random(),
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
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
          
          {/* Animated progress bar */}
          <motion.div 
            className="w-64 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden"
            initial={{ width: 0 }}
            animate={{ width: 256 }}
            transition={{ duration: 1, delay: 0.7 }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
              animate={{ 
                x: ['-100%', '100%'],
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                ease: "easeInOut" 
              }}
            />
          </motion.div>
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
        {/* Enhanced User Location Marker */}
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

        {/* Zomato-style Animated Incident Markers */}
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

        {/* Enhanced Info Window */}
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

      {/* Enhanced overlays and info panels remain the same but with improved animations */}
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
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Locate className="w-6 h-6 text-yellow-600" />
              </motion.div>
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

      {/* Enhanced loading overlay */}
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

      {/* Enhanced info panel */}
      <motion.div 
        className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-gray-200 max-w-xs"
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.8 }}
      >
        <div className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <motion.span
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          >
            🏙️
          </motion.span>
          3D City View
        </div>
        <div className="text-sm text-gray-600 space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
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
// components/GoogleMapView.tsx - Enhanced with 3D Isometric Map
// 'use client'

// import React, { useCallback, useState, useEffect, useMemo } from 'react';
// import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
// import { useGeolocation } from '@/lib/hooks/useGeolocation';
// import { MapPin, Navigation, AlertCircle, Compass, Mountain } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';

// interface Incident {
//   id: string;
//   type: 'traffic' | 'weather' | 'infrastructure' | 'events' | 'safety';
//   title: string;
//   description: string;
//   location: {
//     lat: number;
//     lng: number;
//   };
//   severity: 'low' | 'medium' | 'high' | 'critical';
//   distance_km: number;
//   created_at: string;
//   affected_count?: number;
//   confidence_score: number;
//   sub_topic: string;
// }

// interface GoogleMapViewProps {
//   incidents: Incident[];
//   selectedIncident: Incident | null;
//   onIncidentClick: (incidentId: string) => void;
//   isLoading: boolean;
// }

// // Enhanced 3D configuration
// const GOOGLE_MAPS_3D_CONFIG = {
//   libraries: ['places', 'geometry'] as ('places' | 'geometry')[],
//   defaultCenter: {
//     lat: 12.9120,
//     lng: 77.6365
//   },
//   defaultZoom: 16, // Closer zoom for better 3D effect
//   default3DTilt: 60, // Isometric angle
//   defaultHeading: 0,
// };

// const INCIDENT_MARKER_STYLES = {
//   traffic: { color: '#ea580c', icon: '🚗' },
//   weather: { color: '#3b82f6', icon: '🌧️' },
//   infrastructure: { color: '#dc2626', icon: '⚡' },
//   events: { color: '#16a34a', icon: '🎉' },
//   safety: { color: '#7c3aed', icon: '🚨' }
// };

// export default function GoogleMapView({
//   incidents,
//   selectedIncident,
//   onIncidentClick,
//   isLoading
// }: GoogleMapViewProps) {
//   const [map, setMap] = useState<google.maps.Map | null>(null);
//   const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
//   const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);
//   const [is3DMode, setIs3DMode] = useState(true);
//   const [mapTilt, setMapTilt] = useState(GOOGLE_MAPS_3D_CONFIG.default3DTilt);
//   const [mapHeading, setMapHeading] = useState(GOOGLE_MAPS_3D_CONFIG.defaultHeading);

//   // Load Google Maps
//   const { isLoaded, loadError } = useJsApiLoader({
//     id: 'google-map-script',
//     googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
//     libraries: GOOGLE_MAPS_3D_CONFIG.libraries,
//   });

//   // Get user location
//   const {
//     latitude,
//     longitude,
//     error: locationError,
//     loading: locationLoading,
//     permissionStatus,
//     requestLocation
//   } = useGeolocation({
//     enableHighAccuracy: true,
//     timeout: 10000,
//     maximumAge: 300000
//   });

//   // Map center
//   const mapCenter = useMemo(() => {
//     if (latitude && longitude) {
//       return { lat: latitude, lng: longitude };
//     }
//     return GOOGLE_MAPS_3D_CONFIG.defaultCenter;
//   }, [latitude, longitude]);

//   // Enhanced 3D map options
//   const mapOptions = useMemo(() => {
//     if (!isLoaded) return {};
    
//     return {
//       // Basic controls
//       disableDefaultUI: false,
//       zoomControl: true,
//       mapTypeControl: true,
//       scaleControl: true,
//       streetViewControl: true,
//       rotateControl: true,
//       fullscreenControl: true,
//       gestureHandling: 'auto',
//       clickableIcons: true,
      
//       // 3D FEATURES
//       mapTypeId: 'roadmap', // Use roadmap for 3D buildings
//       tilt: is3DMode ? mapTilt : 0, // Isometric tilt
//       heading: mapHeading, // Rotation
      
//       // Enhanced 3D styling
//       styles: [
//         // Hide unnecessary POIs for cleaner look
//         {
//           featureType: 'poi.business',
//           stylers: [{ visibility: 'off' }]
//         },
//         {
//           featureType: 'poi.park',
//           elementType: 'labels',
//           stylers: [{ visibility: 'off' }]
//         },
//         {
//           featureType: 'transit.station',
//           stylers: [{ visibility: 'off' }]
//         },
        
//         // Enhanced roads for 3D effect
//         {
//           featureType: 'road.highway',
//           elementType: 'geometry',
//           stylers: [
//             { color: '#ffffff' },
//             { weight: 3 }
//           ]
//         },
//         {
//           featureType: 'road.arterial',
//           elementType: 'geometry',
//           stylers: [
//             { color: '#ffffff' },
//             { weight: 2 }
//           ]
//         },
//         {
//           featureType: 'road.local',
//           elementType: 'geometry',
//           stylers: [
//             { color: '#ffffff' },
//             { weight: 1 }
//           ]
//         },
        
//         // Building styling for 3D effect
//         {
//           featureType: 'landscape.man_made',
//           elementType: 'geometry.fill',
//           stylers: [
//             { color: '#e8e8e8' },
//             { lightness: 20 }
//           ]
//         },
        
//         // Water features
//         {
//           featureType: 'water',
//           elementType: 'geometry',
//           stylers: [
//             { color: '#a8d0f0' },
//             { lightness: 10 }
//           ]
//         },
        
//         // Landscape
//         {
//           featureType: 'landscape.natural',
//           elementType: 'geometry',
//           stylers: [
//             { color: '#d4e6c4' },
//             { lightness: 5 }
//           ]
//         },
        
//         // Labels with better contrast
//         {
//           featureType: 'all',
//           elementType: 'labels.text.fill',
//           stylers: [{ color: '#2c3e50' }]
//         },
//         {
//           featureType: 'all',
//           elementType: 'labels.text.stroke',
//           stylers: [
//             { color: '#ffffff' },
//             { weight: 2 }
//           ]
//         }
//       ]
//     };
//   }, [isLoaded, is3DMode, mapTilt, mapHeading]);

//   // Handle map load with 3D initialization
//   const onMapLoad = useCallback((map: google.maps.Map) => {
//     setMap(map);
    
//     // Enable 3D buildings
//     const enable3DBuildings = () => {
//       if (window.google && map) {
//         // Force 3D mode
//         map.setTilt(mapTilt);
//         map.setHeading(mapHeading);
        
//         // Enable 3D buildings layer
//         const buildings = new window.google.maps.visualization.HeatmapLayer();
//         // Note: Google Maps automatically shows 3D buildings when tilted
//       }
//     };

//     // Small delay to ensure map is fully loaded
//     setTimeout(enable3DBuildings, 1000);
    
//     // Fit bounds to show incidents
//     if (incidents.length > 0 && window.google) {
//       const bounds = new window.google.maps.LatLngBounds();
      
//       if (latitude && longitude) {
//         bounds.extend({ lat: latitude, lng: longitude });
//       }
      
//       incidents.forEach(incident => {
//         bounds.extend({
//           lat: incident.location.lat,
//           lng: incident.location.lng
//         });
//       });
      
//       map.fitBounds(bounds);
      
//       // After fitting bounds, re-apply 3D settings
//       setTimeout(() => {
//         if (is3DMode) {
//           map.setTilt(mapTilt);
//           map.setHeading(mapHeading);
//         }
//       }, 1500);
//     }
//   }, [incidents, latitude, longitude, mapTilt, mapHeading, is3DMode]);

//   // Handle map unmount
//   const onMapUnmount = useCallback(() => {
//     setMap(null);
//   }, []);

//   // 3D Control Functions
//   const toggle3DMode = useCallback(() => {
//     if (map) {
//       const newMode = !is3DMode;
//       setIs3DMode(newMode);
      
//       // Smooth transition to 3D/2D
//       if (newMode) {
//         // Enable 3D
//         map.setTilt(mapTilt);
//         map.setHeading(mapHeading);
//       } else {
//         // Disable 3D
//         map.setTilt(0);
//         map.setHeading(0);
//       }
//     }
//   }, [map, is3DMode, mapTilt, mapHeading]);

//   const adjustTilt = useCallback((newTilt: number) => {
//     if (map && is3DMode) {
//       setMapTilt(newTilt);
//       map.setTilt(newTilt);
//     }
//   }, [map, is3DMode]);

//   const adjustHeading = useCallback((newHeading: number) => {
//     if (map) {
//       setMapHeading(newHeading);
//       map.setHeading(newHeading);
//     }
//   }, [map]);

//   // Create enhanced 3D markers
//   const createMarkerIcon = useCallback((incident: Incident) => {
//     if (!isLoaded || !window.google) return undefined;
    
//     const style = INCIDENT_MARKER_STYLES[incident.type];
//     const isSelected = selectedIncident?.id === incident.id;
//     const isHovered = hoveredMarker === incident.id;
    
//     const size = isSelected ? 48 : isHovered ? 40 : 36;
//     const height = incident.severity === 'critical' ? 35 : 
//                    incident.severity === 'high' ? 30 : 
//                    incident.severity === 'medium' ? 25 : 20;

//     return {
//       url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
//         <svg width="${size}" height="${size + height}" viewBox="0 0 ${size} ${size + height}" xmlns="http://www.w3.org/2000/svg">
//           <defs>
//             <linearGradient id="grad${incident.id}" x1="0%" y1="0%" x2="100%" y2="100%">
//               <stop offset="0%" style="stop-color:${style.color};stop-opacity:1" />
//               <stop offset="50%" style="stop-color:${style.color};stop-opacity:0.8" />
//               <stop offset="100%" style="stop-color:${style.color};stop-opacity:0.6" />
//             </linearGradient>
//             <filter id="shadow${incident.id}" x="-50%" y="-50%" width="200%" height="200%">
//               <feDropShadow dx="3" dy="6" stdDeviation="4" flood-opacity="0.4"/>
//             </filter>
//             <filter id="glow${incident.id}">
//               <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
//               <feMerge> 
//                 <feMergeNode in="coloredBlur"/>
//                 <feMergeNode in="SourceGraphic"/>
//               </feMerge>
//             </filter>
//           </defs>
          
//           <!-- Base shadow -->
//           <ellipse cx="${size/2}" cy="${size + height - 5}" rx="${size/2 - 2}" ry="4" 
//                    fill="black" opacity="0.3"/>
          
//           <!-- 3D Cylinder Body -->
//           <rect x="${size/4}" y="${size/2}" width="${size/2}" height="${height}" 
//                 fill="url(#grad${incident.id})" filter="url(#shadow${incident.id})" rx="3"/>
          
//           <!-- 3D Top -->
//           <ellipse cx="${size/2}" cy="${size/2}" rx="${size/4}" ry="6" 
//                    fill="${style.color}" opacity="0.9"/>
          
//           <!-- Side highlight -->
//           <rect x="${size/4 + 2}" y="${size/2 + 2}" width="2" height="${height - 4}" 
//                 fill="white" opacity="0.4" rx="1"/>
          
//           <!-- Icon -->
//           <text x="${size/2}" y="${size/2 + height/2 + 4}" text-anchor="middle" 
//                 font-size="${size/3}" fill="white" font-weight="bold">${style.icon}</text>
          
//           <!-- Severity glow for critical incidents -->
//           ${incident.severity === 'critical' ? `
//             <circle cx="${size/2}" cy="${size/2}" r="${size/3}" 
//                     fill="${style.color}" opacity="0.3" filter="url(#glow${incident.id})">
//               <animate attributeName="opacity" values="0.3;0.6;0.3" dur="1.5s" repeatCount="indefinite"/>
//             </circle>
//           ` : ''}
          
//           <!-- Selection ring -->
//           ${isSelected ? `
//             <circle cx="${size/2}" cy="${size/2 + height/2}" r="${size/2 + 3}" 
//                     fill="none" stroke="#ffffff" stroke-width="3" opacity="0.8">
//               <animate attributeName="stroke-width" values="3;5;3" dur="1s" repeatCount="indefinite"/>
//             </circle>
//           ` : ''}
//         </svg>
//       `)}`,
//       scaledSize: new window.google.maps.Size(size, size + height),
//       anchor: new window.google.maps.Point(size/2, size + height - 5)
//     };
//   }, [isLoaded, selectedIncident, hoveredMarker]);

//   // User location icon with 3D effect
//   const userLocationIcon = useMemo(() => {
//     if (!isLoaded || !window.google) return undefined;
    
//     return {
//       url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
//         <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
//           <defs>
//             <radialGradient id="userGrad" cx="50%" cy="30%" r="70%">
//               <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
//               <stop offset="50%" style="stop-color:#3b82f6;stop-opacity:1" />
//               <stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />
//             </radialGradient>
//             <filter id="userShadow">
//               <feDropShadow dx="2" dy="4" stdDeviation="3" flood-opacity="0.4"/>
//             </filter>
//           </defs>
          
//           <!-- Outer pulse ring -->
//           <circle cx="16" cy="16" r="14" fill="#3b82f6" opacity="0.2" filter="url(#userShadow)">
//             <animate attributeName="r" values="14;18;14" dur="2s" repeatCount="indefinite"/>
//             <animate attributeName="opacity" values="0.2;0;0.2" dur="2s" repeatCount="indefinite"/>
//           </circle>
          
//           <!-- Main location dot -->
//           <circle cx="16" cy="16" r="8" fill="url(#userGrad)" filter="url(#userShadow)"/>
          
//           <!-- Inner white dot -->
//           <circle cx="16" cy="16" r="4" fill="white"/>
          
//           <!-- Center dot -->
//           <circle cx="16" cy="16" r="2" fill="#3b82f6"/>
//         </svg>
//       `)}`,
//       scaledSize: new window.google.maps.Size(32, 32),
//       anchor: new window.google.maps.Point(16, 16)
//     };
//   }, [isLoaded]);

//   // Handle marker interactions
//   const handleMarkerClick = (incidentId: string) => {
//     setSelectedMarker(incidentId);
//     onIncidentClick(incidentId);
//   };

//   const handleInfoWindowClose = () => {
//     setSelectedMarker(null);
//   };

//   const formatTimeAgo = (dateString: string) => {
//     const now = new Date();
//     const created = new Date(dateString);
//     const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    
//     if (diffInMinutes < 1) return 'Just now';
//     if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
//     if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
//     return `${Math.floor(diffInMinutes / 1440)}d ago`;
//   };

//   // Loading state
//   if (!isLoaded || locationLoading) {
//     return (
//       <motion.div 
//         className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center"
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//       >
//         <div className="text-center">
//           <motion.div 
//             className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
//             animate={{ rotate: 360 }}
//             transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
//           />
//           <motion.p 
//             className="text-gray-700 font-medium text-lg"
//             initial={{ y: 10, opacity: 0 }}
//             animate={{ y: 0, opacity: 1 }}
//             transition={{ delay: 0.2 }}
//           >
//             {!isLoaded ? 'Loading 3D City Map...' : 'Getting your location...'}
//           </motion.p>
//           <motion.p 
//             className="text-gray-500 text-sm mt-2"
//             initial={{ y: 10, opacity: 0 }}
//             animate={{ y: 0, opacity: 1 }}
//             transition={{ delay: 0.4 }}
//           >
//             Preparing immersive 3D experience
//           </motion.p>
//         </div>
//       </motion.div>
//     );
//   }

//   // Error state
//   if (loadError) {
//     return (
//       <div className="w-full h-full bg-red-50 flex items-center justify-center">
//         <div className="text-center p-6">
//           <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
//           <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to Load 3D Map</h3>
//           <p className="text-red-600 mb-4">
//             Unable to load Google Maps 3D view. Please check your connection.
//           </p>
//           <button
//             onClick={() => window.location.reload()}
//             className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
//           >
//             Retry
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="relative w-full h-full">
//       <GoogleMap
//         mapContainerStyle={{ width: '100%', height: '100%' }}
//         center={mapCenter}
//         zoom={GOOGLE_MAPS_3D_CONFIG.defaultZoom}
//         options={mapOptions}
//         onLoad={onMapLoad}
//         onUnmount={onMapUnmount}
//       >
//         {/* User Location Marker */}
//         {latitude && longitude && userLocationIcon && (
//           <motion.div
//             initial={{ scale: 0 }}
//             animate={{ scale: 1 }}
//             transition={{ type: "spring", stiffness: 300, damping: 25 }}
//           >
//             <Marker
//               position={{ lat: latitude, lng: longitude }}
//               icon={userLocationIcon}
//               title="Your Location"
//               zIndex={1000}
//             />
//           </motion.div>
//         )}

//         {/* 3D Incident Markers */}
//         <AnimatePresence>
//           {incidents.map((incident, index) => {
//             const markerIcon = createMarkerIcon(incident);
            
//             return (
//               <motion.div
//                 key={incident.id}
//                 initial={{ scale: 0, y: -100, rotateX: 90 }}
//                 animate={{ scale: 1, y: 0, rotateX: 0 }}
//                 exit={{ scale: 0, y: -100, rotateX: 90 }}
//                 transition={{ 
//                   delay: index * 0.1,
//                   type: "spring", 
//                   stiffness: 200,
//                   damping: 20
//                 }}
//               >
//                 <Marker
//                   position={{
//                     lat: incident.location.lat,
//                     lng: incident.location.lng
//                   }}
//                   icon={markerIcon}
//                   title={incident.title}
//                   onClick={() => handleMarkerClick(incident.id)}
//                   onMouseOver={() => setHoveredMarker(incident.id)}
//                   onMouseOut={() => setHoveredMarker(null)}
//                   zIndex={selectedIncident?.id === incident.id ? 999 : 1}
//                 />
//               </motion.div>
//             );
//           })}
//         </AnimatePresence>

//         {/* Info Window */}
//         {selectedMarker && incidents.find(i => i.id === selectedMarker) && (
//           <InfoWindow
//             position={{
//               lat: incidents.find(i => i.id === selectedMarker)!.location.lat,
//               lng: incidents.find(i => i.id === selectedMarker)!.location.lng
//             }}
//             onCloseClick={handleInfoWindowClose}
//           >
//             <motion.div 
//               className="p-3 max-w-xs"
//               initial={{ opacity: 0, scale: 0.8 }}
//               animate={{ opacity: 1, scale: 1 }}
//               transition={{ duration: 0.3 }}
//             >
//               {(() => {
//                 const incident = incidents.find(i => i.id === selectedMarker)!;
//                 return (
//                   <>
//                     <h3 className="font-semibold text-gray-900 mb-2">{incident.title}</h3>
//                     <p className="text-sm text-gray-600 mb-3">{incident.description}</p>
//                     <div className="flex items-center justify-between text-xs text-gray-500">
//                       <span className={`px-2 py-1 rounded-full text-xs font-medium ${
//                         incident.severity === 'critical' ? 'bg-red-100 text-red-800' :
//                         incident.severity === 'high' ? 'bg-orange-100 text-orange-800' :
//                         incident.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
//                         'bg-green-100 text-green-800'
//                       }`}>
//                         {incident.severity}
//                       </span>
//                       <span>{formatTimeAgo(incident.created_at)}</span>
//                     </div>
//                   </>
//                 );
//               })()}
//             </motion.div>
//           </InfoWindow>
//         )}
//       </GoogleMap>

//       {/* 3D Control Panel */}
//       <motion.div 
//         className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-gray-200"
//         initial={{ opacity: 0, x: 20 }}
//         animate={{ opacity: 1, x: 0 }}
//         transition={{ delay: 0.5 }}
//       >
//         <div className="flex flex-col gap-3">
//           {/* 3D Toggle */}
//           <motion.button
//             onClick={toggle3DMode}
//             className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
//               is3DMode 
//                 ? 'bg-blue-500 text-white shadow-md' 
//                 : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//             }`}
//             whileHover={{ scale: 1.05 }}
//             whileTap={{ scale: 0.95 }}
//           >
//             <Mountain className="w-4 h-4" />
//             {is3DMode ? '3D ON' : '3D OFF'}
//           </motion.button>

//           {/* Tilt Control */}
//           {is3DMode && (
//             <motion.div 
//               className="flex flex-col gap-1"
//               initial={{ opacity: 0, height: 0 }}
//               animate={{ opacity: 1, height: 'auto' }}
//               transition={{ duration: 0.3 }}
//             >
//               <label className="text-xs text-gray-600 font-medium">Tilt</label>
//               <input
//                 type="range"
//                 min="0"
//                 max="75"
//                 value={mapTilt}
//                 onChange={(e) => adjustTilt(Number(e.target.value))}
//                 className="w-20 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
//               />
//             </motion.div>
//           )}

//           {/* Rotation Control */}
//           <motion.div className="flex flex-col gap-1">
//             <label className="text-xs text-gray-600 font-medium">Rotate</label>
//             <div className="flex gap-1">
//               <motion.button
//                 onClick={() => adjustHeading(mapHeading - 45)}
//                 className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center text-xs"
//                 whileHover={{ scale: 1.1 }}
//                 whileTap={{ scale: 0.9 }}
//               >
//                 ↶
//               </motion.button>
//               <motion.button
//                 onClick={() => adjustHeading(mapHeading + 45)}
//                 className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center text-xs"
//                 whileHover={{ scale: 1.1 }}
//                 whileTap={{ scale: 0.9 }}
//               >
//                 ↷
//               </motion.button>
//             </div>
//           </motion.div>
//         </div>
//       </motion.div>

//       {/* Enhanced overlays */}
//       <AnimatePresence>
//         {permissionStatus === 'denied' && (
//           <motion.div 
//             className="absolute top-4 left-4 right-20 bg-yellow-50/95 backdrop-blur-sm border border-yellow-200 rounded-xl p-4"
//             initial={{ opacity: 0, y: -20 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: -20 }}
//           >
//             <div className="flex items-center gap-3">
//               <MapPin className="w-5 h-5 text-yellow-600" />
//               <div className="flex-1">
//                 <p className="text-sm text-yellow-800 font-medium">
//                   Location access denied
//                 </p>
//                 <p className="text-xs text-yellow-700 mt-1">
//                   Enable location for better 3D experience
//                 </p>
//               </div>
//               <motion.button
//                 onClick={requestLocation}
//                 className="text-yellow-600 hover:text-yellow-700 text-sm font-medium"
//                 whileHover={{ scale: 1.05 }}
//                 whileTap={{ scale: 0.95 }}
//               >
//                 Enable
//               </motion.button>
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* Loading overlay */}
//       <AnimatePresence>
//         {isLoading && (
//           <motion.div 
//             className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg"
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: 20 }}
//           >
//             <div className="flex items-center gap-3">
//               <motion.div 
//                 className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"
//                 animate={{ rotate: 360 }}
//                 transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
//               />
//               <span className="text-sm text-gray-700 font-medium">Loading 3D incidents...</span>
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* Enhanced info panel */}
//       <motion.div 
//         className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-200"
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ delay: 0.8 }}
//       >
//         <div className="text-sm font-semibold text-gray-900 mb-2">
//           🏙️ 3D City View
//         </div>
//         <div className="text-xs text-gray-600 space-y-1">
//           <div>📍 {incidents.length} Active Incidents</div>
//           <div>🎮 Use controls to navigate 3D view</div>
//           <div>🖱️ Click markers for details</div>
//           {latitude && longitude && (
//             <div className="text-green-600 font-medium">
//               📡 Live location: {latitude.toFixed(4)}, {longitude.toFixed(4)}
//             </div>
//           )}
//         </div>
//       </motion.div>
//     </div>
//   );
// }
// components/GoogleMapView.tsx - Enhanced with Zomato-style animations
