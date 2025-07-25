import { API_BASE_URL, API_ENDPOINTS } from './constants'

class ApiClient {
  private baseURL: string

  constructor() {
    this.baseURL = API_BASE_URL
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    }

    try {
      const response = await fetch(url, { ...defaultOptions, ...options })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API request failed: ${url}`, error)
      throw error
    }
  }

  // Dashboard methods
  async getDashboard(userId: string, lat?: number, lng?: number) {
    const params = new URLSearchParams()
    if (lat) params.append('lat', lat.toString())
    if (lng) params.append('lng', lng.toString())
    
    const endpoint = `${API_ENDPOINTS.dashboard(userId)}${params.toString() ? `?${params}` : ''}`
    return this.request(endpoint)
  }

  // Chat methods
  async sendChatMessage(data: {
    user_id: string
    message: string
    location?: { lat: number; lng: number }
    context?: any
  }) {
    return this.request(API_ENDPOINTS.chat, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Events methods
  async searchEvents(query: string, location?: { lat: number; lng: number }) {
    const params = new URLSearchParams({ query })
    if (location) {
      params.append('lat', location.lat.toString())
      params.append('lng', location.lng.toString())
    }
    
    return this.request(`${API_ENDPOINTS.eventsSearch}?${params}`)
  }

  async getNearbyEvents(lat: number, lng: number, radius = 5) {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
      radius_km: radius.toString(),
    })
    
    return this.request(`${API_ENDPOINTS.eventsNearby}?${params}`)
  }

  // User methods
  async getUser(userId: string) {
    return this.request(API_ENDPOINTS.users(userId))
  }

  async updateUser(userId: string, data: any) {
    return this.request(API_ENDPOINTS.users(userId), {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // Health check
  async healthCheck() {
    return this.request(API_ENDPOINTS.health)
  }
}

export const apiClient = new ApiClient()
