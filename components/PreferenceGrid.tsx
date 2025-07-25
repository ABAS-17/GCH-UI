'use client'

interface PreferenceOption {
  key: string
  label: string
  icon: string
  description: string
}

interface PreferenceGridProps {
  options: PreferenceOption[]
  selectedKeys: string[]
  onToggle: (key: string) => void
}

export default function PreferenceGrid({ options, selectedKeys, onToggle }: PreferenceGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((option) => {
        const isSelected = selectedKeys.includes(option.key)

        return (
          <button
            key={option.key}
            onClick={() => onToggle(option.key)}
            className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
              isSelected
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <div className="text-2xl mb-2">
                {option.icon}
              </div>
              <div className={`text-sm font-medium mb-1 ${
                isSelected ? 'text-primary-700' : 'text-gray-900'
              }`}>
                {option.label}
              </div>
              <div className={`text-xs leading-tight ${
                isSelected ? 'text-primary-600' : 'text-gray-500'
              }`}>
                {option.description}
              </div>
            </div>

            {/* Selection indicator */}
            {isSelected && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
