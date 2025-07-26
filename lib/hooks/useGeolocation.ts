// lib/hooks/useGeolocation.ts - Enhanced for better location detection
'use client'

import { useState, useEffect } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
  permissionStatus: 'granted' | 'denied' | 'prompt' | 'unknown';
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watch?: boolean;
  enableFallback?: boolean;
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: true,
    permissionStatus: 'unknown'
  });

  const {
    enableHighAccuracy = true,
    timeout = 15000, // Increased timeout
    maximumAge = 60000,
    watch = false,
    enableFallback = true
  } = options;

  useEffect(() => {
    let watchId: number | undefined;
    let timeoutId: NodeJS.Timeout;

    const updateLocation = (position: GeolocationPosition) => {
      console.log('📍 Location obtained:', {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy
      });

      setState({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        error: null,
        loading: false,
        permissionStatus: 'granted'
      });
    };

    const handleError = (error: GeolocationPositionError) => {
      let errorMessage = 'Unknown error';
      let permissionStatus: GeolocationState['permissionStatus'] = 'unknown';

      console.error('❌ Geolocation error:', error);

      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Location access denied by user';
          permissionStatus = 'denied';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location information unavailable';
          break;
        case error.TIMEOUT:
          errorMessage = 'Location request timeout';
          break;
      }

      // If geolocation fails and fallback is enabled, use IP-based location
      if (enableFallback && error.code !== error.PERMISSION_DENIED) {
        console.log('🔄 Trying IP-based location fallback...');
        tryIPLocation();
      } else {
        setState(prev => ({
          ...prev,
          error: errorMessage,
          loading: false,
          permissionStatus
        }));
      }
    };

    const tryIPLocation = async () => {
      try {
        console.log('🌐 Attempting IP-based location...');
        
        // Try multiple IP location services
        const services = [
          'https://ipapi.co/json/',
          'https://ip-api.com/json/',
          'https://ipinfo.io/json'
        ];

        for (const service of services) {
          try {
            const response = await fetch(service);
            const data = await response.json();
            
            let lat, lng;
            
            // Handle different API response formats
            if (data.latitude && data.longitude) {
              lat = data.latitude;
              lng = data.longitude;
            } else if (data.lat && data.lon) {
              lat = data.lat;
              lng = data.lon;
            } else if (data.loc) {
              [lat, lng] = data.loc.split(',').map(Number);
            }

            if (lat && lng) {
              console.log(`✅ IP location from ${service}:`, { lat, lng });
              setState({
                latitude: lat,
                longitude: lng,
                accuracy: 10000, // IP accuracy is low
                error: null,
                loading: false,
                permissionStatus: 'granted'
              });
              return;
            }
          } catch (err) {
            console.warn(`⚠️ IP service ${service} failed:`, err);
            continue;
          }
        }
        
        // If all IP services fail, use Bengaluru as final fallback
        throw new Error('All IP location services failed');
        
      } catch (err) {
        console.log('🏙️ Using Bengaluru fallback location');
        setState({
          latitude: 12.9716, // Bengaluru center
          longitude: 77.5946,
          accuracy: 50000,
          error: 'Using approximate location (Bengaluru)',
          loading: false,
          permissionStatus: 'granted'
        });
      }
    };

    const checkPermissionAndGetLocation = async () => {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        console.error('❌ Geolocation not supported');
        if (enableFallback) {
          tryIPLocation();
        } else {
          setState(prev => ({
            ...prev,
            error: 'Geolocation not supported',
            loading: false,
            permissionStatus: 'denied'
          }));
        }
        return;
      }

      // Check permission status if available
      try {
        if ('permissions' in navigator) {
          const permission = await navigator.permissions.query({ name: 'geolocation' });
          console.log('🔐 Permission status:', permission.state);
          
          setState(prev => ({ 
            ...prev, 
            permissionStatus: permission.state as any 
          }));

          permission.addEventListener('change', () => {
            console.log('🔄 Permission changed to:', permission.state);
            setState(prev => ({ 
              ...prev, 
              permissionStatus: permission.state as any 
            }));
          });
        }
      } catch (e) {
        console.warn('⚠️ Permissions API not supported');
      }

      // Set timeout for geolocation
      timeoutId = setTimeout(() => {
        console.log('⏰ Geolocation timeout, trying fallback...');
        if (enableFallback) {
          tryIPLocation();
        }
      }, timeout);

      const geoOptions: PositionOptions = {
        enableHighAccuracy,
        timeout,
        maximumAge
      };

      console.log('🎯 Requesting geolocation with options:', geoOptions);

      if (watch) {
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            clearTimeout(timeoutId);
            updateLocation(position);
          },
          handleError,
          geoOptions
        );
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            clearTimeout(timeoutId);
            updateLocation(position);
          },
          handleError,
          geoOptions
        );
      }
    };

    checkPermissionAndGetLocation();

    return () => {
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [enableHighAccuracy, timeout, maximumAge, watch, enableFallback]);

  const requestLocation = () => {
    console.log('🔄 Manual location request triggered');
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation not supported',
        loading: false,
        permissionStatus: 'denied'
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('✅ Manual location obtained:', {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          error: null,
          loading: false,
          permissionStatus: 'granted'
        });
      },
      (error) => {
        console.error('❌ Manual location error:', error);
        setState(prev => ({
          ...prev,
          error: error.message,
          loading: false,
          permissionStatus: 'denied'
        }));
      },
      { 
        enableHighAccuracy: true, 
        timeout: 10000, 
        maximumAge: 0 // Force fresh location
      }
    );
  };

  return {
    ...state,
    requestLocation,
    isSupported: 'geolocation' in navigator
  };
}