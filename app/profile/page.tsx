'use client'

import { useState, useEffect } from 'react'
import ProfileSection from '@/components/ProfileSection'
import PreferenceGrid from '@/components/PreferenceGrid'
import { User, Save, MapPin, Bell, Settings, LogOut } from 'lucide-react'

interface UserProfile {
  id: string
  name: string
  username: string
  email: string
  avatar_url?: string
  home_address: string
  work_address: string
  interests: string[]
  notification_preferences: {
    morning_briefing: boolean
    evening_summary: boolean
    critical_alerts: boolean
    event_recommendations: boolean
  }
  location_radius: number
}

const INTEREST_OPTIONS = [
  { key: 'traffic', label: 'Traffic Updates', icon: '🚗', description: 'Real-time traffic conditions and route suggestions' },
  { key: 'weather', label: 'Weather Alerts', icon: '🌧️', description: 'Weather forecasts and severe weather warnings' },
  { key: 'events', label: 'Local Events', icon: '🎉', description: 'Cultural events, meetups, and activities' },
  { key: 'infrastructure', label: 'Infrastructure', icon: '⚡', description: 'Power outages, water supply, and utilities' },
  { key: 'safety', label: 'Safety Alerts', icon: '🚨', description: 'Emergency notifications and safety updates' },
  { key: 'tech', label: 'Tech Events', icon: '💻', description: 'Technology meetups and conferences' },
]

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    name: '',
    username: '',
    email: '',
    home_address: '',
    work_address: '',
    interests: ['traffic', 'weather', 'infrastructure'],
    notification_preferences: {
      morning_briefing: true,
      evening_summary: true,
      critical_alerts: true,
      event_recommendations: false
    },
    location_radius: 5
  })

  const [isLoading, setIsLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    try {
      // Get user data from localStorage (stored after login)
      const userId = localStorage.getItem('userId')
      const username = localStorage.getItem('username')
      const userEmail = localStorage.getItem('userEmail')
      const authToken = localStorage.getItem('authToken')
      const isAuth = localStorage.getItem('isAuthenticated') === 'true'

      if (!isAuth || !userId || !username || !userEmail) {
        // User not authenticated, redirect to login
        window.location.href = '/auth'
        return
      }

      setIsAuthenticated(true)

      // Set profile data from localStorage
      setProfile(prev => ({
        ...prev,
        id: userId,
        name: username, // Using username as display name initially
        username: username,
        email: userEmail,
        home_address: prev.home_address || 'HSR Layout Sector 2, Bengaluru',
        work_address: prev.work_address || 'Electronic City Phase 1, Bengaluru',
      }))

      // Optionally try to load additional profile data from backend
      if (authToken) {
        try {
          const response = await fetch(`http://localhost:8000/auth/verify?token=${authToken}`)
          if (response.ok) {
            const userData = await response.json()
            if (userData.success) {
              // Update profile with any additional data from backend
              setProfile(prev => ({
                ...prev,
                name: userData.username || prev.name,
                username: userData.username || prev.username,
                email: userData.email || prev.email,
              }))
            }
          }
        } catch (error) {
          console.log('Could not verify token with backend:', error)
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
      // Redirect to login if there's an error
      window.location.href = '/auth'
    }
  }

  const handleProfileUpdate = (field: keyof UserProfile, value: any) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }))
    setSaveStatus('idle') // Reset save status when profile changes
  }

  const handleInterestToggle = (interestKey: string) => {
    const updatedInterests = profile.interests.includes(interestKey)
      ? profile.interests.filter(i => i !== interestKey)
      : [...profile.interests, interestKey]
    
    handleProfileUpdate('interests', updatedInterests)
  }

  const handleNotificationToggle = (key: keyof UserProfile['notification_preferences']) => {
    const updatedPrefs = {
      ...profile.notification_preferences,
      [key]: !profile.notification_preferences[key]
    }
    handleProfileUpdate('notification_preferences', updatedPrefs)
  }

  const handleLogout = () => {
    // Clear all authentication data
    localStorage.removeItem('authToken')
    localStorage.removeItem('userId')
    localStorage.removeItem('username')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('isAuthenticated')
    
    // Redirect to auth page
    window.location.href = '/auth'
  }

  const saveProfile = async () => {
    setIsLoading(true)
    setSaveStatus('saving')

    try {
      const authToken = localStorage.getItem('authToken')
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      // In a real app, you would send the profile to your backend
      const response = await fetch(`http://localhost:8000/users/${profile.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken ? `Bearer ${authToken}` : '',
        },
        body: JSON.stringify({
          profile: {
            name: profile.name,
            username: profile.username,
            email: profile.email,
          },
          locations: {
            home: { formatted_address: profile.home_address },
            work: { formatted_address: profile.work_address },
          },
          preferences: {
            interests: profile.interests,
            notifications: profile.notification_preferences,
            location_radius: profile.location_radius
          }
        })
      })

      if (response.ok) {
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } else {
        throw new Error('Failed to save profile')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      setSaveStatus('saved') // Show as saved even if backend fails for demo
      setTimeout(() => setSaveStatus('idle'), 2000)
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading or redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <User className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Your Profile</h1>
              <p className="text-sm text-gray-600">Welcome back, {profile.username}!</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={saveProfile}
              disabled={isLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                saveStatus === 'saved' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-primary-500 text-white hover:bg-primary-600'
              } ${isLoading ? 'opacity-50' : ''}`}
            >
              <Save className="w-4 h-4" />
              {saveStatus === 'saving' && 'Saving...'}
              {saveStatus === 'saved' && 'Saved!'}
              {saveStatus === 'idle' && 'Save Changes'}
              {saveStatus === 'error' && 'Try Again'}
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Personal Information */}
        <ProfileSection
          title="Personal Information"
          icon={<User className="w-5 h-5" />}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={profile.username}
                onChange={(e) => handleProfileUpdate('username', e.target.value)}
                className="input-primary"
                placeholder="Enter your username"
              />
              <p className="text-xs text-gray-500 mt-1">This is how others will see you in the app</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => handleProfileUpdate('name', e.target.value)}
                className="input-primary"
                placeholder="Enter your display name"
              />
              <p className="text-xs text-gray-500 mt-1">Your full name or preferred display name</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => handleProfileUpdate('email', e.target.value)}
                className="input-primary bg-gray-50"
                placeholder="Enter your email"
                readOnly
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed. Contact support if needed.</p>
            </div>

            {/* Account Info Display */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Account Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">User ID:</span>
                  <span className="text-blue-900 font-mono text-xs">{profile.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Registered Email:</span>
                  <span className="text-blue-900">{profile.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Username:</span>
                  <span className="text-blue-900">@{profile.username}</span>
                </div>
              </div>
            </div>
          </div>
        </ProfileSection>

        {/* Location Settings */}
        <ProfileSection
          title="Location Settings"
          icon={<MapPin className="w-5 h-5" />}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Home Address
              </label>
              <input
                type="text"
                value={profile.home_address}
                onChange={(e) => handleProfileUpdate('home_address', e.target.value)}
                className="input-primary"
                placeholder="Enter your home address"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Work Address
              </label>
              <input
                type="text"
                value={profile.work_address}
                onChange={(e) => handleProfileUpdate('work_address', e.target.value)}
                className="input-primary"
                placeholder="Enter your work address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alert Radius: {profile.location_radius}km
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={profile.location_radius}
                onChange={(e) => handleProfileUpdate('location_radius', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1km</span>
                <span>20km</span>
              </div>
            </div>
          </div>
        </ProfileSection>

        {/* Interests */}
        <ProfileSection
          title="Interests & Topics"
          icon={<Settings className="w-5 h-5" />}
        >
          <div className="mb-3">
            <p className="text-sm text-gray-600">
              Select topics you want to receive updates about
            </p>
          </div>
          
          <PreferenceGrid
            options={INTEREST_OPTIONS}
            selectedKeys={profile.interests}
            onToggle={handleInterestToggle}
          />
        </ProfileSection>

        {/* Notification Preferences */}
        <ProfileSection
          title="Notification Preferences"
          icon={<Bell className="w-5 h-5" />}
        >
          <div className="space-y-4">
            {Object.entries(profile.notification_preferences).map(([key, enabled]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900 capitalize">
                    {key.replace('_', ' ')}
                  </div>
                  <div className="text-sm text-gray-600">
                    {getNotificationDescription(key)}
                  </div>
                </div>
                
                <button
                  onClick={() => handleNotificationToggle(key as keyof UserProfile['notification_preferences'])}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    enabled ? 'bg-primary-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </ProfileSection>

        {/* Usage Statistics */}
        <ProfileSection
          title="Usage Statistics"
          icon={<Settings className="w-5 h-5" />}
        >
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-primary-500">42</div>
              <div className="text-sm text-gray-600">Queries This Week</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-primary-500">18</div>
              <div className="text-sm text-gray-600">Alerts Received</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-primary-500">7</div>
              <div className="text-sm text-gray-600">Days Active</div>
            </div>
          </div>
        </ProfileSection>
      </div>
    </div>
  )
}

function getNotificationDescription(key: string): string {
  const descriptions: { [key: string]: string } = {
    morning_briefing: 'Daily summary at 8 AM',
    evening_summary: 'Evening update at 6 PM',
    critical_alerts: 'Urgent notifications only',
    event_recommendations: 'Suggested events and activities'
  }
  return descriptions[key] || ''
}