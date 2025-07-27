// lib/hooks/useIncidents.ts - Pure Live Location Based Incident Fetching
'use client'

import { useState, useEffect, useCallback, useRef } from 'react';

export interface ProcessedIncident {
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

interface UseIncidentsOptions {
  latitude: number | null;
  longitude: number | null;
  radiusKm?: number;
  maxResults?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableLiveUpdates?: boolean; // Follow user movement
}

interface UseIncidentsReturn {
  incidents: ProcessedIncident[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  totalCount: number;
  refetch: () => Promise<void>;
  fetchByTopic: (topic: string) => Promise<void>;
  searchIncidents: (query: string) => Promise<void>;
  isLiveTracking: boolean;
}

export function useIncidents({
  latitude,
  longitude,
  radiusKm = 15,
  maxResults = 100,
  autoRefresh = true,
  refreshInterval = 30000,
  enableLiveUpdates = true
}: UseIncidentsOptions): UseIncidentsReturn {
  const [incidents, setIncidents] = useState<ProcessedIncident[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [isLiveTracking, setIsLiveTracking] = useState(false);

  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  
  // Track last location to detect movement
  const lastLocationRef = useRef<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });
  const lastFetchRef = useRef<number>(0);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | undefined>();

  // Map backend topics to frontend types
  const mapTopicToType = useCallback((topic?: string): ProcessedIncident['type'] => {
    if (!topic) return 'traffic';
    const mapping: { [key: string]: ProcessedIncident['type'] } = {
      'traffic': 'traffic',
      'weather': 'weather', 
      'infrastructure': 'infrastructure',
      'events': 'events',
      'safety': 'safety'
    };
    return mapping[topic.toLowerCase()] || 'traffic';
  }, []);

  const mapSeverity = useCallback((severity?: string): ProcessedIncident['severity'] => {
    if (!severity) return 'medium';
    const mapping: { [key: string]: ProcessedIncident['severity'] } = {
      'low': 'low',
      'medium': 'medium',
      'high': 'high',
      'critical': 'critical'
    };
    return mapping[severity.toLowerCase()] || 'medium';
  }, []);

  // Calculate distance between two coordinates
  const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // Check if user has moved significantly (100m threshold)
  const hasUserMoved = useCallback((newLat: number, newLng: number): boolean => {
    if (!lastLocationRef.current.lat || !lastLocationRef.current.lng) {
      return true; // First location
    }
    
    const distance = calculateDistance(
      lastLocationRef.current.lat,
      lastLocationRef.current.lng,
      newLat,
      newLng
    );
    
    return distance > 0.1; // 100 meters
  }, [calculateDistance]);

  // PURE LIVE LOCATION BASED FETCHING
  const fetchIncidents = useCallback(async (forceRefresh = false) => {
    // STRICT: Require live coordinates - no fallbacks
    if (!latitude || !longitude) {
      console.log('⏳ No live location available - waiting for GPS...');
      setIsLoading(false);
      setIncidents([]);
      setTotalCount(0);
      setError('Waiting for live location from GPS...');
      setIsLiveTracking(false);
      return;
    }

    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchRef.current;

    // Prevent too frequent API calls (minimum 5 seconds apart unless forced)
    if (!forceRefresh && timeSinceLastFetch < 5000) {
      console.log('🚫 API call throttled - too recent');
      return;
    }

    // Check if user has moved significantly
    if (enableLiveUpdates && !forceRefresh && !hasUserMoved(latitude, longitude)) {
      console.log('📍 User hasn\'t moved significantly - skipping fetch');
      return;
    }

    try {
      setError(null);
      setIsLoading(true);
      setIsLiveTracking(true);
      lastFetchRef.current = now;

      console.log(`🌐 Fetching incidents for live location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);

      // Update last known location
      lastLocationRef.current = { lat: latitude, lng: longitude };

      // Primary: Try /events/nearby with live coordinates
      let url = `${baseURL}/events/nearby?lat=${latitude}&lng=${longitude}&radius_km=${radiusKm}&max_results=${maxResults}`;
      console.log(`🔍 Live location API call: ${url}`);
      
      let response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
      }

      let data = await response.json();
      console.log('📦 Live location backend response:', data);

      // If nearby returns no events, try search endpoint with live coordinates
      if (!data.events || data.events.length === 0) {
        console.log('🔍 No events from nearby, trying search with live location...');
        
        url = `${baseURL}/events/search?query=incidents alerts emergency traffic weather infrastructure&lat=${latitude}&lng=${longitude}&max_results=${maxResults}`;
        
        response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          mode: 'cors',
        });

        if (!response.ok) {
          throw new Error(`Search API error: ${response.status} ${response.statusText}`);
        }

        data = await response.json();
        console.log('📦 Live location search response:', data);

        // Convert search results to nearby format
        if (data.success && data.results) {
          data = {
            success: true,
            events: data.results.map((result: any) => ({
              event_id: result.event_id,
              topic: result.topic,
              severity: result.severity,
              distance_km: result.distance_km,
              confidence_score: result.similarity_score,
              created_at: result.created_at,
              location: result.location,
              document: result.title
            })),
            total_events: data.total_results,
            center_location: { lat: latitude, lng: longitude },
            radius_km: radiusKm
          };
        }
      }

      // Process ONLY valid backend events with strict validation
      if (data.success && data.events && Array.isArray(data.events)) {
        const processed = data.events
          .map((event: any, index: number) => {
            const lat = event.location?.lat || event.metadata?.latitude;
            const lng = event.location?.lng || event.metadata?.longitude;
            
            // STRICT: Skip events without valid coordinates
            if (typeof lat !== 'number' || typeof lng !== 'number') {
              console.warn(`⚠️ Skipping event ${event.event_id} - invalid coordinates`);
              return null;
            }
            
            // STRICT: Skip events without essential data
            if (!event.event_id) {
              console.warn(`⚠️ Skipping event - missing ID`);
              return null;
            }

            // Calculate actual distance from user's live location
            const actualDistance = calculateDistance(latitude, longitude, lat, lng);
            
            return {
              id: event.event_id,
              type: mapTopicToType(event.topic),
              title: event.document || event.title || `${event.topic} incident`,
              description: event.document || event.title || `${event.topic} incident`,
              location: { lat, lng },
              severity: mapSeverity(event.severity),
              distance_km: actualDistance, // Use calculated distance from live location
              created_at: event.created_at || new Date().toISOString(),
              affected_count: event.metadata?.affected_users || undefined,
              confidence_score: event.confidence_score || event.metadata?.confidence_score || 0.8,
              sub_topic: event.sub_topic || 'general'
            } as ProcessedIncident;
          })
          .filter(Boolean) // Remove null entries
          .sort((a, b) => a.distance_km - b.distance_km); // Sort by distance from live location

        setIncidents(processed);
        setTotalCount(data.total_events || processed.length);
        setLastUpdated(new Date());
        
        console.log(`✅ Live location: Loaded ${processed.length} incidents within ${radiusKm}km`);
      } else {
        // No incidents found at live location
        console.log('⚠️ No incidents found at current live location');
        setIncidents([]);
        setTotalCount(0);
        setLastUpdated(new Date());
        setError(`No incidents found within ${radiusKm}km of your current location`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Backend connection failed';
      console.error('❌ Live location fetch error:', errorMessage);
      setError(errorMessage);
      
      // Don't clear incidents on error - keep showing last known data
      setLastUpdated(new Date());
    } finally {
      setIsLoading(false);
    }
  }, [latitude, longitude, radiusKm, maxResults, mapTopicToType, mapSeverity, baseURL, enableLiveUpdates, hasUserMoved, calculateDistance]);

  // Fetch by specific topic with live location
  const fetchByTopic = useCallback(async (topic: string) => {
    if (!latitude || !longitude) {
      setError('Live location required for topic search');
      return;
    }

    try {
      setError(null);
      setIsLoading(true);

      const url = `${baseURL}/events/search?query=${encodeURIComponent(topic)}&lat=${latitude}&lng=${longitude}&max_results=${maxResults}`;
      console.log(`🎯 Live location topic search: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error(`Topic search error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`📦 Live location topic ${topic} results:`, data);

      if (data.success && data.results && Array.isArray(data.results)) {
        const processed = data.results
          .map((result: any) => {
            const lat = result.location?.lat;
            const lng = result.location?.lng;
            
            if (typeof lat !== 'number' || typeof lng !== 'number') {
              return null;
            }

            // Calculate distance from live location
            const distance = calculateDistance(latitude, longitude, lat, lng);
            
            return {
              id: result.event_id,
              type: mapTopicToType(result.topic),
              title: result.title,
              description: result.title,
              location: { lat, lng },
              severity: mapSeverity(result.severity),
              distance_km: distance,
              created_at: result.created_at,
              affected_count: undefined,
              confidence_score: result.similarity_score || 0.8,
              sub_topic: 'general'
            } as ProcessedIncident;
          })
          .filter(Boolean)
          .sort((a, b) => a.distance_km - b.distance_km);

        setIncidents(processed);
        setTotalCount(data.total_results);
        setLastUpdated(new Date());
        
        console.log(`✅ Live location topic search: ${processed.length} ${topic} incidents`);
      } else {
        setIncidents([]);
        setTotalCount(0);
        setError(`No ${topic} incidents found near your current location`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Topic search failed';
      console.error(`❌ Live location topic search error:`, errorMessage);
      setError(errorMessage);
      setIncidents([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [latitude, longitude, maxResults, mapTopicToType, mapSeverity, baseURL, calculateDistance]);

  // Search incidents by query with live location
  const searchIncidents = useCallback(async (query: string) => {
    if (!latitude || !longitude) {
      setError('Live location required for search');
      return;
    }

    try {
      setError(null);
      setIsLoading(true);

      const url = `${baseURL}/events/search?query=${encodeURIComponent(query)}&lat=${latitude}&lng=${longitude}&max_results=${maxResults}`;
      console.log(`🔍 Live location search: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error(`Search error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`📦 Live location search results:`, data);

      if (data.success && data.results && Array.isArray(data.results)) {
        const processed = data.results
          .map((result: any) => {
            const lat = result.location?.lat;
            const lng = result.location?.lng;
            
            if (typeof lat !== 'number' || typeof lng !== 'number') {
              return null;
            }

            const distance = calculateDistance(latitude, longitude, lat, lng);
            
            return {
              id: result.event_id,
              type: mapTopicToType(result.topic),
              title: result.title,
              description: result.title,
              location: { lat, lng },
              severity: mapSeverity(result.severity),
              distance_km: distance,
              created_at: result.created_at,
              affected_count: undefined,
              confidence_score: result.similarity_score || 0.8,
              sub_topic: 'general'
            } as ProcessedIncident;
          })
          .filter(Boolean)
          .sort((a, b) => a.distance_km - b.distance_km);

        setIncidents(processed);
        setTotalCount(data.total_results);
        setLastUpdated(new Date());
      } else {
        setIncidents([]);
        setTotalCount(0);
        setError('No search results found near your current location');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      setIncidents([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [latitude, longitude, maxResults, mapTopicToType, mapSeverity, baseURL, calculateDistance]);

  // Live location change detection - fetch when user moves
  useEffect(() => {
    if (latitude && longitude && enableLiveUpdates) {
      console.log(`📍 Live location updated: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      fetchIncidents();
    } else if (!latitude || !longitude) {
      // Clear data when location is lost
      setIncidents([]);
      setTotalCount(0);
      setError('Waiting for live GPS location...');
      setIsLiveTracking(false);
    }
  }, [latitude, longitude, enableLiveUpdates, fetchIncidents]);

  // Auto-refresh timer - ONLY if we have live location
  useEffect(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    if (autoRefresh && latitude && longitude) {
      refreshTimeoutRef.current = setTimeout(() => {
        console.log('🔄 Auto-refreshing incidents for live location...');
        fetchIncidents(true); // Force refresh
      }, refreshInterval);
    }

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, latitude, longitude, fetchIncidents]);

  return {
    incidents,
    isLoading,
    error,
    lastUpdated,
    totalCount,
    refetch: () => fetchIncidents(true),
    fetchByTopic,
    searchIncidents,
    isLiveTracking
  };
}