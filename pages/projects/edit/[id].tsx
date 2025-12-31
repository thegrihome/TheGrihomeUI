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
import ImageUploader from '@/components/projects/ImageUploader'
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
  const [brochurePdf, setBrochurePdf] = useState<string | null>(null)
  const [locationAddress, setLocationAddress] = useState('')
  const [googleMapsUrl, setGoogleMapsUrl] = useState('')
  const [highlights, setHighlights] = useState<string[]>([])
  const [amenities, setAmenities] = useState<string[]>([])
  const [walkthroughVideoUrl, setWalkthroughVideoUrl] = useState('')

  // Image state (store URLs for existing images, base64 for new ones)
  const [bannerImage, setBannerImage] = useState<string[]>([])
  const [floorplanImages, setFloorplanImages] = useState<string[]>([])
  const [clubhouseImages, setClubhouseImages] = useState<string[]>([])
  const [galleryImages, setGalleryImages] = useState<string[]>([])
  const [siteLayoutImages, setSiteLayoutImages] = useState<string[]>([])

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
      setBrochureUrl(project.brochureUrl || '')
      setLocationAddress(project.location.formattedAddress || '')
      setGoogleMapsUrl(project.googlePin || '')
      setHighlights(project.highlights || [])
      setAmenities(project.amenities || [])
      setWalkthroughVideoUrl(project.walkthroughVideoUrl || '')

      // Set existing images (URLs)
      if (project.bannerImageUrl) setBannerImage([project.bannerImageUrl])
      setFloorplanImages(project.floorplanImageUrls || [])
      setClubhouseImages(project.clubhouseImageUrls || [])
      setGalleryImages(project.galleryImageUrls || [])
      setSiteLayoutImages(project.siteLayoutImageUrls || [])
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

    setIsSubmitting(true)

    try {
      // Send ALL images (existing URLs + new base64) so API knows which to keep
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
          brochureUrl: brochureUrl.trim() || null,
          brochurePdfBase64: brochurePdf || null,
          locationAddress: locationAddress.trim() || null,
          googleMapsUrl: googleMapsUrl.trim() || null,
          // Send all images (URLs to keep + new base64 to upload)
          bannerImages: bannerImage,
          floorplanImages: floorplanImages,
          clubhouseImages: clubhouseImages,
          galleryImages: galleryImages,
          siteLayoutImages: siteLayoutImages,
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
        title="Edit Project | Grihome"
        description="Edit your real estate project on Grihome"
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

              <ImageUploader
                images={siteLayoutImages}
                onChange={setSiteLayoutImages}
                maxImages={10}
                label="Site Layout Images (up to 10 images)"
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
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white py-2.5 px-4 rounded-lg font-medium text-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Updating Project...' : 'Update Project'}
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
