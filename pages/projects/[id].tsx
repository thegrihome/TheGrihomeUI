import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { NextSeo } from 'next-seo'
import { GetServerSideProps } from 'next'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ImageLightbox from '@/components/projects/ImageLightbox'
import { prisma } from '@/lib/cockroachDB/prisma'

// Helper function to convert Google Maps URL to embeddable format
const getEmbeddableMapUrl = (googlePin: string | null, fallbackAddress: string): string => {
  if (!googlePin) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(fallbackAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
  }

  // Already an embed URL
  if (googlePin.includes('/embed') || googlePin.includes('output=embed')) {
    return googlePin
  }

  // Extract coordinates from various Google Maps URL formats
  // Format: https://www.google.com/maps/@17.4234,78.4456,17z
  const atMatch = googlePin.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/)
  if (atMatch) {
    return `https://maps.google.com/maps?q=${atMatch[1]},${atMatch[2]}&z=15&output=embed`
  }

  // Format: https://www.google.com/maps/place/.../@17.4234,78.4456
  const placeMatch = googlePin.match(/place\/[^/]+\/@(-?\d+\.?\d*),(-?\d+\.?\d*)/)
  if (placeMatch) {
    return `https://maps.google.com/maps?q=${placeMatch[1]},${placeMatch[2]}&z=15&output=embed`
  }

  // For short URLs (maps.app.goo.gl) or unrecognized formats, fallback to address
  return `https://maps.google.com/maps?q=${encodeURIComponent(fallbackAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
}

const PropertyMap = dynamic(() => import('@/components/properties/PropertyMap'), {
  ssr: false,
  loading: () => (
    <div className="rounded-lg bg-gray-100 p-8 text-center" style={{ minHeight: '400px' }}>
      <p className="text-gray-600">Loading map...</p>
    </div>
  ),
})

interface ProjectDetails {
  id: string
  name: string
  description: string
  type: string
  propertyType: string | null
  numberOfUnits: number | null
  size: number | null
  googlePin: string | null
  thumbnailUrl: string | null
  imageUrls: string[]
  bannerImageUrl: string | null
  floorplanImageUrls: string[]
  clubhouseImageUrls: string[]
  galleryImageUrls: string[]
  siteLayoutImageUrls: string[]
  walkthroughVideoUrl: string | null
  highlights: any
  amenities: any
  projectDetails: any
  builderPageUrl: string | null
  builderProspectusUrl: string | null
  builderWebsiteLink: string | null
  brochureUrl: string | null
  contactPersonFirstName: string | null
  contactPersonLastName: string | null
  contactPersonEmail: string | null
  contactPersonPhone: string | null
  isArchived: boolean
  postedByUserId: string | null
  builder: {
    id: string
    name: string
    description: string | null
    logoUrl: string | null
    website: string | null
    contactInfo: any
  }
  location: {
    id: string
    city: string
    state: string
    country: string
    locality: string | null
    zipcode: string | null
    neighborhood: string | null
    latitude: number | null
    longitude: number | null
    formattedAddress: string | null
  }
  postedBy: {
    id: string
    name: string | null
    email: string
    phone: string | null
  } | null
}

interface Property {
  id: string
  streetAddress: string
  propertyType: string
  listingType: string
  sqFt: number | null
  thumbnailUrl: string | null
  imageUrls: string[]
  propertyDetails: any
  location: {
    city: string
    state: string
    locality: string | null
  }
  isFeatured: boolean
  projectPropertyId: string | null
}

interface Agent {
  id: string
  agent: {
    id: string
    name: string | null
    username: string
    email: string
    phone: string | null
    image: string | null
    companyName: string | null
    emailVerified: boolean
    mobileVerified: boolean
  }
  registeredAt: Date
  isFeatured: boolean
}

interface ReviewData {
  id: string
  rating: number
  review: string
  createdAt: Date
  userId: string
  user: {
    name: string | null
    image: string | null
  }
}

interface ReviewsResponse {
  reviews: ReviewData[]
  averageRating: number
  reviewCount: number
  userHasReviewed: boolean
}

interface ProjectPageProps {
  project: ProjectDetails | null
}

export default function ProjectPage({ project }: ProjectPageProps) {
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([])
  const [regularProperties, setRegularProperties] = useState<Property[]>([])
  const [featuredAgents, setFeaturedAgents] = useState<Agent[]>([])
  const [regularAgents, setRegularAgents] = useState<Agent[]>([])
  const [isRegisteredAgent, setIsRegisteredAgent] = useState(false)
  const [showAgentBanner, setShowAgentBanner] = useState(false)
  const [isExpressingInterest, setIsExpressingInterest] = useState(false)
  const [isRegisteringAgent, setIsRegisteringAgent] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)
  const [reviewsData, setReviewsData] = useState<ReviewsResponse | null>(null)
  const [contactingAgentId, setContactingAgentId] = useState<string | null>(null)

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [lightboxTitle, setLightboxTitle] = useState('')

  const openLightbox = (images: string[], index: number, title: string) => {
    setLightboxImages(images)
    setLightboxIndex(index)
    setLightboxTitle(title)
    setLightboxOpen(true)
  }

  const { data: session, status } = useSession()
  const isAuthenticated = status === 'authenticated'
  const router = useRouter()

  // Check if current user is the owner
  const isOwner = session?.user?.id === project?.postedByUserId

  const details = project?.projectDetails || {}

  // Fetch properties and agents
  useEffect(() => {
    if (!project) return

    const fetchData = async () => {
      try {
        // Fetch properties
        const propsRes = await fetch(`/api/projects/${project.id}/properties`)
        if (propsRes.ok) {
          const propsData = await propsRes.json()
          setFeaturedProperties(propsData.featuredProperties || [])
          setRegularProperties(propsData.regularProperties || [])
        }

        // Fetch agents
        const agentsRes = await fetch(`/api/projects/${project.id}/agents`)
        if (agentsRes.ok) {
          const agentsData = await agentsRes.json()
          setFeaturedAgents(agentsData.featuredAgents || [])
          setRegularAgents(agentsData.regularAgents || [])

          // Check if current user is registered
          if (session?.user?.email) {
            const allAgents = [...agentsData.featuredAgents, ...agentsData.regularAgents]
            const isRegistered = allAgents.some((a: Agent) => a.agent.email === session.user.email)
            setIsRegisteredAgent(isRegistered)
            if (isRegistered) {
              setShowAgentBanner(true)
            }
          }
        }

        // Fetch reviews
        const reviewsRes = await fetch(`/api/projects/${project.id}/reviews`)
        if (reviewsRes.ok) {
          const reviewsData = await reviewsRes.json()
          setReviewsData(reviewsData)
        }
      } catch (error) {
        // Error fetching project data
      }
    }

    fetchData()
  }, [project, session])

  if (!project) {
    return (
      <div className="project-detail-container flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Project Not Found</h1>
            <p className="text-gray-600 mb-4">
              The project you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Link href="/projects" className="text-blue-600 hover:text-blue-800">
              Browse All Projects
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const handleExpressInterest = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to express interest')
      router.push('/login')
      return
    }

    setIsExpressingInterest(true)
    try {
      const response = await fetch(`/api/projects/${project.id}/express-interest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        toast.success('Interest expressed successfully!')
      } else {
        const data = await response.json()
        toast.error(data.message || 'Failed to express interest')
      }
    } catch (error) {
      toast.error('Error expressing interest. Please try again.')
    } finally {
      setIsExpressingInterest(false)
    }
  }

  const handleRegisterAsAgent = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to register as an agent')
      router.push('/login')
      return
    }

    setIsRegisteringAgent(true)
    try {
      const response = await fetch(`/api/projects/${project.id}/register-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        toast.success('Successfully registered as an agent for this project!')
        setIsRegisteredAgent(true)
        setShowAgentBanner(true)
        // Refresh agents list
        const agentsRes = await fetch(`/api/projects/${project.id}/agents`)
        if (agentsRes.ok) {
          const agentsData = await agentsRes.json()
          setFeaturedAgents(agentsData.featuredAgents || [])
          setRegularAgents(agentsData.regularAgents || [])
        }
      } else {
        const data = await response.json()
        toast.error(data.message || 'Failed to register as agent')
      }
    } catch (error) {
      toast.error('Error registering as agent. Please try again.')
    } finally {
      setIsRegisteringAgent(false)
    }
  }

  const handlePromoteProperty = async (propertyId: string) => {
    try {
      const response = await fetch(`/api/projects/${project.id}/promote-property`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ propertyId, totalDays: 5 }),
      })

      if (response.ok) {
        toast.success('Property promoted successfully!')
        // Refresh properties
        const propsRes = await fetch(`/api/projects/${project.id}/properties`)
        if (propsRes.ok) {
          const propsData = await propsRes.json()
          setFeaturedProperties(propsData.featuredProperties || [])
          setRegularProperties(propsData.regularProperties || [])
        }
      } else {
        const data = await response.json()
        toast.error(data.message || 'Failed to promote property')
      }
    } catch (error) {
      toast.error('Error promoting property. Please try again.')
    }
  }

  const handlePromoteAgent = async () => {
    try {
      const response = await fetch(`/api/projects/${project.id}/promote-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ totalDays: 5 }),
      })

      if (response.ok) {
        toast.success('Agent promoted successfully!')
        // Refresh agents
        const agentsRes = await fetch(`/api/projects/${project.id}/agents`)
        if (agentsRes.ok) {
          const agentsData = await agentsRes.json()
          setFeaturedAgents(agentsData.featuredAgents || [])
          setRegularAgents(agentsData.regularAgents || [])
        }
      } else {
        const data = await response.json()
        toast.error(data.message || 'Failed to promote agent')
      }
    } catch (error) {
      toast.error('Error promoting agent. Please try again.')
    }
  }

  const handleArchiveProject = async () => {
    const confirmMessage = project.isArchived
      ? 'Are you sure you want to restore this project?'
      : 'Are you sure you want to archive this project? It will be hidden from public view.'

    if (!confirm(confirmMessage)) return

    setIsArchiving(true)
    try {
      const response = await fetch('/api/projects/archive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project.id,
          isArchived: !project.isArchived,
        }),
      })

      if (response.ok) {
        toast.success(`Project ${project.isArchived ? 'restored' : 'archived'} successfully!`)
        router.reload()
      } else {
        const data = await response.json()
        toast.error(data.message || 'Failed to archive project')
      }
    } catch (error) {
      toast.error('Error archiving project. Please try again.')
    } finally {
      setIsArchiving(false)
    }
  }

  const handleContactAgent = async (agentId: string) => {
    if (!isAuthenticated) {
      toast.error('Please login to contact agent')
      router.push('/login')
      return
    }

    setContactingAgentId(agentId)
    try {
      const response = await fetch(`/api/projects/${project.id}/contact-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ agentId }),
      })

      if (response.ok) {
        toast.success('Contact request sent! The agent will reach out to you soon.')
      } else {
        const data = await response.json()
        toast.error(data.message || 'Failed to send contact request')
      }
    } catch (error) {
      toast.error('Error sending contact request. Please try again.')
    } finally {
      setContactingAgentId(null)
    }
  }

  return (
    <div className="project-detail-container">
      <NextSeo
        title={`${project.name} - ${project.builder.name} | Grihome`}
        description={project.description}
        canonical={`https://grihome.vercel.app/projects/${project.id}`}
        openGraph={{
          url: `https://grihome.vercel.app/projects/${project.id}`,
          title: `${project.name} - ${project.builder.name}`,
          description: project.description,
          images: project.thumbnailUrl
            ? [
                {
                  url: project.thumbnailUrl,
                  width: 1200,
                  height: 630,
                  alt: project.name,
                },
              ]
            : [],
          site_name: 'Grihome',
        }}
      />
      <Head>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <main className="project-detail-layout">
        {/* Left Column */}
        <div className="project-detail-left">
          {/* Back Button */}
          <Link href="/projects" className="project-back-link">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Projects
          </Link>

          {/* Project Title */}
          <div className="project-header-section">
            <div className="project-title-row">
              <div className="project-title-left">
                {project.builder.logoUrl && (
                  <Image
                    src={project.builder.logoUrl}
                    alt={project.builder.name}
                    width={80}
                    height={40}
                    className="object-contain"
                  />
                )}
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                  {project.name}
                  <svg
                    className="w-6 h-6 text-blue-500 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-label="Verified Project"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {isOwner && (
                    <span className="project-owner-actions">
                      {/* Edit Icon */}
                      <Link
                        href={`/projects/edit/${project.id}`}
                        className="project-action-icon project-action-icon--edit"
                        aria-label="Edit Listing"
                      >
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        <span className="project-action-tooltip">Edit Listing</span>
                      </Link>

                      {/* Archive/Restore Icon */}
                      <button
                        onClick={handleArchiveProject}
                        disabled={isArchiving}
                        className={`project-action-icon ${
                          project.isArchived
                            ? 'project-action-icon--restore'
                            : 'project-action-icon--archive'
                        }`}
                        aria-label={project.isArchived ? 'Restore Project' : 'Archive Project'}
                      >
                        {project.isArchived ? (
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                        ) : (
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                            />
                          </svg>
                        )}
                        <span className="project-action-tooltip">
                          {project.isArchived ? 'Restore Project' : 'Archive Project'}
                        </span>
                      </button>
                    </span>
                  )}
                </h1>
              </div>

              {/* Star Rating Display - Desktop version (in title row) */}
              <div
                onClick={() => {
                  if (status === 'authenticated') {
                    router.push(`/projects/${project.id}/rating`)
                  } else {
                    toast.error('Please log in to write a review')
                    router.push('/login')
                  }
                }}
                className="project-rating-display project-rating-display--desktop"
              >
                <div className="stars-container">
                  {[1, 2, 3, 4, 5].map(star => {
                    const avgRating = reviewsData?.averageRating || 0
                    const isFilled = star <= Math.floor(avgRating)
                    const isHalfFilled = star === Math.ceil(avgRating) && avgRating % 1 >= 0.5

                    return (
                      <svg
                        key={star}
                        className={`star-icon ${isFilled ? 'filled' : isHalfFilled ? 'half-filled' : 'empty'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    )
                  })}
                </div>
                <span className="rating-text">
                  {reviewsData?.averageRating?.toFixed(1) || '0.0'} / 5
                  <span className="rating-count">
                    {' '}
                    ({reviewsData?.reviewCount || 0}{' '}
                    {reviewsData?.reviewCount === 1 ? 'rating' : 'ratings'})
                  </span>
                </span>
              </div>
            </div>
            {/* Builder info */}
            <div className="project-info-wrapper">
              <div className="project-info-left">
                <div className="project-builder-row">
                  <Link href={`/builders/${project.builder.id}`} className="project-builder-name">
                    {project.builder.name}
                  </Link>
                  {/* Star Rating Display - Mobile version (in builder row) */}
                  <div
                    onClick={() => {
                      if (status === 'authenticated') {
                        router.push(`/projects/${project.id}/rating`)
                      } else {
                        toast.error('Please log in to write a review')
                        router.push('/login')
                      }
                    }}
                    className="project-rating-display project-rating-display--mobile"
                  >
                    <div className="stars-container">
                      {[1, 2, 3, 4, 5].map(star => {
                        const avgRating = reviewsData?.averageRating || 0
                        const isFilled = star <= Math.floor(avgRating)
                        const isHalfFilled = star === Math.ceil(avgRating) && avgRating % 1 >= 0.5

                        return (
                          <svg
                            key={star}
                            className={`star-icon ${isFilled ? 'filled' : isHalfFilled ? 'half-filled' : 'empty'}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        )
                      })}
                    </div>
                    <span className="rating-text">
                      {reviewsData?.averageRating?.toFixed(1) || '0.0'}
                    </span>
                  </div>
                </div>
                <div className="project-type-tiles">
                  {project.propertyType && (
                    <>
                      <span className="project-type-badge project-type-badge--type">
                        {project.propertyType === 'VILLA' && 'Villa'}
                        {project.propertyType === 'APARTMENT' && 'Apartment'}
                        {project.propertyType === 'RESIDENTIAL_LAND' && 'Residential Land'}
                        {project.propertyType === 'AGRICULTURE_LAND' && 'Agriculture Land'}
                        {project.propertyType === 'COMMERCIAL' && 'Commercial'}
                      </span>
                      <span className="project-type-badge project-type-badge--sale">For Sale</span>
                    </>
                  )}
                </div>
                <span className="project-builder-location">
                  {project.location.locality && `${project.location.locality}, `}
                  {project.location.city}, {project.location.state}
                </span>
              </div>
            </div>

            {/* Registered Agent Banner */}
            {showAgentBanner && (
              <div className="registered-agent-banner">
                <span className="registered-agent-banner-text">
                  You are registered as an agent for this project
                </span>
                <button
                  className="registered-agent-banner-close"
                  onClick={() => setShowAgentBanner(false)}
                >
                  ×
                </button>
              </div>
            )}

            {/* Header Actions */}
            <div className="project-header-actions">
              <div className="project-header-actions-row1">
                <div className="relative group">
                  <button
                    onClick={handleExpressInterest}
                    disabled={isExpressingInterest}
                    className="action-button action-button-primary"
                  >
                    {isExpressingInterest ? 'Sending...' : 'Express Interest'}
                  </button>
                  <div className="absolute left-0 top-full mt-2 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                    <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                    ℹ️ Grihome will contact you and ensure your interest is submitted to the builder
                    to help you finalize a deal.
                  </div>
                </div>

                {(project.builderWebsiteLink || project.builder.website) && (
                  <a
                    href={project.builderWebsiteLink || project.builder.website || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="action-button action-button-outline"
                  >
                    Visit Builder Website
                  </a>
                )}
              </div>

              {(project.brochureUrl || project.builderProspectusUrl) && (
                <div className="project-header-actions-row2">
                  <a
                    href={project.brochureUrl || project.builderProspectusUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="action-button action-button-outline"
                    download
                  >
                    Download Brochure
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Banner Image */}
          {project.bannerImageUrl && (
            <div
              className="project-banner project-area-banner clickable-image"
              onClick={() => openLightbox([project.bannerImageUrl!], 0, 'Banner')}
            >
              <Image
                src={project.bannerImageUrl}
                alt={project.name}
                width={1200}
                height={500}
                className="w-full h-96 object-cover rounded-lg"
              />
            </div>
          )}

          {/* Description */}
          <div className="project-section project-area-description">
            <h2 className="project-section-title">Description</h2>
            <div className="project-section-content">
              {details.reraNumber && (
                <p className="mb-4">
                  <strong>TS RERA Regn No. {details.reraNumber}</strong>
                </p>
              )}
              <div
                className="prose prose-sm max-w-none"
                style={{ whiteSpace: 'pre-line' }}
                dangerouslySetInnerHTML={{ __html: project.description.replace(/\n/g, '<br />') }}
              />
            </div>
          </div>

          {/* Highlights */}
          {project.highlights &&
            Array.isArray(project.highlights) &&
            project.highlights.length > 0 && (
              <div className="project-section">
                <h2 className="project-section-title">Highlights</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {project.highlights.map((highlight: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200"
                    >
                      <div className="flex-shrink-0 w-6 h-6 bg-amber-50 rounded flex items-center justify-center">
                        <svg
                          className="w-3.5 h-3.5 text-amber-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                      <span className="text-gray-700 text-sm">{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Amenities */}
          {project.amenities &&
            Array.isArray(project.amenities) &&
            project.amenities.length > 0 && (
              <div className="project-section">
                <h2 className="project-section-title">Amenities</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {project.amenities.map((amenity: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200"
                    >
                      <div className="flex-shrink-0 w-6 h-6 bg-green-50 rounded flex items-center justify-center">
                        <svg
                          className="w-3.5 h-3.5 text-green-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <span className="text-gray-700 text-sm">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Floor Plans */}
          {project.floorplanImageUrls && project.floorplanImageUrls.length > 0 && (
            <div className="project-section">
              <h2 className="project-section-title">Floor Plans</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {project.floorplanImageUrls.map((url: string, index: number) => (
                  <div
                    key={index}
                    className="border rounded-lg overflow-hidden shadow-sm clickable-image"
                    onClick={() => openLightbox(project.floorplanImageUrls, index, 'Floor Plans')}
                  >
                    <Image
                      src={url}
                      alt={`Floor Plan ${index + 1}`}
                      width={600}
                      height={400}
                      className="w-full h-auto"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Clubhouse */}
          {project.clubhouseImageUrls && project.clubhouseImageUrls.length > 0 && (
            <div className="project-section">
              <h2 className="project-section-title">Clubhouse</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {project.clubhouseImageUrls.map((url: string, index: number) => (
                  <div
                    key={index}
                    className="border rounded-lg overflow-hidden shadow-sm clickable-image"
                    onClick={() => openLightbox(project.clubhouseImageUrls, index, 'Clubhouse')}
                  >
                    <Image
                      src={url}
                      alt={`Clubhouse ${index + 1}`}
                      width={400}
                      height={300}
                      className="w-full h-64 object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gallery */}
          {project.galleryImageUrls && project.galleryImageUrls.length > 0 && (
            <div className="project-section">
              <h2 className="project-section-title">Gallery</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {project.galleryImageUrls.map((url: string, index: number) => (
                  <div
                    key={index}
                    className="border rounded-lg overflow-hidden shadow-sm clickable-image"
                    onClick={() => openLightbox(project.galleryImageUrls, index, 'Gallery')}
                  >
                    <Image
                      src={url}
                      alt={`Gallery Image ${index + 1}`}
                      width={300}
                      height={200}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Site Layout */}
          {project.siteLayoutImageUrls && project.siteLayoutImageUrls.length > 0 && (
            <div className="project-section">
              <h2 className="project-section-title">Site Layout</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {project.siteLayoutImageUrls.map((url: string, index: number) => (
                  <div
                    key={index}
                    className="border rounded-lg overflow-hidden shadow-sm clickable-image"
                    onClick={() => openLightbox(project.siteLayoutImageUrls, index, 'Site Layout')}
                  >
                    <Image
                      src={url}
                      alt={`Site Layout ${index + 1}`}
                      width={600}
                      height={400}
                      className="w-full h-auto object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Walkthrough Video */}
          {project.walkthroughVideoUrl &&
            (() => {
              // Helper function to convert YouTube URL to embed URL
              const getYouTubeEmbedUrl = (url: string): string | null => {
                if (!url) return null

                // Handle youtu.be short URLs
                let match = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/)
                if (match) return `https://www.youtube.com/embed/${match[1]}`

                // Handle youtube.com watch URLs (with or without additional params)
                match = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/)
                if (match) return `https://www.youtube.com/embed/${match[1]}`

                // Handle youtube.com embed URLs (already correct)
                if (url.includes('youtube.com/embed/')) return url

                // Fallback: return the URL as-is
                return url
              }

              const embedUrl = getYouTubeEmbedUrl(project.walkthroughVideoUrl)
              if (!embedUrl) return null

              return (
                <div className="project-section">
                  <h2 className="project-section-title">Virtual Walkthrough</h2>
                  <div className="aspect-video rounded-lg overflow-hidden shadow-lg">
                    <iframe
                      src={embedUrl}
                      title="Project Walkthrough"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </div>
                </div>
              )
            })()}

          {/* Location Map */}
          {project.location.latitude && project.location.longitude && (
            <div className="project-section">
              <h2 className="project-section-title">Location</h2>
              <PropertyMap
                latitude={project.location.latitude}
                longitude={project.location.longitude}
                address={
                  project.location.formattedAddress ||
                  `${project.location.city}, ${project.location.state}`
                }
                className="w-full"
              />
              <div className="mt-3 text-gray-700">
                <p className="font-medium">
                  {project.location.formattedAddress || (
                    <>
                      {project.location.neighborhood && `${project.location.neighborhood}, `}
                      {project.location.locality && `${project.location.locality}, `}
                      {project.location.city}, {project.location.state}
                      {project.location.zipcode && ` - ${project.location.zipcode}`}
                    </>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Old sections - Keep for backward compatibility if old format data exists */}
          {details.floorPlans &&
            details.floorPlans.length > 0 &&
            !project.floorplanImageUrls?.length && (
              <div className="project-section">
                <h2 className="project-section-title">Floor Plans</h2>
                <div className="images-grid">
                  {details.floorPlans.map((floorPlan: any, index: number) => (
                    <div
                      key={index}
                      className="image-item clickable-image"
                      onClick={() =>
                        openLightbox(
                          details.floorPlans.map((fp: any) => fp.image),
                          index,
                          'Floor Plans'
                        )
                      }
                    >
                      <Image
                        src={floorPlan.image}
                        alt={floorPlan.name}
                        width={400}
                        height={300}
                        className="w-full"
                      />
                      <p className="text-center mt-2 font-medium">{floorPlan.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Clubhouse */}
          {(details.clubhouse?.description || details.clubhouse?.images) && (
            <div className="project-section">
              <h2 className="project-section-title">Clubhouse</h2>
              {details.clubhouse?.description && (
                <div className="project-section-content mb-6">
                  <div
                    className="prose prose-sm max-w-none"
                    style={{ whiteSpace: 'pre-line' }}
                    dangerouslySetInnerHTML={{
                      __html: details.clubhouse.description.replace(/\n/g, '<br />'),
                    }}
                  />
                </div>
              )}
              {details.clubhouse?.images && details.clubhouse.images.length > 0 && (
                <div className="clubhouse-images-grid">
                  {details.clubhouse.images.map((img: any, index: number) => (
                    <div
                      key={index}
                      className="clubhouse-image-card clickable-image"
                      onClick={() =>
                        openLightbox(
                          details.clubhouse.images.map((i: any) => i.url),
                          index,
                          'Clubhouse'
                        )
                      }
                    >
                      <Image
                        src={img.url}
                        alt={img.name}
                        width={400}
                        height={300}
                        className="w-full"
                      />
                      <div className="clubhouse-image-info">
                        <p className="clubhouse-image-name">{img.name}</p>
                        {img.details && <p className="clubhouse-image-details">{img.details}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Gallery */}
          {details.gallery && details.gallery.length > 0 && (
            <div className="project-section">
              <h2 className="project-section-title">Gallery</h2>
              <div className="images-grid">
                {details.gallery.map((img: any, index: number) => (
                  <div
                    key={index}
                    className="image-item clickable-image"
                    onClick={() =>
                      openLightbox(
                        details.gallery.map((g: any) => g.image),
                        index,
                        'Gallery'
                      )
                    }
                  >
                    <Image
                      src={img.image}
                      alt={img.name}
                      width={400}
                      height={300}
                      className="w-full"
                    />
                    <p className="text-center mt-2 font-medium">{img.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="project-detail-right">
          {/* Posted By Section */}
          {isAuthenticated &&
            (project.postedBy ||
              (project.contactPersonFirstName && project.contactPersonEmail)) && (
              <div className="sidebar-section sidebar-posted-by">
                <h3 className="sidebar-section-title">Posted By</h3>
                <div className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between gap-4">
                    <span className="font-medium text-gray-900 text-sm">
                      {project.contactPersonFirstName && project.contactPersonLastName
                        ? `${project.contactPersonFirstName} ${project.contactPersonLastName}`
                        : project.postedBy?.name || 'N/A'}
                    </span>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs text-gray-600">
                        {project.contactPersonEmail || project.postedBy?.email}
                      </div>
                      {(project.contactPersonPhone || project.postedBy?.phone) && (
                        <div className="text-xs text-gray-600 mt-0.5">
                          {project.contactPersonPhone || project.postedBy?.phone}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Properties */}
          <div className="sidebar-section sidebar-properties">
            <div className="flex items-center justify-between mb-4">
              <h3 className="sidebar-section-title mb-0">
                Properties ({featuredProperties.length + regularProperties.length})
              </h3>

              {/* Add Your Property Button */}
              {isAuthenticated && session?.user && (
                <button
                  onClick={() => router.push(`/projects/${project.id}/promote-property`)}
                  className="bg-blue-600 text-white px-2.5 py-1.5 rounded text-xs font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-1"
                >
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Add property
                </button>
              )}
            </div>

            <div className="featured-items-container">
              {/* Featured/Promoted properties first */}
              {featuredProperties.map(property => (
                <Link key={property.id} href={`/properties/${property.id}`}>
                  <div className="featured-property-card p-2 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-gray-900 text-sm">
                          {property.propertyDetails?.title || property.streetAddress}
                        </span>
                        <svg
                          className="w-3.5 h-3.5 text-blue-500 inline-block ml-1 align-middle"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="flex items-start gap-1 flex-shrink-0">
                        <span
                          className={`px-1.5 py-0.5 rounded text-xs font-medium ${property.listingType === 'RENT' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}
                        >
                          {property.listingType === 'RENT' ? 'Rent' : 'Sale'}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {property.propertyType === 'VILLA'
                            ? 'Villa'
                            : property.propertyType === 'APARTMENT'
                              ? 'Apt'
                              : property.propertyType === 'RESIDENTIAL_LAND'
                                ? 'Land'
                                : property.propertyType === 'AGRICULTURE_LAND'
                                  ? 'Agri'
                                  : property.propertyType === 'COMMERCIAL'
                                    ? 'Comm'
                                    : 'Land'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-600">
                        {property.location?.locality && `${property.location.locality}, `}
                        {property.location?.city}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {property.propertyDetails?.price
                          ? `₹${(property.propertyDetails.price / 100000).toFixed(1)}L`
                          : 'Price on Request'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
              {/* Regular (non-promoted) properties */}
              {regularProperties.map(property => (
                <Link key={property.id} href={`/properties/${property.id}`}>
                  <div className="featured-property-card p-2 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-gray-900 text-sm">
                          {property.propertyDetails?.title || property.streetAddress}
                        </span>
                      </div>
                      <div className="flex items-start gap-1 flex-shrink-0">
                        <span
                          className={`px-1.5 py-0.5 rounded text-xs font-medium ${property.listingType === 'RENT' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}
                        >
                          {property.listingType === 'RENT' ? 'Rent' : 'Sale'}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {property.propertyType === 'VILLA'
                            ? 'Villa'
                            : property.propertyType === 'APARTMENT'
                              ? 'Apt'
                              : property.propertyType === 'RESIDENTIAL_LAND'
                                ? 'Land'
                                : property.propertyType === 'AGRICULTURE_LAND'
                                  ? 'Agri'
                                  : property.propertyType === 'COMMERCIAL'
                                    ? 'Comm'
                                    : 'Land'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-600">
                        {property.location?.locality && `${property.location.locality}, `}
                        {property.location?.city}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {property.propertyDetails?.price
                          ? `₹${(property.propertyDetails.price / 100000).toFixed(1)}L`
                          : 'Price on Request'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
              {featuredProperties.length === 0 && regularProperties.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No properties are tagged to this project yet.
                </p>
              )}
            </div>
          </div>

          {/* Agents */}
          <div className="sidebar-section sidebar-agents">
            <div className="flex items-center justify-between mb-4">
              <h3 className="sidebar-section-title mb-0">
                Agents ({featuredAgents.length + regularAgents.length})
              </h3>

              {/* Add as Agent Button - Only show if user is agent and NOT already registered */}
              {isAuthenticated &&
                session?.user &&
                (session.user as any).role === 'AGENT' &&
                !isRegisteredAgent && (
                  <button
                    onClick={() => router.push(`/projects/${project.id}/promote-agent`)}
                    className="bg-blue-600 text-white px-2.5 py-1.5 rounded text-xs font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-1"
                  >
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Add as Agent
                  </button>
                )}
            </div>

            <div className="featured-items-container">
              {featuredAgents.map(agentData => (
                <div key={agentData.id} className="featured-agent-card">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/agents/${agentData.agent.id}/properties`}
                      className="agent-header flex-shrink-0"
                    >
                      {agentData.agent.image ? (
                        <Image
                          src={agentData.agent.image}
                          alt={agentData.agent.name || agentData.agent.username}
                          width={40}
                          height={40}
                          className="agent-avatar"
                        />
                      ) : (
                        <div className="agent-avatar flex items-center justify-center">
                          <span className="text-gray-500 text-sm">
                            {(agentData.agent.name || agentData.agent.username || '')
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="agent-info">
                        <div className="agent-name flex items-center gap-1">
                          {agentData.agent.name || agentData.agent.username}
                          <svg
                            className="w-4 h-4 text-blue-500 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-label="Verified Agent"
                          >
                            <path
                              fillRule="evenodd"
                              d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="agent-role">
                          {agentData.agent.companyName || 'Real Estate Agent'}
                        </div>
                      </div>
                    </Link>
                    <button
                      onClick={() => handleContactAgent(agentData.agent.id)}
                      className="contact-agent-button"
                      disabled={contactingAgentId === agentData.agent.id}
                    >
                      {contactingAgentId === agentData.agent.id ? 'Sending...' : 'Contact Agent'}
                    </button>
                  </div>
                </div>
              ))}
              {regularAgents.map(agentData => (
                <div key={agentData.id} className="featured-agent-card">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/agents/${agentData.agent.id}/properties`}
                      className="agent-header flex-shrink-0"
                    >
                      {agentData.agent.image ? (
                        <Image
                          src={agentData.agent.image}
                          alt={agentData.agent.name || agentData.agent.username}
                          width={40}
                          height={40}
                          className="agent-avatar"
                        />
                      ) : (
                        <div className="agent-avatar flex items-center justify-center">
                          <span className="text-gray-500 text-sm">
                            {(agentData.agent.name || agentData.agent.username || '')
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="agent-info">
                        <div className="agent-name flex items-center gap-1">
                          {agentData.agent.name || agentData.agent.username}
                          <svg
                            className="w-4 h-4 text-blue-500 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-label="Verified Agent"
                          >
                            <path
                              fillRule="evenodd"
                              d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="agent-role">
                          {agentData.agent.companyName || 'Real Estate Agent'}
                        </div>
                      </div>
                    </Link>
                    <button
                      onClick={() => handleContactAgent(agentData.agent.id)}
                      className="contact-agent-button"
                      disabled={contactingAgentId === agentData.agent.id}
                    >
                      {contactingAgentId === agentData.agent.id ? 'Sending...' : 'Contact Agent'}
                    </button>
                  </div>
                </div>
              ))}
              {featuredAgents.length === 0 && regularAgents.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No agents registered for this project yet.
                </p>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="sidebar-section sidebar-location">
            <h3 className="sidebar-section-title">Location</h3>
            <div className="location-map">
              <iframe
                src={getEmbeddableMapUrl(
                  project.googlePin,
                  `${project.name}, ${project.location.locality ? project.location.locality + ', ' : ''}${project.location.city}, ${project.location.state}`
                )}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                title={`${project.name} Location`}
              />
            </div>
            <div className="location-address">
              {project.location.locality && `${project.location.locality}, `}
              {project.location.city}, {project.location.state}
              {project.location.zipcode && `, ${project.location.zipcode}`}
            </div>
          </div>

          {/* Reviews Section */}
          <div className="sidebar-section sidebar-reviews">
            <h3 className="sidebar-section-title">Reviews ({reviewsData?.reviewCount || 0})</h3>

            <div className="reviews-list-container">
              {reviewsData && reviewsData.reviews.length > 0 ? (
                reviewsData.reviews.map(review => (
                  <div key={review.id} className="review-item">
                    <div className="review-header">
                      <div className="review-user">
                        {review.user.image && (
                          <Image
                            src={review.user.image}
                            alt={review.user.name || 'User'}
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                        )}
                        <span className="review-user-name">{review.user.name || 'Anonymous'}</span>
                      </div>
                      <div className="review-meta">
                        <div className="review-stars">
                          {[1, 2, 3, 4, 5].map(star => (
                            <svg
                              key={star}
                              className={star <= review.rating ? 'filled' : 'empty'}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="review-date">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <p className="review-text">{review.review}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No reviews yet. Be the first to review!
                </p>
              )}
            </div>

            {isAuthenticated && (
              <button
                onClick={() => router.push(`/projects/${project.id}/rating`)}
                className="write-review-button"
              >
                {reviewsData?.userHasReviewed ? 'Edit Your Review' : 'Write a Review'}
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Image Lightbox */}
      <ImageLightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        title={lightboxTitle}
      />

      <Footer />
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  try {
    const projectId = params?.id as string

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        builder: {
          select: {
            id: true,
            name: true,
            description: true,
            logoUrl: true,
            website: true,
            contactInfo: true,
          },
        },
        location: {
          select: {
            id: true,
            city: true,
            state: true,
            country: true,
            locality: true,
            zipcode: true,
            neighborhood: true,
            latitude: true,
            longitude: true,
            formattedAddress: true,
          },
        },
        postedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
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
