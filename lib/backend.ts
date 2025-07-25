// Backend connection status and utilities
class BackendConnection {
  private baseUrl: string
  private isConnected: boolean = false

  constructor(baseUrl: string = 'http://localhost:8000') {
    this.baseUrl = baseUrl
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000 as any
      })
      
      this.isConnected = response.ok
      return response.ok
    } catch (error) {
      this.isConnected = false
      return false
    }
  }

  async getDashboard(userId: string, lat: number, lng: number) {
    const url = `${this.baseUrl}/dashboard/${userId}?lat=${lat}&lng=${lng}`
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Dashboard API error:', error)
      throw error
    }
  }

  createSSEConnection(userId: string, lat: number, lng: number): EventSource {
    const url = `${this.baseUrl}/dashboard/${userId}/stream?lat=${lat}&lng=${lng}`
    return new EventSource(url)
  }

  async expandCard(userId: string, cardId: string, lat: number, lng: number) {
    const url = `${this.baseUrl}/dashboard/${userId}/expand/${cardId}?lat=${lat}&lng=${lng}`
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Card expansion API error:', error)
      throw error
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected
  }
}

// Singleton instance
export const backendConnection = new BackendConnection()

// Types for backend responses
export interface BackendDashboardCard {
  id: string
  type: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  title: string
  summary: string
  action: string
  confidence: number
  distance_km?: number
  synthesis_meta?: {
    event_count: number
    topic: string
    key_insight: string
    individual_events?: any[]
  }
  created_at: string
  user_id: string
  expandable?: boolean
  expansion_url?: string
}

export interface BackendDashboardResponse {
  success: boolean
  cards: BackendDashboardCard[]
  total_cards: number
  generated_at: string
  user_id: string
  ai_synthesis?: string
}

export interface BackendSSEUpdate {
  type: 'dashboard_update' | 'heartbeat' | 'error'
  cards?: BackendDashboardCard[]
  timestamp: string
  user_id: string
  high_priority_count?: number
  message?: string
}

export interface BackendCardExpansion {
  success: boolean
  expanded_topic: string
  total_events: number
  user_id: string
  individual_events: Array<{
    event_id: string
    title: string
    summary: string
    distance_km: number
    confidence: number
    expanded_details?: {
      severity: string
      full_description: string
      event_id: string
      similarity_score: number
      created_timestamp: string
      exact_distance: string
    }
  }>
  summary: string
  generated_at: string
}

// Mock data generator for when backend is unavailable
export function generateMockDashboardData(userId: string): BackendDashboardCard[] {
  return [
    {
      id: 'mock_traffic_1',
      type: 'traffic_synthesis',
      priority: 'critical',
      title: '3 Accidents on ORR - Heavy Delays',
      summary: 'Multiple incidents causing 45min delays. Alternative routes available via Sarjapur Road.',
      action: 'Get AI assistance',
      confidence: 0.92,
      distance_km: 2.3,
      synthesis_meta: {
        event_count: 3,
        topic: 'traffic',
        key_insight: 'ORR completely blocked, use alternatives'
      },
      created_at: new Date().toISOString(),
      user_id: userId,
      expandable: true
    },
    {
      id: 'mock_weather_1',
      type: 'weather_warning',
      priority: 'high',
      title: 'Rain Expected - Evening Commute',
      summary: '80% chance of rain from 5-7 PM. Plan accordingly for your evening commute.',
      action: 'Ask about alternatives',
      confidence: 0.85,
      distance_km: 0.5,
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      user_id: userId
    },
    {
      id: 'mock_infrastructure_1',
      type: 'infrastructure_alert',
      priority: 'medium',
      title: 'Power Outage - HSR Layout Sector 2',
      summary: 'Scheduled maintenance affecting 120 homes. Expected restoration by 6 PM today.',
      action: 'Show alternatives',
      confidence: 0.90,
      distance_km: 0.8,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      user_id: userId
    },
    {
      id: 'mock_event_1',
      type: 'event_recommendation',
      priority: 'low',
      title: 'Weekend Tech Meetups',
      summary: '5 tech events in Koramangala this weekend. Perfect for networking and learning.',
      action: 'Show me details',
      confidence: 0.78,
      distance_km: 1.8,
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      user_id: userId
    }
  ]
}
