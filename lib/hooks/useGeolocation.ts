// lib/hooks/useGeolocation.ts - Pure Live Location Tracking
'use client'

import { useState, useEffect, useRef } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  heading: number | null; // Compass direction
  speed: number | null; // Movement speed
  altitude: number | null;
  error: string | null;
  loading: boolean;
  permissionStatus: 'granted' | 'denied' | 'prompt' | 'unknown';
  isTracking: boolean;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  enableTracking?: boolean; // Continuous tracking like Google Maps
  trackingInterval?: number; // How often to update position
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    heading: null,
    speed: null,
    altitude: null,
    error: null,
    loading: true,
    permissionStatus: 'unknown',
    isTracking: false
  });

  const {
    enableHighAccuracy = true,
    timeout = 10000, // Reduced timeout for faster response
    maximumAge = 30000, // 30 seconds max age for cached position
    enableTracking = true, // Enable continuous tracking by default
    trackingInterval = 5000 // Update every 5 seconds when tracking
  } = options;

  const watchIdRef = useRef<number | undefined>();
  const trackingIntervalRef = useRef<NodeJS.Timeout | undefined>();
  const lastUpdateRef = useRef<number>(0);

  const updateLocation = (position: GeolocationPosition) => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;
    
    // Prevent too frequent updates (minimum 1 second apart)
    if (timeSinceLastUpdate < 1000 && lastUpdateRef.current > 0) {
      return;
    }
    
    lastUpdateRef.current = now;

    console.log('📍 Live location update:', {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      heading: position.coords.heading,
      speed: position.coords.speed,
      timestamp: new Date(position.timestamp).toLocaleTimeString()
    });

    setState(prev => ({
      ...prev,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      heading: position.coords.heading,
      speed: position.coords.speed,
      altitude: position.coords.altitude,
      error: null,
      loading: false,
      permissionStatus: 'granted',
      isTracking: true
    }));
  };

  const handleError = (error: GeolocationPositionError) => {
    let errorMessage = 'Unknown location error';
    let permissionStatus: GeolocationState['permissionStatus'] = 'unknown';

    console.error('❌ Geolocation error:', error);

    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location access denied - please enable location permissions';
        permissionStatus = 'denied';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information unavailable - check GPS/network';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timeout - trying again...';
        // Don't change permission status for timeouts
        permissionStatus = state.permissionStatus;
        break;
    }

    setState(prev => ({
      ...prev,
      error: errorMessage,
      loading: false,
      permissionStatus,
      isTracking: false
    }));

    // For timeouts, automatically retry after a short delay
    if (error.code === error.TIMEOUT) {
      setTimeout(() => {
        if (navigator.geolocation) {
          console.log('🔄 Retrying location request after timeout...');
          startLocationTracking();
        }
      }, 2000);
    }
  };

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      console.error('❌ Geolocation not supported in this browser');
      setState(prev => ({
        ...prev,
        error: 'Geolocation not supported in this browser',
        loading: false,
        permissionStatus: 'denied',
        isTracking: false
      }));
      return;
    }

    // Clear any existing watch
    if (watchIdRef.current !== undefined) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    const geoOptions: PositionOptions = {
      enableHighAccuracy, // Use GPS for highest accuracy
      timeout,
      maximumAge
    };

    console.log('🎯 Starting live location tracking with options:', geoOptions);

    if (enableTracking) {
      // Continuous tracking with watchPosition (like Google Maps)
      watchIdRef.current = navigator.geolocation.watchPosition(
        updateLocation,
        handleError,
        geoOptions
      );
      console.log('🔄 Started continuous location tracking');
    } else {
      // Single position request
      navigator.geolocation.getCurrentPosition(
        updateLocation,
        handleError,
        geoOptions
      );
      console.log('📍 Requested single location');
    }
  };

  const stopLocationTracking = () => {
    if (watchIdRef.current !== undefined) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = undefined;
    }
    
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = undefined;
    }

    setState(prev => ({
      ...prev,
      isTracking: false
    }));

    console.log('⏹️ Stopped location tracking');
  };

  const requestLocation = () => {
    console.log('🔄 Manual location request triggered');
    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null 
    }));
    
    startLocationTracking();
  };

  // Check permission status
  useEffect(() => {
    const checkPermissionStatus = async () => {
      try {
        if ('permissions' in navigator) {
          const permission = await navigator.permissions.query({ name: 'geolocation' });
          console.log('🔐 Location permission status:', permission.state);
          
          setState(prev => ({ 
            ...prev, 
            permissionStatus: permission.state as any 
          }));

          // Listen for permission changes
          permission.addEventListener('change', () => {
            console.log('🔄 Permission changed to:', permission.state);
            setState(prev => ({ 
              ...prev, 
              permissionStatus: permission.state as any 
            }));

            // If permission granted, start tracking
            if (permission.state === 'granted') {
              startLocationTracking();
            } else if (permission.state === 'denied') {
              stopLocationTracking();
            }
          });
        }
      } catch (e) {
        console.warn('⚠️ Permissions API not supported');
      }
    };

    checkPermissionStatus();
  }, []);

  // Initialize location tracking
  useEffect(() => {
    startLocationTracking();

    // Cleanup on unmount
    return () => {
      stopLocationTracking();
    };
  }, [enableHighAccuracy, timeout, maximumAge, enableTracking]);

  // Optional: Enhanced tracking interval for better responsiveness
  useEffect(() => {
    if (enableTracking && state.permissionStatus === 'granted') {
      trackingIntervalRef.current = setInterval(() => {
        // Only refresh if we haven't had an update recently
        const timeSinceLastUpdate = Date.now() - lastUpdateRef.current;
        if (timeSinceLastUpdate > trackingInterval) {
          console.log('🔄 Periodic location refresh...');
          navigator.geolocation.getCurrentPosition(
            updateLocation,
            (error) => {
              // Don't show errors for periodic updates unless it's permission denied
              if (error.code === error.PERMISSION_DENIED) {
                handleError(error);
              }
            },
            {
              enableHighAccuracy,
              timeout: 5000, // Shorter timeout for periodic updates
              maximumAge: 0 // Force fresh location
            }
          );
        }
      }, trackingInterval);

      return () => {
        if (trackingIntervalRef.current) {
          clearInterval(trackingIntervalRef.current);
        }
      };
    }
  }, [enableTracking, state.permissionStatus, trackingInterval, enableHighAccuracy]);

  return {
    ...state,
    requestLocation,
    stopTracking: stopLocationTracking,
    startTracking: startLocationTracking,
    isSupported: 'geolocation' in navigator
  };
}