import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { NextSeo } from 'next-seo'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import { Loader } from '@googlemaps/js-api-loader'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import toast from 'react-hot-toast'

interface AdSlot {
  slotNumber: number
  basePrice: number
  isActive: boolean
  hasAd: boolean
  isExpiringSoon: boolean
  isUserAd: boolean
  ad: {
    id: string
    endDate: string
    totalDays: number
    totalAmount: number
    user: {
      id: string
      name: string
    }
    property?: {
      id: string
      title: string
      type: string
      sqFt: number
      details: any
      thumbnail: string
      location: {
        locality: string
        city: string
        state: string
      }
    }
    project?: {
      id: string
      name: string
      description: string
      thumbnail: string
      location: {
        locality: string
        city: string
        state: string
      }
    }
  } | null
}

interface ActiveListings {
  properties: any[]
  projects: any[]
  hasActiveListings: boolean
}

export default function Home() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([])
  const [showPredictions, setShowPredictions] = useState(false)
  const [autocompleteService, setAutocompleteService] =
    useState<google.maps.places.AutocompleteService | null>(null)
  const [adSlots, setAdSlots] = useState<AdSlot[]>([])
  const [activeListings, setActiveListings] = useState<ActiveListings | null>(null)
  const [loading, setLoading] = useState(true)
  const [showExpiringBanner, setShowExpiringBanner] = useState(false)
  const [expiringAds, setExpiringAds] = useState<AdSlot[]>([])

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      // eslint-disable-next-line no-console
      console.error(
        'Google Maps API key is missing. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable.'
      )
      return
    }

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places'],
    })

    loader
      .load()
      .then(() => {
        const service = new google.maps.places.AutocompleteService()
        setAutocompleteService(service)
      })
      .catch(error => {
        // eslint-disable-next-line no-console
        console.error('Error loading Google Maps API:', error)
      })
  }, [])

  const loadAdSlots = useCallback(async () => {
    try {
      const response = await fetch('/api/ads/slots')
      if (!response.ok) {
        throw new Error('Failed to fetch ad slots')
      }
      const data = await response.json()
      setAdSlots(data.adSlots)

      // Check for expiring ads for logged-in users
      if (status === 'authenticated') {
        const userExpiringAds = data.adSlots.filter(
          (slot: AdSlot) => slot.isUserAd && slot.isExpiringSoon
        )
        setExpiringAds(userExpiringAds)
        setShowExpiringBanner(userExpiringAds.length > 0)
      }
    } catch (error) {
      toast.error('Failed to load ad slots')
    } finally {
      setLoading(false)
    }
  }, [status])

  const loadActiveListings = useCallback(async () => {
    try {
      const response = await fetch('/api/user/active-listings')
      if (!response.ok) {
        throw new Error('Failed to fetch active listings')
      }
      const data = await response.json()
      setActiveListings(data)
    } catch (error) {
      // Silent fail for active listings
    }
  }, [])

  useEffect(() => {
    loadAdSlots()
    if (status === 'authenticated') {
      loadActiveListings()
    }
  }, [status, loadAdSlots, loadActiveListings])

  const handlePurchaseAd = (slotNumber: number) => {
    if (status !== 'authenticated') {
      router.push('/api/auth/signin')
      return
    }

    if (!activeListings?.hasActiveListings) {
      toast.error('You need an active property to purchase an ad slot')
      return
    }

    router.push(`/purchase-ad-slot-${slotNumber}`)
  }

  const handleRenewAd = (adId: string, slotNumber: number) => {
    router.push(`/purchase-ad-slot-${slotNumber}?renew=${adId}`)
  }

  const formatLocation = (location: any) => {
    const parts = []
    if (location.locality) parts.push(location.locality)
    parts.push(location.city)
    if (location.state) parts.push(location.state)
    return parts.join(', ')
  }

  const getPropertyTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      SINGLE_FAMILY: 'Villa',
      CONDO: 'Apartment',
      TOWNHOUSE: 'Townhouse',
      MULTI_FAMILY: 'Multi-Family',
      LAND: 'Land',
      COMMERCIAL: 'Commercial',
    }
    return typeMap[type] || type
  }

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value

    if (query.length > 2 && autocompleteService) {
      autocompleteService.getPlacePredictions(
        {
          input: query,
          types: ['(regions)'],
          componentRestrictions: { country: 'IN' },
        },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setPredictions(predictions)
            setShowPredictions(true)
          } else {
            setPredictions([])
            setShowPredictions(false)
          }
        }
      )
    } else {
      setPredictions([])
      setShowPredictions(false)
    }
  }

  const handlePredictionSelect = (prediction: google.maps.places.AutocompletePrediction) => {
    if (searchInputRef.current) {
      searchInputRef.current.value = prediction.description
    }
    setShowPredictions(false)
    setPredictions([])
    // Navigate to properties page with location
    navigateToProperties(prediction.description)
  }

  const isZipCode = (input: string) => {
    // Check if input is numeric and between 5-6 digits (Indian postal codes)
    return /^\d{5,6}$/.test(input.trim())
  }

  const navigateToProperties = (searchValue: string) => {
    const query: { [key: string]: string } = {}

    if (isZipCode(searchValue)) {
      query.zipcode = searchValue.trim()
    } else {
      query.location = searchValue
    }

    router.push({
      pathname: '/properties',
      query,
    })
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const searchValue = searchInputRef.current?.value?.trim()
    if (searchValue) {
      navigateToProperties(searchValue)
    }
  }

  return (
    <div className="home-container">
      <NextSeo
        title="Grihome"
        description="Grihome — Redefining Real Estate with you."
        canonical="https://grihome.vercel.app/"
        openGraph={{
          url: 'https://grihome.vercel.app/',
          title: 'Grihome',
          description: 'Grihome — Redefining Real Estate with you.',
          images: [
            {
              url: 'blob:https://og-playground.vercel.app/8baff750-c782-4a04-b198-7ee3dd1e1974',
            },
          ],
          site_name: 'Grihome',
        }}
        twitter={{
          handle: '@urstrulymahesh',
          site: 'https://grihome.vercel.app/',
          cardType: 'summary_large_image',
        }}
      />
      <Head>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <section className="home-main-section">
        <div className="home-content-wrapper">
          <div className="home-content-container">
            <div className="home-content-max-width">
              <h1 className="home-title">
                <span className="home-title-line">Redefining Real Estate</span>
                <span className="home-title-gradient">with you.</span>
              </h1>

              <div className="home-cities-container">
                <div className="home-city-item">
                  <div className="home-city-icon">💎</div>
                  <span className="home-city-name">Hyderabad</span>
                </div>
                <div className="home-city-item">
                  <div className="home-city-icon">🏖️</div>
                  <span className="home-city-name">Chennai</span>
                </div>
                <div className="home-city-item">
                  <div className="home-city-icon">🌳</div>
                  <span className="home-city-name">Bengaluru</span>
                </div>
                <div className="home-city-item">
                  <div className="home-city-icon">🏙️</div>
                  <span className="home-city-name">Mumbai</span>
                </div>
                <div className="home-city-item">
                  <div className="home-city-icon">🏛️</div>
                  <span className="home-city-name">Delhi</span>
                </div>
                <div className="home-city-item">
                  <div className="home-city-icon">🌉</div>
                  <span className="home-city-name">Kolkata</span>
                </div>
                <div className="home-city-item">
                  <div className="home-city-icon">🏢</div>
                  <span className="home-city-name">Gurgaon</span>
                </div>
                <div className="home-city-item">
                  <div className="home-city-icon">🌇</div>
                  <span className="home-city-name">Noida</span>
                </div>
              </div>

              <div className="home-search-container">
                <form onSubmit={handleSearchSubmit} className="home-search-wrapper">
                  <div className="home-search-icon-container">
                    <svg
                      className="home-search-icon"
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
                    ref={searchInputRef}
                    type="text"
                    className="home-search-input"
                    placeholder="Enter a property, locality or zip code"
                    onChange={handleSearchInput}
                    onFocus={() => predictions.length > 0 && setShowPredictions(true)}
                    onBlur={() => setTimeout(() => setShowPredictions(false), 200)}
                  />
                  <button type="submit" className="home-search-button">
                    Search
                  </button>
                  {showPredictions && predictions.length > 0 && (
                    <div className="home-search-predictions">
                      {predictions.map(prediction => (
                        <div
                          key={prediction.place_id}
                          className="home-search-prediction-item"
                          onClick={() => handlePredictionSelect(prediction)}
                        >
                          <div className="home-search-prediction-icon">
                            <svg
                              className="home-search-location-icon"
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
                          </div>
                          <div className="home-search-prediction-text">
                            <span className="home-search-prediction-main">
                              {prediction.structured_formatting.main_text}
                            </span>
                            <span className="home-search-prediction-secondary">
                              {prediction.structured_formatting.secondary_text}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Expiry Warning Banner */}
      {showExpiringBanner && expiringAds.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="container mx-auto px-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {expiringAds.length} of your ads {expiringAds.length === 1 ? 'is' : 'are'}{' '}
                  expiring soon!
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleRenewAd(expiringAds[0].ad!.id, expiringAds[0].slotNumber)}
                className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 transition-colors"
              >
                Renew
              </button>
              <button
                onClick={() => setShowExpiringBanner(false)}
                className="text-red-400 hover:text-red-500"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No Active Properties Banner */}
      {status === 'authenticated' && activeListings && !activeListings.hasActiveListings && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="container mx-auto px-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  You need an active property to purchase ad slots. Please list a property first.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Featured Properties Section */}
      <section className="featured-properties-section">
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
            Featured Properties
          </h2>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {adSlots.map(slot => (
                <div
                  key={slot.slotNumber}
                  className="property-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
                >
                  {slot.hasAd && slot.ad ? (
                    // Show actual property/project ad
                    <>
                      <div className="property-image-container relative h-48">
                        <Image
                          src={
                            slot.ad.property?.thumbnail ||
                            slot.ad.project?.thumbnail ||
                            'https://via.placeholder.com/400x192?text=Property+Ad'
                          }
                          alt={slot.ad.property?.title || slot.ad.project?.name || 'Property Ad'}
                          width={400}
                          height={192}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-4 left-4 bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">
                          Featured Ad
                        </div>
                        {slot.isUserAd && slot.isExpiringSoon && (
                          <div className="absolute top-4 right-4 bg-red-600 text-white px-2 py-1 rounded text-xs font-medium">
                            Expiring Soon
                          </div>
                        )}
                        {slot.isUserAd && (
                          <div className="absolute bottom-4 right-4">
                            <button
                              onClick={() => handleRenewAd(slot.ad!.id, slot.slotNumber)}
                              className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                            >
                              Renew
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-lg mb-2 text-gray-800">
                          {slot.ad.property?.title || slot.ad.project?.name}
                        </h3>
                        {slot.ad.property && (
                          <p className="text-gray-600 text-sm mb-2">
                            {getPropertyTypeLabel(slot.ad.property.type)} • {slot.ad.property.sqFt}{' '}
                            sq ft
                            {slot.ad.property.details?.bedrooms &&
                              ` • ${slot.ad.property.details.bedrooms} BHK`}
                          </p>
                        )}
                        <p className="text-gray-500 text-sm mb-3">
                          {formatLocation(slot.ad.property?.location || slot.ad.project?.location)}
                        </p>
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-gray-500">
                            Posted by{' '}
                            <span className="text-blue-600 hover:text-blue-800 cursor-pointer">
                              {slot.ad.user.name}
                            </span>
                          </p>
                          <button
                            onClick={() => {
                              if (slot.ad?.property) {
                                router.push(`/properties/${slot.ad.property.id}`)
                              } else if (slot.ad?.project) {
                                router.push(`/projects/${slot.ad.project.id}`)
                              }
                            }}
                            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    // Show "Purchase Ad" placeholder
                    <>
                      <div className="property-image-container relative h-48 bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                        <div className="text-center">
                          <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            stroke="currentColor"
                            fill="none"
                            viewBox="0 0 48 48"
                          >
                            <path
                              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <h3 className="mt-2 text-sm font-medium text-gray-900">
                            Purchase Ad Slot
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">₹{slot.basePrice}/day</p>
                        </div>
                        <div className="absolute top-4 left-4 bg-orange-600 text-white px-2 py-1 rounded text-xs font-medium">
                          Slot #{slot.slotNumber}
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-lg mb-2 text-gray-800">
                          Ad Slot Available
                        </h3>
                        <p className="text-gray-600 text-sm mb-2">Feature your property here</p>
                        <p className="text-gray-500 text-sm mb-3">
                          Starting at ₹{slot.basePrice} per day
                        </p>
                        <div className="flex justify-end">
                          <button
                            onClick={() => handlePurchaseAd(slot.slotNumber)}
                            className="bg-orange-600 text-white px-4 py-2 rounded text-sm hover:bg-orange-700 transition-colors"
                          >
                            Purchase Ad
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}
