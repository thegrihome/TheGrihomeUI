import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

interface Builder {
  id: string
  name: string
  description: string | null
  logoUrl: string | null
  website: string | null
  projectCount?: number
}

interface BuilderSelectorProps {
  value: string | null
  onChange: (builderId: string) => void
  className?: string
}

export default function BuilderSelector({ value, onChange, className = '' }: BuilderSelectorProps) {
  const [builders, setBuilders] = useState<Builder[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newBuilderName, setNewBuilderName] = useState('')
  const [newBuilderWebsite, setNewBuilderWebsite] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedBuilder, setSelectedBuilder] = useState<Builder | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { data: session } = useSession()

  // Fetch builders
  useEffect(() => {
    const fetchBuilders = async () => {
      try {
        const response = await fetch(`/api/builders?search=${encodeURIComponent(searchQuery)}&limit=50`)
        if (response.ok) {
          const data = await response.json()
          setBuilders(data.builders || [])
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching builders:', error)
      }
    }

    fetchBuilders()
  }, [searchQuery])

  // Set selected builder when value changes
  useEffect(() => {
    if (value && builders.length > 0) {
      const builder = builders.find(b => b.id === value)
      if (builder) {
        setSelectedBuilder(builder)
      }
    }
  }, [value, builders])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowAddForm(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectBuilder = (builder: Builder) => {
    setSelectedBuilder(builder)
    onChange(builder.id)
    setIsOpen(false)
    setShowAddForm(false)
  }

  const handleAddNewBuilder = async () => {
    if (!newBuilderName.trim()) {
      toast.error('Please enter builder name')
      return
    }

    if (!session?.user) {
      toast.error('Please sign in to add a builder')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/builders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newBuilderName.trim(),
          website: newBuilderWebsite.trim() || null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Builder added successfully!')
        const newBuilder = data.builder
        setBuilders([newBuilder, ...builders])
        handleSelectBuilder(newBuilder)
        setNewBuilderName('')
        setNewBuilderWebsite('')
      } else {
        toast.error(data.message || 'Failed to add builder')
      }
    } catch (error) {
      toast.error('Error adding builder')
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredBuilders = builders.filter(builder =>
    builder.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Selected Builder Display */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
      >
        {selectedBuilder ? (
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-900">{selectedBuilder.name}</span>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        ) : (
          <div className="flex items-center justify-between text-gray-400">
            <span>Select a builder...</span>
            <svg
              className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search builders..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {/* Add New Builder Button */}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full px-4 py-3 text-left text-blue-600 hover:bg-blue-50 border-b border-gray-200 font-medium transition-colors"
          >
            + Add New Builder
          </button>

          {/* Add New Builder Form */}
          {showAddForm && (
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Builder Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newBuilderName}
                    onChange={(e) => setNewBuilderName(e.target.value)}
                    placeholder="Enter builder name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website (Optional)
                  </label>
                  <input
                    type="url"
                    value={newBuilderWebsite}
                    onChange={(e) => setNewBuilderWebsite(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddNewBuilder}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                  >
                    {isSubmitting ? 'Adding...' : 'Add Builder'}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false)
                      setNewBuilderName('')
                      setNewBuilderWebsite('')
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Builders List */}
          <div className="max-h-60 overflow-y-auto">
            {filteredBuilders.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                No builders found. Try a different search or add a new builder.
              </div>
            ) : (
              filteredBuilders.map((builder) => (
                <div
                  key={builder.id}
                  onClick={() => handleSelectBuilder(builder)}
                  className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                    value === builder.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="font-medium text-gray-900">{builder.name}</div>
                  {builder.website && (
                    <div className="text-sm text-gray-500 mt-1">{builder.website}</div>
                  )}
                  {builder.projectCount !== undefined && (
                    <div className="text-xs text-gray-400 mt-1">
                      {builder.projectCount} {builder.projectCount === 1 ? 'project' : 'projects'}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
