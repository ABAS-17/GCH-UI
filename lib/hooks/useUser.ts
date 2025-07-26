// lib/hooks/useUser.ts - Backend Authentication Integration
'use client'

import { useState, useEffect, useCallback } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  preferences?: {
    location?: {
      lat: number;
      lng: number;
      address: string;
    };
    notifications?: {
      traffic: boolean;
      weather: boolean;
      infrastructure: boolean;
      events: boolean;
      safety: boolean;
    };
    radius_km?: number;
  };
  created_at: string;
  last_active: string;
}

interface UseUserReturn {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updatePreferences: (preferences: Partial<User['preferences']>) => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Get stored user ID from localStorage
  const getStoredUserId = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('urban_intelligence_user_id');
  }, []);

  // Store user ID in localStorage
  const storeUserId = useCallback((userId: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('urban_intelligence_user_id', userId);
  }, []);

  // Clear stored user ID
  const clearStoredUserId = useCallback(() => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('urban_intelligence_user_id');
  }, []);

  // Fetch user data from backend
  const fetchUser = useCallback(async (userId: string): Promise<User | null> => {
    try {
      const response = await fetch(`${baseURL}/users/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`⚠️ User ${userId} not found in backend`);
          return null;
        }
        throw new Error(`Failed to fetch user: ${response.status} ${response.statusText}`);
      }

      const userData = await response.json();
      console.log('✅ User data fetched from backend:', userData);
      
      return userData;
    } catch (err) {
      console.error('❌ Error fetching user:', err);
      throw err;
    }
  }, [baseURL]);

  // Create new user in backend
  const createUser = useCallback(async (email: string, name: string): Promise<User | null> => {
    try {
      const response = await fetch(`${baseURL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify({
          email,
          name,
          preferences: {
            notifications: {
              traffic: true,
              weather: true,
              infrastructure: true,
              events: false,
              safety: true
            },
            radius_km: 15
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create user: ${response.status} ${response.statusText}`);
      }

      const userData = await response.json();
      console.log('✅ User created in backend:', userData);
      
      return userData;
    } catch (err) {
      console.error('❌ Error creating user:', err);
      throw err;
    }
  }, [baseURL]);

  // Initialize user on app load
  useEffect(() => {
    const initializeUser = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const storedUserId = getStoredUserId();
        
        if (storedUserId) {
          console.log('🔍 Found stored user ID:', storedUserId);
          const userData = await fetchUser(storedUserId);
          
          if (userData) {
            setUser(userData);
            console.log('✅ User authenticated from storage');
          } else {
            // User not found in backend, clear invalid ID
            clearStoredUserId();
            console.log('⚠️ Stored user ID invalid, cleared');
          }
        } else {
          console.log('ℹ️ No stored user ID found');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize user';
        setError(errorMessage);
        clearStoredUserId(); // Clear invalid stored data
      } finally {
        setIsLoading(false);
      }
    };

    initializeUser();
  }, [getStoredUserId, fetchUser, clearStoredUserId]);

  // Login function
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // For now, we'll use email as a simple authentication
      // In production, this would involve proper authentication
      const name = email.split('@')[0]; // Extract name from email
      
      // Try to fetch existing user by email
      // This is a simplified approach - in production, use proper auth endpoints
      let userData: User | null = null;
      
      try {
        // Search for user by email (this endpoint would need to be implemented)
        const response = await fetch(`${baseURL}/users/search?email=${encodeURIComponent(email)}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          mode: 'cors',
        });
        
        if (response.ok) {
          const searchResult = await response.json();
          if (searchResult.user) {
            userData = searchResult.user;
          }
        }
      } catch (searchErr) {
        console.log('ℹ️ User search failed, will create new user');
      }
      
      // If user doesn't exist, create new one
      if (!userData) {
        userData = await createUser(email, name);
      }
      
      if (userData) {
        setUser(userData);
        storeUserId(userData.id);
        console.log('✅ User logged in successfully');
        return true;
      } else {
        throw new Error('Failed to login or create user');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [baseURL, createUser, storeUserId]);

  // Logout function
  const logout = useCallback(async (): Promise<void> => {
    setUser(null);
    clearStoredUserId();
    console.log('✅ User logged out');
  }, [clearStoredUserId]);

  // Update user preferences
  const updatePreferences = useCallback(async (preferences: Partial<User['preferences']>): Promise<boolean> => {
    if (!user) {
      setError('No user logged in');
      return false;
    }

    try {
      const response = await fetch(`${baseURL}/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify({
          preferences: {
            ...user.preferences,
            ...preferences
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update preferences: ${response.status} ${response.statusText}`);
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      console.log('✅ User preferences updated');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update preferences';
      setError(errorMessage);
      return false;
    }
  }, [user, baseURL]);

  // Refresh user data
  const refreshUser = useCallback(async (): Promise<void> => {
    if (!user) return;

    try {
      const userData = await fetchUser(user.id);
      if (userData) {
        setUser(userData);
        console.log('✅ User data refreshed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh user';
      setError(errorMessage);
    }
  }, [user, fetchUser]);

  return {
    user,
    isLoading,
    error,
    login,
    logout,
    updatePreferences,
    refreshUser
  };
}