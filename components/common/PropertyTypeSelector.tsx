import React, { useState, useEffect, useRef } from 'react'
import { PROPERTY_TYPE_OPTIONS } from '@/lib/constants'

interface PropertyTypeSelectorProps {
  value: string
  onChange: (value: string) => void
  required?: boolean
  label?: string
  placeholder?: string
  className?: string
}

const PropertyTypeSelector: React.FC<PropertyTypeSelectorProps> = ({
  value,
  onChange,
  required = false,
  label = 'Property Type',
  placeholder = 'Select Property Type',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const selectedOption = PROPERTY_TYPE_OPTIONS.find(t => t.value === value)

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative property-type-dropdown" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-left"
        >
          {selectedOption ? (
            <span className="flex items-center gap-2">
              <span>{selectedOption.icon}</span>
              <span>{selectedOption.label}</span>
            </span>
          ) : (
            placeholder
          )}
        </button>
        <svg
          className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
        {isOpen && (
          <div className="absolute z-10 w-full top-full mt-0 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            <div
              className="px-4 py-3 hover:bg-blue-50 cursor-pointer text-gray-500"
              onClick={() => {
                onChange('')
                setIsOpen(false)
              }}
            >
              {placeholder}
            </div>
            {PROPERTY_TYPE_OPTIONS.map(option => (
              <div
                key={option.value}
                className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex items-center gap-2"
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
              >
                <span>{option.icon}</span>
                <span>{option.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default PropertyTypeSelector
