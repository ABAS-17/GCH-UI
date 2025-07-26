// lib/hooks/useIncidents.ts - NO MOCK DATA, PURE BACKEND ONLY
'use client'

import { useState, useEffect, useCallback } from 'react';

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
}

export function useIncidents({
  latitude,
  longitude,
  radiusKm = 20,
  maxResults = 50,
  autoRefresh = true,
  refreshInterval = 30000
}: UseIncidentsOptions): UseIncidentsReturn {
  const [incidents, setIncidents] = useState<ProcessedIncident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

  // Map topics to types
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

  // PURE BACKEND FETCH - NO MOCK DATA FALLBACK
  const fetchIncidents = useCallback(async () => {
    if (!latitude || !longitude) {
      console.log('⏳ No location available');
      setIsLoading(false);
      setIncidents([]); // EMPTY ARRAY - NO MOCK DATA
      setTotalCount(0);
      setError('Location required to fetch incidents');
      return;
    }

    try {
      setError(null);
      setIsLoading(true);

      console.log(`🌐 Fetching PURE BACKEND DATA for: ${latitude}, ${longitude}`);

      // Method 1: Try /events/nearby
      let url = `${baseURL}/events/nearby?lat=${latitude}&lng=${longitude}&radius_km=${radiusKm}&max_results=${maxResults}`;
      console.log(`🔍 Backend URL: ${url}`);
      
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
      console.log('📦 Pure backend response:', data);

      // If nearby returns no events, try search endpoint
      if (!data.events || data.events.length === 0) {
        console.log('🔍 No events from nearby, trying search endpoint...');
        
        url = `${baseURL}/events/search?query=traffic weather infrastructure events safety incidents&lat=${latitude}&lng=${longitude}&max_results=${maxResults}`;
        console.log(`🔍 Search URL: ${url}`);
        
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
        console.log('📦 Search response:', data);

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

      // Process ONLY backend events
      if (data.success && data.events && data.events.length > 0) {
        const processed = data.events.map((event: any, index: number) => {
          const lat = event.location?.lat || event.metadata?.latitude;
          const lng = event.location?.lng || event.metadata?.longitude;
          
          // STRICT: Only process events with valid coordinates
          if (!lat || !lng) {
            console.warn(`⚠️ Skipping event ${event.event_id} - no valid coordinates`);
            return null;
          }
          
          return {
            id: event.event_id || `backend-event-${index}`,
            type: mapTopicToType(event.topic),
            title: event.document || event.title || `${event.topic} incident`,
            description: event.document || event.title || `${event.topic} incident from backend`,
            location: { lat, lng },
            severity: mapSeverity(event.severity),
            distance_km: event.distance_km || 0,
            created_at: event.created_at || new Date().toISOString(),
            affected_count: event.metadata?.affected_users || undefined,
            confidence_score: event.confidence_score || event.metadata?.confidence_score || 0.8,
            sub_topic: event.sub_topic || 'general'
          } as ProcessedIncident;
        }).filter(Boolean); // Remove null entries

        setIncidents(processed);
        setTotalCount(data.total_events || processed.length);
        setLastUpdated(new Date());
        
        console.log(`✅ PURE BACKEND: Loaded ${processed.length} incidents`);
      } else {
        // NO MOCK DATA - SHOW EMPTY STATE
        console.log('⚠️ Backend returned no events - showing empty state');
        setIncidents([]);
        setTotalCount(0);
        setLastUpdated(new Date());
        setError('No incidents found in your area. Try expanding the search radius.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Backend connection failed';
      console.error('❌ Backend fetch error:', errorMessage);
      setError(errorMessage);
      
      // NO MOCK DATA FALLBACK - SHOW ERROR STATE
      setIncidents([]);
      setTotalCount(0);
      setLastUpdated(new Date());
    } finally {
      setIsLoading(false);
    }
  }, [latitude, longitude, radiusKm, maxResults, mapTopicToType, mapSeverity, baseURL]);

  // Fetch by topic using search - PURE BACKEND ONLY
  const fetchByTopic = useCallback(async (topic: string) => {
    if (!latitude || !longitude) {
      setError('Location required for topic search');
      return;
    }

    try {
      setError(null);
      setIsLoading(true);

      const url = `${baseURL}/events/search?query=${topic}&lat=${latitude}&lng=${longitude}&max_results=${maxResults}`;
      console.log(`🎯 Backend topic search: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error(`Topic search error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`📦 Backend topic ${topic} response:`, data);

      if (data.success && data.results) {
        const processed = data.results.map((result: any) => ({
          id: result.event_id,
          type: mapTopicToType(result.topic),
          title: result.title,
          description: result.title,
          location: result.location,
          severity: mapSeverity(result.severity),
          distance_km: result.distance_km,
          created_at: result.created_at,
          affected_count: undefined,
          confidence_score: result.similarity_score,
          sub_topic: 'general'
        })).filter((item: any) => item.location?.lat && item.location?.lng);

        setIncidents(processed);
        setTotalCount(data.total_results);
        setLastUpdated(new Date());
        
        console.log(`✅ Backend topic search: ${processed.length} ${topic} incidents`);
      } else {
        setIncidents([]);
        setTotalCount(0);
        setError(`No ${topic} incidents found in backend`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Topic search failed';
      console.error(`❌ Backend topic search error:`, errorMessage);
      setError(errorMessage);
      setIncidents([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [latitude, longitude, maxResults, mapTopicToType, mapSeverity, baseURL]);

  const searchIncidents = useCallback(async (query: string) => {
    if (!latitude || !longitude) {
      setError('Location required for search');
      return;
    }

    try {
      setError(null);
      setIsLoading(true);

      const url = `${baseURL}/events/search?query=${encodeURIComponent(query)}&lat=${latitude}&lng=${longitude}&max_results=${maxResults}`;
      console.log(`🔍 Backend search: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error(`Search error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`📦 Backend search results:`, data);

      if (data.success && data.results) {
        const processed = data.results.map((result: any) => ({
          id: result.event_id,
          type: mapTopicToType(result.topic),
          title: result.title,
          description: result.title,
          location: result.location,
          severity: mapSeverity(result.severity),
          distance_km: result.distance_km,
          created_at: result.created_at,
          affected_count: undefined,
          confidence_score: result.similarity_score,
          sub_topic: 'general'
        })).filter((item: any) => item.location?.lat && item.location?.lng);

        setIncidents(processed);
        setTotalCount(data.total_results);
        setLastUpdated(new Date());
      } else {
        setIncidents([]);
        setTotalCount(0);
        setError('No search results found in backend');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      setIncidents([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [latitude, longitude, maxResults, mapTopicToType, mapSeverity, baseURL]);

  // Initial fetch
  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !latitude || !longitude) return;
    const interval = setInterval(fetchIncidents, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchIncidents, latitude, longitude]);

  return {
    incidents,
    isLoading,
    error,
    lastUpdated,
    totalCount,
    refetch: fetchIncidents,
    fetchByTopic,
    searchIncidents
  };
}