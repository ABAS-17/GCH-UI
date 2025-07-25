'use client'

import { useState, useEffect } from 'react'
import { backendConnection } from '@/lib/backend'

interface ConnectionTestProps {
  className?: string
}

export default function ConnectionTest({ className = '' }: ConnectionTestProps) {
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown')
  const [lastTest, setLastTest] = useState<string>('')

  useEffect(() => {
    // Test connection on mount
    testConnection()
  }, [])

  const testConnection = async () => {
    setIsTestingConnection(true)
    try {
      const isHealthy = await backendConnection.healthCheck()
      setConnectionStatus(isHealthy ? 'connected' : 'disconnected')
      setLastTest(new Date().toLocaleTimeString())
    } catch (error) {
      setConnectionStatus('disconnected')
      setLastTest(new Date().toLocaleTimeString())
    } finally {
      setIsTestingConnection(false)
    }
  }

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600'
      case 'disconnected': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return '✅'
      case 'disconnected': return '❌'
      default: return '❓'
    }
  }

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <span className={getStatusColor()}>
        {getStatusIcon()} Backend
      </span>
      
      <button
        onClick={testConnection}
        disabled={isTestingConnection}
        className="text-blue-600 hover:text-blue-700 underline disabled:opacity-50"
      >
        {isTestingConnection ? 'Testing...' : 'Test'}
      </button>
      
      {lastTest && (
        <span className="text-gray-500 text-xs">
          {lastTest}
        </span>
      )}
    </div>
  )
}
