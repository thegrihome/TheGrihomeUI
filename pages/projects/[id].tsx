import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { NextSeo } from 'next-seo'
import { GetServerSideProps } from 'next'
import { PrismaClient } from '@prisma/client'
import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
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

  const { isAuthenticated } = useSelector((state: RootState) => state.auth)

  const allImages = project
    ? [...(project.thumbnailUrl ? [project.thumbnailUrl] : []), ...project.imageUrls]
    : []

  // Auto-rotate images
  useEffect(() => {
    if (!isAutoPlaying || allImages.length <= 1) return

    const interval = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % allImages.length)
    }, 4000) // Change image every 4 seconds

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

  const details = project.projectDetails || {}

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
                {/* Express Interest Button */}
                <ExpressInterestButton
                  projectId={project.id}
                  projectName={project.name}
                  onAuthRequired={handleAuthRequired}
                />

                {/* Brochure Link */}
                <a
                  href="https://www.myhomeconstructions.com/my-home-apas/assests/brochure/my-home-apas-brochure.pdf"
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

                {/* Builder Website Link */}
                <a
                  href="https://www.myhomeconstructions.com/my-home-apas/"
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
                  </div>
                </div>
              )}

              {/* Right Side - Location & Highlights */}
              <div className="lg:w-1/3 flex flex-col justify-between space-y-6">
                {/* Google Maps */}
                {project.googlePin && (
                  <div className="map-card bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-4">Location</h3>
                    <div className="map-container rounded-lg overflow-hidden border">
                      <iframe
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(
                          `${project.name}, ${project.location.locality ? project.location.locality + ', ' : ''}${project.location.city}, ${project.location.state}`
                        )}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
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
                      <span className="font-medium">Address:</span> Kokapet, Hyderabad, Telangana
                    </div>
                  </div>
                )}

                {/* Top Section - Highlights */}
                <div className="highlights-card bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold mb-4">Highlights</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Row 1 */}
                    <div className="highlight-item text-center">
                      <div className="highlight-icon mb-2">
                        <Image
                          src="https://www.myhomeconstructions.com/my-home-apas/assets-avali/highlights-01.webp"
                          alt="6 Sky High Towers"
                          width={50}
                          height={50}
                          className="mx-auto object-contain"
                        />
                      </div>
                      <div className="highlight-text">
                        <div className="text-lg font-bold text-blue-600">6 Sky</div>
                        <div className="text-xs text-gray-700">High Towers</div>
                      </div>
                    </div>

                    <div className="highlight-item text-center">
                      <div className="highlight-icon mb-2">
                        <Image
                          src="https://www.myhomeconstructions.com/my-home-apas/assets-avali/highlights-02.webp"
                          alt="G+44 Floors"
                          width={50}
                          height={50}
                          className="mx-auto object-contain"
                        />
                      </div>
                      <div className="highlight-text">
                        <div className="text-lg font-bold text-blue-600">G+44</div>
                        <div className="text-xs text-gray-700">Floors</div>
                      </div>
                    </div>

                    {/* Row 2 */}
                    <div className="highlight-item text-center">
                      <div className="highlight-icon mb-2">
                        <Image
                          src="https://www.myhomeconstructions.com/my-home-apas/assets-avali/highlights-03.webp"
                          alt="81.6% Open Space"
                          width={50}
                          height={50}
                          className="mx-auto object-contain"
                        />
                      </div>
                      <div className="highlight-text">
                        <div className="text-lg font-bold text-green-600">81.6%</div>
                        <div className="text-xs text-gray-700">Open Space</div>
                      </div>
                    </div>

                    <div className="highlight-item text-center">
                      <div className="highlight-icon mb-2">
                        <Image
                          src="https://www.myhomeconstructions.com/my-home-apas/assets-avali/highlights-04.webp"
                          alt="13.52 Acres Land Extent"
                          width={50}
                          height={50}
                          className="mx-auto object-contain"
                        />
                      </div>
                      <div className="highlight-text">
                        <div className="text-lg font-bold text-blue-600">13.52 Acres</div>
                        <div className="text-xs text-gray-700">Land Extent</div>
                      </div>
                    </div>

                    {/* Row 3 */}
                    <div className="highlight-item text-center">
                      <div className="highlight-icon mb-2">
                        <Image
                          src="https://www.myhomeconstructions.com/my-home-apas/assets-avali/highlights-05.webp"
                          alt="72,000 SFT Clubhouse"
                          width={50}
                          height={50}
                          className="mx-auto object-contain"
                        />
                      </div>
                      <div className="highlight-text">
                        <div className="text-lg font-bold text-blue-600">72,000 SFT</div>
                        <div className="text-xs text-gray-700">Clubhouse</div>
                      </div>
                    </div>

                    <div className="highlight-item text-center">
                      <div className="highlight-icon mb-2">
                        <Image
                          src="https://www.myhomeconstructions.com/my-home-apas/assets-avali/highlights-06.webp"
                          alt="3 BHK Luxury Apartments"
                          width={50}
                          height={50}
                          className="mx-auto object-contain"
                        />
                      </div>
                      <div className="highlight-text">
                        <div className="text-lg font-bold text-blue-600">3 BHK Luxury</div>
                        <div className="text-xs text-gray-700">Apartments 2765 To 3860 SFT</div>
                      </div>
                    </div>

                    {/* Row 4 */}
                    <div className="highlight-item text-center">
                      <div className="highlight-icon mb-2">
                        <Image
                          src="https://www.myhomeconstructions.com/my-home-apas/assets-avali/highlights-07.webp"
                          alt="Tower Lobby"
                          width={50}
                          height={50}
                          className="mx-auto object-contain"
                        />
                      </div>
                      <div className="highlight-text">
                        <div className="text-lg font-bold text-blue-600">Tower</div>
                        <div className="text-xs text-gray-700">Lobby</div>
                      </div>
                    </div>

                    <div className="highlight-item text-center">
                      <div className="highlight-icon mb-2">
                        <Image
                          src="https://www.myhomeconstructions.com/my-home-apas/assets-avali/highlights-08.webp"
                          alt="1338 Number of Flats"
                          width={50}
                          height={50}
                          className="mx-auto object-contain"
                        />
                      </div>
                      <div className="highlight-text">
                        <div className="text-lg font-bold text-blue-600">1338</div>
                        <div className="text-xs text-gray-700">Number of Flats</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Section - Project Walkthrough Video */}
                <div className="video-card bg-white p-6 rounded-lg shadow-md mt-auto">
                  <h3 className="text-lg font-semibold mb-4">Project Walkthrough</h3>
                  <div className="video-container rounded-lg overflow-hidden">
                    <video
                      width="100%"
                      height="200"
                      controls
                      className="rounded-lg"
                      poster="https://www.myhomeconstructions.com/my-home-apas/assets-avali/my-home-apas-mobile.webp"
                    >
                      <source
                        src="https://www.myhomeconstructions.com/my-home-apas/assets-avali/video/Testimonia3.mp4"
                        type="video/mp4"
                      />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </div>
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

                      <p>
                        Nestled in the charming neighborhood of Kokapet, My Home Apas is a
                        residential haven that promises an exceptional living experience. Serene and
                        thoughtfully designed, Kokapet offers easy connectivity to the vibrant hubs
                        of Hyderabad, including the bustling Wipro Junction and Gachibowli, through
                        its well-connected wide roads. Moreover, the Outer Ring Road (ORR)
                        facilitates a convenient route to the airport.
                      </p>

                      <p>
                        If you seek a prestigious address that places you at the heart of luxury,
                        with access to top-tier shopping malls, upscale restaurants, renowned
                        educational institutions, and global corporate offices, then My Home Apas in
                        Kokapet is the ideal destination to embrace the elevated lifestyle you
                        desire. Experience the essence of opulence and comfort at My Home Apas.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Amenities Section */}
              <div className="amenities-section">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {/* Tennis Court */}
                  <div className="amenity-item text-center p-4 bg-white rounded-lg shadow-sm border">
                    <div className="amenity-icon mb-3">
                      <Image
                        src="https://www.myhomeconstructions.com/my-home-apas/assets-avali/icons/icon-tennis-court.webp"
                        alt="Tennis Court"
                        width={60}
                        height={60}
                        className="mx-auto object-contain"
                      />
                    </div>
                    <p className="text-sm font-medium text-gray-700">
                      TENNIS COURT WITH VIEWING GALLERY
                    </p>
                  </div>

                  {/* Toddler Park */}
                  <div className="amenity-item text-center p-4 bg-white rounded-lg shadow-sm border">
                    <div className="amenity-icon mb-3">
                      <Image
                        src="https://www.myhomeconstructions.com/my-home-apas/assets-avali/icons/icon-Todler-park.webp"
                        alt="Toddler Park"
                        width={60}
                        height={60}
                        className="mx-auto object-contain"
                      />
                    </div>
                    <p className="text-sm font-medium text-gray-700">TODDLER PARK</p>
                  </div>

                  {/* Tower Lobby */}
                  <div className="amenity-item text-center p-4 bg-white rounded-lg shadow-sm border">
                    <div className="amenity-icon mb-3">
                      <Image
                        src="https://www.myhomeconstructions.com/my-home-apas/assets-avali/icons/icon-Tower-Loby.webp"
                        alt="Tower Lobby"
                        width={60}
                        height={60}
                        className="mx-auto object-contain"
                      />
                    </div>
                    <p className="text-sm font-medium text-gray-700">TOWER LOBBY</p>
                  </div>

                  {/* Pavilion */}
                  <div className="amenity-item text-center p-4 bg-white rounded-lg shadow-sm border">
                    <div className="amenity-icon mb-3">
                      <Image
                        src="https://www.myhomeconstructions.com/my-home-apas/assets-avali/icons/icon-pavillian.webp"
                        alt="Pavilion"
                        width={60}
                        height={60}
                        className="mx-auto object-contain"
                      />
                    </div>
                    <p className="text-sm font-medium text-gray-700">PAVILION</p>
                  </div>

                  {/* Tower Entrance */}
                  <div className="amenity-item text-center p-4 bg-white rounded-lg shadow-sm border">
                    <div className="amenity-icon mb-3">
                      <Image
                        src="https://www.myhomeconstructions.com/my-home-apas/assets-avali/icons/icon-Tower-One-Entrance.webp"
                        alt="Tower Entrance"
                        width={60}
                        height={60}
                        className="mx-auto object-contain"
                      />
                    </div>
                    <p className="text-sm font-medium text-gray-700">TOWER ENTRANCE</p>
                  </div>

                  {/* Swimming Pool */}
                  <div className="amenity-item text-center p-4 bg-white rounded-lg shadow-sm border">
                    <div className="amenity-icon mb-3">
                      <Image
                        src="https://www.myhomeconstructions.com/my-home-apas/assets-avali/icons/icon-Swimming-Pool.webp"
                        alt="Swimming Pool"
                        width={60}
                        height={60}
                        className="mx-auto object-contain"
                      />
                    </div>
                    <p className="text-sm font-medium text-gray-700">SWIMMING POOL</p>
                  </div>

                  {/* Sculpture Garden */}
                  <div className="amenity-item text-center p-4 bg-white rounded-lg shadow-sm border">
                    <div className="amenity-icon mb-3">
                      <Image
                        src="https://www.myhomeconstructions.com/my-home-apas/assets-avali/icons/icon-Sculpture%20Garden.webp"
                        alt="Sculpture Garden"
                        width={60}
                        height={60}
                        className="mx-auto object-contain"
                      />
                    </div>
                    <p className="text-sm font-medium text-gray-700">SCULPTURE GARDEN</p>
                  </div>

                  {/* Walking/Jogging Track */}
                  <div className="amenity-item text-center p-4 bg-white rounded-lg shadow-sm border">
                    <div className="amenity-icon mb-3">
                      <Image
                        src="https://www.myhomeconstructions.com/my-home-apas/assets-avali/icons/icon-Walking-Jogging-Park.webp"
                        alt="Walking/Jogging Track"
                        width={60}
                        height={60}
                        className="mx-auto object-contain"
                      />
                    </div>
                    <p className="text-sm font-medium text-gray-700">WALKING / JOGGING TRACK</p>
                  </div>

                  {/* Seating Area */}
                  <div className="amenity-item text-center p-4 bg-white rounded-lg shadow-sm border">
                    <div className="amenity-icon mb-3">
                      <Image
                        src="https://www.myhomeconstructions.com/my-home-apas/assets-avali/icons/icon-Seating-Area.webp"
                        alt="Seating Area"
                        width={60}
                        height={60}
                        className="mx-auto object-contain"
                      />
                    </div>
                    <p className="text-sm font-medium text-gray-700">SEATING AREA</p>
                  </div>
                </div>
              </div>

              {/* Specifications Section */}
              <div className="specifications-section">
                <h2 className="text-2xl font-bold mb-8 text-gray-800 text-center">
                  SPECIFICATIONS
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column */}
                  <div className="space-y-4">
                    {/* Super Structure */}
                    <div className="spec-item bg-white border rounded-lg">
                      <details className="group">
                        <summary className="cursor-pointer p-4 font-semibold text-gray-800 uppercase hover:bg-gray-50 transition-colors">
                          Super Structure
                        </summary>
                        <div className="p-4 pt-0 text-gray-700">
                          <p>
                            RCC shear wall-framed structure, resistant to wind and earthquake (Zone
                            -2)
                          </p>
                        </div>
                      </details>
                    </div>

                    {/* Walls */}
                    <div className="spec-item bg-white border rounded-lg">
                      <details className="group">
                        <summary className="cursor-pointer p-4 font-semibold text-gray-800 uppercase hover:bg-gray-50 transition-colors">
                          Walls
                        </summary>
                        <div className="p-4 pt-0 text-gray-700">
                          <ul className="list-disc list-inside space-y-2">
                            <li>
                              <strong>EXTERNAL WALLS:</strong> Reinforced shear walls
                            </li>
                            <li>
                              <strong>INTERNAL WALLS:</strong> Reinforced shear walls
                            </li>
                          </ul>
                        </div>
                      </details>
                    </div>

                    {/* Ceiling Finishes */}
                    <div className="spec-item bg-white border rounded-lg">
                      <details className="group">
                        <summary className="cursor-pointer p-4 font-semibold text-gray-800 uppercase hover:bg-gray-50 transition-colors">
                          Ceiling Finishes
                        </summary>
                        <div className="p-4 pt-0 text-gray-700">
                          <ul className="list-disc list-inside space-y-2">
                            <li>
                              <strong>
                                DRAWING, DINING, LIVING, BEDROOMS, KITCHEN AND BALCONY:
                              </strong>{' '}
                              Smoothly finished with putty and acrylic emulsion paint.
                            </li>
                            <li>
                              <strong>BATHROOM:</strong> Grid ceiling to cover all service lines.
                            </li>
                          </ul>
                        </div>
                      </details>
                    </div>

                    {/* Wall Finishing */}
                    <div className="spec-item bg-white border rounded-lg">
                      <details className="group">
                        <summary className="cursor-pointer p-4 font-semibold text-gray-800 uppercase hover:bg-gray-50 transition-colors">
                          Wall Finishing
                        </summary>
                        <div className="p-4 pt-0 text-gray-700">
                          <ul className="list-disc list-inside space-y-2">
                            <li>
                              <strong>
                                DRAWING, DINING, LIVING, BEDROOMS, KITCHEN AND BALCONY:
                              </strong>{' '}
                              Smoothly finished with putty and acrylic emulsion paint.
                            </li>
                            <li>
                              <strong>BATHROOM:</strong> Glazed Vitrified Tile cladding up to lintel
                              height.
                            </li>
                            <li>
                              <strong>EXTERNAL FINISHING:</strong> Texture finish & two coats of
                              exterior emulsion paint of reputed brands with architectural features.
                            </li>
                          </ul>
                        </div>
                      </details>
                    </div>

                    {/* Flooring */}
                    <div className="spec-item bg-white border rounded-lg">
                      <details className="group">
                        <summary className="cursor-pointer p-4 font-semibold text-gray-800 uppercase hover:bg-gray-50 transition-colors">
                          Flooring
                        </summary>
                        <div className="p-4 pt-0 text-gray-700">
                          <ul className="list-disc list-inside space-y-2">
                            <li>
                              <strong>DRAWING, DINING, LIVING, BEDROOMS, KITCHEN:</strong> Large
                              Format (1000 x 1000 mm size) double charged Vitrified tiles of reputed
                            </li>
                            <li>
                              <strong>BALCONY / BATHROOM / UTILITY:</strong> Anti-skid Vitrified
                              tiles
                            </li>
                            <li>
                              <strong>CORRIDORS FLOORING:</strong> Vitrified tiles with spacer joint
                            </li>
                            <li>
                              <strong>STAIRCASE:</strong> Natural stone / Granite Flooring
                            </li>
                          </ul>
                        </div>
                      </details>
                    </div>

                    {/* Windows / Grills */}
                    <div className="spec-item bg-white border rounded-lg">
                      <details className="group">
                        <summary className="cursor-pointer p-4 font-semibold text-gray-800 uppercase hover:bg-gray-50 transition-colors">
                          Windows / Grills
                        </summary>
                        <div className="p-4 pt-0 text-gray-700">
                          <p>
                            Windows are of Aluminum alloy / UPVC glazed sliding/open-able shutters
                            with EPDM gaskets, necessary hardware with M.S. Grill and provision for
                            mosquito mesh shutter
                          </p>
                        </div>
                      </details>
                    </div>

                    {/* Doors */}
                    <div className="spec-item bg-white border rounded-lg">
                      <details className="group">
                        <summary className="cursor-pointer p-4 font-semibold text-gray-800 uppercase hover:bg-gray-50 transition-colors">
                          Doors
                        </summary>
                        <div className="p-4 pt-0 text-gray-700">
                          <ul className="list-disc list-inside space-y-2">
                            <li>
                              <strong>MAIN DOORS:</strong> Hard wood frame, finished with melamine
                              spray polish, Teak finished flush shutters with reputed hardware
                            </li>
                            <li>
                              <strong>INTERNAL DOORS:</strong> Hard wood frame or factory made
                              wooden frame with both side laminated flush shutter with reputed
                              hardware.
                            </li>
                            <li>
                              <strong>BATHROOM / UTILITY:</strong> Granite frame with both side
                              laminated flush shutter with reputed hardware.
                            </li>
                            <li>
                              <strong>BALCONIES:</strong> Aluminum/UPVC glazed French sliding doors
                              with mosquito mesh provision.
                            </li>
                          </ul>
                        </div>
                      </details>
                    </div>

                    {/* All Bathrooms */}
                    <div className="spec-item bg-white border rounded-lg">
                      <details className="group">
                        <summary className="cursor-pointer p-4 font-semibold text-gray-800 uppercase hover:bg-gray-50 transition-colors">
                          All Bathrooms
                        </summary>
                        <div className="p-4 pt-0 text-gray-700">
                          <ul className="list-disc list-inside space-y-2">
                            <li>Vanity type wash basin with single lever basin mixer.</li>
                            <li>EWC with flush Valve of reputed brand.</li>
                            <li>Single lever bath and shower mixer.</li>
                            <li>Provision for geysers in all bathrooms.</li>
                            <li>All faucets are chrome plated by reputed brands.</li>
                          </ul>
                        </div>
                      </details>
                    </div>

                    {/* Kitchen */}
                    <div className="spec-item bg-white border rounded-lg">
                      <details className="group">
                        <summary className="cursor-pointer p-4 font-semibold text-gray-800 uppercase hover:bg-gray-50 transition-colors">
                          Kitchen
                        </summary>
                        <div className="p-4 pt-0 text-gray-700">
                          <ul className="list-disc list-inside space-y-2">
                            <li>Granite platform with single bowl stainless steel sink.</li>
                            <li>Provision for hot & cold water and provision for water purifier</li>
                          </ul>
                        </div>
                      </details>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    {/* Electrical */}
                    <div className="spec-item bg-white border rounded-lg">
                      <details className="group">
                        <summary className="cursor-pointer p-4 font-semibold text-gray-800 uppercase hover:bg-gray-50 transition-colors">
                          Electrical
                        </summary>
                        <div className="p-4 pt-0 text-gray-700">
                          <ul className="list-disc list-inside space-y-2">
                            <li>Concealed copper wiring of reputed make.</li>
                            <li>Power outlet for air conditioners in all bed rooms and Living.</li>
                            <li>Power outlets for geysers in all bathrooms and utility.</li>
                            <li>
                              Power outlets for chimney, hob, refrigerator, microwave oven,
                              mixer/grinder, water purifier in kitchen.
                            </li>
                            <li>Washing machine & dishwasher point in utility area.</li>
                            <li>Three phase supply for each unit and individual prepaid meters.</li>
                            <li>
                              Miniature circuit breakers (MCB) for each distribution board of
                              reputed make.
                            </li>
                            <li>Modular switches of reputed make</li>
                          </ul>
                        </div>
                      </details>
                    </div>

                    {/* TV / Telephone */}
                    <div className="spec-item bg-white border rounded-lg">
                      <details className="group">
                        <summary className="cursor-pointer p-4 font-semibold text-gray-800 uppercase hover:bg-gray-50 transition-colors">
                          TV / Telephone
                        </summary>
                        <div className="p-4 pt-0 text-gray-700">
                          <ul className="list-disc list-inside space-y-2">
                            <li>Provision for internet connection & DTH</li>
                            <li>Telephone point in drawing</li>
                            <li>TV points in all bedrooms, drawing & living</li>
                          </ul>
                        </div>
                      </details>
                    </div>

                    {/* Waterproofing */}
                    <div className="spec-item bg-white border rounded-lg">
                      <details className="group">
                        <summary className="cursor-pointer p-4 font-semibold text-gray-800 uppercase hover:bg-gray-50 transition-colors">
                          Waterproofing
                        </summary>
                        <div className="p-4 pt-0 text-gray-700">
                          <p>
                            Waterproofing shall be provided for all bathrooms, balconies, utility
                            area & roof terrace.
                          </p>
                        </div>
                      </details>
                    </div>

                    {/* Security */}
                    <div className="spec-item bg-white border rounded-lg">
                      <details className="group">
                        <summary className="cursor-pointer p-4 font-semibold text-gray-800 uppercase hover:bg-gray-50 transition-colors">
                          Security
                        </summary>
                        <div className="p-4 pt-0 text-gray-700">
                          <ul className="list-disc list-inside space-y-2">
                            <li>Intercom facility to all units connecting security</li>
                            <li>
                              Comprehensive security system with cameras at main security, entrance
                              of the tower & lift cabins.
                            </li>
                          </ul>
                        </div>
                      </details>
                    </div>

                    {/* Fire Safety */}
                    <div className="spec-item bg-white border rounded-lg">
                      <details className="group">
                        <summary className="cursor-pointer p-4 font-semibold text-gray-800 uppercase hover:bg-gray-50 transition-colors">
                          Fire Safety
                        </summary>
                        <div className="p-4 pt-0 text-gray-700">
                          <p>
                            Fire alarm, automatic sprinklers and wet risers as per Fire Authority
                            Regulations.
                          </p>
                        </div>
                      </details>
                    </div>

                    {/* Power Back up */}
                    <div className="spec-item bg-white border rounded-lg">
                      <details className="group">
                        <summary className="cursor-pointer p-4 font-semibold text-gray-800 uppercase hover:bg-gray-50 transition-colors">
                          Power Back up
                        </summary>
                        <div className="p-4 pt-0 text-gray-700">
                          <p>Metered DG backup with acoustic enclosure & AMF</p>
                        </div>
                      </details>
                    </div>

                    {/* LPG */}
                    <div className="spec-item bg-white border rounded-lg">
                      <details className="group">
                        <summary className="cursor-pointer p-4 font-semibold text-gray-800 uppercase hover:bg-gray-50 transition-colors">
                          LPG
                        </summary>
                        <div className="p-4 pt-0 text-gray-700">
                          <ul className="list-disc list-inside space-y-2">
                            <li>Supply of gas from LPG</li>
                          </ul>
                        </div>
                      </details>
                    </div>

                    {/* Lifts */}
                    <div className="spec-item bg-white border rounded-lg">
                      <details className="group">
                        <summary className="cursor-pointer p-4 font-semibold text-gray-800 uppercase hover:bg-gray-50 transition-colors">
                          Lifts
                        </summary>
                        <div className="p-4 pt-0 text-gray-700">
                          <p>
                            V3F drive high speed Lifts of Reputed make. Lift lobby cladding with
                            vitrified tiles /granite.
                          </p>
                        </div>
                      </details>
                    </div>

                    {/* WTP & STP */}
                    <div className="spec-item bg-white border rounded-lg">
                      <details className="group">
                        <summary className="cursor-pointer p-4 font-semibold text-gray-800 uppercase hover:bg-gray-50 transition-colors">
                          WTP & STP
                        </summary>
                        <div className="p-4 pt-0 text-gray-700">
                          <ul className="list-disc list-inside space-y-2">
                            <li>
                              Water treatment plant for bore-well water and water meter for each
                              unit
                            </li>
                            <li>
                              A sewage treatment plant of adequate capacity as per norms will be
                              provided inside the project.
                            </li>
                            <li>Treated sewage water for the landscape and flushing purpose.</li>
                          </ul>
                        </div>
                      </details>
                    </div>

                    {/* Billing System */}
                    <div className="spec-item bg-white border rounded-lg">
                      <details className="group">
                        <summary className="cursor-pointer p-4 font-semibold text-gray-800 uppercase hover:bg-gray-50 transition-colors">
                          Billing System
                        </summary>
                        <div className="p-4 pt-0 text-gray-700">
                          <p>Automated billing system for water, power, gas, & maintenance.</p>
                        </div>
                      </details>
                    </div>
                  </div>
                </div>
              </div>

              {/* Layout Section */}
              <div className="layout-section">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Layout</h2>
                <div className="layout-image-container bg-white p-6 rounded-lg shadow-sm border">
                  <div
                    className="cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() =>
                      openImageModal(
                        'https://www.myhomeconstructions.com/my-home-apas/assets-avali/site-layout.webp'
                      )
                    }
                  >
                    <Image
                      src="https://www.myhomeconstructions.com/my-home-apas/assets-avali/site-layout.webp"
                      alt="My Home Apas Site Layout"
                      width={800}
                      height={600}
                      className="w-full h-auto object-contain rounded-lg"
                      sizes="100vw"
                    />
                  </div>
                </div>
              </div>

              {/* Floor Plans Section */}
              <div className="floor-plans-section">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Floor Plans</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="floor-plan-item bg-white p-4 rounded-lg shadow-sm border">
                    <div
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() =>
                        openImageModal(
                          'https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-01.webp'
                        )
                      }
                    >
                      <Image
                        src="https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-01.webp"
                        alt="Floor Plan 01"
                        width={400}
                        height={300}
                        className="w-full h-auto object-contain rounded-lg"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                    <h3 className="text-center mt-3 font-medium text-gray-800">Floor Plan 01</h3>
                  </div>

                  <div className="floor-plan-item bg-white p-4 rounded-lg shadow-sm border">
                    <div
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() =>
                        openImageModal(
                          'https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-02.webp'
                        )
                      }
                    >
                      <Image
                        src="https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-02.webp"
                        alt="Floor Plan 02"
                        width={400}
                        height={300}
                        className="w-full h-auto object-contain rounded-lg"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                    <h3 className="text-center mt-3 font-medium text-gray-800">Floor Plan 02</h3>
                  </div>

                  <div className="floor-plan-item bg-white p-4 rounded-lg shadow-sm border">
                    <div
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() =>
                        openImageModal(
                          'https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-03.webp'
                        )
                      }
                    >
                      <Image
                        src="https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-03.webp"
                        alt="Floor Plan 03"
                        width={400}
                        height={300}
                        className="w-full h-auto object-contain rounded-lg"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                    <h3 className="text-center mt-3 font-medium text-gray-800">Floor Plan 03</h3>
                  </div>

                  <div className="floor-plan-item bg-white p-4 rounded-lg shadow-sm border">
                    <div
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() =>
                        openImageModal(
                          'https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-04.webp'
                        )
                      }
                    >
                      <Image
                        src="https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-04.webp"
                        alt="Floor Plan 04"
                        width={400}
                        height={300}
                        className="w-full h-auto object-contain rounded-lg"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                    <h3 className="text-center mt-3 font-medium text-gray-800">Floor Plan 04</h3>
                  </div>

                  <div className="floor-plan-item bg-white p-4 rounded-lg shadow-sm border">
                    <div
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() =>
                        openImageModal(
                          'https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-05.webp'
                        )
                      }
                    >
                      <Image
                        src="https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-05.webp"
                        alt="Floor Plan 05"
                        width={400}
                        height={300}
                        className="w-full h-auto object-contain rounded-lg"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                    <h3 className="text-center mt-3 font-medium text-gray-800">Floor Plan 05</h3>
                  </div>

                  <div className="floor-plan-item bg-white p-4 rounded-lg shadow-sm border">
                    <div
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() =>
                        openImageModal(
                          'https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-06.webp'
                        )
                      }
                    >
                      <Image
                        src="https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-06.webp"
                        alt="Floor Plan 06"
                        width={400}
                        height={300}
                        className="w-full h-auto object-contain rounded-lg"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                    <h3 className="text-center mt-3 font-medium text-gray-800">Floor Plan 06</h3>
                  </div>

                  <div className="floor-plan-item bg-white p-4 rounded-lg shadow-sm border">
                    <div
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() =>
                        openImageModal(
                          'https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-07.webp'
                        )
                      }
                    >
                      <Image
                        src="https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-07.webp"
                        alt="Floor Plan 07"
                        width={400}
                        height={300}
                        className="w-full h-auto object-contain rounded-lg"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                    <h3 className="text-center mt-3 font-medium text-gray-800">Floor Plan 07</h3>
                  </div>

                  <div className="floor-plan-item bg-white p-4 rounded-lg shadow-sm border">
                    <div
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() =>
                        openImageModal(
                          'https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-08.webp'
                        )
                      }
                    >
                      <Image
                        src="https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-08.webp"
                        alt="Floor Plan 08"
                        width={400}
                        height={300}
                        className="w-full h-auto object-contain rounded-lg"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                    <h3 className="text-center mt-3 font-medium text-gray-800">Floor Plan 08</h3>
                  </div>

                  <div className="floor-plan-item bg-white p-4 rounded-lg shadow-sm border">
                    <div
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() =>
                        openImageModal(
                          'https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-09.webp'
                        )
                      }
                    >
                      <Image
                        src="https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-09.webp"
                        alt="Floor Plan 09"
                        width={400}
                        height={300}
                        className="w-full h-auto object-contain rounded-lg"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                    <h3 className="text-center mt-3 font-medium text-gray-800">Floor Plan 09</h3>
                  </div>

                  <div className="floor-plan-item bg-white p-4 rounded-lg shadow-sm border">
                    <div
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() =>
                        openImageModal(
                          'https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-10.webp'
                        )
                      }
                    >
                      <Image
                        src="https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-10.webp"
                        alt="Floor Plan 10"
                        width={400}
                        height={300}
                        className="w-full h-auto object-contain rounded-lg"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                    <h3 className="text-center mt-3 font-medium text-gray-800">Floor Plan 10</h3>
                  </div>

                  <div className="floor-plan-item bg-white p-4 rounded-lg shadow-sm border">
                    <div
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() =>
                        openImageModal(
                          'https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-11.webp'
                        )
                      }
                    >
                      <Image
                        src="https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-11.webp"
                        alt="Floor Plan 11"
                        width={400}
                        height={300}
                        className="w-full h-auto object-contain rounded-lg"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                    <h3 className="text-center mt-3 font-medium text-gray-800">Floor Plan 11</h3>
                  </div>

                  <div className="floor-plan-item bg-white p-4 rounded-lg shadow-sm border">
                    <div
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() =>
                        openImageModal(
                          'https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-12.webp'
                        )
                      }
                    >
                      <Image
                        src="https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-12.webp"
                        alt="Floor Plan 12"
                        width={400}
                        height={300}
                        className="w-full h-auto object-contain rounded-lg"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                    <h3 className="text-center mt-3 font-medium text-gray-800">Floor Plan 12</h3>
                  </div>

                  <div className="floor-plan-item bg-white p-4 rounded-lg shadow-sm border">
                    <div
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() =>
                        openImageModal(
                          'https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-13.webp'
                        )
                      }
                    >
                      <Image
                        src="https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-13.webp"
                        alt="Floor Plan 13"
                        width={400}
                        height={300}
                        className="w-full h-auto object-contain rounded-lg"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                    <h3 className="text-center mt-3 font-medium text-gray-800">Floor Plan 13</h3>
                  </div>
                </div>
              </div>

              {/* Gallery Section */}
              <div className="gallery-section">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Gallery</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="gallery-item bg-white p-4 rounded-lg shadow-sm border">
                    <div
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() =>
                        openImageModal(
                          'https://www.myhomeconstructions.com/my-home-apas/assets-avali/galllery_bridge-cam.webp'
                        )
                      }
                    >
                      <Image
                        src="https://www.myhomeconstructions.com/my-home-apas/assets-avali/galllery_bridge-cam.webp"
                        alt="Bridge View"
                        width={400}
                        height={300}
                        className="w-full h-auto object-cover rounded-lg"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                    <h3 className="text-center mt-3 font-medium text-gray-800">Bridge View</h3>
                  </div>

                  <div className="gallery-item bg-white p-4 rounded-lg shadow-sm border">
                    <div
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() =>
                        openImageModal(
                          'https://www.myhomeconstructions.com/my-home-apas/assets-avali/galllery_central-land-scape.webp'
                        )
                      }
                    >
                      <Image
                        src="https://www.myhomeconstructions.com/my-home-apas/assets-avali/galllery_central-land-scape.webp"
                        alt="Central Landscape"
                        width={400}
                        height={300}
                        className="w-full h-auto object-cover rounded-lg"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                    <h3 className="text-center mt-3 font-medium text-gray-800">
                      Central Landscape
                    </h3>
                  </div>

                  <div className="gallery-item bg-white p-4 rounded-lg shadow-sm border">
                    <div
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() =>
                        openImageModal(
                          'https://www.myhomeconstructions.com/my-home-apas/assets-avali/galllery_reading-lounge.webp'
                        )
                      }
                    >
                      <Image
                        src="https://www.myhomeconstructions.com/my-home-apas/assets-avali/galllery_reading-lounge.webp"
                        alt="Reading Lounge"
                        width={400}
                        height={300}
                        className="w-full h-auto object-cover rounded-lg"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                    <h3 className="text-center mt-3 font-medium text-gray-800">Reading Lounge</h3>
                  </div>

                  <div className="gallery-item bg-white p-4 rounded-lg shadow-sm border">
                    <div
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() =>
                        openImageModal(
                          'https://www.myhomeconstructions.com/my-home-apas/assets-avali/galllery_lake-view.webp'
                        )
                      }
                    >
                      <Image
                        src="https://www.myhomeconstructions.com/my-home-apas/assets-avali/galllery_lake-view.webp"
                        alt="Lake View"
                        width={400}
                        height={300}
                        className="w-full h-auto object-cover rounded-lg"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                    <h3 className="text-center mt-3 font-medium text-gray-800">Lake View</h3>
                  </div>

                  <div className="gallery-item bg-white p-4 rounded-lg shadow-sm border">
                    <div
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() =>
                        openImageModal(
                          'https://www.myhomeconstructions.com/my-home-apas/assets-avali/galllery_central-land-scape-lower-angle.webp'
                        )
                      }
                    >
                      <Image
                        src="https://www.myhomeconstructions.com/my-home-apas/assets-avali/galllery_central-land-scape-lower-angle.webp"
                        alt="Central Landscape - Lower Angle"
                        width={400}
                        height={300}
                        className="w-full h-auto object-cover rounded-lg"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                    <h3 className="text-center mt-3 font-medium text-gray-800">
                      Central Landscape - Lower Angle
                    </h3>
                  </div>

                  <div className="gallery-item bg-white p-4 rounded-lg shadow-sm border">
                    <div
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() =>
                        openImageModal(
                          'https://www.myhomeconstructions.com/my-home-apas/assets-avali/galllery_kids-cam.webp'
                        )
                      }
                    >
                      <Image
                        src="https://www.myhomeconstructions.com/my-home-apas/assets-avali/galllery_kids-cam.webp"
                        alt="Kids Area"
                        width={400}
                        height={300}
                        className="w-full h-auto object-cover rounded-lg"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                    <h3 className="text-center mt-3 font-medium text-gray-800">Kids Area</h3>
                  </div>
                </div>
              </div>

              {/* Project Status Section */}
              <div className="project-status-section">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Project Status</h2>
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <p className="text-blue-800 font-medium">As on 1st August 25</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="status-item bg-white p-4 rounded-lg shadow-sm border flex flex-col justify-end">
                    <div
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() =>
                        openImageModal(
                          'https://www.myhomeconstructions.com/my-home-apas/assests/img/project-status/1.webp'
                        )
                      }
                    >
                      <Image
                        src="https://www.myhomeconstructions.com/my-home-apas/assests/img/project-status/1.webp"
                        alt='My Home "APAS" Tower-"01" 19th Floor Roof Slab Work In Progress'
                        width={400}
                        height={300}
                        className="w-full h-auto object-cover rounded-lg"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                    <p className="text-center mt-3 text-sm text-gray-700">
                      My Home &quot;APAS&quot; Tower-&quot;01&quot; 19th Floor Roof Slab Work In
                      Progress
                    </p>
                  </div>

                  <div className="status-item bg-white p-4 rounded-lg shadow-sm border flex flex-col justify-end">
                    <div
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() =>
                        openImageModal(
                          'https://www.myhomeconstructions.com/my-home-apas/assests/img/project-status/2.webp'
                        )
                      }
                    >
                      <Image
                        src="https://www.myhomeconstructions.com/my-home-apas/assests/img/project-status/2.webp"
                        alt='My Home "APAS" Tower-"02" 22nd Floor Roof Slab Work In Progress'
                        width={400}
                        height={300}
                        className="w-full h-auto object-cover rounded-lg"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                    <p className="text-center mt-3 text-sm text-gray-700">
                      My Home &quot;APAS&quot; Tower-&quot;02&quot; 22nd Floor Roof Slab Work In
                      Progress
                    </p>
                  </div>

                  <div className="status-item bg-white p-4 rounded-lg shadow-sm border flex flex-col justify-end">
                    <div
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() =>
                        openImageModal(
                          'https://www.myhomeconstructions.com/my-home-apas/assests/img/project-status/3.webp'
                        )
                      }
                    >
                      <Image
                        src="https://www.myhomeconstructions.com/my-home-apas/assests/img/project-status/3.webp"
                        alt='My Home "APAS" Tower-"03" 21st Floor Roof Slab Work In Progress'
                        width={400}
                        height={300}
                        className="w-full h-auto object-cover rounded-lg"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                    <p className="text-center mt-3 text-sm text-gray-700">
                      My Home &quot;APAS&quot; Tower-&quot;03&quot; 21st Floor Roof Slab Work In
                      Progress
                    </p>
                  </div>

                  <div className="status-item bg-white p-4 rounded-lg shadow-sm border flex flex-col justify-end">
                    <div
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() =>
                        openImageModal(
                          'https://www.myhomeconstructions.com/my-home-apas/assests/img/project-status/4.webp'
                        )
                      }
                    >
                      <Image
                        src="https://www.myhomeconstructions.com/my-home-apas/assests/img/project-status/4.webp"
                        alt='My Home "APAS" Tower-"04" Basement-I Roof Slab Work In Progress'
                        width={400}
                        height={300}
                        className="w-full h-auto object-cover rounded-lg"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                    <p className="text-center mt-3 text-sm text-gray-700">
                      My Home &quot;APAS&quot; Tower-&quot;04&quot; Basement-I Roof Slab Work In
                      Progress
                    </p>
                  </div>

                  <div className="status-item bg-white p-4 rounded-lg shadow-sm border flex flex-col justify-end">
                    <div
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() =>
                        openImageModal(
                          'https://www.myhomeconstructions.com/my-home-apas/assests/img/project-status/5.webp'
                        )
                      }
                    >
                      <Image
                        src="https://www.myhomeconstructions.com/my-home-apas/assests/img/project-status/5.webp"
                        alt="CLUB-APAS"
                        width={400}
                        height={300}
                        className="w-full h-auto object-cover rounded-lg"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                    <p className="text-center mt-3 text-sm text-gray-700">CLUB-APAS</p>
                  </div>
                </div>
              </div>
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
            {/* Close Button */}
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

            {/* Zoom Controls */}
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

            {/* Image Container */}
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

      {/* Auth Modal */}
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
