import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Image from 'next/image'
import PropertyCard from '@/components/properties/PropertyCard'
import { NextSeo } from 'next-seo'

interface Property {
  id: string
  streetAddress: string
  location: {
    city: string
    state: string
    zipcode: string | null
    locality: string | null
    fullAddress: string
  }
  builder: string
  project: string
  propertyType: string
  listingType: string
  sqFt: number | null
  thumbnailUrl?: string
  imageUrls: string[]
  listingStatus: string
  createdAt: string
  postedBy: string
  companyName?: string
  bedrooms?: string | number
  bathrooms?: string | number
  price?: string | number
  size?: string
  sizeUnit?: string
  plotSize?: string
  plotSizeUnit?: string
  description?: string
  userId: string
  userEmail: string
}

interface Project {
  id: string
  name: string
  location: {
    city: string
    state: string
    locality: string | null
  } | null
  builder: string
  propertyCount: number
  registeredAt: string
  isPromoted: boolean
  thumbnailUrl?: string
}

interface Agent {
  id: string
  name: string
  username: string
  email: string
  phone: string | null
  companyName: string | null
  image: string | null
}

interface Pagination {
  currentPage: number
  totalPages: number
  totalCount: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export default function AgentProperties() {
  const router = useRouter()
  const { id, tab } = router.query
  const { status } = useSession()
  const isAuthenticated = status === 'authenticated'

  const [agent, setAgent] = useState<Agent | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [projectsPagination, setProjectsPagination] = useState<Pagination | null>(null)
  const [activePropertiesCount, setActivePropertiesCount] = useState<number>(0)
  const [soldPropertiesCount, setSoldPropertiesCount] = useState<number>(0)
  const [projectsCount, setProjectsCount] = useState<number>(0)
  const [initialLoading, setInitialLoading] = useState(true)
  const [fetchingProperties, setFetchingProperties] = useState(false)
  const [fetchingProjects, setFetchingProjects] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [projectsPage, setProjectsPage] = useState(1)
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'SOLD' | 'PROJECTS'>(
    tab === 'projects' ? 'PROJECTS' : 'ACTIVE'
  )

  // Update activeTab when URL query changes
  useEffect(() => {
    if (tab === 'projects') {
      setActiveTab('PROJECTS')
    }
  }, [tab])

  // Fetch all counts initially
  useEffect(() => {
    if (!id) return

    const fetchAllCounts = async () => {
      try {
        // Fetch active properties count
        const activeRes = await fetch(`/api/agents/${id}/properties?page=1&limit=1&status=ACTIVE`)
        if (activeRes.ok) {
          const activeData = await activeRes.json()
          setActivePropertiesCount(activeData.pagination?.totalCount || 0)
          if (!agent) setAgent(activeData.agent)
        }

        // Fetch sold properties count
        const soldRes = await fetch(`/api/agents/${id}/properties?page=1&limit=1&status=SOLD`)
        if (soldRes.ok) {
          const soldData = await soldRes.json()
          setSoldPropertiesCount(soldData.pagination?.totalCount || 0)
        }

        // Fetch projects count
        const projectsRes = await fetch(`/api/agents/${id}/projects?page=1&limit=1`)
        if (projectsRes.ok) {
          const projectsData = await projectsRes.json()
          setProjectsCount(projectsData.pagination?.totalCount || 0)
        }
      } catch (err) {
        // Silently fail - counts will show 0
      }
    }

    fetchAllCounts()
  }, [id, agent])

  // Fetch properties
  useEffect(() => {
    if (!id || activeTab === 'PROJECTS') return

    const fetchAgentProperties = async () => {
      setFetchingProperties(true)
      setError(null)

      try {
        const response = await fetch(
          `/api/agents/${id}/properties?page=${currentPage}&limit=12&status=${activeTab}`
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Failed to fetch agent properties')
        }

        const data = await response.json()
        setAgent(data.agent)
        setProperties(data.properties)
        setPagination(data.pagination)
        setActivePropertiesCount(data.activePropertiesCount || 0)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setFetchingProperties(false)
        setInitialLoading(false)
      }
    }

    fetchAgentProperties()
  }, [id, currentPage, activeTab])

  // Fetch projects
  useEffect(() => {
    if (!id || activeTab !== 'PROJECTS') return

    const fetchAgentProjects = async () => {
      setFetchingProjects(true)
      setError(null)

      try {
        const response = await fetch(`/api/agents/${id}/projects?page=${projectsPage}&limit=12`)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Failed to fetch agent projects')
        }

        const data = await response.json()
        setAgent(data.agent)
        setProjects(data.projects)
        setProjectsPagination(data.pagination)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setFetchingProjects(false)
        setInitialLoading(false)
      }
    }

    fetchAgentProjects()
  }, [id, projectsPage, activeTab])

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-600">Loading agent properties...</div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
            <p className="text-gray-600 mb-6">{error || 'Agent not found'}</p>
            <Link href="/agents" className="text-blue-600 hover:text-blue-700 font-medium">
              ← Back to Agents
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NextSeo
        title={`Properties by ${agent.name} | Zillfin`}
        description={`Browse all properties listed by ${agent.name}${agent.companyName ? ` from ${agent.companyName}` : ''}`}
      />
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm">
          <Link href="/" className="text-blue-600 hover:text-blue-700">
            Home
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <Link href="/agents" className="text-blue-600 hover:text-blue-700">
            Agents
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-600">{agent.name}</span>
        </nav>

        {/* Agent Info Header */}
        <div className="bg-white rounded-lg shadow-sm p-3 mb-6">
          <div className="flex items-center gap-3">
            {agent.image ? (
              <div className="w-12 h-12 flex-shrink-0 relative">
                <Image
                  src={agent.image}
                  alt={agent.name}
                  fill
                  className="rounded-full object-cover"
                />
              </div>
            ) : (
              <div className="w-12 h-12 flex-shrink-0 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-blue-600">
                  {agent.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900">{agent.name}</h1>
              {agent.companyName && <p className="text-sm text-gray-600">{agent.companyName}</p>}
              <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-1">
                {isAuthenticated ? (
                  <>
                    {agent.email && <span>📧 {agent.email}</span>}
                    {agent.phone && <span>📱 {agent.phone}</span>}
                  </>
                ) : (
                  <span className="italic">Sign in to view email and mobile</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex gap-8">
              <button
                onClick={() => {
                  setActiveTab('ACTIVE')
                  setCurrentPage(1)
                }}
                className={`py-4 px-1 border-b-2 font-bold text-sm transition-colors ${
                  activeTab === 'ACTIVE'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Active Properties ({activePropertiesCount})
              </button>
              <button
                onClick={() => {
                  setActiveTab('SOLD')
                  setCurrentPage(1)
                }}
                className={`py-4 px-1 border-b-2 font-bold text-sm transition-colors ${
                  activeTab === 'SOLD'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Sold Properties ({soldPropertiesCount})
              </button>
              <button
                onClick={() => {
                  setActiveTab('PROJECTS')
                  setProjectsPage(1)
                }}
                className={`py-4 px-1 border-b-2 font-bold text-sm transition-colors ${
                  activeTab === 'PROJECTS'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Projects ({projectsCount})
              </button>
            </nav>
          </div>
        </div>

        {/* Content Header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {activeTab === 'PROJECTS'
              ? `Projects (${projectsPagination?.totalCount || 0})`
              : `${activeTab === 'ACTIVE' ? 'Active' : 'Sold'} Properties (${pagination?.totalCount || 0})`}
          </h2>
        </div>

        {/* Properties Grid */}
        {activeTab !== 'PROJECTS' && (
          <>
            {fetchingProperties ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-gray-600">Loading properties...</div>
              </div>
            ) : properties.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <p className="text-gray-600 text-lg mb-4">No properties found</p>
                <p className="text-gray-500">This agent has not listed any properties yet.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {properties.map(property => (
                    <PropertyCard key={property.id} property={property} isOwner={false} />
                  ))}
                </div>

                {/* Properties Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="mt-8 flex justify-center items-center gap-4">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={!pagination.hasPreviousPage}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>

                    <span className="text-gray-600">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </span>

                    <button
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      disabled={!pagination.hasNextPage}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Projects Grid */}
        {activeTab === 'PROJECTS' && (
          <>
            {fetchingProjects ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-gray-600">Loading projects...</div>
              </div>
            ) : projects.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <p className="text-gray-600 text-lg mb-4">No projects found</p>
                <p className="text-gray-500">This agent is not registered to any projects yet.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {projects.map(project => (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                    >
                      {project.thumbnailUrl ? (
                        <div className="relative h-40 w-full">
                          <Image
                            src={project.thumbnailUrl}
                            alt={project.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-40 w-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                          <span className="text-4xl font-bold text-blue-600">
                            {project.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-1 truncate">
                          {project.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">by {project.builder}</p>
                        {project.location && (
                          <p className="text-sm text-gray-500 mb-2">
                            {project.location.locality && `${project.location.locality}, `}
                            {project.location.city}, {project.location.state}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{project.propertyCount} properties</span>
                          <span>Joined {new Date(project.registeredAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Projects Pagination */}
                {projectsPagination && projectsPagination.totalPages > 1 && (
                  <div className="mt-8 flex justify-center items-center gap-4">
                    <button
                      onClick={() => setProjectsPage(prev => Math.max(1, prev - 1))}
                      disabled={!projectsPagination.hasPreviousPage}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>

                    <span className="text-gray-600">
                      Page {projectsPagination.currentPage} of {projectsPagination.totalPages}
                    </span>

                    <button
                      onClick={() => setProjectsPage(prev => prev + 1)}
                      disabled={!projectsPagination.hasNextPage}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
