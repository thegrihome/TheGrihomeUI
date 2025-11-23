import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import { NextSeo } from 'next-seo'
import { Loader } from '@googlemaps/js-api-loader'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import BuilderSelector from '@/components/projects/BuilderSelector'
import DynamicList from '@/components/projects/DynamicList'
import ImageUploader from '@/components/projects/ImageUploader'
import toast from 'react-hot-toast'

export default function SubmitProject() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [propertyType, setPropertyType] = useState('')
  const [builderId, setBuilderId] = useState<string | null>(null)
  const [brochureUrl, setBrochureUrl] = useState('')
  const [brochurePdf, setBrochurePdf] = useState<string | null>(null)
  const [locationAddress, setLocationAddress] = useState('')
  const [highlights, setHighlights] = useState<string[]>([])
  const [amenities, setAmenities] = useState<string[]>([])
  const [walkthroughVideoUrl, setWalkthroughVideoUrl] = useState('')
  const [walkthroughVideo, setWalkthroughVideo] = useState<string | null>(null)

  // Dropdown state
  const [showPropertyTypeDropdown, setShowPropertyTypeDropdown] = useState(false)

  // Image state
  const [bannerImage, setBannerImage] = useState<string[]>([])
  const [floorplanImages, setFloorplanImages] = useState<string[]>([])
  const [clubhouseImages, setClubhouseImages] = useState<string[]>([])
  const [galleryImages, setGalleryImages] = useState<string[]>([])

  // Google Maps autocomplete refs
  const locationInputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  // Property type options - using standardized types
  const propertyTypeOptions = [
    { value: 'SINGLE_FAMILY', label: 'Villas', icon: '🏡' },
    { value: 'CONDO', label: 'Apartments', icon: '🏢' },
    { value: 'LAND_RESIDENTIAL', label: 'Residential Lands', icon: '🏞️' },
    { value: 'LAND_AGRICULTURE', label: 'Agriculture Lands', icon: '🌾' },
    { value: 'COMMERCIAL', label: 'Commercial', icon: '🏬' },
  ]

  // Handle click outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement

      if (!target.closest('.property-type-dropdown')) {
        setShowPropertyTypeDropdown(false)
      }
    }

    if (showPropertyTypeDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showPropertyTypeDropdown])

  // Initialize Google Maps Autocomplete
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      // eslint-disable-next-line no-console
      console.warn('Google Maps API key not found')
      return
    }

    const initializeAutocomplete = () => {
      if (locationInputRef.current && window.google?.maps?.places?.Autocomplete) {
        autocompleteRef.current = new google.maps.places.Autocomplete(locationInputRef.current, {
          types: ['geocode'],
          componentRestrictions: { country: 'in' },
        })

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current?.getPlace()
          if (place?.formatted_address) {
            setLocationAddress(place.formatted_address)
          }
        })
      }
    }

    // Check if Google Maps is already loaded
    if (window.google?.maps?.places?.Autocomplete) {
      initializeAutocomplete()
      return
    }

    // Load Google Maps API
    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places'],
    })

    loader
      .load()
      .then(() => {
        initializeAutocomplete()
      })
      .catch(error => {
        // eslint-disable-next-line no-console
        console.error('Error loading Google Maps API:', error)
      })
  }, [])

  // Redirect if not authenticated
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    router.push('/auth/login')
    return null
  }

  const handleBrochurePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('PDF file size must not exceed 10MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setBrochurePdf(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('video/')) {
      toast.error('Please upload a video file')
      return
    }

    if (file.size > 100 * 1024 * 1024) {
      toast.error('Video file size must not exceed 100MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setWalkthroughVideo(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!name.trim()) {
      toast.error('Project name is required')
      return
    }
    if (!description.trim()) {
      toast.error('Description is required')
      return
    }
    if (!builderId) {
      toast.error('Please select a builder')
      return
    }
    if (!locationAddress.trim()) {
      toast.error('Location is required')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/projects/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          propertyType: propertyType || null,
          builderId,
          brochureUrl: brochureUrl.trim() || null,
          brochurePdfBase64: brochurePdf || null,
          locationAddress: locationAddress.trim(),
          bannerImageBase64: bannerImage[0] || null,
          highlights: highlights.length > 0 ? highlights : null,
          amenities: amenities.length > 0 ? amenities : null,
          floorplanImagesBase64: floorplanImages,
          clubhouseImagesBase64: clubhouseImages,
          galleryImagesBase64: galleryImages,
          walkthroughVideoUrl: walkthroughVideoUrl.trim() || null,
          walkthroughVideoBase64: walkthroughVideo || null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Project submitted successfully!')
        router.push(`/projects/${data.project.id}`)
      } else {
        toast.error(data.message || 'Failed to submit project')
      }
    } catch (error) {
      toast.error('Error submitting project')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NextSeo
        title="Submit Project | Grihome"
        description="Submit a new real estate project to Grihome"
      />
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Submit New Project</h1>
          <p className="text-gray-600 mb-8">
            Share your real estate project with potential buyers and agents
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">
                Basic Information
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g., My Home Apas"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe your project..."
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Type
                </label>
                <div className="relative property-type-dropdown">
                  <button
                    type="button"
                    onClick={() => setShowPropertyTypeDropdown(!showPropertyTypeDropdown)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-left"
                  >
                    {propertyType
                      ? `${propertyTypeOptions.find(t => t.value === propertyType)?.icon} ${propertyTypeOptions.find(t => t.value === propertyType)?.label}`
                      : 'Select Property Type'}
                  </button>
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
                  {showPropertyTypeDropdown && (
                    <div className="absolute z-10 w-full top-full mt-0 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      <div
                        className="px-4 py-3 hover:bg-blue-50 cursor-pointer text-gray-500"
                        onClick={() => {
                          setPropertyType('')
                          setShowPropertyTypeDropdown(false)
                        }}
                      >
                        Select Property Type
                      </div>
                      {propertyTypeOptions.map(option => (
                        <div
                          key={option.value}
                          className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex items-center gap-2"
                          onClick={() => {
                            setPropertyType(option.value)
                            setShowPropertyTypeDropdown(false)
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Builder <span className="text-red-500">*</span>
                </label>
                <BuilderSelector value={builderId} onChange={setBuilderId} className="w-full" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exact Google Maps Location <span className="text-red-500">*</span>
                </label>
                <input
                  ref={locationInputRef}
                  type="text"
                  value={locationAddress}
                  onChange={e => setLocationAddress(e.target.value)}
                  placeholder="Start typing address... (e.g., Kokapet, Hyderabad, Telangana)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Start typing and select from Google Maps suggestions for accurate location
                </p>
              </div>
            </div>

            {/* Brochure */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">
                Project Brochure
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brochure Link or PDF Upload
                </label>
                <input
                  type="url"
                  value={brochureUrl}
                  onChange={e => setBrochureUrl(e.target.value)}
                  placeholder="https://example.com/brochure.pdf"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                  disabled={!!brochurePdf}
                />
                <div className="text-center text-gray-500 text-sm my-2">OR</div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <label className="cursor-pointer block text-center">
                    {brochurePdf ? (
                      <div className="space-y-2">
                        <div className="text-green-600">✓ PDF Uploaded</div>
                        <button
                          type="button"
                          onClick={() => setBrochurePdf(null)}
                          className="text-sm text-red-600 hover:underline"
                        >
                          Remove PDF
                        </button>
                      </div>
                    ) : (
                      <>
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div className="text-sm text-gray-600 mt-2">
                          <span className="text-blue-600 hover:text-blue-700 font-medium">
                            Upload PDF
                          </span>{' '}
                          or drag and drop
                        </div>
                        <p className="text-xs text-gray-500 mt-1">PDF up to 10MB</p>
                      </>
                    )}
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleBrochurePdfUpload}
                      className="hidden"
                      disabled={!!brochureUrl.trim()}
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Provide either a direct link to the brochure or upload a PDF file
                </p>
              </div>
            </div>

            {/* Project Details */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Project Details</h2>

              <DynamicList
                items={highlights}
                onChange={setHighlights}
                label="Highlights"
                placeholder="e.g., 2 & 3 BHK Apartments"
              />

              <DynamicList
                items={amenities}
                onChange={setAmenities}
                label="Amenities"
                placeholder="e.g., Swimming Pool"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Walkthrough Video (YouTube Link or Upload)
                </label>
                <input
                  type="url"
                  value={walkthroughVideoUrl}
                  onChange={e => setWalkthroughVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                  disabled={!!walkthroughVideo}
                />
                <div className="text-center text-gray-500 text-sm my-2">OR</div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <label className="cursor-pointer block text-center">
                    {walkthroughVideo ? (
                      <div className="space-y-2">
                        <div className="text-green-600">✓ Video Uploaded</div>
                        <button
                          type="button"
                          onClick={() => setWalkthroughVideo(null)}
                          className="text-sm text-red-600 hover:underline"
                        >
                          Remove Video
                        </button>
                      </div>
                    ) : (
                      <>
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div className="text-sm text-gray-600 mt-2">
                          <span className="text-blue-600 hover:text-blue-700 font-medium">
                            Upload Video
                          </span>{' '}
                          or drag and drop
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Video up to 100MB (MP4, MOV, AVI)
                        </p>
                      </>
                    )}
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="hidden"
                      disabled={!!walkthroughVideoUrl.trim()}
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Provide either a YouTube link or upload a video file
                </p>
              </div>
            </div>

            {/* Images */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Images</h2>

              <ImageUploader
                images={bannerImage}
                onChange={setBannerImage}
                maxImages={1}
                label="Banner Image"
              />

              <ImageUploader
                images={floorplanImages}
                onChange={setFloorplanImages}
                maxImages={20}
                label="Floor Plans (up to 20 images)"
              />

              <ImageUploader
                images={clubhouseImages}
                onChange={setClubhouseImages}
                maxImages={10}
                label="Clubhouse Images (up to 10 images)"
              />

              <ImageUploader
                images={galleryImages}
                onChange={setGalleryImages}
                maxImages={20}
                label="Gallery Images (up to 20 images)"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Submitting Project...' : 'Submit Project'}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}
