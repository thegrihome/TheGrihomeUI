import React, { useState, useEffect, useRef } from 'react'
import { NextSeo } from 'next-seo'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import PropertyCard from '@/components/properties/PropertyCard'
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
  project: string | { id: string; name: string }
  title?: string
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
  const [favorites, setFavorites] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Get tab from URL or default to 'active'
  const getTabFromUrl = (): 'active' | 'archived' | 'favorites' => {
    const tab = router.query.tab as string
    if (tab === 'archived' || tab === 'favorites') return tab
    return 'active'
  }

  const [activeTab, setActiveTab] = useState<'active' | 'archived' | 'favorites'>(getTabFromUrl())
  const [showInterestModal, setShowInterestModal] = useState<string | null>(null)
  const [showSoldModal, setShowSoldModal] = useState<string | null>(null)
  const [soldToName, setSoldToName] = useState('')
  const [showBuyerDropdown, setShowBuyerDropdown] = useState(false)
  const [buyerSearchQuery, setBuyerSearchQuery] = useState('')
  const buyerDropdownRef = useRef<HTMLDivElement>(null)

  const propertyTypes = [
    {
      value: PROPERTY_TYPES.VILLA,
      label: 'Villas',
      icon: PROPERTY_TYPE_ICONS[PROPERTY_TYPES.VILLA],
    },
    {
      value: PROPERTY_TYPES.APARTMENT,
      label: 'Apartments',
      icon: PROPERTY_TYPE_ICONS[PROPERTY_TYPES.APARTMENT],
    },
    {
      value: PROPERTY_TYPES.RESIDENTIAL_LAND,
      label: 'Residential Lands',
      icon: PROPERTY_TYPE_ICONS[PROPERTY_TYPES.RESIDENTIAL_LAND],
    },
    {
      value: PROPERTY_TYPES.AGRICULTURE_LAND,
      label: 'Agriculture Lands',
      icon: PROPERTY_TYPE_ICONS[PROPERTY_TYPES.AGRICULTURE_LAND],
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

  // Update tab when URL changes
  useEffect(() => {
    if (router.isReady) {
      setActiveTab(getTabFromUrl())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query.tab, router.isReady])

  useEffect(() => {
    if (!mounted) return

    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (isAuthenticated && user) {
      loadMyProperties()
      loadFavorites()
    }
  }, [mounted, isAuthenticated, user, router])

  // Close buyer dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buyerDropdownRef.current && !buyerDropdownRef.current.contains(event.target as Node)) {
        setShowBuyerDropdown(false)
      }
    }

    if (showBuyerDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showBuyerDropdown])

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
      setIsInitialLoad(false)
    }
  }

  const loadFavorites = async () => {
    try {
      const response = await fetch('/api/properties/favorites')

      if (!response.ok) {
        throw new Error('Failed to fetch favorites')
      }

      const data = await response.json()
      // eslint-disable-next-line no-console
      console.log('Favorites data:', data.favorites)
      setFavorites(data.favorites || [])
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load favorites:', error)
      setFavorites([])
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
      setBuyerSearchQuery('')
      setShowBuyerDropdown(false)
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

  const currentProperties =
    activeTab === 'active'
      ? activeProperties
      : activeTab === 'archived'
        ? archivedProperties
        : favorites

  // Only show full page loader on initial load
  if (!mounted || (isInitialLoad && loading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1 flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </main>
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
        <div className="properties-main-content">
          <div className={styles['my-properties-header']}>
            <h1 className={styles['my-properties-title']}>
              <span className={styles['my-properties-title-main']}>My </span>
              <span className={styles['my-properties-title-gradient']}>Properties</span>
            </h1>
            <p className={styles['my-properties-subtitle']}>
              Manage your property listings and view interested buyers
            </p>
          </div>

          {/* Tabs */}
          <div className={styles['my-properties-tabs']}>
            <div className={styles['my-properties-tabs-nav']}>
              <button
                onClick={() => {
                  setActiveTab('active')
                  router.push('/properties/my-properties?tab=active', undefined, {
                    shallow: true,
                  })
                }}
                className={`${styles['my-properties-tab']} ${
                  activeTab === 'active'
                    ? styles['my-properties-tab--active']
                    : styles['my-properties-tab--inactive']
                }`}
              >
                Active Properties ({activeProperties.length})
              </button>
              <button
                onClick={() => {
                  setActiveTab('archived')
                  router.push('/properties/my-properties?tab=archived', undefined, {
                    shallow: true,
                  })
                }}
                className={`${styles['my-properties-tab']} ${
                  activeTab === 'archived'
                    ? styles['my-properties-tab--active']
                    : styles['my-properties-tab--inactive']
                }`}
              >
                Archived Properties ({archivedProperties.length})
              </button>
              <button
                onClick={() => {
                  setActiveTab('favorites')
                  router.push('/properties/my-properties?tab=favorites', undefined, {
                    shallow: true,
                  })
                }}
                className={`${styles['my-properties-tab']} ${
                  activeTab === 'favorites'
                    ? styles['my-properties-tab--active']
                    : styles['my-properties-tab--inactive']
                }`}
              >
                My Favorites ({favorites.length})
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
                  : activeTab === 'archived'
                    ? "You don't have any archived properties."
                    : "You haven't favorited any properties yet."}
              </p>
              {activeTab === 'active' && (
                <button
                  onClick={() => router.push('/properties/add-property')}
                  className={styles['my-properties-empty-button']}
                >
                  Add Your First Property
                </button>
              )}
              {activeTab === 'favorites' && (
                <button
                  onClick={() => router.push('/properties')}
                  className={styles['my-properties-empty-button']}
                >
                  Browse Properties
                </button>
              )}
            </div>
          ) : (
            <div className="properties-grid">
              {currentProperties.map(property => (
                <PropertyCard
                  key={property.id}
                  property={{
                    ...property,
                    title: property.title,
                    project:
                      typeof property.project === 'string'
                        ? property.project
                        : property.project?.name || '',
                    listingType: 'SALE',
                    userId: user?.id || '',
                    userEmail: user?.email || '',
                  }}
                  isOwner={true}
                  currentUserId={user?.id || null}
                  onMarkAsSold={
                    activeTab === 'active' ? propertyId => setShowSoldModal(propertyId) : undefined
                  }
                  processing={false}
                />
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
                      {/* Left: Name and Date */}
                      <div>
                        <p className={styles['interest-item-name']}>{interest.user.name}</p>
                        <p className={styles['interest-item-date']}>
                          {formatDate(interest.createdAt)}
                        </p>
                      </div>
                      {/* Right: Email and Phone */}
                      <div className="text-right">
                        <p className={styles['interest-item-email']}>{interest.user.email}</p>
                        <p className={styles['interest-item-phone']}>{interest.user.phone}</p>
                      </div>
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
                  setBuyerSearchQuery('')
                  setShowBuyerDropdown(false)
                }}
                className={styles['modal-close']}
              >
                ✕
              </button>
            </div>
            <div className={styles['modal-content']}>
              <div className={styles['sold-modal-input-group']}>
                <label className={styles['sold-modal-label']}>Sold to (optional)</label>
                <div className="relative" ref={buyerDropdownRef}>
                  <div className="relative">
                    <input
                      type="text"
                      value={buyerSearchQuery || soldToName}
                      onChange={e => {
                        setBuyerSearchQuery(e.target.value)
                        setSoldToName('')
                        setShowBuyerDropdown(true)
                      }}
                      onFocus={() => setShowBuyerDropdown(true)}
                      placeholder="Search buyers or type 'External Buyer'"
                      className={styles['sold-modal-input']}
                    />
                    <svg
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
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
                  {showBuyerDropdown && showSoldModal && (
                    <div className="absolute z-[9999] w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto top-full -mt-px">
                      <div
                        className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                        onClick={() => {
                          setSoldToName('External Buyer')
                          setBuyerSearchQuery('')
                          setShowBuyerDropdown(false)
                        }}
                      >
                        External Buyer
                      </div>
                      {properties
                        .find(p => p.id === showSoldModal)
                        ?.interests.filter(interest =>
                          buyerSearchQuery
                            ? interest.user.name
                                .toLowerCase()
                                .includes(buyerSearchQuery.toLowerCase()) ||
                              interest.user.email
                                .toLowerCase()
                                .includes(buyerSearchQuery.toLowerCase()) ||
                              interest.user.phone.includes(buyerSearchQuery)
                            : true
                        )
                        .map(interest => (
                          <div
                            key={interest.id}
                            className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-t text-sm"
                            onClick={() => {
                              setSoldToName(interest.user.name)
                              setBuyerSearchQuery('')
                              setShowBuyerDropdown(false)
                            }}
                          >
                            <div className="font-medium">{interest.user.name}</div>
                            <div className="text-xs text-gray-500">
                              {interest.user.email} • {interest.user.phone}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
              <div className={styles['modal-actions']}>
                <button
                  onClick={() => {
                    setShowSoldModal(null)
                    setSoldToName('')
                    setBuyerSearchQuery('')
                    setShowBuyerDropdown(false)
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
