import React, { useState, useEffect, useCallback } from 'react'
import { NextSeo } from 'next-seo'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import toast from 'react-hot-toast'
import { SIZE_UNIT_LABELS } from '@/lib/constants'

interface PropertyDetail {
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
  userId: string
  userEmail: string
  userPhone?: string
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

export default function PropertyDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { id } = router.query
  const [property, setProperty] = useState<PropertyDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [expressing, setExpressing] = useState(false)
  const [hasExpressedInterest, setHasExpressedInterest] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [showSoldModal, setShowSoldModal] = useState(false)
  const [buyerName, setBuyerName] = useState('')
  const [processing, setProcessing] = useState(false)
  const [contactMessage, setContactMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)

  const propertyTypes = [
    { value: 'SINGLE_FAMILY', label: 'Villas', icon: '🏡' },
    { value: 'CONDO', label: 'Apartments', icon: '🏢' },
    { value: 'LAND_RESIDENTIAL', label: 'Residential Lands', icon: '🏞️' },
    { value: 'LAND_AGRICULTURE', label: 'Agriculture Lands', icon: '🌾' },
    { value: 'COMMERCIAL', label: 'Commercial', icon: '🏬' },
  ]

  const loadPropertyDetail = useCallback(
    async (propertyId: string) => {
      setLoading(true)
      try {
        const response = await fetch(`/api/properties/${propertyId}`)

        if (!response.ok) {
          throw new Error('Failed to fetch property details')
        }

        const data = await response.json()
        setProperty(data.property)
      } catch (error) {
        toast.error('Failed to load property details')
        router.push('/properties')
      } finally {
        setLoading(false)
      }
    },
    [router]
  )

  useEffect(() => {
    if (id && typeof id === 'string') {
      loadPropertyDetail(id)
    }
  }, [id, loadPropertyDetail])

  useEffect(() => {
    if (property && session?.user?.email) {
      // Check if current user has already expressed interest
      const userInterest = property.interests.find(
        interest => interest.user.email === session.user?.email
      )
      setHasExpressedInterest(!!userInterest)
    }
  }, [property, session])

  const handleExpressInterest = async () => {
    if (!session?.user) {
      router.push('/api/auth/signin')
      return
    }

    setExpressing(true)
    try {
      const response = await fetch('/api/interests/express', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId: property?.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to express interest')
      }

      toast.success('Interest expressed successfully!')
      setHasExpressedInterest(true)

      // Reload property to get updated interest list
      if (property) {
        loadPropertyDetail(property.id)
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to express interest')
    } finally {
      setExpressing(false)
    }
  }

  const handleMarkAsSold = async () => {
    setProcessing(true)
    try {
      const response = await fetch(`/api/properties/${property?.id}/archive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          markAsSold: true,
          soldTo: buyerName || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to mark property as sold')
      }

      toast.success('Property marked as sold!')
      router.push('/my-properties')
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark property as sold')
    } finally {
      setProcessing(false)
      setShowSoldModal(false)
      setBuyerName('')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatIndianCurrency = (amount: string) => {
    const num = parseFloat(amount)
    if (isNaN(num)) return amount
    return num.toLocaleString('en-IN')
  }

  const isOwner = session?.user?.email === property?.userEmail

  if (loading) {
    return (
      <div className="property-detail-main">
        <Header />
        <div className="property-detail-loading">
          <div className="property-detail-spinner"></div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!property) {
    return (
      <div className="property-detail-main">
        <Header />
        <div className="property-detail-content">
          <div className="property-not-found">
            <h1 className="property-not-found__title">Property Not Found</h1>
            <button
              onClick={() => router.push('/properties')}
              className="property-not-found__button"
            >
              Back to Properties
            </button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const propertyTypeInfo = propertyTypes.find(t => t.value === property.propertyType)
  const allImages = [property.thumbnailUrl, ...property.imageUrls].filter(Boolean)

  return (
    <div className="property-detail-container">
      <NextSeo
        title={`${property.project} - ${propertyTypeInfo?.label} in ${property.location.city} - Grihome`}
        description={
          property.description ||
          `${propertyTypeInfo?.label} property in ${property.location.fullAddress}`
        }
        canonical={`https://grihome.vercel.app/properties/${property.id}`}
      />

      <Header />

      <main className="property-detail-main">
        <div className="property-detail-content">
          {/* Back Button */}
          <button onClick={() => router.back()} className="property-detail-back">
            <svg
              className="property-detail-back__icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>

          <div className="property-detail-grid">
            {/* Property Images and Main Info */}
            <div className="property-detail-main-column">
              {/* Image Gallery */}
              <div className="property-image-gallery">
                <div className="property-image-main">
                  <Image
                    src={
                      allImages[selectedImageIndex] ||
                      'https://via.placeholder.com/800x400?text=Property'
                    }
                    alt={`${property.project} - Image ${selectedImageIndex + 1}`}
                    fill
                    className="property-image-main__img"
                  />
                  <div
                    className={`property-image-status ${
                      property.listingStatus === 'ACTIVE'
                        ? 'property-image-status--active'
                        : property.listingStatus === 'SOLD'
                          ? 'property-image-status--sold'
                          : property.listingStatus === 'PENDING'
                            ? 'property-image-status--pending'
                            : 'property-image-status--default'
                    }`}
                  >
                    {property.listingStatus}
                  </div>

                  {/* Navigation Arrows */}
                  {allImages.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setSelectedImageIndex(prev =>
                            prev === 0 ? allImages.length - 1 : prev - 1
                          )
                        }
                        className="property-image-nav property-image-nav--left"
                        aria-label="Previous image"
                      >
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() =>
                          setSelectedImageIndex(prev =>
                            prev === allImages.length - 1 ? 0 : prev + 1
                          )
                        }
                        className="property-image-nav property-image-nav--right"
                        aria-label="Next image"
                      >
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Property Details */}
              <div className="property-details-section">
                {/* Title and Price Row */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h1 className="property-details-title flex-1">{property.project}</h1>
                  {property.price && (
                    <span className="property-details-title whitespace-nowrap">
                      ₹{formatIndianCurrency(property.price)}
                    </span>
                  )}
                </div>

                {/* Location/Posted and Mark as Sold Row */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <p className="property-location__address">
                      <svg
                        className="property-location__icon"
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
                    <p className="property-location__meta">
                      Posted on {formatDate(property.createdAt)}
                    </p>
                  </div>
                  <div>
                    {isOwner && property.listingStatus === 'ACTIVE' && (
                      <button
                        onClick={() => setShowSoldModal(true)}
                        disabled={processing}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                      >
                        Mark as Sold
                      </button>
                    )}
                  </div>
                </div>

                {/* Property Features */}
                <div className="property-features-grid">
                  {property.bedrooms && (
                    <div className="property-feature">
                      <div className="property-feature__value">{property.bedrooms}</div>
                      <div className="property-feature__label">Bedrooms</div>
                    </div>
                  )}
                  {property.bathrooms && (
                    <div className="property-feature">
                      <div className="property-feature__value">{property.bathrooms}</div>
                      <div className="property-feature__label">Bathrooms</div>
                    </div>
                  )}
                  {property.size && (
                    <div className="property-feature">
                      <div className="property-feature__value">
                        {property.size}{' '}
                        {property.sizeUnit &&
                          SIZE_UNIT_LABELS[property.sizeUnit as keyof typeof SIZE_UNIT_LABELS]}
                      </div>
                      <div className="property-feature__label">Unit Size</div>
                    </div>
                  )}
                  {property.plotSize && (
                    <div className="property-feature">
                      <div className="property-feature__value">
                        {property.plotSize}{' '}
                        {property.plotSizeUnit &&
                          SIZE_UNIT_LABELS[property.plotSizeUnit as keyof typeof SIZE_UNIT_LABELS]}
                      </div>
                      <div className="property-feature__label">Plot Size</div>
                    </div>
                  )}
                </div>

                {/* Description */}
                {property.description && (
                  <div className="property-description">
                    <h3 className="property-description__title">Description</h3>
                    <p className="property-description__text">{property.description}</p>
                  </div>
                )}

                {/* Builder/Company Info */}
                {(property.builder !== 'Independent' || property.companyName) && (
                  <div className="property-builder-info">
                    <h3 className="property-builder-info__title">Builder Information</h3>
                    <p className="property-builder-info__text">
                      {property.builder !== 'Independent' && `Builder: ${property.builder}`}
                      {property.companyName && ` • Company: ${property.companyName}`}
                    </p>
                  </div>
                )}

                {/* Sold Information */}
                {property.listingStatus === 'SOLD' && (
                  <div className="property-sold-notice">
                    <h3 className="property-sold-notice__title">Property Sold</h3>
                    <p className="property-sold-notice__text">
                      Sold to: {property.soldTo || 'External Buyer'}
                      {property.soldDate && ` on ${formatDate(property.soldDate)}`}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="property-detail-sidebar-column">
              {/* Express Interest Button (Non-Owner) */}
              {!isOwner && property.listingStatus === 'ACTIVE' && (
                <div className="property-buyers-card">
                  {status === 'authenticated' ? (
                    session.user?.isEmailVerified || session.user?.isMobileVerified ? (
                      <button
                        onClick={async () => {
                          if (hasExpressedInterest) {
                            toast('You have already expressed interest in this property')
                            return
                          }
                          setSendingMessage(true)
                          try {
                            const response = await fetch('/api/interests/express', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                propertyId: property.id,
                              }),
                            })
                            if (!response.ok) {
                              const errorData = await response.json()
                              throw new Error(errorData.message || 'Failed to express interest')
                            }
                            toast.success('Interest sent to property owner!')
                            setHasExpressedInterest(true)
                            if (property) {
                              loadPropertyDetail(property.id)
                            }
                          } catch (error: any) {
                            toast.error(error.message || 'Failed to express interest')
                          } finally {
                            setSendingMessage(false)
                          }
                        }}
                        disabled={sendingMessage || hasExpressedInterest}
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                      >
                        {hasExpressedInterest
                          ? '✓ Interest Expressed'
                          : sendingMessage
                            ? 'Sending...'
                            : 'Send Interest'}
                      </button>
                    ) : (
                      <button
                        onClick={() => router.push('/auth/userinfo')}
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium text-sm"
                      >
                        Verify Email/Mobile to Express Interest
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => router.push('/auth/signin')}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium text-sm"
                    >
                      Sign In to Express Interest
                    </button>
                  )}
                </div>
              )}

              {/* Interested Buyers (Owner Only) */}
              {isOwner && (
                <div className="property-buyers-card">
                  <h3 className="property-buyers-card__title">
                    Interested Buyers ({property.interests.length})
                  </h3>
                  {property.interests.length === 0 ? (
                    <p className="property-buyers-card__empty">
                      No one has expressed interest yet.
                    </p>
                  ) : (
                    <div className="property-buyers-list-scroll">
                      {property.interests.map(interest => (
                        <div key={interest.id} className="property-buyer">
                          <div className="property-buyer-row">
                            {/* Left: Name and Date */}
                            <div className="flex-1">
                              <p className="property-buyer__name">{interest.user.name}</p>
                              <p className="property-buyer__date">
                                {formatDate(interest.createdAt)}
                              </p>
                            </div>
                            {/* Right: Email and Phone */}
                            <div className="text-right">
                              <p className="property-buyer__email">{interest.user.email}</p>
                              <p className="property-buyer__phone">{interest.user.phone}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Mark as Sold Modal */}
      {showSoldModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Mark Property as Sold</h3>
              <button
                onClick={() => {
                  setShowSoldModal(false)
                  setBuyerName('')
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buyer Name (Optional)
              </label>
              <input
                type="text"
                value={buyerName}
                onChange={e => setBuyerName(e.target.value)}
                placeholder="Enter buyer name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Leave blank if sold to an external buyer</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSoldModal(false)
                  setBuyerName('')
                }}
                disabled={processing}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkAsSold}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Processing...' : 'Mark as Sold'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
