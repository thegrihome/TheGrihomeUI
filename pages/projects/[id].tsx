import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { NextSeo } from 'next-seo'
import { GetServerSideProps } from 'next'
import { PrismaClient } from '@prisma/client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ExpressInterestButton from '@/components/properties/ExpressInterestButton'

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
}

interface ProjectPageProps {
  project: ProjectDetails | null
}

export default function ProjectPage({ project }: ProjectPageProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 })
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [isDeleting, setIsDeleting] = useState(false)

  const { status } = useSession()
  const isAuthenticated = status === 'authenticated'
  const router = useRouter()

  const details = project?.projectDetails || {}
  const allImages = project
    ? [...(project.thumbnailUrl ? [project.thumbnailUrl] : []), ...project.imageUrls]
    : []

  useEffect(() => {
    if (!isAutoPlaying || allImages.length <= 1) return

    const interval = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % allImages.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [allImages.length, isAutoPlaying])

  if (!project) {
    return (
      <div className="project-not-found">
        <Header />
        <div className="project-not-found__content">
          <div className="project-not-found__icon">🏗️</div>
          <h1 className="project-not-found__title">Project Not Found</h1>
          <p className="project-not-found__text">
            The project you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link href="/projects" className="project-not-found__button">
            Browse All Projects
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  const nextImage = () => {
    setCurrentImageIndex(prev => (prev + 1) % allImages.length)
    setIsAutoPlaying(false)
  }

  const prevImage = () => {
    setCurrentImageIndex(prev => (prev - 1 + allImages.length) % allImages.length)
    setIsAutoPlaying(false)
  }

  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl)
    setZoom(1)
    setImagePosition({ x: 0, y: 0 })
  }

  const closeImageModal = () => {
    setSelectedImage(null)
    setZoom(1)
    setImagePosition({ x: 0, y: 0 })
  }

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.5, 5))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.5, 0.5))
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    if (e.deltaY < 0) {
      handleZoomIn()
    } else {
      handleZoomOut()
    }
  }

  const handleAuthRequired = () => {
    setAuthMode('login')
    setShowAuthModal(true)
  }

  const handleDeleteProject = async () => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch('/api/projects/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId: project.id }),
      })

      if (response.ok) {
        alert('Project deleted successfully!')
        router.push('/projects')
      } else {
        const data = await response.json()
        alert(`Error: ${data.message}`)
      }
    } catch (error) {
      alert('Error deleting project. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="project-page-container">
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

      <main className="project-main">
        {/* Project Header */}
        <div className="project-header">
          <div className="project-header__content">
            <div className="project-header__layout">
              <div className="project-title-section">
                <h1 className="project-title">{project.name}</h1>
                <div className="project-meta">
                  <div className="builder-info">
                    <span className="builder-info__text">by </span>
                    <Link href={`/builders/${project.builder.id}`} className="builder-info__link">
                      {project.builder.name}
                    </Link>
                  </div>
                  <div className="location-info">
                    <svg
                      className="location-info__icon"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                    </svg>
                    <span className="location-info__text">
                      {project.location.locality && `${project.location.locality}, `}
                      {project.location.city}, {project.location.state}
                    </span>
                  </div>
                  <div className="project-type">
                    <span className="project-type-badge">{project.type}</span>
                  </div>
                </div>
              </div>
              <div className="project-actions">
                <ExpressInterestButton
                  projectId={project.id}
                  projectName={project.name}
                  onAuthRequired={handleAuthRequired}
                />

                {/* Admin Delete Button */}
                <button
                  onClick={handleDeleteProject}
                  disabled={isDeleting}
                  className="project-action-button project-action-button--delete"
                >
                  {isDeleting ? (
                    <>
                      <div className="project-action-spinner"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <svg
                        className="project-action-icon"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Delete
                    </>
                  )}
                </button>

                {details.assets?.documents?.[0]?.url && (
                  <a
                    href={details.assets.documents[0].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="project-action-button project-action-button--download"
                  >
                    <svg
                      className="project-action-icon"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Download Brochure
                  </a>
                )}

                <a
                  href={details.routes?.builderWebsite || project.builder.website || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="project-action-button project-action-button--visit"
                >
                  <svg
                    className="project-action-icon"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  Visit Builder Page
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Project Image & Sidebar */}
        <div className="project-image-section">
          <div className="project-image-section__content">
            <div className="project-image-layout">
              {/* Left Side - Project Image */}
              {allImages.length > 0 && (
                <div className="project-image-container">
                  <div>
                    <Image
                      src={allImages[currentImageIndex]}
                      alt={`${project.name} - Image ${currentImageIndex + 1}`}
                      width={600}
                      height={400}
                      className="project-image-main"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 60vw"
                    />

                    {/* Image Navigation */}
                    {allImages.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="project-image-nav project-image-nav--prev"
                        >
                          <svg
                            className="project-image-nav__icon"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M15 19l-7-7 7-7"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={nextImage}
                          className="project-image-nav project-image-nav--next"
                        >
                          <svg
                            className="project-image-nav__icon"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>

                        {/* Image Dots */}
                        <div className="project-image-dots">
                          {allImages.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`project-image-dot ${
                                index === currentImageIndex
                                  ? 'project-image-dot--active'
                                  : 'project-image-dot--inactive'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Right Side - Location & Highlights */}
              <div className="project-sidebar">
                {/* Google Maps */}
                {(details.googleMaps?.embedUrl ||
                  project.googlePin ||
                  details.overview?.location) && (
                  <div className="map-card">
                    <h3 className="map-card__title">Location</h3>
                    <div className="map-container">
                      <iframe
                        src={
                          details.googleMaps?.embedUrl ||
                          project.googlePin ||
                          `https://maps.google.com/maps?q=${encodeURIComponent(
                            details.overview?.location ||
                              `${project.name}, ${project.location.locality ? project.location.locality + ', ' : ''}${project.location.city}, ${project.location.state}`
                          )}&t=&z=15&ie=UTF8&iwloc=&output=embed`
                        }
                        width="100%"
                        height="250"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        className="map-container__iframe"
                        title={`${project.name} Location`}
                      />
                    </div>
                    <div className="map-card__address">
                      <span className="map-card__address-label">Address:</span>{' '}
                      {details.overview?.location ||
                        `${project.location.locality ? project.location.locality + ', ' : ''}${project.location.city}, ${project.location.state}`}
                    </div>
                  </div>
                )}

                {/* Highlights */}
                {details.highlights && (
                  <div className="highlights-card">
                    <h3 className="highlights-card__title">Highlights</h3>
                    <div className="highlights-grid">
                      {details.highlights.map((highlight: any, index: number) => (
                        <div key={index} className="highlight-item">
                          {highlight.icon && (
                            <div className="highlight-icon">
                              <Image
                                src={highlight.icon}
                                alt={`${highlight.value} ${highlight.label}`}
                                width={50}
                                height={50}
                                className="highlight-icon__img"
                              />
                            </div>
                          )}
                          <div className="highlight-text">
                            <div className="highlight-text__value">
                              {highlight.value}
                              {highlight.unit && <span> {highlight.unit}</span>}
                            </div>
                            <div className="highlight-text__label">
                              {highlight.label}
                              {highlight.labelLine2 && (
                                <>
                                  <br />
                                  {highlight.labelLine2}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Project Walkthrough Video */}
                {details.assets?.videos?.[0] && (
                  <div className="video-card">
                    <h3 className="video-card__title">Project Walkthrough</h3>
                    <div className="video-container">
                      <video
                        width="100%"
                        height="200"
                        controls
                        className="video-container__player"
                        poster={details.assets.videos[0].poster || project.thumbnailUrl}
                      >
                        <source src={details.assets.videos[0].url} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Project Content */}
        <div className="project-content">
          <div className="project-image-section__content">
            <div className="space-y-8">
              {/* Overview Section */}
              <div className="overview-section">
                <h2 className="overview-section__title">Overview</h2>
                <div className="overview-section__content">
                  <div>
                    <h3 className="overview-section__subtitle">Project Description</h3>
                    <div className="overview-section__text">
                      <p>{project.description}</p>
                      {details.overview?.description && (
                        <p>
                          {typeof details.overview.description === 'string'
                            ? details.overview.description
                            : String(details.overview.description)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Amenities Section */}
              {(details.amenities?.outdoorImages || details.amenities?.indoorImages) && (
                <div className="amenities-section">
                  <h2 className="amenities-section__title">Amenities</h2>
                  <div className="amenities-grid">
                    {details.amenities?.outdoorImages?.map((amenity: any, index: number) => (
                      <div key={`outdoor-${index}`} className="amenity-item">
                        <div className="amenity-icon">
                          <Image
                            src={amenity.icon}
                            alt={amenity.name}
                            width={50}
                            height={50}
                            className="amenity-icon__img"
                          />
                        </div>
                        <p className="amenity-name">
                          {typeof amenity.name === 'string' ? amenity.name : String(amenity.name)}
                        </p>
                      </div>
                    ))}

                    {details.amenities?.indoorImages?.map((amenity: any, index: number) => (
                      <div key={`indoor-${index}`} className="amenity-item">
                        <div className="amenity-icon">
                          <Image
                            src={amenity.icon}
                            alt={amenity.name}
                            width={50}
                            height={50}
                            className="amenity-icon__img"
                          />
                        </div>
                        <p className="amenity-name">
                          {typeof amenity.name === 'string' ? amenity.name : String(amenity.name)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Specifications Section */}
              {details.specifications && (
                <div className="specifications-section">
                  <h2 className="text-2xl font-bold mb-8 text-gray-800 text-center">
                    SPECIFICATIONS
                  </h2>
                  <div className="specifications-grid">
                    {Array.isArray(details.specifications)
                      ? details.specifications.map((specGroup: any, index: number) => (
                          <div key={index} className="spec-item">
                            <details className="group">
                              <summary className="spec-summary">
                                {specGroup.category || `Specification ${index + 1}`}
                              </summary>
                              <div className="spec-content">
                                {Array.isArray(specGroup.items) ? (
                                  <ul className="spec-list">
                                    {specGroup.items.map((item: string, idx: number) => (
                                      <li key={idx} dangerouslySetInnerHTML={{ __html: item }} />
                                    ))}
                                  </ul>
                                ) : (
                                  <div
                                    dangerouslySetInnerHTML={{
                                      __html: String(specGroup.items || ''),
                                    }}
                                  />
                                )}
                              </div>
                            </details>
                          </div>
                        ))
                      : Object.entries(details.specifications).map(
                          ([category, specs]: [string, any]) => (
                            <div key={category} className="spec-item">
                              <details className="group">
                                <summary className="spec-summary">
                                  {category
                                    .replace(/([A-Z])/g, ' $1')
                                    .replace(/^./, str => str.toUpperCase())}
                                </summary>
                                <div className="spec-content">
                                  {Array.isArray(specs) ? (
                                    <ul className="spec-list">
                                      {specs.map((spec: string, index: number) => (
                                        <li
                                          key={index}
                                          dangerouslySetInnerHTML={{ __html: spec }}
                                        />
                                      ))}
                                    </ul>
                                  ) : typeof specs === 'object' && specs !== null ? (
                                    <div className="spec-details">
                                      {Object.entries(specs).map(([key, value]: [string, any]) => (
                                        <div key={key}>
                                          <strong className="spec-details__label">
                                            {key.toUpperCase()}:
                                          </strong>{' '}
                                          {Array.isArray(value) ? (
                                            <ul className="spec-details__sublist">
                                              {value.map((item: any, idx: number) => (
                                                <li
                                                  key={idx}
                                                  dangerouslySetInnerHTML={{ __html: String(item) }}
                                                />
                                              ))}
                                            </ul>
                                          ) : (
                                            <span
                                              dangerouslySetInnerHTML={{ __html: String(value) }}
                                            />
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div dangerouslySetInnerHTML={{ __html: String(specs) }} />
                                  )}
                                </div>
                              </details>
                            </div>
                          )
                        )}
                  </div>
                </div>
              )}

              {/* Layout Section */}
              {details.assets?.layout && (
                <div className="layout-section">
                  <h2 className="layout-section__title">Layout</h2>
                  <div className="layout-image-container">
                    <div
                      className="layout-image-wrapper"
                      onClick={() => openImageModal(details.assets.layout.url)}
                    >
                      <Image
                        src={details.assets.layout.url}
                        alt={details.assets.layout.title || `${project.name} Site Layout`}
                        width={800}
                        height={600}
                        className="layout-image"
                        sizes="100vw"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Floor Plans Section */}
              {details.floorPlans && details.floorPlans.length > 0 && (
                <div className="floor-plans-section">
                  <h2 className="floor-plans-section__title">Floor Plans</h2>
                  <div className="floor-plans-grid">
                    {details.floorPlans.map((floorPlan: any, index: number) => (
                      <div key={`floorplan-${index}`} className="fp">
                        <div
                          className="layout-image-wrapper"
                          onClick={() => openImageModal(floorPlan.image)}
                        >
                          <Image
                            src={floorPlan.image}
                            alt={floorPlan.name}
                            width={400}
                            height={300}
                            className="w-full h-auto object-cover rounded-lg"
                          />
                        </div>
                        <div className="text-center mt-3 font-medium text-gray-800">
                          {typeof floorPlan.name === 'string'
                            ? floorPlan.name
                            : String(floorPlan.name)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gallery Section */}
              {details.gallery && details.gallery.length > 0 && (
                <div className="gallery-section">
                  <h2 className="gallery-section__title">Gallery</h2>
                  <div className="floor-plans-grid">
                    {details.gallery.map((galleryItem: any, index: number) => (
                      <div key={`gallery-${index}`} className="gallery-item">
                        <div
                          className="layout-image-wrapper"
                          onClick={() => openImageModal(galleryItem.image)}
                        >
                          <Image
                            src={galleryItem.image}
                            alt={galleryItem.name}
                            width={400}
                            height={300}
                            className="w-full h-auto object-cover rounded-lg"
                          />
                        </div>
                        <h3 className="text-center mt-3 font-medium text-gray-800">
                          {typeof galleryItem.name === 'string'
                            ? galleryItem.name
                            : String(galleryItem.name)}
                        </h3>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Project Status Section */}
              {details.projectStatus && details.projectStatus.length > 0 && (
                <div className="project-status-section">
                  <h2 className="project-status-section__title">Project Status</h2>
                  {details.projectStatusDate && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                      <p className="text-blue-800 font-medium">
                        {typeof details.projectStatusDate === 'string'
                          ? details.projectStatusDate
                          : String(details.projectStatusDate)}
                      </p>
                    </div>
                  )}
                  <div className="floor-plans-grid">
                    {details.projectStatus.map((statusItem: any, index: number) => (
                      <div key={`status-${index}`} className="status-item">
                        <div
                          className="layout-image-wrapper"
                          onClick={() => openImageModal(statusItem.image)}
                        >
                          <Image
                            src={statusItem.image}
                            alt={statusItem.name}
                            width={400}
                            height={300}
                            className="w-full h-auto object-cover rounded-lg"
                          />
                        </div>
                        <p className="text-center mt-3 text-sm text-gray-700">
                          {typeof statusItem.name === 'string'
                            ? statusItem.name
                            : String(statusItem.name)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={closeImageModal}
        >
          <div className="relative max-w-full max-h-full">
            <button
              className="absolute top-4 right-4 z-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 text-white transition-colors"
              onClick={closeImageModal}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="absolute top-4 left-4 z-10 flex gap-2">
              <button
                className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 text-white transition-colors"
                onClick={handleZoomIn}
              >
                <svg
                  className="project-image-nav__icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </button>
              <button
                className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 text-white transition-colors"
                onClick={handleZoomOut}
              >
                <svg
                  className="project-image-nav__icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                </svg>
              </button>
              <div className="bg-white bg-opacity-20 rounded-full px-3 py-2 text-white text-sm">
                {Math.round(zoom * 100)}%
              </div>
            </div>

            <div
              className="overflow-hidden max-w-[90vw] max-h-[90vh] cursor-move"
              onClick={e => e.stopPropagation()}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <Image
                src={selectedImage}
                alt="Enlarged view"
                width={1200}
                height={900}
                className="transition-transform duration-200"
                style={{
                  transform: `scale(${zoom}) translate(${imagePosition.x / zoom}px, ${imagePosition.y / zoom}px)`,
                  cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                }}
                sizes="90vw"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const prisma = new PrismaClient()

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
  } finally {
    await prisma.$disconnect()
  }
}
