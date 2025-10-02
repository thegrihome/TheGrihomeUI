import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import { NextSeo } from 'next-seo'
import { Loader } from '@googlemaps/js-api-loader'
import toast from 'react-hot-toast'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface FormData {
  location: string
  neighborhood: string
  city: string
  state: string
  zipcode: string
  builder: string
  project: string
  propertyType: string
  description: string
  size: string
  sizeUnit: string
  plotSize: string
  plotSizeUnit: string
  bedrooms: string
  bathrooms: string
  price: string
  images: File[]
  video: File | null
}

export default function AddProperty() {
  const router = useRouter()
  const { status } = useSession()
  const isAuthenticated = status === 'authenticated'
  const locationInputRef = useRef<HTMLInputElement>(null)

  const [mounted, setMounted] = useState(false)
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([])
  const [showPredictions, setShowPredictions] = useState(false)
  const [autocompleteService, setAutocompleteService] =
    useState<google.maps.places.AutocompleteService | null>(null)
  const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null)

  // Builder search states
  const [builderSearch, setBuilderSearch] = useState('')
  const [showBuilderDropdown, setShowBuilderDropdown] = useState(false)
  const [filteredBuilders, setFilteredBuilders] = useState<typeof builders>([])

  // Initialize filtered builders after builders array is defined
  useEffect(() => {
    setFilteredBuilders(builders)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Close builder dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as Element).closest('.builder-dropdown')) {
        setShowBuilderDropdown(false)
      }
    }

    if (showBuilderDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showBuilderDropdown])

  const [formData, setFormData] = useState<FormData>({
    location: '',
    neighborhood: '',
    city: '',
    state: '',
    zipcode: '',
    builder: '',
    project: '',
    propertyType: '',
    description: '',
    size: '',
    sizeUnit: 'sq-ft',
    plotSize: '',
    plotSizeUnit: 'sq-ft',
    bedrooms: '',
    bathrooms: '',
    price: '',
    images: [],
    video: null,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Mock builders data - replace with actual API call
  const builders = [
    { id: '1', name: 'DLF Limited' },
    { id: '2', name: 'Godrej Properties' },
    { id: '3', name: 'Prestige Group' },
    { id: '4', name: 'Brigade Group' },
    { id: '5', name: 'Sobha Limited' },
    { id: '6', name: 'Mantri Developers' },
    { id: '7', name: 'Raheja Developers' },
    { id: '8', name: 'Lodha Group' },
    { id: '9', name: 'Tata Housing' },
    { id: '10', name: 'Mahindra Lifespace' },
    { id: 'independent', name: 'Independent (Not in list)' },
  ]

  // Property types from forum (matching the database schema)
  const propertyTypes = [
    { value: 'SINGLE_FAMILY', label: 'Villas', icon: '🏡' },
    { value: 'CONDO', label: 'Apartments', icon: '🏢' },
    { value: 'LAND_RESIDENTIAL', label: 'Residential Lands', icon: '🏞️' },
    { value: 'LAND_AGRICULTURE', label: 'Agriculture Lands', icon: '🌾' },
    { value: 'COMMERCIAL', label: 'Commercial Properties', icon: '🏬' },
  ]

  // Mock projects data - replace with actual API call based on builder
  const projectsByBuilder = {
    '1': [
      { id: '1', name: 'DLF City Phase 1' },
      { id: '2', name: 'DLF Cyber City' },
    ],
    '2': [
      { id: '3', name: 'Godrej Summit' },
      { id: '4', name: 'Godrej Nurture' },
    ],
    '3': [
      { id: '5', name: 'Prestige Lakeside Habitat' },
      { id: '6', name: 'Prestige Falcon City' },
    ],
    '4': [
      { id: '7', name: 'Brigade Gateway' },
      { id: '8', name: 'Brigade Cornerstone Utopia' },
    ],
    '5': [
      { id: '9', name: 'Sobha Indraprastha' },
      { id: '10', name: 'Sobha Dream Acres' },
    ],
    '6': [
      { id: '11', name: 'Mantri Espana' },
      { id: '12', name: 'Mantri Alpyne' },
    ],
    '7': [
      { id: '13', name: 'Raheja Residency' },
      { id: '14', name: 'Raheja Atlantis' },
    ],
    '8': [
      { id: '15', name: 'Lodha Belmondo' },
      { id: '16', name: 'Lodha Seamont' },
    ],
    '9': [
      { id: '17', name: 'Tata Primanti' },
      { id: '18', name: 'Tata Promont' },
    ],
    '10': [
      { id: '19', name: 'Mahindra Bloomdale' },
      { id: '20', name: 'Mahindra Windchimes' },
    ],
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    if (!isAuthenticated) {
      router.push('/login')
      return
    }

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
      .importLibrary('places')
      .then(() => {
        const autocompleteService = new google.maps.places.AutocompleteService()
        setAutocompleteService(autocompleteService)

        // Create a temporary div for PlacesService (required by Google Maps API)
        const mapDiv = document.createElement('div')
        const tempMap = new google.maps.Map(mapDiv)
        const placesService = new google.maps.places.PlacesService(tempMap)
        setPlacesService(placesService)
      })
      .catch(() => {
        // Error loading Google Maps API - fail silently
      })
  }, [mounted, isAuthenticated, router])

  const handleLocationInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setFormData(prev => ({ ...prev, location: query }))

    if (query.length > 2 && autocompleteService) {
      autocompleteService.getPlacePredictions(
        {
          input: query,
          componentRestrictions: { country: 'IN' },
          types: ['address'],
        },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setPredictions(predictions)
            setShowPredictions(true)
          } else {
            setPredictions([])
            setShowPredictions(false)
          }
        }
      )
    } else {
      setPredictions([])
      setShowPredictions(false)
    }
  }

  const handleLocationSelect = (prediction: google.maps.places.AutocompletePrediction) => {
    setFormData(prev => ({ ...prev, location: prediction.description }))
    setShowPredictions(false)

    // Get detailed place information
    if (placesService && prediction.place_id) {
      placesService.getDetails(
        {
          placeId: prediction.place_id,
          fields: ['address_components', 'formatted_address'],
        },
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place?.address_components) {
            const addressComponents = place.address_components

            let neighborhood = ''
            let city = ''
            let state = ''
            let zipcode = ''

            // Parse address components
            const neighborhoodParts: string[] = []

            addressComponents.forEach(component => {
              const types = component.types

              // Collect all neighborhood/sublocality information
              if (
                types.includes('sublocality_level_1') ||
                types.includes('sublocality_level_2') ||
                types.includes('sublocality') ||
                types.includes('neighborhood')
              ) {
                neighborhoodParts.push(component.long_name)
              } else if (types.includes('locality')) {
                city = component.long_name
              } else if (types.includes('administrative_area_level_1')) {
                state = component.long_name
              } else if (types.includes('postal_code')) {
                zipcode = component.long_name
              }

              // Fallback for city
              if (!city && types.includes('administrative_area_level_2')) {
                city = component.long_name
              }
            })

            // Combine neighborhood parts, removing duplicates and empty values
            neighborhood = [...new Set(neighborhoodParts.filter(part => part && part.trim()))].join(
              ', '
            )

            // Update form data with parsed location details
            setFormData(prev => ({
              ...prev,
              neighborhood,
              city,
              state,
              zipcode,
            }))

            // Location details captured and stored in form state

            // Show toast with parsed information
            toast.success(
              `Location details captured: ${city}, ${state}${zipcode ? ' - ' + zipcode : ''}`
            )
          }
        }
      )
    }
  }

  const handleBuilderSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setBuilderSearch(query)

    // Filter builders based on search
    const filtered = builders.filter(builder =>
      builder.name.toLowerCase().includes(query.toLowerCase())
    )
    setFilteredBuilders(filtered)
  }

  const handleBuilderSelect = (builder: (typeof builders)[0]) => {
    setFormData(prev => ({ ...prev, builder: builder.id, project: '' }))
    setShowBuilderDropdown(false)
    setBuilderSearch('') // Clear search when selecting
  }

  const handleBuilderDropdownToggle = () => {
    setShowBuilderDropdown(!showBuilderDropdown)
    if (!showBuilderDropdown) {
      setFilteredBuilders(builders)
      setBuilderSearch('')
    }
  }

  const getSelectedBuilderName = () => {
    const selected = builders.find(b => b.id === formData.builder)
    return selected ? selected.name : 'Select Builder'
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // Reset project when builder changes
    if (name === 'builder') {
      setFormData(prev => ({ ...prev, project: '' }))
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    if (files.length > 20) {
      toast.error('Maximum 20 images allowed')
      e.target.value = '' // Clear the input
      return
    }

    // Check individual file size (1MB = 1024 * 1024 bytes)
    const oversizedFiles = files.filter(file => file.size > 1024 * 1024)
    if (oversizedFiles.length > 0) {
      toast.error(
        `Each image must be less than 1MB. Found ${oversizedFiles.length} oversized file(s)`
      )
      e.target.value = '' // Clear the input
      return
    }

    // Check total size (20MB limit)
    const totalSize = files.reduce((sum, file) => sum + file.size, 0)
    const totalSizeMB = totalSize / (1024 * 1024)

    if (totalSize > 20 * 1024 * 1024) {
      toast.error(
        `Total images size must be less than 20MB. Current size: ${totalSizeMB.toFixed(2)}MB`
      )
      e.target.value = '' // Clear the input
      return
    }

    setFormData(prev => ({ ...prev, images: files }))
    toast.success(`${files.length} image(s) selected (${totalSizeMB.toFixed(2)}MB total)`)
  }

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (!file) {
      setFormData(prev => ({ ...prev, video: null }))
      return
    }

    const fileSizeMB = file.size / (1024 * 1024)

    if (file.size > 20 * 1024 * 1024) {
      toast.error(`Video must be less than 20MB. Current size: ${fileSizeMB.toFixed(2)}MB`)
      e.target.value = '' // Clear the input
      return
    }

    setFormData(prev => ({ ...prev, video: file }))
    toast.success(`Video selected (${fileSizeMB.toFixed(2)}MB)`)
  }

  const validateForm = () => {
    if (!formData.location) {
      toast.error('Please select a location')
      return false
    }
    if (!formData.builder) {
      toast.error('Please select a builder')
      return false
    }
    if (formData.builder !== 'independent' && !formData.project) {
      toast.error('Please select a project')
      return false
    }
    if (!formData.propertyType) {
      toast.error('Please select property type')
      return false
    }
    if (!formData.description.trim()) {
      toast.error('Please enter description')
      return false
    }
    if (!formData.size) {
      toast.error('Please enter size')
      return false
    }
    if (!formData.price) {
      toast.error('Please enter price')
      return false
    }

    // Validate images
    if (formData.images.length > 0) {
      // Check individual image sizes (1MB each)
      const oversizedImages = formData.images.filter(file => file.size > 1024 * 1024)
      if (oversizedImages.length > 0) {
        toast.error(`${oversizedImages.length} image(s) exceed 1MB limit`)
        return false
      }

      // Check total images size (20MB total)
      const totalImageSize = formData.images.reduce((sum, file) => sum + file.size, 0)
      if (totalImageSize > 20 * 1024 * 1024) {
        const totalSizeMB = totalImageSize / (1024 * 1024)
        toast.error(`Total images size exceeds 20MB limit (${totalSizeMB.toFixed(2)}MB)`)
        return false
      }

      // Check image count
      if (formData.images.length > 20) {
        toast.error('Maximum 20 images allowed')
        return false
      }
    }

    // Validate video
    if (formData.video) {
      if (formData.video.size > 20 * 1024 * 1024) {
        const videoSizeMB = formData.video.size / (1024 * 1024)
        toast.error(`Video exceeds 20MB limit (${videoSizeMB.toFixed(2)}MB)`)
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      // Final validation before submission
      const totalImageSize = formData.images.reduce((sum, file) => sum + file.size, 0)
      const totalSizeMB = totalImageSize / (1024 * 1024)

      if (totalImageSize > 20 * 1024 * 1024) {
        toast.error(
          `Total size exceeds 20MB (${totalSizeMB.toFixed(2)}MB). Please reduce file sizes.`
        )
        setIsSubmitting(false)
        return
      }

      // Create FormData for file uploads
      const submitData = new FormData()

      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'images') {
          formData.images.forEach((image, index) => {
            submitData.append(`image_${index}`, image)
          })
          submitData.append('imageCount', formData.images.length.toString())
        } else if (key === 'video' && value) {
          submitData.append('video', value)
        } else if (typeof value === 'string' || typeof value === 'number') {
          submitData.append(key, value.toString())
        }
      })

      // Add file size information for server validation
      submitData.append('totalImageSize', totalImageSize.toString())
      if (formData.video) {
        submitData.append('videoSize', formData.video.size.toString())
      }

      toast.loading('Uploading property... Please wait')

      // TODO: Replace with actual API endpoint
      const response = await fetch('/api/properties/create', {
        method: 'POST',
        body: submitData,
      })

      toast.dismiss() // Remove loading toast

      if (response.ok) {
        toast.success('Property added successfully!')
        // Reset form
        setFormData({
          location: '',
          neighborhood: '',
          city: '',
          state: '',
          zipcode: '',
          builder: '',
          project: '',
          propertyType: '',
          description: '',
          size: '',
          sizeUnit: 'sq-ft',
          plotSize: '',
          plotSizeUnit: 'sq-ft',
          bedrooms: '',
          bathrooms: '',
          price: '',
          images: [],
          video: null,
        })
        setBuilderSearch('')
        router.push('/properties')
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to add property')
      }
    } catch (error) {
      toast.dismiss() // Remove loading toast
      // Error handled by toast notification
      toast.error('Network error. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const showPlotSizeField =
    formData.propertyType === 'SINGLE_FAMILY' || formData.propertyType === 'CONDO'
  const showBedroomsBathroomsFields =
    formData.propertyType === 'SINGLE_FAMILY' || formData.propertyType === 'CONDO'

  // Show loading state during hydration
  if (!mounted) {
    return (
      <>
        <NextSeo
          title="Add Property - GRIHOME"
          description="Add your property to GRIHOME marketplace"
        />
        <Header />
        <main className="add-property-main">
          <div className="add-property-container">
            <div className="add-property-card">
              <div className="loading-skeleton">
                <div className="skeleton-title"></div>
                <div className="add-property-form">
                  <div className="skeleton-field"></div>
                  <div className="skeleton-input"></div>
                  <div className="skeleton-field"></div>
                  <div className="skeleton-input"></div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  // Redirect to login if not authenticated (only after mounting)
  if (!isAuthenticated) {
    return (
      <>
        <NextSeo
          title="Add Property - GRIHOME"
          description="Add your property to GRIHOME marketplace"
        />
        <Header />
        <main className="add-property-main">
          <div className="add-property-container">
            <div className="add-property-card auth-required">
              <h1 className="auth-required__title">Authentication Required</h1>
              <p className="auth-required__text">Please sign in to add a property.</p>
              <div className="auth-required__spinner"></div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <NextSeo
        title="Add Property - GRIHOME"
        description="Add your property to GRIHOME marketplace"
      />
      <Header />

      <main className="add-property-main">
        <div className="add-property-container">
          <div className="add-property-card">
            <h1 className="add-property-title">Add New Property</h1>

            <form onSubmit={handleSubmit} className="add-property-form">
              {/* Location */}
              <div className="relative">
                <label htmlFor="location" className="form-field__label">
                  Location *
                </label>
                <input
                  ref={locationInputRef}
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleLocationInput}
                  placeholder="Enter city or location"
                  className="form-field__input"
                  required
                />

                {showPredictions && predictions.length > 0 && (
                  <div className="predictions-dropdown">
                    {predictions.map((prediction, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleLocationSelect(prediction)}
                        className="prediction-item"
                      >
                        {prediction.description}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Location Details Display */}
              {(formData.city || formData.state || formData.zipcode || formData.neighborhood) && (
                <div className="location-info">
                  <h3 className="location-info__title">📍 Location Details Captured:</h3>
                  <div className="location-info__grid">
                    {formData.neighborhood && (
                      <div>
                        <span className="location-info__label">Neighborhood:</span>
                        <div>{formData.neighborhood}</div>
                      </div>
                    )}
                    {formData.city && (
                      <div>
                        <span className="location-info__label">City:</span>
                        <div>{formData.city}</div>
                      </div>
                    )}
                    {formData.state && (
                      <div>
                        <span className="location-info__label">State:</span>
                        <div>{formData.state}</div>
                      </div>
                    )}
                    {formData.zipcode && (
                      <div>
                        <span className="location-info__label">Zipcode:</span>
                        <div>{formData.zipcode}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Zipcode */}
              <div>
                <label htmlFor="zipcode" className="form-field__label">
                  Zipcode
                </label>
                <input
                  type="text"
                  id="zipcode"
                  name="zipcode"
                  value={formData.zipcode}
                  onChange={handleInputChange}
                  placeholder="Enter zipcode"
                  className="form-field__input"
                />
              </div>

              {/* Builder */}
              <div className="relative builder-dropdown">
                <label htmlFor="builder" className="form-field__label">
                  Builder *
                </label>
                <button
                  type="button"
                  onClick={handleBuilderDropdownToggle}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-left bg-white flex items-center justify-between"
                >
                  <span className={formData.builder ? 'text-gray-900' : 'text-gray-500'}>
                    {getSelectedBuilderName()}
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${showBuilderDropdown ? 'rotate-180' : ''}`}
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

                {showBuilderDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                    <div className="p-3 border-b border-gray-200">
                      <input
                        type="text"
                        placeholder="Search builders..."
                        value={builderSearch}
                        onChange={handleBuilderSearch}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-60 overflow-auto">
                      {filteredBuilders.length > 0 ? (
                        filteredBuilders.map(builder => (
                          <button
                            key={builder.id}
                            type="button"
                            onClick={() => handleBuilderSelect(builder)}
                            className={`w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                              formData.builder === builder.id
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-900'
                            }`}
                          >
                            {builder.name}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-gray-500 text-center">No builders found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Project (conditional) */}
              {formData.builder && formData.builder !== 'independent' && (
                <div>
                  <label htmlFor="project" className="form-field__label">
                    Project *
                  </label>
                  <select
                    id="project"
                    name="project"
                    value={formData.project}
                    onChange={handleInputChange}
                    className="form-field__input"
                    required
                  >
                    <option value="">Select Project</option>
                    {projectsByBuilder[formData.builder as keyof typeof projectsByBuilder]?.map(
                      project => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      )
                    )}
                  </select>
                </div>
              )}

              {/* Property Type */}
              <div className="relative">
                <label htmlFor="propertyType" className="form-field__label">
                  Property Type *
                </label>
                <div className="relative">
                  <select
                    id="propertyType"
                    name="propertyType"
                    value={formData.propertyType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white pr-10"
                    required
                  >
                    <option value="">Select Property Type</option>
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

              {/* Description */}
              <div>
                <label htmlFor="description" className="form-field__label">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Describe your property..."
                  className="form-field__input"
                  required
                />
              </div>

              {/* Size */}
              <div className="size-input-group">
                <div>
                  <label htmlFor="size" className="form-field__label">
                    Size *
                  </label>
                  <input
                    type="number"
                    id="size"
                    name="size"
                    value={formData.size}
                    onChange={handleInputChange}
                    placeholder="Enter size"
                    className="form-field__input"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="sizeUnit" className="form-field__label">
                    Unit *
                  </label>
                  <div className="relative">
                    <select
                      id="sizeUnit"
                      name="sizeUnit"
                      value={formData.sizeUnit}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white pr-10"
                    >
                      <option value="sq-ft">Square Feet</option>
                      <option value="sq-yards">Square Yards</option>
                      <option value="acres">Acres</option>
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
              </div>

              {/* Plot Size / UDS (conditional) */}
              {showPlotSizeField && (
                <div className="size-input-group">
                  <div>
                    <label htmlFor="plotSize" className="form-field__label">
                      {formData.propertyType === 'CONDO' ? 'UDS' : 'Plot Size'}
                    </label>
                    <input
                      type="number"
                      id="plotSize"
                      name="plotSize"
                      value={formData.plotSize}
                      onChange={handleInputChange}
                      placeholder={`Enter ${formData.propertyType === 'CONDO' ? 'UDS' : 'plot size'}`}
                      className="form-field__input"
                    />
                  </div>
                  <div>
                    <label htmlFor="plotSizeUnit" className="form-field__label">
                      Unit
                    </label>
                    <div className="relative">
                      <select
                        id="plotSizeUnit"
                        name="plotSizeUnit"
                        value={formData.plotSizeUnit}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white pr-10"
                      >
                        <option value="sq-ft">Square Feet</option>
                        <option value="sq-yards">Square Yards</option>
                        <option value="acres">Acres</option>
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
                </div>
              )}

              {/* Bedrooms and Bathrooms (conditional) */}
              {showBedroomsBathroomsFields && (
                <div className="size-input-group">
                  <div>
                    <label htmlFor="bedrooms" className="form-field__label">
                      Number of Bedrooms
                    </label>
                    <select
                      id="bedrooms"
                      name="bedrooms"
                      value={formData.bedrooms}
                      onChange={handleInputChange}
                      className="form-field__input"
                    >
                      <option value="">Select</option>
                      <option value="1">1 BHK</option>
                      <option value="2">2 BHK</option>
                      <option value="3">3 BHK</option>
                      <option value="4">4 BHK</option>
                      <option value="5">5+ BHK</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="bathrooms" className="form-field__label">
                      Number of Bathrooms
                    </label>
                    <select
                      id="bathrooms"
                      name="bathrooms"
                      value={formData.bathrooms}
                      onChange={handleInputChange}
                      className="form-field__input"
                    >
                      <option value="">Select</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5+</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Price */}
              <div>
                <label htmlFor="price" className="form-field__label">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="Enter price in rupees"
                  className="form-field__input"
                  required
                />
              </div>

              {/* Images */}
              <div>
                <label htmlFor="images" className="form-field__label">
                  Images (Max 20, 1MB each, 20MB total)
                </label>
                <input
                  type="file"
                  id="images"
                  name="images"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="form-field__input"
                />
                {formData.images.length > 0 && (
                  <div className="file-upload__hint">
                    <p>{formData.images.length} image(s) selected</p>
                    <p>
                      Total size:{' '}
                      {(
                        formData.images.reduce((sum, file) => sum + file.size, 0) /
                        (1024 * 1024)
                      ).toFixed(2)}
                      MB / 20MB
                    </p>
                  </div>
                )}
              </div>

              {/* Video */}
              <div>
                <label htmlFor="video" className="form-field__label">
                  Walk-through Video (Max 20MB)
                </label>
                <input
                  type="file"
                  id="video"
                  name="video"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="form-field__input"
                />
                {formData.video && (
                  <p className="file-upload__hint">Video selected: {formData.video.name}</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Adding Property...' : 'Add Property'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}
