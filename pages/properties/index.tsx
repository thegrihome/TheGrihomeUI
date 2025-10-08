import React, { useState, useEffect } from 'react'
import { NextSeo } from 'next-seo'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import { Loader } from '@googlemaps/js-api-loader'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import toast from 'react-hot-toast'

interface Property {
  id: string
  streetAddress: string
  location: {
    city: string
    state: string
    zipcode: string
    locality: string
    fullAddress: string
  }
  builder: string
  project: string
  propertyType: string
  sqFt: number
  thumbnailUrl?: string
  imageUrls: string[]
  listingStatus: string
  createdAt: string
  postedBy: string
  companyName?: string
  bedrooms?: string
  bathrooms?: string
  price?: string
  size?: string
  sizeUnit?: string
  plotSize?: string
  plotSizeUnit?: string
  description?: string
  userId: string
  userEmail: string
}

interface Filters {
  propertyType: string
  bedrooms: string
  bathrooms: string
  location: string
  sortBy: string
}

export default function PropertiesPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [mounted, setMounted] = useState(false)
  const [properties, setProperties] = useState<Property[]>([])
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [autocompleteService, setAutocompleteService] =
    useState<google.maps.places.AutocompleteService | null>(null)
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([])
  const [showLocationPredictions, setShowLocationPredictions] = useState(false)
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [showSoldModal, setShowSoldModal] = useState(false)
  const [buyerName, setBuyerName] = useState('')
  const [processing, setProcessing] = useState(false)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)

  const [filters, setFilters] = useState<Filters>({
    propertyType: '',
    bedrooms: '',
    bathrooms: '',
    location: '',
    sortBy: '',
  })

  const propertyTypes = [
    { value: 'SINGLE_FAMILY', label: 'Villas', icon: '🏡' },
    { value: 'CONDO', label: 'Apartments', icon: '🏢' },
    { value: 'LAND_RESIDENTIAL', label: 'Residential Lands', icon: '🏞️' },
    { value: 'LAND_AGRICULTURE', label: 'Agriculture Lands', icon: '🌾' },
    { value: 'COMMERCIAL', label: 'Commercial Properties', icon: '🏬' },
  ]

  const bedroomOptions = ['1', '2', '3', '4', '5+']
  const bathroomOptions = ['1', '2', '3', '4', '5+']
  const sortOptions = [
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
  ]

  // Initialize from URL query parameters
  useEffect(() => {
    if (router.isReady) {
      const { city, state, locality, location, propertyType, bedrooms, bathrooms, sortBy } =
        router.query

      // Build location string from city, state, locality or use location directly
      let locationString = ''
      if (city || state || locality) {
        const parts = []
        if (locality) parts.push(locality)
        if (city) parts.push(city)
        if (state) parts.push(state)
        locationString = parts.join(', ')
      } else if (location) {
        locationString = location as string
      }

      setFilters(prev => ({
        ...prev,
        location: locationString,
        propertyType: (propertyType as string) || '',
        bedrooms: (bedrooms as string) || '',
        bathrooms: (bathrooms as string) || '',
        sortBy: (sortBy as string) || '',
      }))
    }
  }, [router.isReady, router.query])

  // Initialize Google Maps API
  useEffect(() => {
    setMounted(true)
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      return
    }

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places'],
    })

    loader
      .load()
      .then(() => {
        const service = new google.maps.places.AutocompleteService()
        setAutocompleteService(service)
      })
      .catch(error => {
        // Error handled silently
      })
  }, [])

  // Close sort dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.sort-dropdown')) {
        setShowSortDropdown(false)
      }
    }

    if (showSortDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSortDropdown])

  // Load properties from database
  useEffect(() => {
    if (!mounted) return

    const loadProperties = async () => {
      setLoading(true)
      try {
        const queryParams = new URLSearchParams()

        if (filters.propertyType) queryParams.append('propertyType', filters.propertyType)
        if (filters.bedrooms) queryParams.append('bedrooms', filters.bedrooms)
        if (filters.bathrooms) queryParams.append('bathrooms', filters.bathrooms)
        if (filters.location) queryParams.append('location', filters.location)
        if (filters.sortBy) queryParams.append('sortBy', filters.sortBy)

        const response = await fetch(`/api/properties/list?${queryParams.toString()}`)

        if (!response.ok) {
          throw new Error('Failed to fetch properties')
        }

        const data = await response.json()
        setProperties(data.properties)
        setFilteredProperties(data.properties)
      } catch (error) {
        toast.error('Failed to load properties')
        setProperties([])
        setFilteredProperties([])
      } finally {
        setLoading(false)
      }
    }

    // Debounce API calls to avoid too many requests
    const timeoutId = setTimeout(loadProperties, 300)
    return () => clearTimeout(timeoutId)
  }, [filters, mounted])

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleLocationSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    handleFilterChange('location', query)

    if (query.length > 2 && autocompleteService) {
      autocompleteService.getPlacePredictions(
        {
          input: query,
          types: ['(regions)'],
          componentRestrictions: { country: 'IN' },
        },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setPredictions(predictions)
            setShowLocationPredictions(true)
          } else {
            setPredictions([])
            setShowLocationPredictions(false)
          }
        }
      )
    } else {
      setPredictions([])
      setShowLocationPredictions(false)
    }
  }

  const handleLocationSelect = (prediction: google.maps.places.AutocompletePrediction) => {
    // Show the selected location in the input
    handleFilterChange('location', prediction.description)
    setShowLocationPredictions(false)
    setPredictions([])

    // Extract location details using Places Service for better search
    const placesService = new google.maps.places.PlacesService(document.createElement('div'))
    placesService.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['address_components'],
      },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          // The location components are extracted but we just use the full description
          // The backend will do fuzzy matching on the location string
        }
      }
    )
  }

  const clearFilters = () => {
    setFilters({
      propertyType: '',
      bedrooms: '',
      bathrooms: '',
      location: '',
      sortBy: '',
    })
  }

  const formatIndianCurrency = (amount: string) => {
    const num = parseFloat(amount)
    if (isNaN(num)) return amount
    return num.toLocaleString('en-IN')
  }

  const handleMarkAsSold = async () => {
    if (!selectedPropertyId) return

    setProcessing(true)
    try {
      const response = await fetch(`/api/properties/${selectedPropertyId}/archive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          markAsSold: true,
          soldTo: buyerName || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to mark property as sold')
      }

      toast.success('Property marked as sold!')

      // Remove property from list
      setProperties(prev => prev.filter(p => p.id !== selectedPropertyId))
      setFilteredProperties(prev => prev.filter(p => p.id !== selectedPropertyId))
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark property as sold')
    } finally {
      setProcessing(false)
      setShowSoldModal(false)
      setBuyerName('')
      setSelectedPropertyId(null)
    }
  }

  const showBedroomsBathroomsFilters =
    !filters.propertyType ||
    filters.propertyType === 'SINGLE_FAMILY' ||
    filters.propertyType === 'CONDO'

  if (!mounted) return null

  return (
    <div className="properties-container">
      <NextSeo
        title="Properties - Grihome"
        description="Browse and search properties with advanced filters on Grihome"
        canonical="https://grihome.vercel.app/properties"
      />

      <Header />

      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Properties</h1>
            <p className="text-gray-600">Find your perfect property with advanced filters</p>
          </div>

          {/* Filters Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex flex-wrap items-end gap-4">
              {/* Property Type Filter */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Type
                </label>
                <div className="relative">
                  <select
                    value={filters.propertyType}
                    onChange={e => handleFilterChange('propertyType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white pr-10"
                  >
                    <option value="">All Types</option>
                    {propertyTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                  <svg
                    className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              {/* Bedrooms Filter */}
              {showBedroomsBathroomsFilters && (
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bed(s)</label>
                  <div className="relative">
                    <select
                      value={filters.bedrooms}
                      onChange={e => handleFilterChange('bedrooms', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white pr-10"
                    >
                      <option value="">Any</option>
                      {bedroomOptions.map(option => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <svg
                      className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              )}

              {/* Bathrooms Filter */}
              {showBedroomsBathroomsFilters && (
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bath(s)</label>
                  <div className="relative">
                    <select
                      value={filters.bathrooms}
                      onChange={e => handleFilterChange('bathrooms', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white pr-10"
                    >
                      <option value="">Any</option>
                      {bathroomOptions.map(option => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <svg
                      className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              )}

              {/* Location Filter */}
              <div className="relative flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={filters.location}
                  onChange={handleLocationSearch}
                  placeholder="Enter location..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  onFocus={() => predictions.length > 0 && setShowLocationPredictions(true)}
                  onBlur={() => setTimeout(() => setShowLocationPredictions(false), 200)}
                />
                {showLocationPredictions && predictions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {predictions.map(prediction => (
                      <div
                        key={prediction.place_id}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                        onClick={() => handleLocationSelect(prediction)}
                      >
                        <svg
                          className="w-4 h-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <div className="flex-1">
                          <span className="text-sm font-medium">
                            {prediction.structured_formatting.main_text}
                          </span>
                          <span className="text-xs text-gray-500 ml-1">
                            {prediction.structured_formatting.secondary_text}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Results Summary and Sort */}
          <div className="mb-6 flex justify-between items-center">
            <p className="text-gray-600">
              Showing {filteredProperties.length} of {properties.length} properties
            </p>
            <div className="flex items-center gap-4">
              {/* Sort Dropdown */}
              <div className="relative sort-dropdown">
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Sort: {sortOptions.find(opt => opt.value === filters.sortBy)?.label || 'Default'}
                  <svg
                    className={`w-4 h-4 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {showSortDropdown && (
                  <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-300 rounded-md shadow-lg z-10">
                    <button
                      onClick={() => {
                        handleFilterChange('sortBy', '')
                        setShowSortDropdown(false)
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                        !filters.sortBy ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      Default
                    </button>
                    {sortOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => {
                          handleFilterChange('sortBy', option.value)
                          setShowSortDropdown(false)
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                          filters.sortBy === option.value
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Properties Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-16">
              <h2 className="text-4xl font-bold mb-4">
                <span className="text-gray-800">No Properties</span>{' '}
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Found
                </span>
              </h2>
              <p className="text-gray-600 text-lg">
                Try adjusting your search criteria to find more properties
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map(property => {
                const isOwner = session?.user?.email === property.userEmail
                return (
                  <div
                    key={property.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
                  >
                    <div className="relative h-48">
                      <Image
                        src={
                          property.thumbnailUrl ||
                          property.imageUrls[0] ||
                          'https://via.placeholder.com/400x300?text=Property'
                        }
                        alt={`${property.project} - ${property.propertyType}`}
                        width={400}
                        height={192}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-4 left-4 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                        {propertyTypes.find(t => t.value === property.propertyType)?.icon}{' '}
                        {propertyTypes.find(t => t.value === property.propertyType)?.label}
                      </div>
                      {property.price && (
                        <div className="absolute top-4 right-4 bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">
                          ₹{property.price}L
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-lg text-gray-800">{property.project}</h3>
                        {property.price && (
                          <span className="font-semibold text-lg text-gray-800">
                            ₹{formatIndianCurrency(property.price)}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-2">
                        {property.sqFt && `${property.sqFt} sq ft`}
                        {property.bedrooms && ` • ${property.bedrooms} BHK`}
                        {property.bathrooms && ` • ${property.bathrooms} Bath`}
                        {property.builder !== 'Independent' && ` • Built by ${property.builder}`}
                      </p>
                      <p className="text-gray-500 text-sm mb-3 flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        {property.location.fullAddress}
                      </p>
                      {property.description && (
                        <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                          {property.description}
                        </p>
                      )}
                      <div className="flex justify-between items-center gap-2">
                        <div className="text-xs text-gray-500 flex-1">
                          <div>Zipcode: {property.location.zipcode}</div>
                          <div>Posted by: {property.postedBy}</div>
                          {property.companyName && <div>Company: {property.companyName}</div>}
                        </div>
                        <div className="flex gap-2 items-center">
                          <button
                            onClick={() => router.push(`/properties/${property.id}`)}
                            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                          >
                            View Details
                          </button>

                          {/* Owner Actions - Mark as Sold */}
                          {isOwner && property.listingStatus === 'ACTIVE' && (
                            <button
                              onClick={() => {
                                setSelectedPropertyId(property.id)
                                setShowSoldModal(true)
                              }}
                              disabled={processing}
                              className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Mark as Sold"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* Mark as Sold Modal */}
      {showSoldModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Mark Property as Sold</h3>
              <button
                onClick={() => {
                  setShowSoldModal(false)
                  setBuyerName('')
                  setSelectedPropertyId(null)
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buyer Name (Optional)
              </label>
              <input
                type="text"
                value={buyerName}
                onChange={e => setBuyerName(e.target.value)}
                placeholder="Enter buyer name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Leave blank if sold to an external buyer</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSoldModal(false)
                  setBuyerName('')
                  setSelectedPropertyId(null)
                }}
                disabled={processing}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkAsSold}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Processing...' : 'Mark as Sold'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
