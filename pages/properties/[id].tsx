import React, { useState, useEffect, useCallback } from 'react'
import { NextSeo } from 'next-seo'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import toast from 'react-hot-toast'

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

  const propertyTypes = [
    { value: 'SINGLE_FAMILY', label: 'Villas', icon: '🏡' },
    { value: 'CONDO', label: 'Apartments', icon: '🏢' },
    { value: 'LAND_RESIDENTIAL', label: 'Residential Lands', icon: '🏞️' },
    { value: 'LAND_AGRICULTURE', label: 'Agriculture Lands', icon: '🌾' },
    { value: 'COMMERCIAL', label: 'Commercial Properties', icon: '🏬' },
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
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
                  {property.price && <div className="property-image-price">₹{property.price}L</div>}
                </div>

                {/* Image Thumbnails */}
                {allImages.length > 1 && (
                  <div className="property-image-thumbnails">
                    {allImages.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`property-thumbnail ${
                          selectedImageIndex === index
                            ? 'property-thumbnail--active'
                            : 'property-thumbnail--inactive'
                        }`}
                      >
                        <Image
                          src={image || 'https://via.placeholder.com/80x64?text=Img'}
                          alt={`Thumbnail ${index + 1}`}
                          width={80}
                          height={64}
                          className="property-thumbnail__img"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Property Details */}
              <div className="property-details-section">
                <div className="property-details-header">
                  <span className="property-details-icon">{propertyTypeInfo?.icon}</span>
                  <h1 className="property-details-title">{property.project}</h1>
                </div>

                <div className="property-location">
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
                    Zipcode: {property.location.zipcode} • Posted on{' '}
                    {formatDate(property.createdAt)}
                  </p>
                </div>

                {/* Property Features */}
                <div className="property-features-grid">
                  {property.sqFt && (
                    <div className="property-feature">
                      <div className="property-feature__value">{property.sqFt}</div>
                      <div className="property-feature__label">Sq Ft</div>
                    </div>
                  )}
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
                  {property.plotSize && (
                    <div className="property-feature">
                      <div className="property-feature__value">
                        {property.plotSize} {property.plotSizeUnit}
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
              {/* Contact/Interest Card */}
              <div className="property-contact-card">
                <h3 className="property-contact-card__title">Property Owner</h3>
                <div className="property-contact-card__owner">
                  <p className="property-contact-card__name">{property.postedBy}</p>
                  <p className="property-contact-card__email">{property.userEmail}</p>
                  {property.userPhone && (
                    <p className="property-contact-card__phone">{property.userPhone}</p>
                  )}
                </div>

                {/* Express Interest Button */}
                {!isOwner && status === 'authenticated' && property.listingStatus === 'ACTIVE' && (
                  <div className="property-interest-section">
                    {hasExpressedInterest ? (
                      <div className="property-interest-expressed">
                        <svg
                          className="property-interest-expressed__icon"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <p className="property-interest-expressed__title">Interest Expressed</p>
                        <p className="property-interest-expressed__text">
                          The owner has your contact details
                        </p>
                      </div>
                    ) : (
                      <button
                        onClick={handleExpressInterest}
                        disabled={expressing}
                        className="property-interest-button"
                      >
                        {expressing ? 'Expressing Interest...' : 'Express Interest'}
                      </button>
                    )}
                  </div>
                )}

                {/* Login Prompt */}
                {!isOwner &&
                  status === 'unauthenticated' &&
                  property.listingStatus === 'ACTIVE' && (
                    <button
                      onClick={() => router.push('/api/auth/signin')}
                      className="property-login-prompt"
                    >
                      Sign In to Express Interest
                    </button>
                  )}

                {/* Property Unavailable */}
                {property.listingStatus !== 'ACTIVE' && (
                  <div className="property-unavailable">
                    <p className="property-unavailable__title">Property Not Available</p>
                    <p className="property-unavailable__status">Status: {property.listingStatus}</p>
                  </div>
                )}
              </div>

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
                    <div className="property-buyers-list">
                      {property.interests.map(interest => (
                        <div key={interest.id} className="property-buyer">
                          <p className="property-buyer__name">{interest.user.name}</p>
                          <p className="property-buyer__email">{interest.user.email}</p>
                          <p className="property-buyer__phone">{interest.user.phone}</p>
                          <p className="property-buyer__date">
                            Expressed interest on {formatDate(interest.createdAt)}
                          </p>
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

      <Footer />
    </div>
  )
}
