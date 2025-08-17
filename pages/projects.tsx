import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { NextSeo } from 'next-seo'
import { GetServerSideProps } from 'next'
import { PrismaClient } from '@prisma/client'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface Project {
  id: string
  name: string
  description: string
  type: string
  numberOfUnits: number | null
  size: number | null
  thumbnailUrl: string | null
  builder: {
    id: string
    name: string
    logoUrl: string | null
  }
  location: {
    id: string
    city: string
    state: string
    country: string
  }
}

interface ProjectsPageProps {
  projects: Project[]
}

export default function ProjectsPage({ projects }: ProjectsPageProps) {
  return (
    <div className="projects-page-container">
      <NextSeo
        title="Projects - Grihome"
        description="Explore luxury real estate projects by top builders across India"
        canonical="https://grihome.vercel.app/projects"
        openGraph={{
          url: 'https://grihome.vercel.app/projects',
          title: 'Projects - Grihome',
          description: 'Explore luxury real estate projects by top builders across India',
          site_name: 'Grihome',
        }}
      />
      <Head>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <main className="projects-main">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="projects-header mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Real Estate Projects</h1>
            <p className="text-lg text-gray-600 max-w-2xl">
              Discover premium residential and commercial projects by trusted builders across major
              cities in India.
            </p>
          </div>

          {/* Projects Table */}
          <div className="projects-table-container">
            {projects.length > 0 ? (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                          Project Name
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                          Builder Name
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                          Location
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {projects.map(project => (
                        <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                          {/* Project Name Column */}
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              {/* Project Logo/Thumbnail */}
                              <div className="flex-shrink-0 w-10 h-10">
                                {project.thumbnailUrl ? (
                                  <Image
                                    src={project.thumbnailUrl}
                                    alt={`${project.name} logo`}
                                    width={40}
                                    height={40}
                                    className="w-10 h-10 rounded-lg object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <span className="text-gray-500 text-sm">🏗️</span>
                                  </div>
                                )}
                              </div>
                              {/* Project Name and Details */}
                              <div>
                                <Link
                                  href={`/projects/${project.id}`}
                                  className="text-lg font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                                >
                                  {project.name}
                                </Link>
                                <div className="text-sm text-gray-500">
                                  {project.type}
                                  {project.numberOfUnits && ` • ${project.numberOfUnits} units`}
                                  {project.size && ` • ${project.size} acres`}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Builder Name Column */}
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              {/* Builder Logo */}
                              <div className="flex-shrink-0 w-8 h-8">
                                {project.builder.logoUrl ? (
                                  <Image
                                    src={project.builder.logoUrl}
                                    alt={`${project.builder.name} logo`}
                                    width={32}
                                    height={32}
                                    className="w-8 h-8 rounded object-contain bg-gray-50 p-1"
                                  />
                                ) : (
                                  <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                                    <span className="text-gray-500 text-xs">B</span>
                                  </div>
                                )}
                              </div>
                              {/* Builder Name */}
                              <Link
                                href={`/builders/${project.builder.id}`}
                                className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                              >
                                {project.builder.name}
                              </Link>
                            </div>
                          </td>

                          {/* Location Column */}
                          <td className="px-6 py-4">
                            <div className="flex items-center text-gray-700">
                              <svg
                                className="w-4 h-4 mr-2 text-gray-400"
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
                              <span>
                                {project.location.city}, {project.location.state}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="no-projects text-center py-16">
                <div className="text-6xl mb-4">🏗️</div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Projects Found</h3>
                <p className="text-gray-500">
                  We&apos;re working on adding more projects. Please check back soon!
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />

      <style jsx>{`
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async () => {
  const prisma = new PrismaClient()

  try {
    const projects = await prisma.project.findMany({
      include: {
        builder: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
        location: {
          select: {
            id: true,
            city: true,
            state: true,
            country: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return {
      props: {
        projects: JSON.parse(JSON.stringify(projects)),
      },
    }
  } catch (error) {
    return {
      props: {
        projects: [],
      },
    }
  } finally {
    await prisma.$disconnect()
  }
}
