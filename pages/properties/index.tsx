import React, { useState, useEffect } from 'react'
import { NextSeo } from 'next-seo'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import { Loader } from '@googlemaps/js-api-loader'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import PropertyCard from '@/components/properties/PropertyCard'
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
  listingType: string
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
  listingType: string
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
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [autocompleteService, setAutocompleteService] =
    useState<google.maps.places.AutocompleteService | null>(null)
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([])
  const [showLocationPredictions, setShowLocationPredictions] = useState(false)
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [showSoldModal, setShowSoldModal] = useState(false)
  const [showPropertyTypeDropdown, setShowPropertyTypeDropdown] = useState(false)
  const [showBedroomsDropdown, setShowBedroomsDropdown] = useState(false)
  const [showBathroomsDropdown, setShowBathroomsDropdown] = useState(false)
  const [buyerName, setBuyerName] = useState('')
  const [processing, setProcessing] = useState(false)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const propertiesPerPage = 15

  const [filters, setFilters] = useState<Filters>({
    propertyType: '',
    listingType: '',
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
    { value: 'COMMERCIAL', label: 'Commercial', icon: '🏬' },
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
      const { city, state, locality, location, propertyType, bedrooms, bathrooms, sortBy, type } =
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

      // Map 'buy' to 'SALE' and 'rent' to 'RENT'
      let listingType = ''
      if (type === 'buy') {
        listingType = 'SALE'
      } else if (type === 'rent') {
        listingType = 'RENT'
      }

      setFilters(prev => ({
        ...prev,
        location: locationString,
        propertyType: (propertyType as string) || '',
        listingType,
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

    // Check if Google Maps is already loaded
    if (window.google?.maps?.places?.AutocompleteService) {
      const service = new google.maps.places.AutocompleteService()
      setAutocompleteService(service)
      return
    }

    // Only load if not already loaded
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

  // Fetch favorites when user is authenticated
  useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/properties/favorites')
        .then(res => res.json())
        .then(data => {
          if (data.favorites) {
            const ids = new Set<string>(data.favorites.map((fav: any) => fav.id))
            setFavoriteIds(ids)
          }
        })
        .catch(error => {
          // eslint-disable-next-line no-console
          console.error('Failed to load favorites:', error)
        })
    }
  }, [session?.user?.id])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.sort-dropdown')) {
        setShowSortDropdown(false)
      }
      if (!target.closest('.property-type-dropdown')) {
        setShowPropertyTypeDropdown(false)
      }
      if (!target.closest('.bedrooms-dropdown')) {
        setShowBedroomsDropdown(false)
      }
      if (!target.closest('.bathrooms-dropdown')) {
        setShowBathroomsDropdown(false)
      }
    }

    if (
      showSortDropdown ||
      showPropertyTypeDropdown ||
      showBedroomsDropdown ||
      showBathroomsDropdown
    ) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSortDropdown, showPropertyTypeDropdown, showBedroomsDropdown, showBathroomsDropdown])

  // Load properties from database
  useEffect(() => {
    if (!mounted) return

    const loadProperties = async () => {
      setLoading(true)
      try {
        const queryParams = new URLSearchParams()

        if (filters.propertyType) queryParams.append('propertyType', filters.propertyType)
        if (filters.listingType) queryParams.append('listingType', filters.listingType)
        if (filters.bedrooms) queryParams.append('bedrooms', filters.bedrooms)
        if (filters.bathrooms) queryParams.append('bathrooms', filters.bathrooms)
        if (filters.location) queryParams.append('location', filters.location)
        if (filters.sortBy) queryParams.append('sortBy', filters.sortBy)
        queryParams.append('page', currentPage.toString())
        queryParams.append('limit', propertiesPerPage.toString())

        const response = await fetch(`/api/properties/list?${queryParams.toString()}`)

        if (!response.ok) {
          throw new Error('Failed to fetch properties')
        }

        const data = await response.json()
        setProperties(data.properties)
        setFilteredProperties(data.properties)
        setTotalPages(data.pagination.totalPages)
        setTotalCount(data.pagination.totalCount)
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
  }, [filters, mounted, currentPage, propertiesPerPage])

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }))
    setCurrentPage(1) // Reset to first page when filters change

    // Update URL when listingType changes
    if (key === 'listingType') {
      const query: { type?: string } = {}
      if (value === 'SALE') {
        query.type = 'buy'
      } else if (value === 'RENT') {
        query.type = 'rent'
      }
      // For 'all' (empty value), we don't add type to query

      router.push(
        {
          pathname: '/properties',
          query,
        },
        undefined,
        { shallow: true }
      )
    }
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
      listingType: '',
      bedrooms: '',
      bathrooms: '',
      location: '',
      sortBy: '',
    })
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

  const handleToggleFavorite = async (propertyId: string, currentState: boolean) => {
    if (!session?.user?.id) {
      toast.error('Please login to save favorites')
      router.push('/auth/login')
      return
    }

    try {
      const response = await fetch('/api/properties/toggle-favorite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ propertyId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to toggle favorite')
      }

      const data = await response.json()

      // Update local state
      setFavoriteIds(prev => {
        const newSet = new Set(prev)
        if (data.isFavorited) {
          newSet.add(propertyId)
          toast.success('Added to favorites')
        } else {
          newSet.delete(propertyId)
          toast.success('Removed from favorites')
        }
        return newSet
      })
    } catch (error: any) {
      toast.error(error.message || 'Failed to update favorite')
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
          <div className="mb-6">
            <h1 className="text-2xl font-bold">
              <span className="text-gray-800">Browse</span>{' '}
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Properties
              </span>
            </h1>
          </div>

          {/* Filters Section */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex flex-wrap items-center gap-3">
              {/* Buy/Rent/All Slider Toggle */}
              <div
                className="relative inline-flex items-center bg-white border border-gray-300 rounded-full p-0.5"
                style={{ width: '180px' }}
              >
                <div
                  className="absolute top-0.5 bottom-0.5 bg-blue-600 rounded-full transition-all duration-300 ease-in-out"
                  style={{
                    left:
                      filters.listingType === 'SALE'
                        ? '2px'
                        : filters.listingType === 'RENT'
                          ? 'calc(33.33% + 1px)'
                          : 'calc(66.66%)',
                    width: 'calc(33.33% - 2px)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleFilterChange('listingType', 'SALE')}
                  className={`flex-1 py-1.5 px-2 rounded-full font-medium text-xs transition-colors relative z-10 ${
                    filters.listingType === 'SALE' ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  Buy
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterChange('listingType', 'RENT')}
                  className={`flex-1 py-1.5 px-2 rounded-full font-medium text-xs transition-colors relative z-10 ${
                    filters.listingType === 'RENT' ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  Rent
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterChange('listingType', '')}
                  className={`flex-1 py-1.5 px-2 rounded-full font-medium text-xs transition-colors relative z-10 ${
                    filters.listingType === '' ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  All
                </button>
              </div>

              {/* Property Type Filter */}
              <div className="relative property-type-dropdown">
                <button
                  onClick={() => setShowPropertyTypeDropdown(!showPropertyTypeDropdown)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white pr-8 min-w-[160px] text-left"
                >
                  {filters.propertyType
                    ? `${propertyTypes.find(t => t.value === filters.propertyType)?.icon} ${propertyTypes.find(t => t.value === filters.propertyType)?.label}`
                    : 'All Types'}
                </button>
                <svg
                  className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none"
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
                {showPropertyTypeDropdown && (
                  <div className="absolute z-10 w-full mt-0 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    <div
                      className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                      onClick={() => {
                        handleFilterChange('propertyType', '')
                        setShowPropertyTypeDropdown(false)
                      }}
                    >
                      All Types
                    </div>
                    {propertyTypes.map(type => (
                      <div
                        key={type.value}
                        className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                        onClick={() => {
                          handleFilterChange('propertyType', type.value)
                          setShowPropertyTypeDropdown(false)
                        }}
                      >
                        {type.icon} {type.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bedrooms Filter */}
              {showBedroomsBathroomsFilters && (
                <div className="relative bedrooms-dropdown">
                  <button
                    onClick={() => setShowBedroomsDropdown(!showBedroomsDropdown)}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white pr-8 min-w-[80px] text-left"
                  >
                    {filters.bedrooms || 'Beds'}
                  </button>
                  <svg
                    className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none"
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
                  {showBedroomsDropdown && (
                    <div className="absolute z-10 w-full mt-0 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      <div
                        className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                        onClick={() => {
                          handleFilterChange('bedrooms', '')
                          setShowBedroomsDropdown(false)
                        }}
                      >
                        All
                      </div>
                      {bedroomOptions.map(option => (
                        <div
                          key={option}
                          className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                          onClick={() => {
                            handleFilterChange('bedrooms', option)
                            setShowBedroomsDropdown(false)
                          }}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Bathrooms Filter */}
              {showBedroomsBathroomsFilters && (
                <div className="relative bathrooms-dropdown">
                  <button
                    onClick={() => setShowBathroomsDropdown(!showBathroomsDropdown)}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white pr-8 min-w-[80px] text-left"
                  >
                    {filters.bathrooms || 'Baths'}
                  </button>
                  <svg
                    className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none"
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
                  {showBathroomsDropdown && (
                    <div className="absolute z-10 w-full mt-0 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      <div
                        className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                        onClick={() => {
                          handleFilterChange('bathrooms', '')
                          setShowBathroomsDropdown(false)
                        }}
                      >
                        All
                      </div>
                      {bathroomOptions.map(option => (
                        <div
                          key={option}
                          className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                          onClick={() => {
                            handleFilterChange('bathrooms', option)
                            setShowBathroomsDropdown(false)
                          }}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Location Filter */}
              <div className="relative flex-1 min-w-[250px]">
                <input
                  type="text"
                  value={filters.location}
                  onChange={handleLocationSearch}
                  placeholder="Location..."
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  onFocus={() => predictions.length > 0 && setShowLocationPredictions(true)}
                  onBlur={() => setTimeout(() => setShowLocationPredictions(false), 200)}
                />
                {showLocationPredictions && predictions.length > 0 && (
                  <div className="absolute z-10 w-full top-full -mt-px bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
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
                  className="flex items-center gap-2 px-4 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
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
                  <div className="absolute right-0 mt-0 w-48 bg-white border border-gray-300 rounded-md shadow-lg z-10">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProperties.map(property => {
                const isOwner = session?.user?.email === property.userEmail
                const isFavorited = favoriteIds.has(property.id)
                return (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    isOwner={isOwner}
                    isFavorited={isFavorited}
                    currentUserId={session?.user?.id || null}
                    onMarkAsSold={propertyId => {
                      setSelectedPropertyId(propertyId)
                      setShowSoldModal(true)
                    }}
                    onToggleFavorite={handleToggleFavorite}
                    processing={processing}
                  />
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {!loading && filteredProperties.length > 0 && totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    // Show first page, last page, current page, and pages around current
                    return (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    )
                  })
                  .map((page, index, array) => {
                    // Add ellipsis if there's a gap
                    const prevPage = array[index - 1]
                    const showEllipsis = prevPage && page - prevPage > 1

                    return (
                      <React.Fragment key={page}>
                        {showEllipsis && <span className="px-2 text-gray-400">...</span>}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1.5 text-sm rounded-md ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    )
                  })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>

              <span className="text-sm text-gray-600 ml-4">
                Page {currentPage} of {totalPages} ({totalCount} properties)
              </span>
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
