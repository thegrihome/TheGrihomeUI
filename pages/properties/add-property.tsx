import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import toast from 'react-hot-toast'
import { put } from '@vercel/blob'
import {
  PROPERTY_TYPE_OPTIONS,
  PROPERTY_TYPES,
  SIZE_UNIT_OPTIONS,
  SIZE_UNITS,
  FACING_DIRECTIONS,
} from '@/lib/constants'

export default function AddProperty() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [formData, setFormData] = useState({
    title: '',
    propertyType: '',
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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    // Initialize Google Places Autocomplete
    if (locationInputRef.current && window.google) {
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
    e.preventDefault()
    setLoading(true)

    try {
      // Upload images to Vercel Blob
      const imageUrls: string[] = []
      for (const image of images) {
        const filename = `properties/${session?.user?.id}-${Date.now()}-${image.name}`
        const blob = await put(filename, image, {
          access: 'public',
          contentType: image.type,
        })
        imageUrls.push(blob.url)
      }

      // Create property
      const response = await fetch('/api/properties/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          imageUrls,
          thumbnailUrl: imageUrls[0] || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create property')
      }

      toast.success('Property added successfully!')
      router.push('/properties/my-properties')
    } catch (error) {
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
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Add New Property</h1>

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
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
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
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              {formData.location.address && (
                <p className="mt-2 text-sm text-gray-600">{formData.location.address}</p>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Images (Max 20, Total 10MB)
              </label>
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
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
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
