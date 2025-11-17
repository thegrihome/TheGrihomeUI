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
import { prisma } from '@/lib/cockroachDB/prisma'

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
  numberOfUnits: number | null
  size: number | null
  googlePin: string | null
  thumbnailUrl: string | null
  imageUrls: string[]
  bannerImageUrl: string | null
  floorplanImageUrls: string[]
  clubhouseImageUrls: string[]
  galleryImageUrls: string[]
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
      } catch (error) {
        // Error fetching project data
      }
    }

    fetchData()
  }, [project, session])

  if (!project) {
    return (
      <div className="project-detail-container">
        <Header />
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Project Not Found</h1>
          <p className="text-gray-600 mb-4">
            The project you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link href="/projects" className="text-blue-600 hover:text-blue-800">
            Browse All Projects
          </Link>
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
          {/* Project Title */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              {project.builder.logoUrl && (
                <Image
                  src={project.builder.logoUrl}
                  alt={project.builder.name}
                  width={80}
                  height={40}
                  className="object-contain"
                />
              )}
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Link
                href={`/builders/${project.builder.id}`}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                {project.builder.name}
              </Link>
              <span className="text-gray-400">•</span>
              <span className="text-gray-500 text-sm">
                {project.location.locality && `${project.location.locality}, `}
                {project.location.city}, {project.location.state}
              </span>
            </div>

            {/* Owner Actions */}
            {isOwner && (
              <div className="flex flex-wrap gap-2 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-sm text-gray-700 font-medium flex items-center">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Your Project:
                </span>
                <Link
                  href={`/projects/edit/${project.id}`}
                  className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Edit Project
                </Link>
                <button
                  onClick={handleArchiveProject}
                  disabled={isArchiving}
                  className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    project.isArchived
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d={
                        project.isArchived
                          ? 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                          : 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4'
                      }
                    />
                  </svg>
                  {isArchiving
                    ? 'Processing...'
                    : project.isArchived
                      ? 'Restore Project'
                      : 'Archive Project'}
                </button>
              </div>
            )}

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

              {(project.brochureUrl || project.builderProspectusUrl) && (
                <a
                  href={project.brochureUrl || project.builderProspectusUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="action-button action-button-outline"
                  download
                >
                  Download Brochure
                </a>
              )}
            </div>
          </div>

          {/* Banner Image */}
          {project.bannerImageUrl && (
            <div className="project-banner">
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
          <div className="project-section">
            <h2 className="project-section-title">Description</h2>
            <div className="project-section-content">
              {details.reraNumber && (
                <p className="mb-4">
                  <strong>TS RERA Regn No. {details.reraNumber}</strong>
                </p>
              )}
              <p style={{ whiteSpace: 'pre-line' }}>{project.description}</p>
            </div>
          </div>

          {/* Highlights */}
          {project.highlights &&
            Array.isArray(project.highlights) &&
            project.highlights.length > 0 && (
              <div className="project-section">
                <h2 className="project-section-title">Highlights</h2>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  {project.highlights.map((highlight: string, index: number) => (
                    <li key={index} className="text-lg">
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {/* Amenities */}
          {project.amenities &&
            Array.isArray(project.amenities) &&
            project.amenities.length > 0 && (
              <div className="project-section">
                <h2 className="project-section-title">Amenities</h2>
                <ul className="grid grid-cols-2 md:grid-cols-3 gap-3 text-gray-700">
                  {project.amenities.map((amenity: string, index: number) => (
                    <li key={index} className="flex items-center text-base">
                      <span className="mr-2 text-green-600">✓</span>
                      {amenity}
                    </li>
                  ))}
                </ul>
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
                    className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
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
                    className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
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
                    className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
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

          {/* Walkthrough Video */}
          {project.walkthroughVideoUrl && (
            <div className="project-section">
              <h2 className="project-section-title">Virtual Walkthrough</h2>
              <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden shadow-lg">
                <iframe
                  src={project.walkthroughVideoUrl.replace('watch?v=', 'embed/')}
                  title="Project Walkthrough"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-96"
                />
              </div>
            </div>
          )}

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
                    <div key={index} className="image-item">
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
                  <p style={{ whiteSpace: 'pre-line' }}>{details.clubhouse.description}</p>
                </div>
              )}
              {details.clubhouse?.images && details.clubhouse.images.length > 0 && (
                <div className="clubhouse-images-grid">
                  {details.clubhouse.images.map((img: any, index: number) => (
                    <div key={index} className="clubhouse-image-card">
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
                  <div key={index} className="image-item">
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
          {/* Location */}
          <div className="sidebar-section">
            <h3 className="sidebar-section-title">Location</h3>
            <div className="location-map">
              <iframe
                src={
                  project.googlePin ||
                  `https://maps.google.com/maps?q=${encodeURIComponent(
                    `${project.name}, ${project.location.locality ? project.location.locality + ', ' : ''}${project.location.city}, ${project.location.state}`
                  )}&t=&z=15&ie=UTF8&iwloc=&output=embed`
                }
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

          {/* Posted By Section */}
          {isAuthenticated &&
            (project.postedBy ||
              (project.contactPersonFirstName && project.contactPersonEmail)) && (
              <div className="sidebar-section">
                <h3 className="sidebar-section-title">Posted By</h3>
                <div className="posted-by-card">
                  <div className="posted-by-info">
                    <div className="posted-by-name">
                      {project.contactPersonFirstName && project.contactPersonLastName
                        ? `${project.contactPersonFirstName} ${project.contactPersonLastName}`
                        : project.postedBy?.name || 'N/A'}
                    </div>
                    <div className="posted-by-detail">
                      <span className="posted-by-label">Email:</span>{' '}
                      {project.contactPersonEmail || project.postedBy?.email || 'N/A'}
                    </div>
                    <div className="posted-by-detail">
                      <span className="posted-by-label">Phone:</span>{' '}
                      {project.contactPersonPhone || project.postedBy?.phone || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Properties */}
          <div className="sidebar-section">
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
              {featuredProperties.map(property => (
                <Link key={property.id} href={`/properties/${property.id}`}>
                  <div
                    className={`featured-property-card ${property.isFeatured ? 'featured' : ''}`}
                  >
                    {property.thumbnailUrl && (
                      <Image
                        src={property.thumbnailUrl}
                        alt={property.streetAddress}
                        width={300}
                        height={120}
                        className="property-thumbnail"
                      />
                    )}
                    <div className="property-info">
                      <div className="property-title flex items-center gap-1">
                        {property.streetAddress}
                        {property.isFeatured && (
                          <svg
                            className="w-4 h-4 text-blue-500 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-label="Verified Property"
                          >
                            <path
                              fillRule="evenodd"
                              d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                      <div className="property-price">
                        {property.propertyDetails?.price
                          ? `₹${(property.propertyDetails.price / 100000).toFixed(2)} Lakhs`
                          : 'Price on Request'}
                      </div>
                      <div className="property-location">
                        {property.location?.locality && `${property.location.locality}, `}
                        {property.location?.city}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
              {regularProperties.map(property => (
                <Link key={property.id} href={`/properties/${property.id}`}>
                  <div className="featured-property-card">
                    {property.thumbnailUrl && (
                      <Image
                        src={property.thumbnailUrl}
                        alt={property.streetAddress}
                        width={300}
                        height={120}
                        className="property-thumbnail"
                      />
                    )}
                    <div className="property-info">
                      <div className="property-title">{property.streetAddress}</div>
                      <div className="property-price">
                        {property.propertyDetails?.price
                          ? `₹${(property.propertyDetails.price / 100000).toFixed(2)} Lakhs`
                          : 'Price on Request'}
                      </div>
                      <div className="property-location">
                        {property.location?.locality && `${property.location.locality}, `}
                        {property.location?.city}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
              {featuredProperties.length === 0 && regularProperties.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No properties are tagged for this project yet.
                </p>
              )}
            </div>
          </div>

          {/* Agents */}
          <div className="sidebar-section">
            <div className="flex items-center justify-between mb-4">
              <h3 className="sidebar-section-title mb-0">
                Agents ({featuredAgents.length + regularAgents.length})
              </h3>

              {/* Add as Agent Button */}
              {isAuthenticated && session?.user && (session.user as any).role === 'AGENT' && (
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
                <Link key={agentData.id} href={`/agents/${agentData.agent.id}`}>
                  <div className="featured-agent-card">
                    <div className="flex items-start justify-between gap-2">
                      <div className="agent-header flex-shrink-0">
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
                      </div>
                      <div className="agent-contact-info text-right text-xs flex-shrink-0">
                        {agentData.agent.emailVerified && agentData.agent.email && (
                          <div className="text-gray-600 mb-1">{agentData.agent.email}</div>
                        )}
                        {agentData.agent.mobileVerified && agentData.agent.phone && (
                          <div className="text-gray-600">{agentData.agent.phone}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
              {regularAgents.map(agentData => (
                <Link key={agentData.id} href={`/agents/${agentData.agent.id}`}>
                  <div className="featured-agent-card">
                    <div className="flex items-start justify-between gap-2">
                      <div className="agent-header flex-shrink-0">
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
                      </div>
                      <div className="agent-contact-info text-right text-xs flex-shrink-0">
                        {agentData.agent.emailVerified && agentData.agent.email && (
                          <div className="text-gray-600 mb-1">{agentData.agent.email}</div>
                        )}
                        {agentData.agent.mobileVerified && agentData.agent.phone && (
                          <div className="text-gray-600">{agentData.agent.phone}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
              {featuredAgents.length === 0 && regularAgents.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No agents registered for this project yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

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
