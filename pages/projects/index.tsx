import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { NextSeo } from 'next-seo'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { PROPERTY_TYPE_LABELS } from '@/lib/constants'

interface Project {
  id: string
  name: string
  description: string
  type: string
  propertyType: string | null
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
    zipcode: string | null
    locality: string | null
  }
}

interface ProjectsResponse {
  projects: Project[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  })

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch projects data
  const fetchProjects = useCallback(async (page = 1, search = '') => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
      })

      if (search.trim()) {
        params.append('search', search.trim())
      }

      const response = await fetch(`/api/projects?${params}`)

      if (!response.ok) {
        throw new Error('Failed to fetch projects')
      }

      const data: ProjectsResponse = await response.json()
      setProjects(data.projects)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load and search changes
  useEffect(() => {
    fetchProjects(1, debouncedSearch)
  }, [debouncedSearch, fetchProjects])

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchProjects(newPage, debouncedSearch)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NextSeo
        title="Real Estate Projects - Zillfin"
        description="Discover premium residential and commercial projects by trusted builders across major cities in India."
        canonical="https://grihome.vercel.app/projects"
        openGraph={{
          url: 'https://grihome.vercel.app/projects',
          title: 'Real Estate Projects - Zillfin',
          description:
            'Discover premium residential and commercial projects by trusted builders across major cities in India.',
          site_name: 'Zillfin',
        }}
      />
      <Head>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Real Estate Projects</h1>
            <Link
              href="/projects/submit"
              className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap flex-shrink-0"
            >
              <svg
                className="w-4 h-4 mr-1.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Submit Project
            </Link>
          </div>
          <p className="text-gray-600 mb-6">
            Discover premium residential and commercial projects by trusted builders across major
            cities in India.
          </p>

          {/* Search Bar */}
          <div className="w-full">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                placeholder="Search projects by name, builder, city, state, or zipcode..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Results Summary */}
        {!loading && (
          <div className="mb-6">
            <p className="text-sm text-gray-600">
              {pagination.totalCount > 0 ? (
                <>
                  Showing {projects.length} of {pagination.totalCount} projects
                  {debouncedSearch && ` for "${debouncedSearch}"`}
                </>
              ) : (
                <>
                  No projects found
                  {debouncedSearch && ` for "${debouncedSearch}"`}
                </>
              )}
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden mb-8">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Builder
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[...Array(8)].map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                          <div className="ml-4 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                            <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                          <div className="ml-3 h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded w-28 animate-pulse"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className="text-red-600 mb-2">⚠️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Error loading projects</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => fetchProjects(pagination.currentPage, debouncedSearch)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try again
            </button>
          </div>
        )}

        {/* Projects Table */}
        {!loading && !error && projects.length > 0 && (
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden mb-8">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Builder
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {projects.map(project => (
                    <tr key={project.id} className="hover:bg-gray-50">
                      {/* Project Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            {project.thumbnailUrl ? (
                              <Image
                                src={project.thumbnailUrl}
                                alt={project.name}
                                width={40}
                                height={40}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                                <span className="text-white font-medium text-sm">🏗️</span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <Link
                              href={`/projects/${project.id}`}
                              className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              {project.name}
                            </Link>
                          </div>
                        </div>
                      </td>

                      {/* Builder Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/builders/${project.builder.id}`}
                          className="flex items-center hover:opacity-80 transition-opacity"
                        >
                          <div className="flex-shrink-0">
                            {project.builder.logoUrl ? (
                              <Image
                                src={project.builder.logoUrl}
                                alt={project.builder.name}
                                width={32}
                                height={32}
                                className="w-8 h-8 rounded object-contain bg-gray-50 p-1"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded bg-gray-500 flex items-center justify-center">
                                <span className="text-white text-xs font-bold">
                                  {project.builder.name.charAt(0)}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                              {project.builder.name}
                            </div>
                          </div>
                        </Link>
                      </td>

                      {/* Location Column */}
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {project.location.city}, {project.location.state}
                        </div>
                      </td>

                      {/* Type Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1.5">
                          <span className="inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 w-fit">
                            {project.type}
                          </span>
                          {project.propertyType && (
                            <span className="inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800 w-fit">
                              {PROPERTY_TYPE_LABELS[
                                project.propertyType as keyof typeof PROPERTY_TYPE_LABELS
                              ] || project.propertyType}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && projects.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No projects found</h3>
            <p className="text-gray-600">
              {debouncedSearch
                ? `No projects match your search "${debouncedSearch}". Try different keywords.`
                : 'No projects are currently available in our system.'}
            </p>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPreviousPage}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{pagination.currentPage}</span> of{' '}
                  <span className="font-medium">{pagination.totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPreviousPage}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  {/* Page numbers */}
                  {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                    const pageNum = Math.max(1, pagination.currentPage - 2) + i
                    if (pageNum > pagination.totalPages) return null

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pageNum === pagination.currentPage
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}

                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
