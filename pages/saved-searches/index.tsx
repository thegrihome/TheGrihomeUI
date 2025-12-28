import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import toast from 'react-hot-toast'

interface SavedSearch {
  id: string
  name: string
  searchQuery: {
    propertyType?: string
    listingType?: string
    bedrooms?: string
    bathrooms?: string
    location?: string
    priceMin?: string
    priceMax?: string
    sizeMin?: string
    sizeMax?: string
  }
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const propertyTypeLabels: Record<string, string> = {
  SINGLE_FAMILY: 'Villas',
  CONDO: 'Apartments',
  LAND_RESIDENTIAL: 'Residential Lands',
  LAND_AGRICULTURE: 'Agriculture Lands',
  COMMERCIAL: 'Commercial',
}

export default function SavedSearchesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchSavedSearches()
    }
  }, [status])

  const fetchSavedSearches = async () => {
    try {
      const response = await fetch('/api/saved-searches')
      if (!response.ok) {
        throw new Error('Failed to fetch saved searches')
      }
      const data = await response.json()
      setSavedSearches(data.savedSearches)
    } catch (error) {
      toast.error('Failed to load saved searches')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (id: string, currentState: boolean) => {
    setTogglingId(id)
    try {
      const response = await fetch(`/api/saved-searches/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentState }),
      })

      if (!response.ok) {
        throw new Error('Failed to update saved search')
      }

      setSavedSearches(prev =>
        prev.map(search => (search.id === id ? { ...search, isActive: !currentState } : search))
      )

      toast.success(`Search ${!currentState ? 'activated' : 'paused'}`)
    } catch (error) {
      toast.error('Failed to update saved search')
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this saved search?')) {
      return
    }

    setDeletingId(id)
    try {
      const response = await fetch(`/api/saved-searches/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete saved search')
      }

      setSavedSearches(prev => prev.filter(search => search.id !== id))
      toast.success('Saved search deleted')
    } catch (error) {
      toast.error('Failed to delete saved search')
    } finally {
      setDeletingId(null)
    }
  }

  const buildSearchUrl = (query: SavedSearch['searchQuery']) => {
    const params = new URLSearchParams()

    if (query.listingType === 'SALE') {
      params.set('type', 'buy')
    } else if (query.listingType === 'RENT') {
      params.set('type', 'rent')
    }

    if (query.propertyType) params.set('propertyType', query.propertyType)
    if (query.bedrooms) params.set('bedrooms', query.bedrooms)
    if (query.bathrooms) params.set('bathrooms', query.bathrooms)
    if (query.location) params.set('location', query.location)
    if (query.priceMin) params.set('priceMin', query.priceMin)
    if (query.priceMax) params.set('priceMax', query.priceMax)
    if (query.sizeMin) params.set('sizeMin', query.sizeMin)
    if (query.sizeMax) params.set('sizeMax', query.sizeMax)

    return `/properties?${params.toString()}`
  }

  const formatPrice = (value: string) => {
    const num = parseFloat(value)
    if (isNaN(num)) return value
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(num % 10000000 === 0 ? 0 : 1)} Cr`
    if (num >= 100000) return `₹${(num / 100000).toFixed(num % 100000 === 0 ? 0 : 1)} Lac`
    if (num >= 1000) return `₹${(num / 1000).toFixed(0)}K`
    return `₹${value}`
  }

  if (status === 'loading' || loading) {
    return (
      <div className="saved-searches-container">
        <Header />
        <main className="saved-searches-main">
          <div className="saved-searches-loading">
            <div className="saved-searches-spinner"></div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <div className="saved-searches-container">
      <NextSeo
        title="Saved Searches - Grihome"
        description="View and manage your saved property searches on Grihome"
        canonical="https://grihome.vercel.app/saved-searches"
      />

      <Header />

      <main className="saved-searches-main">
        <div className="saved-searches-content">
          <div className="saved-searches-header">
            <h1 className="saved-searches-title">
              <span className="text-gray-800">Saved</span>{' '}
              <span className="saved-searches-title-gradient">Searches</span>
            </h1>
            <p className="saved-searches-subtitle">
              Manage your saved property searches and get notified about new listings
            </p>
          </div>

          {savedSearches.length === 0 ? (
            <div className="saved-searches-empty">
              <h2 className="saved-searches-empty-title">No saved searches yet</h2>
              <p className="saved-searches-empty-text">
                Save your property searches to get notified when new listings match your criteria
              </p>
              <Link href="/properties" className="saved-searches-empty-button">
                Browse Properties
              </Link>
            </div>
          ) : (
            <div className="saved-searches-table-wrapper">
              <table className="saved-searches-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th className="saved-searches-th-hide-mobile">Type</th>
                    <th className="saved-searches-th-hide-mobile">Property</th>
                    <th className="saved-searches-th-hide-mobile">Location</th>
                    <th className="saved-searches-th-hide-mobile">Price</th>
                    <th className="saved-searches-th-hide-mobile">Size</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {savedSearches.map(search => (
                    <tr key={search.id}>
                      <td>
                        <div className="saved-searches-name-cell">
                          <span className="saved-searches-name">{search.name}</span>
                          <div className="saved-searches-mobile-details">
                            <span className="saved-searches-mobile-detail">
                              {search.searchQuery.listingType === 'SALE'
                                ? 'Buy'
                                : search.searchQuery.listingType === 'RENT'
                                  ? 'Rent'
                                  : 'All'}
                            </span>
                            {search.searchQuery.propertyType && (
                              <span className="saved-searches-mobile-detail">
                                {propertyTypeLabels[search.searchQuery.propertyType] ||
                                  search.searchQuery.propertyType}
                              </span>
                            )}
                            {search.searchQuery.location && (
                              <span className="saved-searches-mobile-detail">
                                {search.searchQuery.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="saved-searches-td-hide-mobile">
                        <span className="saved-searches-badge">
                          {search.searchQuery.listingType === 'SALE'
                            ? 'Buy'
                            : search.searchQuery.listingType === 'RENT'
                              ? 'Rent'
                              : 'All'}
                        </span>
                      </td>
                      <td className="saved-searches-td-hide-mobile">
                        {search.searchQuery.propertyType
                          ? propertyTypeLabels[search.searchQuery.propertyType] ||
                            search.searchQuery.propertyType
                          : '-'}
                        {search.searchQuery.bedrooms && ` · ${search.searchQuery.bedrooms}BHK`}
                        {search.searchQuery.bathrooms && ` · ${search.searchQuery.bathrooms}BA`}
                      </td>
                      <td className="saved-searches-td-hide-mobile">
                        {search.searchQuery.location || '-'}
                      </td>
                      <td className="saved-searches-td-hide-mobile">
                        {search.searchQuery.priceMin && search.searchQuery.priceMax
                          ? `${formatPrice(search.searchQuery.priceMin)} - ${formatPrice(search.searchQuery.priceMax)}`
                          : search.searchQuery.priceMax
                            ? `Up to ${formatPrice(search.searchQuery.priceMax)}`
                            : search.searchQuery.priceMin
                              ? `${formatPrice(search.searchQuery.priceMin)}+`
                              : '-'}
                      </td>
                      <td className="saved-searches-td-hide-mobile">
                        {search.searchQuery.sizeMin && search.searchQuery.sizeMax
                          ? `${search.searchQuery.sizeMin} - ${search.searchQuery.sizeMax} sqft`
                          : search.searchQuery.sizeMax
                            ? `Up to ${search.searchQuery.sizeMax} sqft`
                            : search.searchQuery.sizeMin
                              ? `${search.searchQuery.sizeMin}+ sqft`
                              : '-'}
                      </td>
                      <td>
                        <button
                          onClick={() => handleToggleActive(search.id, search.isActive)}
                          disabled={togglingId === search.id}
                          className={`saved-searches-toggle ${search.isActive ? 'saved-searches-toggle-active' : 'saved-searches-toggle-inactive'}`}
                        >
                          {togglingId === search.id ? (
                            <span className="saved-searches-toggle-loading"></span>
                          ) : (
                            <span>{search.isActive ? 'Active' : 'Paused'}</span>
                          )}
                        </button>
                      </td>
                      <td>
                        <div className="saved-searches-actions">
                          <Link
                            href={buildSearchUrl(search.searchQuery)}
                            className="saved-searches-action-btn saved-searches-view-btn"
                            title="View properties"
                          >
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
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                              />
                            </svg>
                          </Link>
                          <button
                            onClick={() => handleDelete(search.id)}
                            disabled={deletingId === search.id}
                            className="saved-searches-action-btn saved-searches-delete-btn"
                            title="Delete search"
                          >
                            {deletingId === search.id ? (
                              <span className="saved-searches-action-loading"></span>
                            ) : (
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
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
