import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { NextSeo } from 'next-seo'
import { GetServerSideProps } from 'next'
import { PrismaClient } from '@prisma/client'
import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

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
              <div className="project-actions">
                {/* Removed View Builder button as requested */}
              </div>
            </div>
          </div>
        </div>

        {/* Project Image & Sidebar */}
        <div className="project-image-section bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Side - Project Image */}
              {allImages.length > 0 && (
                <div className="lg:col-span-2">
                  <div className="relative rounded-lg overflow-hidden bg-gray-200">
                    <Image
                      src={allImages[currentImageIndex]}
                      alt={`${project.name} - Image ${currentImageIndex + 1}`}
                      width={600}
                      height={300}
                      className="object-contain w-full h-auto transition-all duration-500"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 60vw"
                    />
                  </div>
                </div>
              )}

              {/* Right Side - Quick Stats & Map */}
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="stats-card bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
                  <div className="space-y-3">
                    {project.numberOfUnits && (
                      <div className="stat-item flex justify-between">
                        <span className="text-gray-600">Total Units:</span>
                        <span className="font-medium">{project.numberOfUnits}</span>
                      </div>
                    )}
                    {project.size && (
                      <div className="stat-item flex justify-between">
                        <span className="text-gray-600">Project Size:</span>
                        <span className="font-medium">{project.size} acres</span>
                      </div>
                    )}
                    {details.projectSize?.landArea?.openSpace && (
                      <div className="stat-item flex justify-between">
                        <span className="text-gray-600">Open Space:</span>
                        <span className="font-medium text-green-600">
                          {details.projectSize.landArea.openSpace}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

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
                      <span className="font-medium">Address:</span>{' '}
                      {project.location.locality && `${project.location.locality}, `}
                      {project.location.city}, {project.location.state}
                      {project.location.zipcode && ` - ${project.location.zipcode}`}
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
                    <p className="text-gray-700 leading-relaxed">{project.description}</p>
                  </div>

                  {details.overview && (
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Project Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="info-item">
                          <span className="font-medium">Project Type:</span>
                          <span className="text-gray-700 ml-2">{details.overview.projectType}</span>
                        </div>
                        <div className="info-item">
                          <span className="font-medium">PIN Code:</span>
                          <span className="text-gray-700 ml-2">{details.overview.pinCode}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {details.projectSize && (
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Project Size</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {details.projectSize.landArea && (
                          <div className="info-item">
                            <span className="font-medium">Land Area:</span>
                            <span className="text-gray-700 ml-2">
                              {details.projectSize.landArea.total}
                            </span>
                          </div>
                        )}
                        {details.projectSize.construction && (
                          <>
                            <div className="info-item">
                              <span className="font-medium">Towers:</span>
                              <span className="text-gray-700 ml-2">
                                {details.projectSize.construction.towers}
                              </span>
                            </div>
                            <div className="info-item">
                              <span className="font-medium">Total Units:</span>
                              <span className="text-gray-700 ml-2">
                                {details.projectSize.construction.totalUnits}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Amenities Section */}
              {(details.amenities?.clubhouse || details.amenities?.additional) && (
                <div className="amenities-section">
                  <h2 className="text-2xl font-bold mb-6 text-gray-800">Amenities</h2>
                  <div className="space-y-6">
                    {details.amenities.clubhouse && (
                      <div>
                        <h3 className="text-xl font-semibold mb-3">
                          Clubhouse ({details.amenities.clubhouse.size})
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {details.amenities.clubhouse.facilities?.map(
                            (facility: string, index: number) => (
                              <div
                                key={index}
                                className="amenity-item flex items-center p-2 bg-blue-50 rounded"
                              >
                                <span className="text-blue-600 mr-2">✓</span>
                                <span className="text-sm text-gray-700">{facility}</span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {details.amenities.additional && (
                      <div>
                        <h3 className="text-xl font-semibold mb-3">Additional Amenities</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {details.amenities.additional.map((amenity: string, index: number) => (
                            <div
                              key={index}
                              className="amenity-item flex items-center p-2 bg-green-50 rounded"
                            >
                              <span className="text-green-600 mr-2">✓</span>
                              <span className="text-sm text-gray-700">{amenity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Specifications Section */}
              {details.technicalSpecs && (
                <div className="specifications-section">
                  <h2 className="text-2xl font-bold mb-6 text-gray-800">Specifications</h2>
                  <div className="space-y-6">
                    {details.technicalSpecs.structure && (
                      <div>
                        <h3 className="text-xl font-semibold mb-3">Structure & Safety</h3>
                        <div className="space-y-2">
                          <div className="spec-item">
                            <span className="font-medium">Structure Type:</span>
                            <span className="text-gray-700 ml-2">
                              {details.technicalSpecs.structure.type}
                            </span>
                          </div>
                          <div className="spec-item">
                            <span className="font-medium">Safety Features:</span>
                            <span className="text-gray-700 ml-2">
                              {details.technicalSpecs.structure.safety}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {details.technicalSpecs.finishes && (
                      <div>
                        <h3 className="text-xl font-semibold mb-3">Finishes</h3>
                        <div className="space-y-2">
                          {details.technicalSpecs.finishes.flooring && (
                            <div className="spec-item">
                              <span className="font-medium">Flooring:</span>
                              <span className="text-gray-700 ml-2">
                                {details.technicalSpecs.finishes.flooring.main}
                              </span>
                            </div>
                          )}
                          {details.technicalSpecs.finishes.walls && (
                            <div className="spec-item">
                              <span className="font-medium">Wall Finish:</span>
                              <span className="text-gray-700 ml-2">
                                {details.technicalSpecs.finishes.walls.interior}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* IT Hubs & Commercial Areas - Bottom Section */}
        {details.connectivity?.itHubs && (
          <div className="connectivity-section bg-white">
            <div className="container mx-auto px-4 py-8">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">IT Hubs & Commercial Areas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(details.connectivity.itHubs).map(([key, value]) => (
                  <div
                    key={key}
                    className="connectivity-item flex justify-between p-4 bg-blue-50 rounded-lg"
                  >
                    <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="text-blue-600 font-semibold">{value as string}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
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
