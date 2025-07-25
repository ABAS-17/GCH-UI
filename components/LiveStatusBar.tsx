'use client'

import { Wifi, WifiOff, Clock, BarChart3 } from 'lucide-react'

interface LiveStatusBarProps {
  isConnected: boolean
  lastUpdate: string
  updateCount: number
}

export default function LiveStatusBar({ isConnected, lastUpdate, updateCount }: LiveStatusBarProps) {
  return (
    <div className="mt-4 flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-lg p-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <Wifi className="w-4 h-4 text-green-300" />
              <span className="text-sm text-green-100">Live</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-red-300" />
              <span className="text-sm text-red-100">Offline</span>
            </>
          )}
        </div>
        
        {lastUpdate && (
          <div className="flex items-center gap-1 text-xs text-primary-100">
            <Clock className="w-3 h-3" />
            Last: {lastUpdate}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 text-xs text-primary-100">
        <BarChart3 className="w-3 h-3" />
        {updateCount} updates
      </div>
    </div>
  )
}
