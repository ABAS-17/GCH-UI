// API Base URL
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// API Endpoints
export const API_ENDPOINTS = {
  // Dashboard
  dashboard: (userId: string) => `/dashboard/${userId}`,
  dashboardStream: (userId: string) => `/dashboard/${userId}/stream`,
  
  // Chat
  chat: '/adk/chat',
  chatHistory: (userId: string) => `/adk/chat/${userId}/history`,
  
  // Events
  events: '/events',
  eventsSearch: '/events/search',
  eventsNearby: '/events/nearby',
  
  // Maps
  analytics: '/analytics/overview',
  
  // Users
  users: (userId: string) => `/users/${userId}`,
  
  // Health
  health: '/health'
} as const

// User Settings
export const DEFAULT_USER_ID = 'arjun_user_id'
export const DEFAULT_LOCATION = {
  lat: 12.9120,
  lng: 77.6365,
  address: 'HSR Layout, Bengaluru'
}

// UI Constants
export const ANIMATION_DURATION = 300
export const DEBOUNCE_DELAY = 500
export const MAX_CHAT_HISTORY = 50

// Event Types
export const EVENT_TYPES = {
  TRAFFIC: 'traffic',
  WEATHER: 'weather', 
  INFRASTRUCTURE: 'infrastructure',
  EVENTS: 'events',
  SAFETY: 'safety'
} as const

// Priority Levels
export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
} as const
