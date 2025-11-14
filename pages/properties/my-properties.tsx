import React, { useState, useEffect } from 'react'
import { NextSeo } from 'next-seo'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import toast from 'react-hot-toast'
import styles from '@/styles/pages/properties/my-properties.module.css'
import {
  PROPERTY_TYPES,
  PROPERTY_TYPE_LABELS,
  PROPERTY_TYPE_ICONS,
  LISTING_STATUS,
  LISTING_STATUS_LABELS,
} from '@/lib/constants'

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
  const [soldToName, setSoldToName] = useState('')

  const propertyTypes = [
    {
      value: PROPERTY_TYPES.SINGLE_FAMILY,
      label: 'Villas',
      icon: PROPERTY_TYPE_ICONS[PROPERTY_TYPES.SINGLE_FAMILY],
    },
    {
      value: PROPERTY_TYPES.CONDO,
      label: 'Apartments',
      icon: PROPERTY_TYPE_ICONS[PROPERTY_TYPES.CONDO],
    },
    {
      value: PROPERTY_TYPES.LAND_RESIDENTIAL,
      label: 'Residential Lands',
      icon: PROPERTY_TYPE_ICONS[PROPERTY_TYPES.LAND_RESIDENTIAL],
    },
    {
      value: PROPERTY_TYPES.LAND_AGRICULTURE,
      label: 'Agriculture Lands',
      icon: PROPERTY_TYPE_ICONS[PROPERTY_TYPES.LAND_AGRICULTURE],
    },
    {
      value: PROPERTY_TYPES.COMMERCIAL,
      label: 'Commercial',
      icon: PROPERTY_TYPE_ICONS[PROPERTY_TYPES.COMMERCIAL],
    },
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

  const handleReactivateProperty = async (propertyId: string) => {
    try {
      const response = await fetch(`/api/properties/${propertyId}/reactivate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to reactivate property')
      }

      toast.success('Property reactivated successfully')
      loadMyProperties()
    } catch (error) {
      toast.error('Failed to reactivate property')
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

  const activeProperties = properties.filter(p => p.listingStatus === LISTING_STATUS.ACTIVE)
  const archivedProperties = properties.filter(p =>
    [
      LISTING_STATUS.SOLD,
      LISTING_STATUS.OFF_MARKET,
      LISTING_STATUS.DRAFT,
      LISTING_STATUS.ARCHIVED,
    ].includes(p.listingStatus as any)
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
    <div className={styles['my-properties-container']}>
      <NextSeo
        title="My Properties - Grihome"
        description="Manage your property listings and view interested buyers"
        canonical="https://grihome.vercel.app/my-properties"
      />

      <Header />

      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className={styles['my-properties-header']}>
            <h1 className={styles['my-properties-title']}>My Properties</h1>
            <p className={styles['my-properties-subtitle']}>
              Manage your property listings and view interested buyers
            </p>
          </div>

          {/* Tabs */}
          <div className={styles['my-properties-tabs']}>
            <div className={styles['my-properties-tabs-nav']}>
              <button
                onClick={() => setActiveTab('active')}
                className={`${styles['my-properties-tab']} ${
                  activeTab === 'active'
                    ? styles['my-properties-tab--active']
                    : styles['my-properties-tab--inactive']
                }`}
              >
                Active Properties ({activeProperties.length})
              </button>
              <button
                onClick={() => setActiveTab('archived')}
                className={`${styles['my-properties-tab']} ${
                  activeTab === 'archived'
                    ? styles['my-properties-tab--active']
                    : styles['my-properties-tab--inactive']
                }`}
              >
                Archived Properties ({archivedProperties.length})
              </button>
            </div>
          </div>

          {/* Properties Grid */}
          {currentProperties.length === 0 ? (
            <div className={styles['my-properties-empty']}>
              <h2 className={styles['my-properties-empty-title']}>
                <span className={styles['my-properties-empty-title-main']}>No Properties</span>{' '}
                <span className={styles['my-properties-empty-title-highlight']}>Found</span>
              </h2>
              <p className={styles['my-properties-empty-text']}>
                {activeTab === 'active'
                  ? "You haven't listed any active properties yet."
                  : "You don't have any archived properties."}
              </p>
              {activeTab === 'active' && (
                <button
                  onClick={() => router.push('/properties/add-property')}
                  className={styles['my-properties-empty-button']}
                >
                  Add Your First Property
                </button>
              )}
            </div>
          ) : (
            <div className={styles['my-properties-grid']}>
              {currentProperties.map(property => (
                <div key={property.id} className={styles['property-card']}>
                  <div className={styles['property-card-image']}>
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
                    <div className={styles['property-card-badge']}>
                      {propertyTypes.find(t => t.value === property.propertyType)?.icon}{' '}
                      {propertyTypes.find(t => t.value === property.propertyType)?.label}
                    </div>
                    <div
                      className={`${styles['property-card-status']} ${
                        property.listingStatus === LISTING_STATUS.ACTIVE
                          ? styles['property-card-status--active']
                          : property.listingStatus === LISTING_STATUS.SOLD
                            ? styles['property-card-status--sold']
                            : property.listingStatus === LISTING_STATUS.PENDING
                              ? styles['property-card-status--pending']
                              : styles['property-card-status--archived']
                      }`}
                    >
                      {property.listingStatus}
                    </div>
                  </div>

                  {/* Below image section */}
                  <div className="flex items-start justify-between gap-2 px-2 py-1.5 bg-gray-50 border-b border-gray-200">
                    {/* Left: Details and Posted on */}
                    <div>
                      <p className="text-[10px] text-gray-700 leading-tight">
                        {property.bedrooms && `${property.bedrooms} BHK`}
                        {property.bathrooms && ` • ${property.bathrooms} Bath`}
                        {property.sqFt && ` • ${property.sqFt} sq ft`}
                      </p>
                      <p className="text-[10px] text-gray-500 leading-tight">
                        Posted on: {formatDate(property.createdAt)}
                      </p>
                    </div>

                    {/* Right: Location and Interested buyers */}
                    <div className="flex flex-col items-end gap-1">
                      <p className="text-[10px] text-gray-600 whitespace-nowrap">
                        {property.location.city}, {property.location.state}
                      </p>
                      {activeTab === 'active' && property.interests.length > 0 && (
                        <button
                          onClick={() => setShowInterestModal(property.id)}
                          className={styles['property-interest-button']}
                        >
                          {property.interests.length} interested buyer
                          {property.interests.length !== 1 ? 's' : ''}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className={styles['property-card-content']}>
                    <h3 className={styles['property-card-title']}>{property.project}</h3>

                    {/* Sold Information */}
                    {property.listingStatus === LISTING_STATUS.SOLD && (
                      <div className={styles['property-sold-info']}>
                        <p className={styles['property-sold-info-buyer']}>
                          Sold to: {property.soldTo || 'External Buyer'}
                        </p>
                        {property.soldDate && (
                          <p className={styles['property-sold-info-date']}>
                            Sold on: {formatDate(property.soldDate)}
                          </p>
                        )}
                      </div>
                    )}

                    <div className={styles['property-card-actions']}>
                      <button
                        onClick={() => router.push(`/properties/${property.id}`)}
                        className={`${styles['property-action-button']} ${styles['property-action-button--view']}`}
                      >
                        View
                      </button>
                      {activeTab === 'active' && (
                        <button
                          onClick={() => setShowSoldModal(property.id)}
                          className={`${styles['property-action-button']} ${styles['property-action-button--sold']}`}
                        >
                          Sold
                        </button>
                      )}
                      {activeTab === 'archived' &&
                        property.listingStatus === LISTING_STATUS.ARCHIVED && (
                          <button
                            onClick={() => handleReactivateProperty(property.id)}
                            className={`${styles['property-action-button']} ${styles['property-action-button--reactivate']}`}
                          >
                            Reactivate
                          </button>
                        )}
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
        <div className={styles['modal-overlay']}>
          <div className={styles['modal-container']}>
            <div className={styles['modal-header']}>
              <h3 className={styles['modal-title']}>Interested Buyers</h3>
              <button onClick={() => setShowInterestModal(null)} className={styles['modal-close']}>
                ✕
              </button>
            </div>
            <div className={styles['modal-content']}>
              {properties
                .find(p => p.id === showInterestModal)
                ?.interests.map(interest => (
                  <div key={interest.id} className={styles['interest-item']}>
                    <div className={styles['interest-item-header']}>
                      <div>
                        <p className={styles['interest-item-name']}>{interest.user.name}</p>
                        <p className={styles['interest-item-email']}>{interest.user.email}</p>
                        <p className={styles['interest-item-phone']}>{interest.user.phone}</p>
                      </div>
                      <p className={styles['interest-item-date']}>
                        {formatDate(interest.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Mark as Sold Modal */}
      {showSoldModal && (
        <div className={styles['modal-overlay']}>
          <div className={styles['modal-container']}>
            <div className={styles['modal-header']}>
              <h3 className={styles['modal-title']}>Mark as Sold</h3>
              <button
                onClick={() => {
                  setShowSoldModal(null)
                  setSoldToName('')
                }}
                className={styles['modal-close']}
              >
                ✕
              </button>
            </div>
            <div className={styles['modal-content']}>
              <div className={styles['sold-modal-input-group']}>
                <label className={styles['sold-modal-label']}>Sold to (optional)</label>
                <input
                  type="text"
                  value={soldToName}
                  onChange={e => setSoldToName(e.target.value)}
                  placeholder="Buyer name or 'External Buyer'"
                  className={styles['sold-modal-input']}
                />
              </div>
              <div className={styles['modal-actions']}>
                <button
                  onClick={() => {
                    setShowSoldModal(null)
                    setSoldToName('')
                  }}
                  className={`${styles['modal-button']} ${styles['modal-button--cancel']}`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleMarkAsSold(showSoldModal)}
                  className={`${styles['modal-button']} ${styles['modal-button--confirm']}`}
                >
                  Mark as Sold
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
