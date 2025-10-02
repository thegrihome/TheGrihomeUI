import React, { useState, useEffect } from 'react'
import { NextSeo } from 'next-seo'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import toast from 'react-hot-toast'

interface Property {
  id: string
  streetAddress: string
  location: {
    city: string
    state: string
    zipcode: string
    locality: string
    fullAddress: string
  }
  builder: string
  project: string
  propertyType: string
  sqFt: number
  thumbnailUrl?: string
  imageUrls: string[]
  listingStatus: string
  soldTo?: string
  soldToUserId?: string
  soldDate?: string
  createdAt: string
  postedBy: string
  companyName?: string
  bedrooms?: string
  bathrooms?: string
  price?: string
  size?: string
  sizeUnit?: string
  plotSize?: string
  plotSizeUnit?: string
  description?: string
  interests: Array<{
    id: string
    user: {
      name: string
      email: string
      phone: string
    }
    createdAt: string
  }>
}

export default function MyPropertiesPage() {
  const { data: session, status } = useSession()
  const user = session?.user
  const isAuthenticated = status === 'authenticated'
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active')
  const [showInterestModal, setShowInterestModal] = useState<string | null>(null)
  const [showSoldModal, setShowSoldModal] = useState<string | null>(null)
  const [showArchiveModal, setShowArchiveModal] = useState<string | null>(null)
  const [soldToName, setSoldToName] = useState('')

  const propertyTypes = [
    { value: 'SINGLE_FAMILY', label: 'Villas', icon: '🏡' },
    { value: 'CONDO', label: 'Apartments', icon: '🏢' },
    { value: 'LAND_RESIDENTIAL', label: 'Residential Lands', icon: '🏞️' },
    { value: 'LAND_AGRICULTURE', label: 'Agriculture Lands', icon: '🌾' },
    { value: 'COMMERCIAL', label: 'Commercial Properties', icon: '🏬' },
  ]

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (isAuthenticated && user) {
      loadMyProperties()
    }
  }, [mounted, isAuthenticated, user, router])

  const loadMyProperties = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/user/properties')

      if (!response.ok) {
        throw new Error('Failed to fetch properties')
      }

      const data = await response.json()
      setProperties(data.properties)
    } catch (error) {
      toast.error('Failed to load your properties')
      setProperties([])
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsSold = async (propertyId: string) => {
    try {
      const response = await fetch(`/api/properties/${propertyId}/mark-sold`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          soldTo: soldToName || 'External Buyer',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to mark property as sold')
      }

      toast.success('Property marked as sold successfully')
      setShowSoldModal(null)
      setSoldToName('')
      loadMyProperties()
    } catch (error) {
      toast.error('Failed to mark property as sold')
    }
  }

  const handleArchiveProperty = async (propertyId: string) => {
    try {
      const response = await fetch(`/api/properties/${propertyId}/archive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to archive property')
      }

      toast.success('Property archived successfully')
      setShowArchiveModal(null)
      loadMyProperties()
    } catch (error) {
      toast.error('Failed to archive property')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const activeProperties = properties.filter(p => p.listingStatus === 'ACTIVE')
  const archivedProperties = properties.filter(p =>
    ['SOLD', 'OFF_MARKET', 'DRAFT', 'ARCHIVED'].includes(p.listingStatus)
  )

  const currentProperties = activeTab === 'active' ? activeProperties : archivedProperties

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Authentication Required</h2>
            <p className="text-gray-600 mb-6">Please sign in to view your properties</p>
            <button
              onClick={() => router.push('/login')}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="my-properties-container">
      <NextSeo
        title="My Properties - Grihome"
        description="Manage your property listings and view interested buyers"
        canonical="https://grihome.vercel.app/my-properties"
      />

      <Header />

      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Properties</h1>
            <p className="text-gray-600">
              Manage your property listings and view interested buyers
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('active')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'active'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Active Properties ({activeProperties.length})
                </button>
                <button
                  onClick={() => setActiveTab('archived')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'archived'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Archived Properties ({archivedProperties.length})
                </button>
              </nav>
            </div>
          </div>

          {/* Properties Grid */}
          {currentProperties.length === 0 ? (
            <div className="text-center py-16">
              <h2 className="text-4xl font-bold mb-4">
                <span className="text-gray-800">No Properties</span>{' '}
                <span
                  className="text-transparent bg-clip-text"
                  style={{
                    backgroundImage: 'linear-gradient(to right, #ec4899, #8b5cf6, #6366f1)',
                  }}
                >
                  Found
                </span>
              </h2>
              <p className="text-gray-600 text-lg mb-6">
                {activeTab === 'active'
                  ? "You haven't listed any active properties yet."
                  : "You don't have any archived properties."}
              </p>
              {activeTab === 'active' && (
                <button
                  onClick={() => router.push('/add-property')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  Add Your First Property
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentProperties.map(property => (
                <div
                  key={property.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="relative h-48">
                    <Image
                      src={
                        property.thumbnailUrl ||
                        property.imageUrls[0] ||
                        'https://via.placeholder.com/400x300?text=Property'
                      }
                      alt={`${property.project} - ${property.propertyType}`}
                      width={400}
                      height={192}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                      {propertyTypes.find(t => t.value === property.propertyType)?.icon}{' '}
                      {propertyTypes.find(t => t.value === property.propertyType)?.label}
                    </div>
                    <div
                      className={`absolute top-4 right-4 px-2 py-1 rounded text-xs font-bold text-white ${
                        property.listingStatus === 'ACTIVE'
                          ? 'bg-green-600'
                          : property.listingStatus === 'SOLD'
                            ? 'bg-red-600'
                            : property.listingStatus === 'PENDING'
                              ? 'bg-yellow-600'
                              : 'bg-gray-600'
                      }`}
                    >
                      {property.listingStatus}
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 text-gray-800">{property.project}</h3>
                    <p className="text-gray-600 text-sm mb-2">
                      {property.sqFt && `${property.sqFt} sq ft`}
                      {property.bedrooms && ` • ${property.bedrooms} BHK`}
                      {property.bathrooms && ` • ${property.bathrooms} Bath`}
                      {property.builder !== 'Independent' && ` • Built by ${property.builder}`}
                    </p>
                    <p className="text-gray-500 text-sm mb-3 flex items-center gap-1">
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
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {property.location.fullAddress}
                    </p>

                    {/* Sold Information */}
                    {property.listingStatus === 'SOLD' && (
                      <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded">
                        <p className="text-red-800 text-sm font-medium">
                          Sold to: {property.soldTo || 'External Buyer'}
                        </p>
                        {property.soldDate && (
                          <p className="text-red-600 text-xs">
                            Sold on: {formatDate(property.soldDate)}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Interest Count for Active Properties */}
                    {activeTab === 'active' && (
                      <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-blue-800 text-sm font-medium">
                          {property.interests.length} interested buyer
                          {property.interests.length !== 1 ? 's' : ''}
                        </p>
                        {property.interests.length > 0 && (
                          <button
                            onClick={() => setShowInterestModal(property.id)}
                            className="text-blue-600 text-xs underline mt-1"
                          >
                            View Details
                          </button>
                        )}
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        <div>Posted: {formatDate(property.createdAt)}</div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {activeTab === 'active' && (
                          <>
                            <button
                              onClick={() => setShowSoldModal(property.id)}
                              className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 transition-colors"
                            >
                              Mark as Sold
                            </button>
                            <button
                              onClick={() => setShowArchiveModal(property.id)}
                              className="bg-gray-600 text-white px-3 py-1 rounded text-xs hover:bg-gray-700 transition-colors"
                            >
                              Archive
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => router.push(`/properties/${property.id}`)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Interest Details Modal */}
      {showInterestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Interested Buyers</h3>
              <button
                onClick={() => setShowInterestModal(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              {properties
                .find(p => p.id === showInterestModal)
                ?.interests.map(interest => (
                  <div key={interest.id} className="border rounded p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{interest.user.name}</p>
                        <p className="text-sm text-gray-600">{interest.user.email}</p>
                        <p className="text-sm text-gray-600">{interest.user.phone}</p>
                      </div>
                      <p className="text-xs text-gray-500">{formatDate(interest.createdAt)}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Mark as Sold Modal */}
      {showSoldModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Mark as Sold</h3>
              <button
                onClick={() => {
                  setShowSoldModal(null)
                  setSoldToName('')
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sold to (optional)
                </label>
                <input
                  type="text"
                  value={soldToName}
                  onChange={e => setSoldToName(e.target.value)}
                  placeholder="Buyer name or 'External Buyer'"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowSoldModal(null)
                    setSoldToName('')
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleMarkAsSold(showSoldModal)}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Mark as Sold
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Archive Property Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Archive Property</h3>
              <button
                onClick={() => setShowArchiveModal(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-yellow-800 text-sm">
                  <strong>Warning:</strong> Once archived, this property cannot be reactivated. It
                  will be moved to your archived properties and will no longer be visible to buyers.
                </p>
              </div>
              <p className="text-gray-600">
                Are you sure you want to archive this property? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowArchiveModal(null)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleArchiveProperty(showArchiveModal)}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Archive Property
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
