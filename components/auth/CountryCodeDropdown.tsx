import { useState, useRef, useEffect } from 'react'
import { Country, countryCodes } from '@/lib/countryCodes'

interface CountryCodeDropdownProps {
  value: string
  onChange: (dialCode: string) => void
  className?: string
  disabled?: boolean
}

export default function CountryCodeDropdown({
  value,
  onChange,
  className = '',
  disabled = false,
}: CountryCodeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const selectedCountry =
    countryCodes.find(country => country.dialCode === value) || countryCodes[0]

  const filteredCountries = countryCodes.filter(
    country =>
      country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      country.dialCode.includes(searchTerm) ||
      country.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      country.code3.toLowerCase().includes(searchTerm.toLowerCase())
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  const handleCountrySelect = (country: Country) => {
    onChange(country.dialCode)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
      setSearchTerm('')
    }
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative group">
        <button
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className={`flex items-center justify-between w-full px-3 py-2 text-left border border-gray-300 rounded-md transition-colors ${
            disabled
              ? 'bg-gray-50 text-gray-500 cursor-not-allowed'
              : 'bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center space-x-1 min-w-0">
            <span className="text-lg flex-shrink-0">{selectedCountry.flag}</span>
            <span className="text-sm font-medium text-gray-900 flex-shrink-0">
              {selectedCountry.dialCode}
            </span>
            <span className="text-sm text-gray-600 flex-shrink-0">{selectedCountry.code3}</span>
          </div>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ml-1 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-50 shadow-lg">
          {selectedCountry.name}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-visible">
          {/* Search input */}
          <div className="p-2 border-b border-gray-200">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search countries..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
            />
          </div>

          {/* Country list */}
          <div className="max-h-48 overflow-y-auto overflow-x-visible">
            {filteredCountries.length > 0 ? (
              filteredCountries.map(country => (
                <div key={country.code} className="relative group">
                  <button
                    type="button"
                    onClick={() => handleCountrySelect(country)}
                    title={country.name}
                    className={`w-full px-3 py-2 text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100 transition-colors ${
                      selectedCountry.code === country.code ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-1">
                      <span className="text-lg flex-shrink-0">{country.flag}</span>
                      <span className="text-sm font-medium text-gray-900 flex-shrink-0">
                        {country.dialCode}
                      </span>
                      <span className="text-sm text-gray-600 flex-shrink-0">{country.code3}</span>
                    </div>
                  </button>
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500">No countries found</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
