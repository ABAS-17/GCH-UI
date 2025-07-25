'use client'

import { ReactNode } from 'react'

interface ProfileSectionProps {
  title: string
  icon: ReactNode
  children: ReactNode
}

export default function ProfileSection({ title, icon, children }: ProfileSectionProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="text-primary-500">
            {icon}
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            {title}
          </h2>
        </div>
      </div>
      
      <div className="px-6 py-4">
        {children}
      </div>
    </div>
  )
}
