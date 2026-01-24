import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import { NextSeo } from 'next-seo'
import { Loader } from '@googlemaps/js-api-loader'
import { GetServerSideProps } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import BuilderSelector from '@/components/projects/BuilderSelector'
import DynamicList from '@/components/projects/DynamicList'
import ImageUploaderDirect from '@/components/projects/ImageUploaderDirect'
import PDFUploaderDirect from '@/components/projects/PDFUploaderDirect'
import toast from 'react-hot-toast'
import { prisma } from '@/lib/cockroachDB/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'

interface ProjectData {
  id: string
  name: string
  description: string
  type: string
  builderId: string
  builderWebsiteLink: string | null
  brochureUrl: string | null
  bannerImageUrl: string | null
  floorplanImageUrls: string[]
  clubhouseImageUrls: string[]
  galleryImageUrls: string[]
  siteLayoutImageUrls: string[]
  highlights: string[] | null
  amenities: string[] | null
  walkthroughVideoUrl: string | null
  googlePin: string | null
  location: {
    formattedAddress: string | null
  }
}

interface EditProjectProps {
  project: ProjectData | null
}

interface UploadedImage {
  url: string
  uploading?: boolean
  error?: boolean
  localPreview?: string
}

interface UploadedPDF {
  url: string
  uploading?: boolean
  error?: boolean
  fileName?: string
}

export default function EditProject({ project }: EditProjectProps) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('RESIDENTIAL')
  const [builderId, setBuilderId] = useState<string | null>(null)
  const [builderWebsiteLink, setBuilderWebsiteLink] = useState('')
  const [brochureUrl, setBrochureUrl] = useState('')
  const [brochurePdf, setBrochurePdf] = useState<UploadedPDF | null>(null)
  const [locationAddress, setLocationAddress] = useState('')
  const [googleMapsUrl, setGoogleMapsUrl] = useState('')
  const [highlights, setHighlights] = useState<string[]>([])
  const [amenities, setAmenities] = useState<string[]>([])
  const [walkthroughVideoUrl, setWalkthroughVideoUrl] = useState('')

  // Image state - now stores URLs from direct blob uploads
  const [bannerImage, setBannerImage] = useState<UploadedImage[]>([])
  const [floorplanImages, setFloorplanImages] = useState<UploadedImage[]>([])
  const [clubhouseImages, setClubhouseImages] = useState<UploadedImage[]>([])
  const [galleryImages, setGalleryImages] = useState<UploadedImage[]>([])
  const [siteLayoutImages, setSiteLayoutImages] = useState<UploadedImage[]>([])

  // Google Maps autocomplete refs
  const locationInputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  // Pre-populate form with project data
  useEffect(() => {
    if (project) {
      setName(project.name)
      setDescription(project.description)
      setType(project.type)
      setBuilderId(project.builderId)
      setBuilderWebsiteLink(project.builderWebsiteLink || '')
      // If existing brochure URL is from blob storage, set it as uploaded PDF
      if (project.brochureUrl?.includes('blob.vercel-storage.com')) {
        setBrochurePdf({ url: project.brochureUrl, uploading: false })
        setBrochureUrl('')
      } else {
        setBrochureUrl(project.brochureUrl || '')
        setBrochurePdf(null)
      }
      setLocationAddress(project.location.formattedAddress || '')
      setGoogleMapsUrl(project.googlePin || '')
      setHighlights(project.highlights || [])
      setAmenities(project.amenities || [])
      setWalkthroughVideoUrl(project.walkthroughVideoUrl || '')

      // Set existing images (URLs) - convert to UploadedImage format
      if (project.bannerImageUrl) setBannerImage([{ url: project.bannerImageUrl }])
      setFloorplanImages((project.floorplanImageUrls || []).map(url => ({ url })))
      setClubhouseImages((project.clubhouseImageUrls || []).map(url => ({ url })))
      setGalleryImages((project.galleryImageUrls || []).map(url => ({ url })))
      setSiteLayoutImages((project.siteLayoutImageUrls || []).map(url => ({ url })))
    }
  }, [project])

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

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Project Not Found</h1>
            <p className="text-gray-600">The project you are trying to edit does not exist.</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Check if any images or PDF are still uploading
  const isAnyImageUploading =
    bannerImage.some(img => img.uploading) ||
    floorplanImages.some(img => img.uploading) ||
    clubhouseImages.some(img => img.uploading) ||
    galleryImages.some(img => img.uploading) ||
    siteLayoutImages.some(img => img.uploading) ||
    brochurePdf?.uploading

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
      toast.error('Location address or Google Maps URL is required')
      return
    }

    // Check for pending uploads
    if (isAnyImageUploading) {
      toast.error('Please wait for all uploads to complete')
      return
    }

    setIsSubmitting(true)

    try {
      // Extract URLs from uploaded images
      const bannerUrl = bannerImage[0]?.url || null
      const floorplanUrls = floorplanImages.filter(img => img.url).map(img => img.url)
      const clubhouseUrls = clubhouseImages.filter(img => img.url).map(img => img.url)
      const galleryUrls = galleryImages.filter(img => img.url).map(img => img.url)
      const siteLayoutUrls = siteLayoutImages.filter(img => img.url).map(img => img.url)

      const response = await fetch('/api/projects/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project.id,
          name: name.trim(),
          description: description.trim(),
          type,
          builderId,
          builderWebsiteLink: builderWebsiteLink.trim() || null,
          brochureUrl: brochurePdf?.url || brochureUrl.trim() || null,
          locationAddress: locationAddress.trim() || null,
          googleMapsUrl: googleMapsUrl.trim() || null,
          // Send pre-uploaded image URLs
          bannerImageUrl: bannerUrl,
          floorplanImageUrls: floorplanUrls,
          clubhouseImageUrls: clubhouseUrls,
          galleryImageUrls: galleryUrls,
          siteLayoutImageUrls: siteLayoutUrls,
          highlights: highlights.length > 0 ? highlights : null,
          amenities: amenities.length > 0 ? amenities : null,
          walkthroughVideoUrl: walkthroughVideoUrl.trim() || null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Project updated successfully!')
        router.push(`/projects/${project.id}`)
      } else {
        toast.error(data.message || 'Failed to update project')
      }
    } catch (error) {
      toast.error('Error updating project')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NextSeo
        title="Edit Project | Zillfin"
        description="Edit your real estate project on Zillfin"
      />
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Project</h1>
          <p className="text-gray-600 mb-8">Update your project details</p>

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
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Type</label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="RESIDENTIAL">Residential</option>
                  <option value="COMMERCIAL">Commercial</option>
                  <option value="MIXED_USE">Mixed Use</option>
                </select>
              </div>

              <BuilderSelector value={builderId} onChange={setBuilderId} className="w-full" />

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

            {/* Builder Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">
                Builder Information
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Builder Website Link
                </label>
                <input
                  type="url"
                  value={builderWebsiteLink}
                  onChange={e => setBuilderWebsiteLink(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

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
                  disabled={!!brochurePdf?.url}
                />
                <div className="text-center text-gray-500 text-sm my-2">OR</div>
                <PDFUploaderDirect
                  pdf={brochurePdf}
                  onChange={setBrochurePdf}
                  projectName={name || 'temp-project'}
                  disabled={!!brochureUrl.trim()}
                />
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
                  Walkthrough Video URL (YouTube)
                </label>
                <input
                  type="url"
                  value={walkthroughVideoUrl}
                  onChange={e => setWalkthroughVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
                maxImages={50}
                label="Floor Plans (up to 50 images)"
              />

              <ImageUploaderDirect
                images={clubhouseImages}
                onChange={setClubhouseImages}
                projectName={name || 'temp-project'}
                folder="clubhouse"
                maxImages={50}
                label="Clubhouse Images (up to 50 images)"
              />

              <ImageUploaderDirect
                images={galleryImages}
                onChange={setGalleryImages}
                projectName={name || 'temp-project'}
                folder="gallery"
                maxImages={50}
                label="Gallery Images (up to 50 images)"
              />

              <ImageUploaderDirect
                images={siteLayoutImages}
                onChange={setSiteLayoutImages}
                projectName={name || 'temp-project'}
                folder="sitelayout"
                maxImages={50}
                label="Site Layout Images (up to 50 images)"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 bg-gray-200 text-gray-700 py-2.5 px-4 rounded-lg font-medium text-sm hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isAnyImageUploading}
                  className="flex-1 bg-blue-600 text-white py-2.5 px-4 rounded-lg font-medium text-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isAnyImageUploading ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 text-white"
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
                      Uploading...
                    </>
                  ) : isSubmitting ? (
                    'Updating Project...'
                  ) : (
                    'Update Project'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async context => {
  const { id } = context.params as { id: string }
  const session = await getServerSession(context.req, context.res, authOptions)

  if (!session?.user?.id) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    }
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        builderId: true,
        builderWebsiteLink: true,
        brochureUrl: true,
        bannerImageUrl: true,
        floorplanImageUrls: true,
        clubhouseImageUrls: true,
        galleryImageUrls: true,
        siteLayoutImageUrls: true,
        googlePin: true,
        highlights: true,
        amenities: true,
        walkthroughVideoUrl: true,
        postedByUserId: true,
        location: {
          select: {
            formattedAddress: true,
          },
        },
      },
    })

    if (!project) {
      return {
        props: {
          project: null,
        },
      }
    }

    // Check if user is the owner
    if (project.postedByUserId !== session.user.id) {
      return {
        redirect: {
          destination: `/projects/${id}`,
          permanent: false,
        },
      }
    }

    return {
      props: {
        project: JSON.parse(JSON.stringify(project)),
      },
    }
  } catch (error) {
    return {
      props: {
        project: null,
      },
    }
  }
}
