import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { NextSeo } from 'next-seo'
import { GetServerSideProps } from 'next'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { prisma } from '@/lib/cockroachDB/prisma'

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
  projectDetails: any
  builderPageUrl: string | null
  builderProspectusUrl: string | null
  contactPersonFirstName: string | null
  contactPersonLastName: string | null
  contactPersonEmail: string | null
  contactPersonPhone: string | null
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

  const { data: session, status } = useSession()
  const isAuthenticated = status === 'authenticated'
  const router = useRouter()

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
            <div className="flex items-center gap-4 mb-2">
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
            <p className="text-gray-600 mb-2">by {project.builder.name}</p>
            <p className="text-gray-500 text-sm mb-3">
              {project.location.locality && `${project.location.locality}, `}
              {project.location.city}, {project.location.state}
            </p>

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
              <button
                onClick={handleExpressInterest}
                disabled={isExpressingInterest}
                className="action-button action-button-primary"
              >
                {isExpressingInterest ? 'Sending...' : 'Express Interest'}
              </button>

              {isAuthenticated &&
                session?.user &&
                (session.user as any).role === 'AGENT' &&
                !isRegisteredAgent && (
                  <button
                    onClick={handleRegisterAsAgent}
                    disabled={isRegisteringAgent}
                    className="action-button action-button-secondary"
                  >
                    {isRegisteringAgent ? 'Registering...' : 'Register as Agent'}
                  </button>
                )}

              {isAuthenticated &&
                session?.user &&
                (session.user as any).role === 'AGENT' &&
                isRegisteredAgent && (
                  <button
                    onClick={handlePromoteAgent}
                    className="action-button action-button-outline"
                  >
                    Promote Yourself
                  </button>
                )}

              {project.builderPageUrl && (
                <a
                  href={project.builderPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="action-button action-button-outline"
                >
                  Visit Builder Page
                </a>
              )}

              {project.builderProspectusUrl && (
                <a
                  href={project.builderProspectusUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="action-button action-button-outline"
                >
                  Download Brochure
                </a>
              )}
            </div>
          </div>

          {/* Banner Image */}
          {project.thumbnailUrl && (
            <div className="project-banner">
              <Image
                src={project.thumbnailUrl}
                alt={project.name}
                width={1200}
                height={500}
                className="w-full"
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
          {details.highlights && details.highlights.length > 0 && (
            <div className="project-section">
              <h2 className="project-section-title">Highlights</h2>
              <div className="highlights-grid">
                {details.highlights.map((highlight: any, index: number) => (
                  <div key={index} className="highlight-item">
                    {highlight.icon && (
                      <div className="highlight-icon">
                        <Image src={highlight.icon} alt={highlight.label} width={60} height={60} />
                      </div>
                    )}
                    <div className="highlight-value">
                      {highlight.value}
                      {highlight.unit && <span> {highlight.unit}</span>}
                    </div>
                    <div className="highlight-label">{highlight.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Amenities */}
          {(details.amenities?.outdoorImages || details.amenities?.indoorImages) && (
            <div className="project-section">
              <h2 className="project-section-title">Amenities</h2>
              <div className="amenities-grid">
                {details.amenities.outdoorImages?.map((amenity: any, index: number) => (
                  <div key={`outdoor-${index}`} className="amenity-item">
                    {amenity.icon && (
                      <div className="amenity-icon">
                        <Image src={amenity.icon} alt={amenity.name} width={50} height={50} />
                      </div>
                    )}
                    <div className="amenity-label">{amenity.name}</div>
                  </div>
                ))}
                {details.amenities.indoorImages?.map((amenity: any, index: number) => (
                  <div key={`indoor-${index}`} className="amenity-item">
                    {amenity.icon && (
                      <div className="amenity-icon">
                        <Image src={amenity.icon} alt={amenity.name} width={50} height={50} />
                      </div>
                    )}
                    <div className="amenity-label">{amenity.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Layout */}
          {details.assets?.layout && (
            <div className="project-section">
              <h2 className="project-section-title">Layout</h2>
              <div className="images-grid">
                <div className="image-item">
                  <Image
                    src={details.assets.layout.url}
                    alt={details.assets.layout.title || 'Layout'}
                    width={800}
                    height={600}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Floor Plans */}
          {details.floorPlans && details.floorPlans.length > 0 && (
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

          {/* Featured Properties */}
          <div className="sidebar-section">
            <h3 className="sidebar-section-title">
              Featured Properties ({featuredProperties.length + regularProperties.length})
            </h3>
            <div className="featured-items-container">
              {featuredProperties.map(property => (
                <Link key={property.id} href={`/properties/${property.id}`}>
                  <div
                    className={`featured-property-card ${property.isFeatured ? 'featured' : ''}`}
                  >
                    {property.isFeatured && <span className="featured-badge">FEATURED ✨</span>}
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
                        {property.location.locality && `${property.location.locality}, `}
                        {property.location.city}
                      </div>
                    </div>
                    {isAuthenticated &&
                      session?.user?.email &&
                      property.propertyDetails?.agentEmail === session.user.email && (
                        <button
                          onClick={e => {
                            e.preventDefault()
                            handlePromoteProperty(property.id)
                          }}
                          className="promote-button"
                        >
                          {property.isFeatured
                            ? '⭐ Promote Again (5 days)'
                            : '⭐ Promote Property (₹0 for 5 days)'}
                        </button>
                      )}
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
                        {property.location.locality && `${property.location.locality}, `}
                        {property.location.city}
                      </div>
                    </div>
                    {isAuthenticated &&
                      session?.user?.email &&
                      property.propertyDetails?.agentEmail === session.user.email && (
                        <button
                          onClick={e => {
                            e.preventDefault()
                            handlePromoteProperty(property.id)
                          }}
                          className="promote-button"
                        >
                          ⭐ Promote Property (₹0 for 5 days)
                        </button>
                      )}
                  </div>
                </Link>
              ))}
              {featuredProperties.length === 0 && regularProperties.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No properties available for this project yet.
                </p>
              )}
            </div>
          </div>

          {/* Featured Agents */}
          <div className="sidebar-section">
            <h3 className="sidebar-section-title">
              Featured Agents ({featuredAgents.length + regularAgents.length})
            </h3>
            <div className="featured-items-container">
              {featuredAgents.map(agentData => (
                <Link key={agentData.id} href={`/agents/${agentData.agent.id}`}>
                  <div className={`featured-agent-card ${agentData.isFeatured ? 'featured' : ''}`}>
                    {agentData.isFeatured && <span className="featured-badge">FEATURED ✨</span>}
                    <div className="agent-header">
                      {agentData.agent.image ? (
                        <Image
                          src={agentData.agent.image}
                          alt={agentData.agent.name || agentData.agent.username}
                          width={50}
                          height={50}
                          className="agent-avatar"
                        />
                      ) : (
                        <div className="agent-avatar flex items-center justify-center">
                          <span className="text-gray-500">
                            {(agentData.agent.name || agentData.agent.username)
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="agent-info">
                        <div className="agent-name">
                          {agentData.agent.name || agentData.agent.username}
                        </div>
                        <div className="agent-role">
                          {agentData.agent.companyName || 'Real Estate Agent'}
                        </div>
                      </div>
                    </div>
                    <div className="agent-contact-info">
                      {agentData.agent.emailVerified && agentData.agent.email && (
                        <div className="agent-contact">
                          <span className="text-gray-600">Email:</span> {agentData.agent.email}
                        </div>
                      )}
                      {agentData.agent.mobileVerified && agentData.agent.phone && (
                        <div className="agent-contact">
                          <span className="text-gray-600">Phone:</span> {agentData.agent.phone}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
              {regularAgents.map(agentData => (
                <Link key={agentData.id} href={`/agents/${agentData.agent.id}`}>
                  <div className="featured-agent-card">
                    <div className="agent-header">
                      {agentData.agent.image ? (
                        <Image
                          src={agentData.agent.image}
                          alt={agentData.agent.name || agentData.agent.username}
                          width={50}
                          height={50}
                          className="agent-avatar"
                        />
                      ) : (
                        <div className="agent-avatar flex items-center justify-center">
                          <span className="text-gray-500">
                            {(agentData.agent.name || agentData.agent.username)
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="agent-info">
                        <div className="agent-name">
                          {agentData.agent.name || agentData.agent.username}
                        </div>
                        <div className="agent-role">
                          {agentData.agent.companyName || 'Real Estate Agent'}
                        </div>
                      </div>
                    </div>
                    <div className="agent-contact-info">
                      {agentData.agent.emailVerified && agentData.agent.email && (
                        <div className="agent-contact">
                          <span className="text-gray-600">Email:</span> {agentData.agent.email}
                        </div>
                      )}
                      {agentData.agent.mobileVerified && agentData.agent.phone && (
                        <div className="agent-contact">
                          <span className="text-gray-600">Phone:</span> {agentData.agent.phone}
                        </div>
                      )}
                    </div>
                    {isAuthenticated &&
                      session?.user?.email &&
                      agentData.agent.email === session.user.email && (
                        <button
                          onClick={e => {
                            e.preventDefault()
                            handlePromoteAgent()
                          }}
                          className="promote-button"
                        >
                          ⭐ Promote Yourself (₹0 for 5 days)
                        </button>
                      )}
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
