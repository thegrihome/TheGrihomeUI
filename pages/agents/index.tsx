import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { NextSeo } from 'next-seo'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface Agent {
  id: string
  name: string | null
  username: string
  email: string
  phone: string | null
  companyName: string | null
  image: string | null
  createdAt: string
  _count: {
    listedProperties: number
  }
}

interface AgentsResponse {
  agents: Agent[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export default function AgentsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const isAuthenticated = status === 'authenticated'
  const { company } = router.query

  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [companyFilter, setCompanyFilter] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  })

  // Handle company filter from URL
  useEffect(() => {
    if (company && typeof company === 'string') {
      setCompanyFilter(company)
      setSearchQuery('') // Clear search when filtering by company
    } else {
      setCompanyFilter(null)
    }
  }, [company])

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch agents data
  const fetchAgents = useCallback(async (page = 1, search = '', companyName = '') => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
      })

      if (companyName.trim()) {
        params.append('company', companyName.trim())
      } else if (search.trim()) {
        params.append('search', search.trim())
      }

      const response = await fetch(`/api/agents?${params}`)

      if (!response.ok) {
        throw new Error('Failed to fetch agents')
      }

      const data: AgentsResponse = await response.json()
      setAgents(data.agents)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load and search changes
  useEffect(() => {
    fetchAgents(1, debouncedSearch, companyFilter || '')
  }, [debouncedSearch, companyFilter, fetchAgents])

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchAgents(newPage, debouncedSearch, companyFilter || '')
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Generate company initials
  const getCompanyInitials = (companyName: string | null): string => {
    if (!companyName) return ''
    return companyName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NextSeo
        title="Real Estate Agents - Grihome"
        description="Find qualified real estate agents in India. Connect with experienced professionals to help you buy, sell, or rent properties."
        canonical="https://grihome.vercel.app/agents"
      />
      <Head>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Real Estate Agents</h1>
          <p className="text-gray-600 mb-6">
            Connect with qualified real estate professionals in your area
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
                placeholder={
                  companyFilter
                    ? 'Search disabled when filtering by company'
                    : 'Search agents by name, company, or username...'
                }
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                disabled={!!companyFilter}
              />
            </div>
          </div>

          {/* Company Filter Display */}
          {companyFilter && (
            <div className="mt-4">
              <div className="inline-flex items-center bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
                <span className="text-sm text-blue-800 mr-2">
                  Showing agents from: <strong>{companyFilter}</strong>
                </span>
                <button
                  onClick={() => {
                    router.push('/agents')
                    setCompanyFilter(null)
                  }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Summary */}
        {!loading && (
          <div className="mb-6">
            <p className="text-sm text-gray-600">
              {pagination.totalCount > 0 ? (
                <>
                  Showing {agents.length} of {pagination.totalCount} agents
                  {companyFilter && ` from ${companyFilter}`}
                  {debouncedSearch && !companyFilter && ` for "${debouncedSearch}"`}
                </>
              ) : (
                <>
                  No agents found
                  {companyFilter && ` from ${companyFilter}`}
                  {debouncedSearch && !companyFilter && ` for "${debouncedSearch}"`}
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
                      Agent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Properties Listed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[...Array(8)].map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                          <div className="ml-4 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                            <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                          <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
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
            <h3 className="text-lg font-medium text-gray-900 mb-1">Error loading agents</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() =>
                fetchAgents(pagination.currentPage, debouncedSearch, companyFilter || '')
              }
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try again
            </button>
          </div>
        )}

        {/* Agents Table */}
        {!loading && !error && agents.length > 0 && (
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden mb-8">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Agent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Properties Listed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {agents.map(agent => (
                    <tr key={agent.id} className="hover:bg-gray-50">
                      {/* Agent Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Link href={`/agents/${agent.id}/properties`} className="flex-shrink-0">
                            {agent.image ? (
                              <Image
                                src={agent.image}
                                alt={agent.name || agent.username}
                                width={40}
                                height={40}
                                className="w-10 h-10 rounded-full object-cover hover:opacity-80 transition-opacity"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center hover:bg-blue-600 transition-colors">
                                <span className="text-white font-medium text-sm">
                                  {agent.name
                                    ? agent.name
                                        .split(' ')
                                        .map(n => n.charAt(0))
                                        .join('')
                                        .slice(0, 2)
                                    : agent.username.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </Link>
                          <div className="ml-4">
                            <Link
                              href={`/agents/${agent.id}/properties`}
                              className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
                            >
                              {agent.name || agent.username}
                            </Link>
                            <div className="text-sm text-gray-500">@{agent.username}</div>
                          </div>
                        </div>
                      </td>

                      {/* Company Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {agent.companyName ? (
                          <div className="flex items-center">
                            <div className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center mr-2">
                              <span className="text-white text-xs font-bold">
                                {getCompanyInitials(agent.companyName)}
                              </span>
                            </div>
                            <button
                              onClick={() =>
                                router.push(
                                  `/agents?company=${encodeURIComponent(agent.companyName!)}`
                                )
                              }
                              className="text-sm text-blue-600 hover:text-blue-800 font-medium underline"
                            >
                              {agent.companyName}
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No company</span>
                        )}
                      </td>

                      {/* Contact Column */}
                      <td className="px-6 py-4">
                        {isAuthenticated ? (
                          <div className="space-y-1">
                            <div className="text-sm text-gray-900">{agent.email}</div>
                            {agent.phone && (
                              <div className="text-sm text-gray-600">{agent.phone}</div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 italic">
                            Sign in to view email and mobile
                          </div>
                        )}
                      </td>

                      {/* Properties Listed Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {agent._count.listedProperties > 0 ? (
                          <button
                            onClick={() => router.push(`/agents/${agent.id}/properties`)}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium underline"
                          >
                            {agent._count.listedProperties}
                          </button>
                        ) : (
                          <div className="text-sm text-gray-400">0</div>
                        )}
                      </td>

                      {/* Joined Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(agent.createdAt).toLocaleDateString()}
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
        {!loading && !error && agents.length === 0 && (
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
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No agents found</h3>
            <p className="text-gray-600">
              {companyFilter
                ? `No agents found working at ${companyFilter}.`
                : debouncedSearch
                  ? `No agents match your search "${debouncedSearch}". Try different keywords.`
                  : 'No agents are currently registered in our system.'}
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
