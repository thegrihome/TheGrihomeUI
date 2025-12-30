import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import { NextSeo } from 'next-seo'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../api/auth/[...nextauth]'
import { checkAdminAccess } from '@/lib/utils/admin-access'
import { Loader } from '@googlemaps/js-api-loader'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import BuilderSelector from '@/components/projects/BuilderSelector'
import ImageUploaderDirect from '@/components/projects/ImageUploaderDirect'
import SimpleRichTextEditor from '@/components/common/SimpleRichTextEditor'
import toast from 'react-hot-toast'

interface UploadedImage {
  url: string
  uploading?: boolean
  error?: boolean
  localPreview?: string
}

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
  const [locationAddress, setLocationAddress] = useState('')
  const [googleMapsUrl, setGoogleMapsUrl] = useState('')
  const [highlightsText, setHighlightsText] = useState('')
  const [amenitiesText, setAmenitiesText] = useState('')
  const [walkthroughVideoUrls, setWalkthroughVideoUrls] = useState<string[]>([''])

  // Dropdown state
  const [showPropertyTypeDropdown, setShowPropertyTypeDropdown] = useState(false)

  // Image state - now stores URLs from direct blob uploads
  const [bannerImage, setBannerImage] = useState<UploadedImage[]>([])
  const [floorplanImages, setFloorplanImages] = useState<UploadedImage[]>([])
  const [clubhouseImages, setClubhouseImages] = useState<UploadedImage[]>([])
  const [galleryImages, setGalleryImages] = useState<UploadedImage[]>([])
  const [siteLayoutImages, setSiteLayoutImages] = useState<UploadedImage[]>([])

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

    let isMounted = true

    const initializeAutocomplete = () => {
      if (!isMounted) return
      if (locationInputRef.current && window.google?.maps?.places?.Autocomplete) {
        try {
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
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error initializing autocomplete:', error)
        }
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
      .importLibrary('places')
      .then(() => {
        initializeAutocomplete()
      })
      .catch(error => {
        // eslint-disable-next-line no-console
        console.error('Error loading Google Maps API:', error)
      })

    return () => {
      isMounted = false
    }
  }, [])

  // Redirect if not authenticated
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-gray-600">Loading...</div>
        </main>
        <Footer />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    router.push('/auth/login')
    return null
  }

  const handleVideoUrlChange = (index: number, value: string) => {
    const newUrls = [...walkthroughVideoUrls]
    newUrls[index] = value
    setWalkthroughVideoUrls(newUrls)
  }

  const addVideoUrl = () => {
    setWalkthroughVideoUrls([...walkthroughVideoUrls, ''])
  }

  const removeVideoUrl = (index: number) => {
    if (walkthroughVideoUrls.length > 1) {
      setWalkthroughVideoUrls(walkthroughVideoUrls.filter((_, i) => i !== index))
    } else {
      setWalkthroughVideoUrls([''])
    }
  }

  // Check if any images are still uploading
  const isAnyImageUploading =
    bannerImage.some(img => img.uploading) ||
    floorplanImages.some(img => img.uploading) ||
    clubhouseImages.some(img => img.uploading) ||
    galleryImages.some(img => img.uploading) ||
    siteLayoutImages.some(img => img.uploading)

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
    if (!locationAddress.trim() && !googleMapsUrl.trim()) {
      toast.error('Location or Google Maps URL is required')
      return
    }

    // Check for pending uploads
    if (isAnyImageUploading) {
      toast.error('Please wait for all uploads to complete')
      return
    }

    setIsSubmitting(true)

    // Parse comma-separated text into arrays
    const highlightsArray = highlightsText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
    const amenitiesArray = amenitiesText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)

    // Extract URLs from uploaded images
    const bannerUrl = bannerImage[0]?.url || null
    const floorplanUrls = floorplanImages.filter(img => img.url).map(img => img.url)
    const clubhouseUrls = clubhouseImages.filter(img => img.url).map(img => img.url)
    const galleryUrls = galleryImages.filter(img => img.url).map(img => img.url)
    const siteLayoutUrls = siteLayoutImages.filter(img => img.url).map(img => img.url)

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
          locationAddress: locationAddress.trim(),
          googleMapsUrl: googleMapsUrl.trim() || null,
          bannerImageUrl: bannerUrl,
          highlights: highlightsArray.length > 0 ? highlightsArray : null,
          amenities: amenitiesArray.length > 0 ? amenitiesArray : null,
          floorplanImageUrls: floorplanUrls,
          clubhouseImageUrls: clubhouseUrls,
          galleryImageUrls: galleryUrls,
          siteLayoutImageUrls: siteLayoutUrls,
          walkthroughVideoUrls: walkthroughVideoUrls.filter(url => url.trim() !== ''),
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
                <SimpleRichTextEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="Describe your project..."
                  rows={6}
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
                  Location <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-3 mb-3">
                  <input
                    ref={locationInputRef}
                    type="text"
                    value={locationAddress}
                    onChange={e => setLocationAddress(e.target.value)}
                    placeholder="Type address (e.g., Kokapet, Hyderabad)"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-500 font-medium">OR</span>
                  <input
                    type="url"
                    value={googleMapsUrl}
                    onChange={e => setGoogleMapsUrl(e.target.value)}
                    placeholder="Paste Google Maps URL"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {locationAddress && (
                  <div className="rounded-lg overflow-hidden border border-gray-300">
                    <iframe
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(locationAddress)}&output=embed`}
                      width="100%"
                      height="250"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Project Location Map"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Brochure */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">
                Project Brochure
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brochure Link
                </label>
                <input
                  type="url"
                  value={brochureUrl}
                  onChange={e => setBrochureUrl(e.target.value)}
                  placeholder="https://example.com/brochure.pdf"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Provide a direct link to the project brochure
                </p>
              </div>
            </div>

            {/* Project Details */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Project Details</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Highlights</label>
                <textarea
                  value={highlightsText}
                  onChange={e => setHighlightsText(e.target.value)}
                  placeholder="2 & 3 BHK Apartments, Premium Location, Gated Community, 24/7 Security"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">Enter highlights separated by commas</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
                <textarea
                  value={amenitiesText}
                  onChange={e => setAmenitiesText(e.target.value)}
                  placeholder="Swimming Pool, Gym, Clubhouse, Children's Play Area, Jogging Track"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">Enter amenities separated by commas</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Walkthrough Video Links (YouTube, Vimeo, etc.)
                </label>
                <div className="space-y-2">
                  {walkthroughVideoUrls.map((url, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="url"
                        value={url}
                        onChange={e => handleVideoUrlChange(index, e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {walkthroughVideoUrls.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVideoUrl(index)}
                          className="px-3 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="Remove video link"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      )}
                      {index === walkthroughVideoUrls.length - 1 && (
                        <button
                          type="button"
                          onClick={addVideoUrl}
                          className="px-3 py-3 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Add another video link"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Add links to walkthrough videos (YouTube, Vimeo, etc.)
                </p>
              </div>
            </div>

            {/* Images */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Images</h2>

              {!name.trim() && (
                <p className="text-amber-600 text-sm">
                  Please enter a project name before uploading images
                </p>
              )}

              <ImageUploaderDirect
                images={bannerImage}
                onChange={setBannerImage}
                projectName={name || 'temp-project'}
                folder="banner"
                maxImages={1}
                label="Banner Image"
              />

              <ImageUploaderDirect
                images={floorplanImages}
                onChange={setFloorplanImages}
                projectName={name || 'temp-project'}
                folder="floorplans"
                maxImages={20}
                label="Floor Plans (up to 20 images)"
              />

              <ImageUploaderDirect
                images={clubhouseImages}
                onChange={setClubhouseImages}
                projectName={name || 'temp-project'}
                folder="clubhouse"
                maxImages={10}
                label="Clubhouse Images (up to 10 images)"
              />

              <ImageUploaderDirect
                images={galleryImages}
                onChange={setGalleryImages}
                projectName={name || 'temp-project'}
                folder="gallery"
                maxImages={20}
                label="Gallery Images (up to 20 images)"
              />

              <ImageUploaderDirect
                images={siteLayoutImages}
                onChange={setSiteLayoutImages}
                projectName={name || 'temp-project'}
                folder="sitelayout"
                maxImages={10}
                label="Site Layout Images (up to 10 images)"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t">
              <button
                type="submit"
                disabled={isSubmitting || isAnyImageUploading}
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isAnyImageUploading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Uploading Images...
                  </>
                ) : isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Submitting Project...
                  </>
                ) : (
                  'Submit Project'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async context => {
  const session = await getServerSession(context.req, context.res, authOptions)
  const userEmail = session?.user?.email
  const accessResult = checkAdminAccess(userEmail)

  // In production, redirect non-admin users to contact page
  if (accessResult.isProduction && !accessResult.canAccessAdmin) {
    return {
      redirect: {
        destination: '/contactUs',
        permanent: false,
      },
    }
  }

  return { props: {} }
}
