import { useState } from 'react'

interface DynamicListProps {
  items: string[]
  onChange: (items: string[]) => void
  placeholder?: string
  label: string
  maxItems?: number
  className?: string
}

export default function DynamicList({
  items,
  onChange,
  placeholder = 'Enter item...',
  label,
  maxItems,
  className = '',
}: DynamicListProps) {
  const [currentValue, setCurrentValue] = useState('')

  const handleAdd = () => {
    if (currentValue.trim() && (!maxItems || items.length < maxItems)) {
      onChange([...items, currentValue.trim()])
      setCurrentValue('')
    }
  }

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>

      {/* Existing Items */}
      {items.length > 0 && (
        <div className="space-y-2 mb-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <span className="flex-1 text-gray-900">{item}</span>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="text-red-600 hover:text-red-800 transition-colors p-1"
                title="Remove item"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add New Item */}
      {(!maxItems || items.length < maxItems) && (
        <div className="flex gap-2">
          <input
            type="text"
            value={currentValue}
            onChange={e => setCurrentValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!currentValue.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add
          </button>
        </div>
      )}

      {maxItems && (
        <p className="text-sm text-gray-500 mt-2">
          {items.length} / {maxItems} items
        </p>
      )}
    </div>
  )
}
