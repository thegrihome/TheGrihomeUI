import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { NextSeo } from 'next-seo'
import { GetServerSideProps } from 'next'
import { PrismaClient } from '@prisma/client'
import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useRouter } from 'next/router'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ExpressInterestButton from '@/components/ExpressInterestButton'
import AuthModal from '@/components/auth/AuthModal'
import { RootState } from '@/store/store'

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

  const { isAuthenticated } = useSelector((state: RootState) => state.auth)
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
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">🏗️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Project Not Found</h1>
          <p className="text-gray-600 mb-8">
            The project you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link
            href="/projects"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
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
        <div className="project-header bg-white border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="project-title-section">
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
                  {project.name}
                </h1>
                <div className="project-meta flex flex-wrap items-center gap-4 text-gray-600">
                  <div className="builder-info">
                    <span className="text-sm">by </span>
                    <Link
                      href={`/builders/${project.builder.id}`}
                      className="font-medium text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      {project.builder.name}
                    </Link>
                  </div>
                  <div className="location-info flex items-center">
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
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                    </svg>
                    <span className="text-sm">
                      {project.location.locality && `${project.location.locality}, `}
                      {project.location.city}, {project.location.state}
                    </span>
                  </div>
                  <div className="project-type">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                      {project.type}
                    </span>
                  </div>
                </div>
              </div>
              <div className="project-actions flex items-center gap-4">
                <ExpressInterestButton
                  projectId={project.id}
                  projectName={project.name}
                  onAuthRequired={handleAuthRequired}
                />

                {/* Admin Delete Button */}
                <button
                  onClick={handleDeleteProject}
                  disabled={isDeleting}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
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
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="project-image-section bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Left Side - Project Image */}
              {allImages.length > 0 && (
                <div className="lg:w-2/3">
                  <div className="relative rounded-lg overflow-hidden h-full">
                    <Image
                      src={allImages[currentImageIndex]}
                      alt={`${project.name} - Image ${currentImageIndex + 1}`}
                      width={600}
                      height={400}
                      className="object-cover w-full h-full transition-all duration-500"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 60vw"
                    />

                    {/* Image Navigation */}
                    {allImages.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
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
                              d="M15 19l-7-7 7-7"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
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
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>

                        {/* Image Dots */}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                          {allImages.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`w-2 h-2 rounded-full transition-colors ${
                                index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
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
              <div className="lg:w-1/3 flex flex-col justify-between space-y-6">
                {/* Google Maps */}
                {(details.googleMaps?.embedUrl ||
                  project.googlePin ||
                  details.overview?.location) && (
                  <div className="map-card bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-4">Location</h3>
                    <div className="map-container rounded-lg overflow-hidden border">
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
                        className="rounded-lg"
                        title={`${project.name} Location`}
                      />
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <span className="font-medium">Address:</span>{' '}
                      {details.overview?.location ||
                        `${project.location.locality ? project.location.locality + ', ' : ''}${project.location.city}, ${project.location.state}`}
                    </div>
                  </div>
                )}

                {/* Highlights */}
                {details.highlights && (
                  <div className="highlights-card bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-4">Highlights</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {details.highlights.map((highlight: any, index: number) => (
                        <div
                          key={index}
                          className="highlight-item text-center flex flex-col items-center"
                        >
                          {highlight.icon && (
                            <div className="highlight-icon mb-1 flex items-center justify-center h-16">
                              <Image
                                src={highlight.icon}
                                alt={`${highlight.value} ${highlight.label}`}
                                width={50}
                                height={50}
                                className="mx-auto object-contain"
                              />
                            </div>
                          )}
                          <div className="highlight-text">
                            <div className="text-base font-bold text-blue-600">
                              {highlight.value}
                              {highlight.unit && <span> {highlight.unit}</span>}
                            </div>
                            <div className="text-xs text-gray-700">
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
                  <div className="video-card bg-white p-6 rounded-lg shadow-md mt-auto">
                    <h3 className="text-lg font-semibold mb-4">Project Walkthrough</h3>
                    <div className="video-container rounded-lg overflow-hidden">
                      <video
                        width="100%"
                        height="200"
                        controls
                        className="rounded-lg"
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
          <div className="container mx-auto px-4 py-8">
            <div className="space-y-8">
              {/* Overview Section */}
              <div className="overview-section">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Overview</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-3">Project Description</h3>
                    <div className="text-gray-700 leading-relaxed space-y-4">
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
                  <h2 className="text-2xl font-bold mb-6 text-gray-800">Amenities</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {details.amenities?.outdoorImages?.map((amenity: any, index: number) => (
                      <div
                        key={`outdoor-${index}`}
                        className="amenity-item text-center p-3 bg-white rounded-lg shadow-sm border"
                      >
                        <div className="amenity-icon mb-2">
                          <Image
                            src={amenity.icon}
                            alt={amenity.name}
                            width={50}
                            height={50}
                            className="mx-auto object-contain"
                          />
                        </div>
                        <p className="text-sm font-medium text-gray-700">
                          {typeof amenity.name === 'string' ? amenity.name : String(amenity.name)}
                        </p>
                      </div>
                    ))}

                    {details.amenities?.indoorImages?.map((amenity: any, index: number) => (
                      <div
                        key={`indoor-${index}`}
                        className="amenity-item text-center p-3 bg-white rounded-lg shadow-sm border"
                      >
                        <div className="amenity-icon mb-2">
                          <Image
                            src={amenity.icon}
                            alt={amenity.name}
                            width={50}
                            height={50}
                            className="mx-auto object-contain"
                          />
                        </div>
                        <p className="text-sm font-medium text-gray-700">
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
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {Array.isArray(details.specifications)
                      ? details.specifications.map((specGroup: any, index: number) => (
                          <div key={index} className="spec-item bg-white border rounded-lg">
                            <details className="group">
                              <summary className="cursor-pointer p-4 font-semibold text-gray-800 uppercase hover:bg-gray-50 transition-colors">
                                {specGroup.category || `Specification ${index + 1}`}
                              </summary>
                              <div className="p-4 pt-0 text-gray-700">
                                {Array.isArray(specGroup.items) ? (
                                  <ul className="list-disc list-inside space-y-2">
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
                            <div key={category} className="spec-item bg-white border rounded-lg">
                              <details className="group">
                                <summary className="cursor-pointer p-4 font-semibold text-gray-800 uppercase hover:bg-gray-50 transition-colors">
                                  {category
                                    .replace(/([A-Z])/g, ' $1')
                                    .replace(/^./, str => str.toUpperCase())}
                                </summary>
                                <div className="p-4 pt-0 text-gray-700">
                                  {Array.isArray(specs) ? (
                                    <ul className="list-disc list-inside space-y-2">
                                      {specs.map((spec: string, index: number) => (
                                        <li
                                          key={index}
                                          dangerouslySetInnerHTML={{ __html: spec }}
                                        />
                                      ))}
                                    </ul>
                                  ) : typeof specs === 'object' && specs !== null ? (
                                    <div className="space-y-3">
                                      {Object.entries(specs).map(([key, value]: [string, any]) => (
                                        <div key={key}>
                                          <strong className="text-gray-800">
                                            {key.toUpperCase()}:
                                          </strong>{' '}
                                          {Array.isArray(value) ? (
                                            <ul className="list-disc list-inside ml-4 mt-1">
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
                  <h2 className="text-2xl font-bold mb-6 text-gray-800">Layout</h2>
                  <div className="layout-image-container bg-white p-6 rounded-lg shadow-sm border">
                    <div
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => openImageModal(details.assets.layout.url)}
                    >
                      <Image
                        src={details.assets.layout.url}
                        alt={details.assets.layout.title || `${project.name} Site Layout`}
                        width={800}
                        height={600}
                        className="w-full h-auto object-contain rounded-lg"
                        sizes="100vw"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Floor Plans Section */}
              {details.floorPlans && details.floorPlans.length > 0 && (
                <div className="floor-plans-section">
                  <h2 className="text-2xl font-bold mb-6 text-gray-800">Floor Plans</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {details.floorPlans.map((floorPlan: any, index: number) => (
                      <div
                        key={`floorplan-${index}`}
                        className="fp bg-white p-4 rounded-lg shadow-sm border"
                      >
                        <div
                          className="cursor-pointer hover:opacity-90 transition-opacity"
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
                  <h2 className="text-2xl font-bold mb-6 text-gray-800">Gallery</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {details.gallery.map((galleryItem: any, index: number) => (
                      <div
                        key={`gallery-${index}`}
                        className="gallery-item bg-white p-4 rounded-lg shadow-sm border"
                      >
                        <div
                          className="cursor-pointer hover:opacity-90 transition-opacity"
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
                  <h2 className="text-2xl font-bold mb-6 text-gray-800">Project Status</h2>
                  {details.projectStatusDate && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                      <p className="text-blue-800 font-medium">
                        {typeof details.projectStatusDate === 'string'
                          ? details.projectStatusDate
                          : String(details.projectStatusDate)}
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {details.projectStatus.map((statusItem: any, index: number) => (
                      <div
                        key={`status-${index}`}
                        className="status-item bg-white p-4 rounded-lg shadow-sm border"
                      >
                        <div
                          className="cursor-pointer hover:opacity-90 transition-opacity"
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
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      <AuthModal isOpen={showAuthModal} mode={authMode} onClose={() => setShowAuthModal(false)} />
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
