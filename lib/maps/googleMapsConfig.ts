// lib/maps/googleMapsConfig.ts
export const GOOGLE_MAPS_CONFIG = {
    libraries: ['places', 'geometry'] as const,
    mapId: 'urban-intelligence-map',
    defaultCenter: {
      lat: 12.9120, // HSR Layout, Bengaluru
      lng: 77.6365
    },
    defaultZoom: 13,
    options: {
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: true,
      scaleControl: true,
      streetViewControl: true,
      rotateControl: true,
      fullscreenControl: true,
      mapTypeId: 'roadmap' as google.maps.MapTypeId,
      gestureHandling: 'auto',
      clickableIcons: true,
      styles: [
        {
          featureType: 'poi.business',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'transit',
          elementType: 'labels.icon',
          stylers: [{ visibility: 'off' }]
        }
      ]
    }
  };
  
  export const INCIDENT_MARKER_STYLES = {
    traffic: { color: '#ea580c', icon: '🚗' },
    weather: { color: '#3b82f6', icon: '🌧️' },
    infrastructure: { color: '#dc2626', icon: '⚡' },
    events: { color: '#16a34a', icon: '🎉' },
    safety: { color: '#7c3aed', icon: '🚨' }
  };