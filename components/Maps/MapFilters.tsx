'use client'

interface Filter {
  key: string
  label: string
  icon: string
  color: string
}

interface MapFiltersProps {
  filters: Filter[]
  activeFilter: string
  onFilterChange: (filterKey: string) => void
  incidentCounts: { [key: string]: number }
}

export default function MapFilters({ 
  filters, 
  activeFilter, 
  onFilterChange, 
  incidentCounts 
}: MapFiltersProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {filters.map((filter) => {
        const isActive = activeFilter === filter.key
        const count = filter.key === 'all' 
          ? Object.values(incidentCounts).reduce((sum, count) => sum + count, 0)
          : incidentCounts[filter.key] || 0

        return (
          <button
            key={filter.key}
            onClick={() => onFilterChange(filter.key)}
            className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
              isActive
                ? 'bg-primary-500 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <span className="text-base">{filter.icon}</span>
            <span>{filter.label}</span>
            {count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                isActive 
                  ? 'bg-white/20 text-white' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
