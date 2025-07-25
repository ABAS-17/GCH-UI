'use client'

import { useRouter } from 'next/navigation'
import { Map, MapPin, Activity } from 'lucide-react'

interface MiniMapProps {
  location: {
    lat: number
    lng: number
    address: string
  }
  incidentCount: number
}

export default function MiniMap({ location, incidentCount }: MiniMapProps) {
  const router = useRouter()

  const handleMapClick = () => {
    router.push('/maps')
  }

  return (
    <div
      className="relative bg-gradient-to-br from-blue-500 via-purple-500 to-teal-500 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] overflow-hidden"
      onClick={handleMapClick}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-4 left-4 w-2 h-2 bg-white rounded-full animate-pulse"></div>
        <div className="absolute top-8 right-6 w-1 h-1 bg-white rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-6 left-8 w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-4 right-4 w-1 h-1 bg-white rounded-full animate-pulse" style={{animationDelay: '3s'}}></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Map className="w-6 h-6" />
            <span className="font-semibold">Live City Map</span>
          </div>
          <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-sm">
            <Activity className="w-4 h-4" />
            {incidentCount}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span className="text-sm opacity-90">{location.address}</span>
          </div>
          
          <div className="text-lg font-medium">
            {incidentCount > 0 
              ? `${incidentCount} active incident${incidentCount !== 1 ? 's' : ''} nearby`
              : 'All clear in your area'
            }
          </div>
          
          <div className="text-sm opacity-75">
            Tap to explore interactive map →
          </div>
        </div>
      </div>

      {/* Overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
    </div>
  )
}
