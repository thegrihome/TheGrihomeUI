import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { NextSeo } from 'next-seo'

interface Location {
  id: string
  city: string
  state: string
  country: string
  locality: string | null
  zipcode: string | null
}

interface Project {
  id: string
  name: string
}

interface Property {
  id: string
  propertyType: string
  listingType: string
  sqFt: number | null
  price: number | null
  bedrooms: number | null
  bathrooms: number | null
  thumbnailUrl: string | null
  imageUrls: string[]
  listingStatus: string
  createdAt: string
  location: Location
  project: Project | null
  propertyDetails: any
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
  const { id } = router.query

  const [agent, setAgent] = useState<Agent | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    if (!id) return

    const fetchAgentProperties = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/agents/${id}/properties?page=${currentPage}&limit=12`)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Failed to fetch agent properties')
        }

        const data = await response.json()
        setAgent(data.agent)
        setProperties(data.properties)
        setPagination(data.pagination)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchAgentProperties()
  }, [id, currentPage])

  const formatPrice = (price: number | null) => {
    if (!price) return 'Price on request'
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)} Cr`
    }
    if (price >= 100000) {
      return `₹${(price / 100000).toFixed(2)} L`
    }
    return `₹${price.toLocaleString('en-IN')}`
  }

  const getPropertyTitle = (property: Property) => {
    if (property.project) {
      return property.project.name
    }
    if (property.propertyDetails?.title) {
      return property.propertyDetails.title
    }
    if (property.propertyDetails?.projectName) {
      return property.propertyDetails.projectName
    }
    return 'Individual Property'
  }

  const getPropertyImage = (property: Property) => {
    return property.thumbnailUrl || property.imageUrls[0] || '/images/placeholder-property.jpg'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
    <div className="min-h-screen bg-gray-50">
      <NextSeo
        title={`Properties by ${agent.name} | Grihome`}
        description={`Browse all properties listed by ${agent.name}${agent.companyName ? ` from ${agent.companyName}` : ''}`}
      />
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center gap-6">
            {agent.image ? (
              <Image
                src={agent.image}
                alt={agent.name}
                width={80}
                height={80}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600">
                  {agent.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{agent.name}</h1>
              {agent.companyName && <p className="text-gray-600 mb-2">{agent.companyName}</p>}
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                {agent.email && <span>📧 {agent.email}</span>}
                {agent.phone && <span>📱 {agent.phone}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Properties Count */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Properties Listed ({pagination?.totalCount || 0})
          </h2>
        </div>

        {/* Properties Grid */}
        {properties.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 text-lg mb-4">No properties found</p>
            <p className="text-gray-500">This agent has not listed any properties yet.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map(property => (
                <Link
                  key={property.id}
                  href={`/properties/${property.id}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Property Image */}
                  <div className="relative h-48 bg-gray-200">
                    <Image
                      src={getPropertyImage(property)}
                      alt={getPropertyTitle(property)}
                      fill
                      className="object-cover"
                    />
                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          property.listingStatus === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : property.listingStatus === 'SOLD'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {property.listingStatus}
                      </span>
                    </div>
                    {/* Listing Type Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        {property.listingType}
                      </span>
                    </div>
                  </div>

                  {/* Property Details */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                      {getPropertyTitle(property)}
                    </h3>

                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {property.location.locality && `${property.location.locality}, `}
                      {property.location.city}, {property.location.state}
                    </p>

                    {/* Price */}
                    <div className="text-xl font-bold text-blue-600 mb-3">
                      {formatPrice(property.price)}
                    </div>

                    {/* Property Features */}
                    <div className="flex items-center gap-4 text-sm text-gray-500 pb-3 border-b border-gray-200">
                      {property.bedrooms && (
                        <span className="flex items-center gap-1">🛏️ {property.bedrooms} BHK</span>
                      )}
                      {property.bathrooms && (
                        <span className="flex items-center gap-1">🚿 {property.bathrooms}</span>
                      )}
                      {property.sqFt && (
                        <span className="flex items-center gap-1">📐 {property.sqFt} sqft</span>
                      )}
                    </div>

                    {/* Property Type */}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm text-gray-600">{property.propertyType}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(property.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
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
      </main>

      <Footer />
    </div>
  )
}
