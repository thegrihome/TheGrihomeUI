import { useState } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import { NextSeo } from 'next-seo'
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
  const [type, setType] = useState('RESIDENTIAL')
  const [builderId, setBuilderId] = useState<string | null>(null)
  const [builderWebsiteLink, setBuilderWebsiteLink] = useState('')
  const [brochureUrl, setBrochureUrl] = useState('')
  const [locationAddress, setLocationAddress] = useState('')
  const [highlights, setHighlights] = useState<string[]>([])
  const [amenities, setAmenities] = useState<string[]>([])
  const [walkthroughVideoUrl, setWalkthroughVideoUrl] = useState('')

  // Image state
  const [bannerImage, setBannerImage] = useState<string[]>([])
  const [floorplanImages, setFloorplanImages] = useState<string[]>([])
  const [clubhouseImages, setClubhouseImages] = useState<string[]>([])
  const [galleryImages, setGalleryImages] = useState<string[]>([])

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
          type,
          builderId,
          builderWebsiteLink: builderWebsiteLink.trim() || null,
          brochureUrl: brochureUrl.trim() || null,
          locationAddress: locationAddress.trim(),
          bannerImageBase64: bannerImage[0] || null,
          highlights: highlights.length > 0 ? highlights : null,
          amenities: amenities.length > 0 ? amenities : null,
          floorplanImagesBase64: floorplanImages,
          clubhouseImagesBase64: clubhouseImages,
          galleryImagesBase64: galleryImages,
          walkthroughVideoUrl: walkthroughVideoUrl.trim() || null,
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
                <input
                  type="text"
                  value={locationAddress}
                  onChange={e => setLocationAddress(e.target.value)}
                  placeholder="Enter full address (e.g., Kokapet, Hyderabad, Telangana)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Provide complete address for accurate location mapping
                </p>
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
                  Brochure URL or PDF Link
                </label>
                <input
                  type="url"
                  value={brochureUrl}
                  onChange={e => setBrochureUrl(e.target.value)}
                  placeholder="https://example.com/brochure.pdf"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
