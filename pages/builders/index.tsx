import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { NextSeo } from 'next-seo'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface Builder {
  id: string
  name: string
  description: string | null
  logoUrl: string | null
  website: string | null
  projectCount: number
}

interface BuildersResponse {
  builders: Builder[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export default function BuildersPage() {
  const [builders, setBuilders] = useState<Builder[]>([])
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

  // Fetch builders data
  const fetchBuilders = useCallback(async (page = 1, search = '') => {
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

      const response = await fetch(`/api/builders?${params}`)

      if (!response.ok) {
        throw new Error('Failed to fetch builders')
      }

      const data: BuildersResponse = await response.json()
      setBuilders(data.builders)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load and search changes
  useEffect(() => {
    fetchBuilders(1, debouncedSearch)
  }, [debouncedSearch, fetchBuilders])

  const handlePageChange = (newPage: number) => {
    fetchBuilders(newPage, debouncedSearch)
  }

  return (
    <>
      <NextSeo
        title="Builders | Grihome"
        description="Browse all builders and real estate developers on Grihome"
        canonical="https://grihome.vercel.app/builders"
      />

      <Head>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Builders</h1>
                <p className="text-gray-600">Browse all builders and real estate developers</p>
              </div>
              <Link
                href="/builders/add-builder"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Builder
              </Link>
            </div>

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
                  placeholder="Search builders by name..."
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
                    Showing {builders.length} of {pagination.totalCount} builders
                    {debouncedSearch && ` for "${debouncedSearch}"`}
                  </>
                ) : (
                  <>
                    No builders found
                    {debouncedSearch && ` for "${debouncedSearch}"`}
                  </>
                )}
              </p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 bg-gray-200 rounded-lg mb-4"></div>
                    <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-600">{error}</p>
              <button
                onClick={() => fetchBuilders(pagination.currentPage, debouncedSearch)}
                className="mt-2 text-blue-600 hover:underline"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Builders Grid */}
          {!loading && !error && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {builders.map(builder => {
                  const isIndependent = builder.name.toLowerCase() === 'independent'
                  const CardContent = (
                    <div className="flex flex-col items-center text-center">
                      {builder.logoUrl ? (
                        <Image
                          src={builder.logoUrl}
                          alt={builder.name}
                          width={96}
                          height={96}
                          className="w-24 h-24 rounded-lg object-contain bg-gray-50 p-2 mb-4"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
                          <span className="text-3xl font-bold text-gray-400">
                            {builder.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{builder.name}</h3>
                      <p className="text-sm text-gray-500">
                        {builder.projectCount} {builder.projectCount === 1 ? 'Project' : 'Projects'}
                      </p>
                      {builder.description && (
                        <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                          {builder.description}
                        </p>
                      )}
                    </div>
                  )

                  return isIndependent ? (
                    <div
                      key={builder.id}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-default"
                    >
                      {CardContent}
                    </div>
                  ) : (
                    <Link
                      key={builder.id}
                      href={`/builders/${builder.id}`}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-6"
                    >
                      {CardContent}
                    </Link>
                  )
                })}
              </div>

              {/* Empty State */}
              {builders.length === 0 && (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🏗️</div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Builders Found</h2>
                  <p className="text-gray-600 mb-6">
                    {debouncedSearch
                      ? 'Try adjusting your search'
                      : 'Be the first to add a builder'}
                  </p>
                  <Link
                    href="/builders/add-builder"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Add Builder
                  </Link>
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPreviousPage}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  <span className="px-4 py-2 text-sm text-gray-700">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>

                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </>
  )
}
