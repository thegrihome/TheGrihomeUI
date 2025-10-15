import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { NextSeo } from 'next-seo'
import { GetServerSideProps } from 'next'
import { PrismaClient } from '@prisma/client'
import { useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface Builder {
  id: string
  name: string
  description: string | null
  logoUrl: string | null
  website: string | null
  contactInfo: any
  builderDetails: any
  projects: Array<{
    id: string
    name: string
    description: string
    type: string
    numberOfUnits: number | null
    size: number | null
    thumbnailUrl: string | null
    location: {
      id: string
      city: string
      state: string
      country: string
      locality: string | null
    }
  }>
}

interface BuilderPageProps {
  builder: Builder | null
}

export default function BuilderPage({ builder }: BuilderPageProps) {
  const [activeTab, setActiveTab] = useState('overview')

  if (!builder) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50">
          <div className="container mx-auto px-4 py-16 text-center">
            <div className="text-6xl mb-4">🏗️</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Builder Not Found</h1>
            <p className="text-gray-600 mb-8">
              The builder you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Link
              href="/projects"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse All Projects
            </Link>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const contactInfo = builder.contactInfo || {}
  const details = builder.builderDetails || {}

  return (
    <>
      <NextSeo
        title={`${builder.name} - Builder Profile | Grihome`}
        description={
          builder.description ||
          `Explore projects by ${builder.name}, a trusted real estate developer`
        }
        canonical={`https://grihome.vercel.app/builders/${builder.id}`}
        openGraph={{
          url: `https://grihome.vercel.app/builders/${builder.id}`,
          title: `${builder.name} - Builder Profile`,
          description:
            builder.description ||
            `Explore projects by ${builder.name}, a trusted real estate developer`,
          images: builder.logoUrl
            ? [
                {
                  url: builder.logoUrl,
                  width: 400,
                  height: 300,
                  alt: `${builder.name} logo`,
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

      <main className="min-h-screen bg-gray-50">
        {/* Builder Header */}
        <div className="builder-header bg-white border-b">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
              {/* Builder Logo & Basic Info */}
              <div className="flex items-start gap-6">
                {builder.logoUrl && (
                  <div className="builder-logo-container flex-shrink-0">
                    <Image
                      src={builder.logoUrl}
                      alt={`${builder.name} logo`}
                      width={120}
                      height={80}
                      className="object-contain bg-gray-50 p-2 rounded-lg"
                    />
                  </div>
                )}
                <div className="builder-info">
                  <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-3">
                    {builder.name}
                  </h1>
                  {builder.description && (
                    <p className="text-gray-600 mb-4 max-w-2xl leading-relaxed">
                      {builder.description}
                    </p>
                  )}
                  <div className="builder-stats flex flex-wrap gap-4 text-sm text-gray-600">
                    <div className="stat-item">
                      <span className="font-medium text-blue-600">{builder.projects.length}</span>
                      <span className="ml-1">Active Projects</span>
                    </div>
                    {details.experience && (
                      <div className="stat-item">
                        <span className="font-medium text-green-600">{details.experience}</span>
                        <span className="ml-1">Years Experience</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="builder-actions flex gap-3 lg:ml-auto">
                {builder.website && (
                  <a
                    href={builder.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    Visit Website
                  </a>
                )}
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                  Contact Builder
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="builder-content">
          <div className="container mx-auto px-4 py-8">
            {/* Navigation Tabs */}
            <div className="tabs-navigation mb-8">
              <div className="flex border-b">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'projects', label: `Projects (${builder.projects.length})` },
                  ...(details.awards || details.certifications
                    ? [{ id: 'achievements', label: 'Achievements' }]
                    : []),
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-3 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'border-b-2 border-blue-500 text-blue-600'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
              {activeTab === 'overview' && (
                <div className="overview-content">
                  {/* Two Column Layout: About and Quick Stats */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    {/* About Section */}
                    <div className="about-section">
                      <h2 className="text-2xl font-semibold mb-4">About {builder.name}</h2>
                      <div className="space-y-4">
                        {builder.description ? (
                          <p className="text-gray-700 leading-relaxed">{builder.description}</p>
                        ) : (
                          <p className="text-gray-500 italic">
                            {builder.name} is a trusted real estate developer committed to creating
                            quality homes and commercial spaces.
                          </p>
                        )}
                        {details.overview?.description && (
                          <p className="text-gray-700 leading-relaxed">
                            {details.overview.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="stats-section">
                      <h2 className="text-2xl font-semibold mb-4">Quick Stats</h2>
                      <div className="stats-card bg-gray-50 p-6 rounded-lg">
                        <div className="space-y-4">
                          <div className="stat-item flex justify-between items-center">
                            <span className="text-gray-600">Total Projects:</span>
                            <span className="font-semibold text-blue-600 text-lg">
                              {builder.projects.length}
                            </span>
                          </div>
                          <div className="stat-item flex justify-between items-center">
                            <span className="text-gray-600">Cities:</span>
                            <span className="font-semibold text-gray-800 text-lg">
                              {new Set(builder.projects.map(p => p.location.city)).size}
                            </span>
                          </div>
                          {details.totalUnits && (
                            <div className="stat-item flex justify-between items-center">
                              <span className="text-gray-600">Total Units:</span>
                              <span className="font-semibold text-purple-600 text-lg">
                                {details.totalUnits}
                              </span>
                            </div>
                          )}
                          {details.experience && (
                            <div className="stat-item flex justify-between items-center">
                              <span className="text-gray-600">Experience:</span>
                              <span className="font-semibold text-green-600 text-lg">
                                {details.experience} Years
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Services Section */}
                  {details.services && details.services.length > 0 && (
                    <div className="services-section mb-12">
                      <h2 className="text-2xl font-semibold mb-6">Our Services</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {details.services.map((service: any, index: number) => (
                          <div
                            key={index}
                            className="service-item bg-white p-6 rounded-lg shadow-sm border"
                          >
                            {(service.emoji || service.icon) && (
                              <div className="service-icon mb-4">
                                {service.emoji ? (
                                  <div className="text-4xl">{service.emoji}</div>
                                ) : (
                                  <Image
                                    src={service.icon}
                                    alt={service.name}
                                    width={48}
                                    height={48}
                                    className="object-contain"
                                  />
                                )}
                              </div>
                            )}
                            <h3 className="text-lg font-semibold mb-3">{service.name}</h3>
                            <p className="text-gray-600 text-sm">{service.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contact Information */}
                  {(contactInfo.company ||
                    contactInfo.emails ||
                    contactInfo.phones ||
                    contactInfo.addresses) && (
                    <div className="contact-section">
                      <h2 className="text-2xl font-semibold mb-6">Contact Information</h2>
                      <div className="bg-white border rounded-lg p-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          {/* Left Column: Contact Details */}
                          <div className="contact-details space-y-8">
                            {/* Company Info */}
                            <div className="company-info">
                              <h3 className="text-lg font-semibold mb-4">Company Information</h3>
                              <div className="space-y-3">
                                {builder.website && (
                                  <div>
                                    <a
                                      href={builder.website}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 flex items-center"
                                    >
                                      <svg
                                        className="w-5 h-5 mr-2"
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
                                      {builder.website}
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Dynamic Contact Sections */}
                            {contactInfo.emails && (
                              <div className="emails-section">
                                <h3 className="text-lg font-semibold mb-4">Email Addresses</h3>
                                <div className="space-y-3">
                                  {Array.isArray(contactInfo.emails) ? (
                                    contactInfo.emails.map((email: any, index: number) => (
                                      <div key={index} className="email-item flex items-center">
                                        <svg
                                          className="w-5 h-5 mr-3 text-gray-400"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                          />
                                        </svg>
                                        <div>
                                          <a
                                            href={`mailto:${typeof email === 'string' ? email : email.email}`}
                                            className="text-blue-600 hover:text-blue-800"
                                          >
                                            {typeof email === 'string' ? email : email.email}
                                          </a>
                                          {typeof email !== 'string' && email.purpose && (
                                            <div className="text-sm text-gray-500">
                                              {email.purpose}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="flex items-center">
                                      <svg
                                        className="w-5 h-5 mr-3 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                        />
                                      </svg>
                                      <a
                                        href={`mailto:${contactInfo.emails}`}
                                        className="text-blue-600 hover:text-blue-800"
                                      >
                                        {contactInfo.emails}
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Phone Numbers */}
                            {contactInfo.phones && (
                              <div className="phones-section">
                                <h3 className="text-lg font-semibold mb-4">Phone Numbers</h3>
                                <div className="space-y-3">
                                  {Array.isArray(contactInfo.phones) ? (
                                    contactInfo.phones.map((phone: any, index: number) => (
                                      <div key={index} className="phone-item flex items-start">
                                        <svg
                                          className="w-5 h-5 mr-3 mt-0.5 text-gray-400"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                          />
                                        </svg>
                                        <div className="flex-grow">
                                          {typeof phone === 'string' ? (
                                            <a
                                              href={`tel:${phone}`}
                                              className="text-blue-600 hover:text-blue-800"
                                            >
                                              {phone}
                                            </a>
                                          ) : (
                                            <div>
                                              <a
                                                href={`tel:${phone.number}`}
                                                className="text-blue-600 hover:text-blue-800"
                                              >
                                                {phone.number}
                                              </a>
                                              {(phone.location || phone.type) && (
                                                <div className="text-sm text-gray-500">
                                                  {phone.location && <span>{phone.location}</span>}
                                                  {phone.type && phone.location && <span> • </span>}
                                                  {phone.type && <span>{phone.type}</span>}
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="flex items-center">
                                      <svg
                                        className="w-5 h-5 mr-3 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                        />
                                      </svg>
                                      <a
                                        href={`tel:${contactInfo.phones}`}
                                        className="text-blue-600 hover:text-blue-800"
                                      >
                                        {contactInfo.phones}
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Right Column: Map */}
                          <div className="map-section">
                            {contactInfo.addresses && contactInfo.addresses[0] && (
                              <div>
                                <h3 className="text-lg font-semibold mb-4">Location</h3>
                                <div className="map-container">
                                  <iframe
                                    src={`https://maps.google.com/maps?q=${encodeURIComponent(
                                      contactInfo.addresses[0].address || contactInfo.addresses[0]
                                    )}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                                    width="100%"
                                    height="400"
                                    style={{ border: 0 }}
                                    allowFullScreen
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    className="rounded-lg"
                                  />
                                </div>
                                <div className="mt-3 text-sm text-gray-600">
                                  <span className="font-medium">Address:</span>{' '}
                                  {typeof contactInfo.addresses[0] === 'string'
                                    ? contactInfo.addresses[0]
                                    : contactInfo.addresses[0].address}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'projects' && (
                <div className="projects-content">
                  <h2 className="text-2xl font-semibold mb-6">All Projects by {builder.name}</h2>
                  {builder.projects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {builder.projects.map(project => (
                        <div
                          key={project.id}
                          className="project-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                        >
                          {/* Project Image */}
                          <div className="project-image-container relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                            {project.thumbnailUrl ? (
                              <Image
                                src={project.thumbnailUrl}
                                alt={project.name}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center text-gray-500">
                                  <div className="text-4xl mb-2">🏗️</div>
                                  <div className="text-sm font-medium">Project Image</div>
                                </div>
                              </div>
                            )}
                            <div className="absolute top-4 left-4 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                              {project.type}
                            </div>
                          </div>

                          {/* Project Details */}
                          <div className="p-6">
                            <div className="mb-3">
                              <Link
                                href={`/projects/${project.id}`}
                                className="project-name-link text-xl font-semibold text-gray-800 hover:text-blue-600 transition-colors"
                              >
                                {project.name}
                              </Link>
                            </div>

                            <div className="location mb-3">
                              <div className="flex items-center text-gray-600">
                                <svg
                                  className="w-4 h-4 mr-2"
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
                            </div>

                            {(project.numberOfUnits || project.size) && (
                              <div className="project-stats flex justify-between items-center text-sm text-gray-600 mb-4">
                                {project.numberOfUnits && (
                                  <div className="stat">
                                    <span className="font-medium">{project.numberOfUnits}</span>{' '}
                                    units
                                  </div>
                                )}
                                {project.size && (
                                  <div className="stat">
                                    <span className="font-medium">{project.size}</span> acres
                                  </div>
                                )}
                              </div>
                            )}

                            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                              {project.description}
                            </p>

                            <Link
                              href={`/projects/${project.id}`}
                              className="view-details-btn bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors inline-block"
                            >
                              View Project Details
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-projects text-center py-12">
                      <div className="text-4xl mb-4">🏗️</div>
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">
                        No Projects Available
                      </h3>
                      <p className="text-gray-500">
                        This builder doesn&apos;t have any projects listed yet.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'achievements' && (details.awards || details.certifications) && (
                <div className="achievements-content">
                  <h2 className="text-2xl font-semibold mb-6">Achievements & Recognition</h2>

                  {/* Awards Section */}
                  {details.awards && details.awards.length > 0 && (
                    <div className="awards-section mb-12">
                      <h3 className="text-xl font-semibold mb-4">Awards</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {details.awards.map((award: any, index: number) => (
                          <div
                            key={index}
                            className="award-item bg-white p-6 rounded-lg shadow-sm border"
                          >
                            <div className="flex items-start gap-4">
                              <div className="award-icon text-3xl">🏆</div>
                              <div>
                                <h4 className="text-lg font-semibold mb-2">{award.name}</h4>
                                <p className="text-gray-600 text-sm mb-2">{award.description}</p>
                                {award.year && (
                                  <div className="text-blue-600 font-medium text-sm">
                                    {award.year}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Certifications Section */}
                  {details.certifications && details.certifications.length > 0 && (
                    <div className="certifications-section">
                      <h3 className="text-xl font-semibold mb-4">Certifications</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {details.certifications.map((cert: any, index: number) => (
                          <div
                            key={index}
                            className="certification-item bg-white p-6 rounded-lg shadow-sm border"
                          >
                            <div className="text-center">
                              <div className="certification-icon text-2xl mb-3">📜</div>
                              <h4 className="text-lg font-semibold mb-2">{cert.name}</h4>
                              {cert.issuer && (
                                <p className="text-gray-600 text-sm mb-2">by {cert.issuer}</p>
                              )}
                              {cert.year && (
                                <div className="text-blue-600 font-medium text-sm">{cert.year}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const prisma = new PrismaClient()

  try {
    const builderId = params?.id as string

    const builder = await prisma.builder.findUnique({
      where: { id: builderId },
      include: {
        projects: {
          include: {
            location: {
              select: {
                id: true,
                city: true,
                state: true,
                country: true,
                locality: true,
              },
            },
          },
          orderBy: {
            name: 'asc',
          },
        },
      },
    })

    if (!builder) {
      return {
        props: {
          builder: null,
        },
      }
    }

    return {
      props: {
        builder: JSON.parse(JSON.stringify(builder)),
      },
    }
  } catch (error) {
    return {
      props: {
        builder: null,
      },
    }
  } finally {
    await prisma.$disconnect()
  }
}
