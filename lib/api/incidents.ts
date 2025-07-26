// lib/api/incidents.ts - PURE BACKEND API, NO MOCK RESPONSES
export interface BackendEventMetadata {
    topic?: string;
    severity?: string;
    created_at?: string;
    latitude?: number;
    longitude?: number;
    affected_users?: number;
    confidence_score?: number;
  }
  
  export interface BackendEvent {
    event_id: string;
    topic?: string;
    severity?: string;
    distance_km?: number;
    confidence_score?: number;
    created_at?: string;
    location?: {
      lat: number;
      lng: number;
    };
    metadata?: BackendEventMetadata;
    document?: string;
    title?: string;
  }
  
  export interface NearbyEventsResponse {
    success: boolean;
    center_location: {
      lat: number;
      lng: number;
    };
    radius_km: number;
    total_events: number;
    events: BackendEvent[];
  }
  
  export interface SearchEventsResponse {
    success: boolean;
    query: string;
    total_results: number;
    results: Array<{
      event_id: string;
      title: string;
      similarity_score: number;
      topic: string;
      severity: string;
      location: {
        lat: number;
        lng: number;
      };
      distance_km: number;
      created_at: string;
    }>;
  }
  
  export interface CreateEventRequest {
    topic: string;
    sub_topic: string;
    title: string;
    description: string;
    location: {
      lat: number;
      lng: number;
    };
    address?: string;
    severity: string;
    media_urls?: string[];
  }
  
  export interface CreateEventResponse {
    success: boolean;
    event_id: string;
    message: string;
    event: {
      id: string;
      title: string;
      topic: string;
      severity: string;
      location: {
        lat: number;
        lng: number;
        address: string;
      };
      created_at: string;
    };
  }
  
  class IncidentsAPI {
    private baseURL: string;
  
    constructor() {
      this.baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
    }
  
    async getNearbyIncidents(
      lat: number,
      lng: number,
      radiusKm: number = 20,
      maxResults: number = 50
    ): Promise<NearbyEventsResponse> {
      const url = `${this.baseURL}/events/nearby?lat=${lat}&lng=${lng}&radius_km=${radiusKm}&max_results=${maxResults}`;
      
      console.log(`🔍 PURE BACKEND API CALL: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ BACKEND ERROR: ${response.status} - ${errorText}`);
        throw new Error(`Backend API Error: ${response.status} - ${response.statusText}`);
      }
  
      const data: NearbyEventsResponse = await response.json();
      console.log(`✅ PURE BACKEND RESPONSE:`, data);
      
      return data;
    }
  
    async searchIncidents(
      query: string,
      lat: number,
      lng: number,
      maxResults: number = 20
    ): Promise<SearchEventsResponse> {
      const url = `${this.baseURL}/events/search?query=${encodeURIComponent(query)}&lat=${lat}&lng=${lng}&max_results=${maxResults}`;
      
      console.log(`🔍 BACKEND SEARCH: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
      });
  
      if (!response.ok) {
        throw new Error(`Search API Error: ${response.status} - ${response.statusText}`);
      }
  
      const data: SearchEventsResponse = await response.json();
      console.log(`✅ BACKEND SEARCH RESULTS:`, data);
      
      return data;
    }
  
    async createIncident(incident: CreateEventRequest): Promise<CreateEventResponse> {
      console.log(`🆕 CREATING BACKEND INCIDENT:`, incident);
      
      const response = await fetch(`${this.baseURL}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify(incident),
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Create API Error: ${response.status} - ${errorText}`);
      }
  
      const data = await response.json();
      console.log(`✅ BACKEND INCIDENT CREATED:`, data);
      
      return data;
    }
  
    async healthCheck(): Promise<boolean> {
      try {
        const response = await fetch(`${this.baseURL}/health`, {
          method: 'GET',
          mode: 'cors',
        });
        
        const isHealthy = response.ok;
        console.log(`🏥 BACKEND HEALTH: ${isHealthy ? 'HEALTHY' : 'UNHEALTHY'}`);
        
        return isHealthy;
      } catch (error) {
        console.error('❌ BACKEND HEALTH CHECK FAILED:', error);
        return false;
      }
    }
  
    // Method to populate demo data when no incidents exist
    async populateDemoData(eventsCount: number = 10): Promise<boolean> {
      try {
        console.log(`🎭 POPULATING BACKEND DEMO DATA: ${eventsCount} events`);
        
        const response = await fetch(`${this.baseURL}/demo/populate?events_count=${eventsCount}&users_count=2`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          mode: 'cors'
        });
  
        const isSuccess = response.ok;
        console.log(`🎭 DEMO DATA POPULATION: ${isSuccess ? 'SUCCESS' : 'FAILED'}`);
        
        return isSuccess;
      } catch (error) {
        console.error('❌ DEMO DATA POPULATION FAILED:', error);
        return false;
      }
    }
  }
  
  export const incidentsAPI = new IncidentsAPI();