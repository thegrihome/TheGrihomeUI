import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import toast from 'react-hot-toast'
import {
  PROPERTY_TYPE_OPTIONS,
  PROPERTY_TYPES,
  SIZE_UNIT_OPTIONS,
  SIZE_UNITS,
  FACING_DIRECTIONS,
} from '@/lib/constants'

interface Project {
  id: string
  name: string
  builder: {
    name: string
  }
  location: {
    city: string
    state: string
  }
}

export default function AddProperty() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [projectSearch, setProjectSearch] = useState('')
  const [showProjectDropdown, setShowProjectDropdown] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    propertyType: '',
    listingType: 'SALE' as 'SALE' | 'RENT',
    projectId: '',
    projectName: '',
    bedrooms: '',
    bathrooms: '',
    propertySize: '',
    propertySizeUnit: SIZE_UNITS.SQ_FT,
    plotSize: '',
    plotSizeUnit: SIZE_UNITS.SQ_FT,
    facing: '',
    description: '',
    price: '',
    location: {
      address: '',
      city: '',
      state: '',
      country: '',
      zipcode: '',
      locality: '',
      lat: 0,
      lng: 0,
    },
  })

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const locationInputRef = useRef<HTMLInputElement>(null)
  const projectDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  const [isVerified, setIsVerified] = useState(true)
  const [verificationStatus, setVerificationStatus] = useState({
    emailVerified: false,
    mobileVerified: false,
  })

  useEffect(() => {
    const checkVerification = async () => {
      if (status === 'authenticated' && session?.user?.email) {
        try {
          const response = await fetch('/api/user/info')
          if (response.ok) {
            const data = await response.json()
            const emailVerified = !!data.user.emailVerified
            const mobileVerified = !!data.user.mobileVerified
            setVerificationStatus({ emailVerified, mobileVerified })
            setIsVerified(emailVerified || mobileVerified)
          }
        } catch (error) {
          // Handle error silently
        }
      }
    }
    checkVerification()
  }, [status, session])

  useEffect(() => {
    // Load all projects on mount
    const loadAllProjects = async () => {
      try {
        const response = await fetch('/api/projects/search?query=')
        if (response.ok) {
          const data = await response.json()
          setProjects(data.projects || [])
        }
      } catch (error) {
        // Failed to load projects
      }
    }

    loadAllProjects()
  }, [])

  useEffect(() => {
    // Typeahead search for projects
    const searchProjects = async () => {
      if (!projectSearch) {
        // Load all projects if search is cleared
        try {
          const response = await fetch('/api/projects/search?query=')
          if (response.ok) {
            const data = await response.json()
            setProjects(data.projects || [])
          }
        } catch (error) {
          // Failed to load projects
        }
        return
      }

      try {
        const response = await fetch(
          `/api/projects/search?query=${encodeURIComponent(projectSearch)}`
        )
        if (response.ok) {
          const data = await response.json()
          setProjects(data.projects || [])
        }
      } catch (error) {
        // Failed to search projects
      }
    }

    const debounceTimer = setTimeout(searchProjects, 300)
    return () => clearTimeout(debounceTimer)
  }, [projectSearch])

  useEffect(() => {
    // Close project dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (
        projectDropdownRef.current &&
        !projectDropdownRef.current.contains(event.target as Node)
      ) {
        setShowProjectDropdown(false)
      }
    }

    if (showProjectDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showProjectDropdown])

  useEffect(() => {
    // Initialize Google Places Autocomplete
    const initAutocomplete = () => {
      if (locationInputRef.current && window.google?.maps?.places) {
        autocompleteRef.current = new google.maps.places.Autocomplete(locationInputRef.current, {
          types: ['geocode'],
          componentRestrictions: { country: 'in' },
        })

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current?.getPlace()
          if (!place?.geometry?.location) return

          const addressComponents = place.address_components || []
          let city = ''
          let state = ''
          let country = ''
          let zipcode = ''
          let locality = ''

          addressComponents.forEach(component => {
            const types = component.types
            if (types.includes('locality')) city = component.long_name
            if (types.includes('administrative_area_level_1')) state = component.long_name
            if (types.includes('country')) country = component.long_name
            if (types.includes('postal_code')) zipcode = component.long_name
            if (types.includes('sublocality_level_1') || types.includes('sublocality'))
              locality = component.long_name
          })

          const location = place.geometry.location

          setFormData(prev => ({
            ...prev,
            location: {
              address: place.formatted_address || '',
              city,
              state,
              country,
              zipcode,
              locality,
              lat: location.lat(),
              lng: location.lng(),
            },
          }))
        })
      }
    }

    // Wait for Google Maps to fully load
    const checkGoogle = setInterval(() => {
      if (window.google?.maps?.places) {
        clearInterval(checkGoogle)
        initAutocomplete()
      }
    }, 100)

    // Cleanup
    return () => clearInterval(checkGoogle)
  }, [])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    if (images.length + files.length > 20) {
      toast.error('Maximum 20 images allowed')
      return
    }

    const totalSize = [...images, ...files].reduce((sum, file) => sum + file.size, 0)
    if (totalSize > 10 * 1024 * 1024) {
      toast.error('Total image size must not exceed 10MB')
      return
    }

    setImages(prev => [...prev, ...files])

    // Generate previews
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    // eslint-disable-next-line no-console
    console.log('handleSubmit function called!')
    e.preventDefault()
    // eslint-disable-next-line no-console
    console.log('Form submitted', { formData, images })

    // Validate location
    if (!formData.location.address) {
      toast.error('Please select a location from the dropdown')
      return
    }

    setLoading(true)

    try {
      // Upload images via API
      const imageUrls: string[] = []
      if (images.length > 0) {
        // eslint-disable-next-line no-console
        console.log('Uploading images...', images.length)
        toast.loading('Uploading images...', { id: 'upload' })

        // Convert images to base64
        const imageDataArray = await Promise.all(
          images.map(
            image =>
              new Promise<{ name: string; type: string; data: string }>((resolve, reject) => {
                const reader = new FileReader()
                reader.onloadend = () => {
                  resolve({
                    name: image.name,
                    type: image.type,
                    data: reader.result as string,
                  })
                }
                reader.onerror = reject
                reader.readAsDataURL(image)
              })
          )
        )

        const uploadResponse = await fetch('/api/upload-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ images: imageDataArray }),
        })

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload images')
        }

        const { imageUrls: uploadedUrls } = await uploadResponse.json()
        imageUrls.push(...uploadedUrls)

        toast.dismiss('upload')
        // eslint-disable-next-line no-console
        console.log('All images uploaded successfully', imageUrls)
      }

      // Create property
      toast.loading('Creating property...', { id: 'create' })
      const response = await fetch('/api/properties/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          imageUrls,
          thumbnailUrl: imageUrls[0] || null,
        }),
      })

      toast.dismiss('create')

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create property')
      }

      toast.success('Property added successfully!')
      router.push('/properties/my-properties')
    } catch (error) {
      toast.dismiss('upload')
      toast.dismiss('create')
      toast.error(error instanceof Error ? error.message : 'Failed to add property')
    } finally {
      setLoading(false)
    }
  }

  const showBedroomsBathrooms =
    formData.propertyType === PROPERTY_TYPES.SINGLE_FAMILY ||
    formData.propertyType === PROPERTY_TYPES.CONDO ||
    formData.propertyType === PROPERTY_TYPES.TOWNHOUSE

  const showPlotSize = showBedroomsBathrooms

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Add New Property</h1>

          {/* Listing Type Toggle */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Listing Type <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, listingType: 'SALE' }))}
                className={`flex-1 py-3 px-6 rounded-md font-medium transition-all ${
                  formData.listingType === 'SALE'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Sell
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, listingType: 'RENT' }))}
                className={`flex-1 py-3 px-6 rounded-md font-medium transition-all ${
                  formData.listingType === 'RENT'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Rent
              </button>
            </div>
          </div>

          {/* Verification Warning Banner */}
          {!isVerified && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-red-800">Verification Required</h3>
                  <p className="mt-2 text-sm text-red-700">
                    You need to verify at least your email or mobile number to post a property.
                    Please verify your account to continue.
                  </p>
                  <div className="mt-4">
                    <button
                      onClick={() => router.push('/auth/userinfo')}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Verify Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading Overlay */}
          {loading && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-8 flex flex-col items-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
                <p className="text-lg font-medium text-gray-900">Processing your property...</p>
                <p className="text-sm text-gray-600 mt-2">Please wait, do not close this page</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 3 BHK Apartment in Gachibowli"
              />
            </div>

            {/* Property Type */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Type <span className="text-red-500">*</span>
              </label>
              <select
                name="propertyType"
                value={formData.propertyType}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Type</option>
                {PROPERTY_TYPE_OPTIONS.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Project */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Project</label>
              <div className="relative" ref={projectDropdownRef}>
                <input
                  type="text"
                  value={projectSearch || formData.projectName}
                  onChange={e => {
                    setProjectSearch(e.target.value)
                    setFormData(prev => ({ ...prev, projectName: '', projectId: '' }))
                    setShowProjectDropdown(true)
                  }}
                  onFocus={() => setShowProjectDropdown(true)}
                  placeholder="Search for a project or select 'Independent'"
                  className={`w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    showProjectDropdown ? 'rounded-t-md' : 'rounded-md'
                  }`}
                />
                {showProjectDropdown && (
                  <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-b-md shadow-lg max-h-60 overflow-y-auto top-full">
                    <div
                      className="px-3 py-2 hover:bg-blue-50 cursor-pointer bg-blue-600 text-white"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          projectId: '',
                          projectName: 'Independent',
                        }))
                        setProjectSearch('Independent')
                        setShowProjectDropdown(false)
                      }}
                    >
                      <div className="font-medium">Independent</div>
                      <div className="text-xs opacity-90">Not part of any project</div>
                    </div>
                    {projectSearch.length >= 2 && projects.length === 0 && (
                      <div className="px-3 py-2 text-gray-500 text-sm">
                        No projects found. Type to search or select &quot;Independent&quot;
                      </div>
                    )}
                    {projects.map(project => (
                      <div
                        key={project.id}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-t"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            projectId: project.id,
                            projectName: project.name,
                          }))
                          setProjectSearch('')
                          setShowProjectDropdown(false)
                        }}
                      >
                        <div className="font-medium">{project.name}</div>
                        <div className="text-xs text-gray-500">
                          {project.builder.name} • {project.location.city}, {project.location.state}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bedrooms & Bathrooms */}
            {showBedroomsBathrooms && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bedrooms <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="bedrooms"
                      value={formData.bedrooms}
                      onChange={handleInputChange}
                      required
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bathrooms <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="bathrooms"
                      value={formData.bathrooms}
                      onChange={handleInputChange}
                      required
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Property Size */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Size <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  name="propertySize"
                  value={formData.propertySize}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Size"
                />
                <select
                  name="propertySizeUnit"
                  value={formData.propertySizeUnit}
                  onChange={handleInputChange}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {SIZE_UNIT_OPTIONS.map(unit => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Plot Size */}
            {showPlotSize && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Plot Size</label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    name="plotSize"
                    value={formData.plotSize}
                    onChange={handleInputChange}
                    min="1"
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Plot Size"
                  />
                  <select
                    name="plotSizeUnit"
                    value={formData.plotSizeUnit}
                    onChange={handleInputChange}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {SIZE_UNIT_OPTIONS.map(unit => (
                      <option key={unit.value} value={unit.value}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Facing */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Facing <span className="text-red-500">*</span>
              </label>
              <select
                name="facing"
                value={formData.facing}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Facing</option>
                {FACING_DIRECTIONS.map(facing => (
                  <option key={facing} value={facing}>
                    {facing}
                  </option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                ref={locationInputRef}
                type="text"
                placeholder="Search for location..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              {formData.location.address ? (
                <p className="mt-2 text-sm text-gray-600">
                  ✓ Selected: {formData.location.address}
                </p>
              ) : (
                <p className="mt-2 text-sm text-red-600">
                  * Please select a location from dropdown
                </p>
              )}
            </div>

            {/* Price */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 5000000"
              />
            </div>

            {/* Description */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe your property..."
              />
            </div>

            {/* Images */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Images (Max 20, Total 10MB)
                </label>
                {images.length > 0 && (
                  <span className="text-sm text-gray-600">
                    {images.length} image{images.length !== 1 ? 's' : ''} •{' '}
                    {(images.reduce((sum, img) => sum + img.size, 0) / (1024 * 1024)).toFixed(2)} MB
                  </span>
                )}
              </div>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />
              <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
              >
                <div className="flex flex-col items-center justify-center">
                  <svg
                    className="w-10 h-10 mb-2 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="text-gray-600">
                    <span className="text-blue-600 font-medium">Click here</span> to upload images
                  </p>
                </div>
              </label>
              {imagePreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <Image
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        width={200}
                        height={150}
                        className="w-full h-32 object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !isVerified}
                onClick={() => {
                  // eslint-disable-next-line no-console
                  console.log('Submit button clicked!')
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Adding Property...' : 'Add Property'}
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  )
}
