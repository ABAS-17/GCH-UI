'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, MessageCircle, Map, User, PlusCircle } from 'lucide-react'

const navigationItems = [
  {
    name: 'Home',
    href: '/',
    icon: Home,
    label: 'Dashboard'
  },
  {
    name: 'AI Chat',
    href: '/chat',
    icon: MessageCircle,
    label: 'Assistant'
  },
  {
    name: 'Posts',
    href: '/posts',
    icon: PlusCircle,
    label: 'Community'
  },
  {
    name: 'Maps',
    href: '/maps',
    icon: Map,
    label: 'Live Map'
  },
  {
    name: 'Profile',
    href: '/profile',
    icon: User,
    label: 'Settings'
  }
]

export default function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-screen-2xl mx-auto px-4">
        <div className="flex justify-around">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center py-2 px-3 min-w-0 flex-1 text-center transition-colors duration-200 relative ${
                  isActive
                    ? 'text-blue-500'
                    : 'text-gray-600 hover:text-blue-500'
                }`}
              >
                <Icon 
                  className={`w-6 h-6 mb-1 transition-transform duration-200 ${
                    isActive ? 'scale-110' : ''
                  }`} 
                />
                <span 
                  className={`text-xs transition-colors duration-200 ${
                    isActive ? 'font-semibold' : 'font-medium'
                  }`}
                >
                  {item.label}
                </span>
                
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />
                )}
              </Link>
            )
          })}
        </div>
      </div>
      
      {/* Safe area for iPhone */}
      <div className="h-4 bg-white" />
    </nav>
  )
}
