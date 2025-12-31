import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { NextSeo } from 'next-seo'
import { GetServerSideProps } from 'next'
import { PrismaClient } from '@prisma/client'
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
            <div className="flex flex-col lg:flex-row gap-3 lg:gap-0">
              {/* Left Side - Logo, Name, Description - 50% */}
              <div className="flex items-start gap-4 lg:w-1/2">
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
                <div className="builder-info flex-1">
                  <h1 className="text-xl lg:text-2xl font-bold text-gray-800 mb-2">
                    {builder.name}
                  </h1>
                  {builder.description && (
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                      {builder.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Middle Section - Address - 25% */}
              {builder.builderDetails?.address && (
                <div className="lg:w-1/4 lg:border-l lg:pl-3 lg:border-gray-200">
                  <div className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
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
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {builder.builderDetails.address}
                    </p>
                  </div>
                </div>
              )}

              {/* Right Section - Phone, Email, Website - 25% */}
              <div className="lg:w-1/4 lg:border-l lg:pl-3 lg:border-gray-200 space-y-2">
                {/* Phone - single */}
                {builder.builderDetails?.phone && (
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-blue-600 flex-shrink-0"
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
                      href={`tel:${builder.builderDetails.phone}`}
                      className="text-sm text-gray-700 hover:text-blue-600 transition-colors"
                    >
                      {builder.builderDetails.phone}
                    </a>
                  </div>
                )}

                {/* Phones - multiple */}
                {builder.builderDetails?.phones &&
                  Array.isArray(builder.builderDetails.phones) &&
                  builder.builderDetails.phones.map((phone: string, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-blue-600 flex-shrink-0"
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
                        href={`tel:${phone.replace(/\s/g, '')}`}
                        className="text-sm text-gray-700 hover:text-blue-600 transition-colors"
                      >
                        {phone}
                      </a>
                    </div>
                  ))}

                {/* Email - single */}
                {builder.builderDetails?.email && !builder.builderDetails?.emails && (
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-blue-600 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <a
                      href={`mailto:${builder.builderDetails.email}`}
                      className="text-sm text-gray-700 hover:text-blue-600 transition-colors"
                    >
                      {builder.builderDetails.email}
                    </a>
                  </div>
                )}

                {/* Emails - multiple */}
                {builder.builderDetails?.emails &&
                  Array.isArray(builder.builderDetails.emails) &&
                  builder.builderDetails.emails.map((email: string, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-blue-600 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      <a
                        href={`mailto:${email}`}
                        className="text-sm text-gray-700 hover:text-blue-600 transition-colors"
                      >
                        {email}
                      </a>
                    </div>
                  ))}

                {/* Visit Website Button */}
                {builder.website && (
                  <div className="pt-1">
                    <a
                      href={builder.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
                    >
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
                          d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                        />
                      </svg>
                      Visit Website
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Projects Section */}
        <div className="builder-content">
          <div className="container mx-auto px-4 py-8">
            <h2 className="text-2xl font-semibold mb-6">Projects</h2>
            {builder.projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {builder.projects.map(project => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="project-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer block"
                  >
                    {/* Project Image */}
                    <div className="project-image-container relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                      {project.thumbnailUrl ? (
                        <Image
                          src={project.thumbnailUrl}
                          alt={project.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center text-gray-500">
                            <div className="text-4xl mb-2">🏗️</div>
                            <div className="text-sm font-medium">Project Image</div>
                          </div>
                        </div>
                      )}
                      <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-0.5 rounded text-xs font-medium">
                        {project.type}
                      </div>
                    </div>

                    {/* Project Details */}
                    <div className="p-4">
                      <div className="mb-2">
                        <h3 className="text-base font-semibold text-gray-800 line-clamp-1">
                          {project.name}
                        </h3>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs mb-2">
                        <span className="text-gray-600">
                          {project.location.locality && `${project.location.locality}, `}
                          {project.location.city}
                        </span>
                        {project.numberOfUnits && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span>
                              <span className="font-bold text-blue-600">
                                {project.numberOfUnits}
                              </span>{' '}
                              <span className="text-gray-600">units</span>
                            </span>
                          </>
                        )}
                        {project.size && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span>
                              <span className="font-bold text-green-600">{project.size}</span>{' '}
                              <span className="text-gray-600">acres</span>
                            </span>
                          </>
                        )}
                      </div>

                      <p className="text-gray-600 text-xs mb-3 line-clamp-2">
                        {project.description}
                      </p>

                      <div className="flex justify-end">
                        <span className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs hover:bg-blue-700 transition-colors">
                          View Details
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="no-projects text-center py-12">
                <div className="text-4xl mb-4">🏗️</div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Projects Available</h3>
                <p className="text-gray-500">
                  This builder doesn&apos;t have any projects listed yet.
                </p>
              </div>
            )}
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
