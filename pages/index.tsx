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

    router.push(`/ads/purchase-ad?slot=${slotNumber}`)
  }

  const handleRenewAd = (adId: string, slotNumber: number) => {
    router.push(`/ads/${slotNumber}/purchase?renew=${adId}`)
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

  const handlePredictionSelect = async (prediction: google.maps.places.AutocompletePrediction) => {
    if (searchInputRef.current) {
      searchInputRef.current.value = prediction.description
    }
    setShowPredictions(false)
    setPredictions([])

    // Get place details to extract city, state, locality
    const placesService = new google.maps.places.PlacesService(document.createElement('div'))
    placesService.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['address_components', 'formatted_address'],
      },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          navigateToPropertiesWithDetails(place)
        } else {
          // Fallback to simple location search
          navigateToProperties(prediction.description)
        }
      }
    )
  }

  const navigateToPropertiesWithDetails = (place: google.maps.places.PlaceResult) => {
    const addressComponents = place.address_components || []
    let city = ''
    let state = ''
    let locality = ''

    addressComponents.forEach(component => {
      const types = component.types
      if (types.includes('locality')) city = component.long_name
      if (types.includes('administrative_area_level_1')) state = component.long_name
      if (types.includes('sublocality_level_1') || types.includes('sublocality'))
        locality = component.long_name
      // If locality is not found, also check for neighborhood
      if (!locality && types.includes('neighborhood')) locality = component.long_name
    })

    const query: { [key: string]: string } = {}
    if (city) query.city = city
    if (state) query.state = state
    if (locality) query.locality = locality

    router.push({
      pathname: '/properties',
      query,
    })
  }

  const navigateToProperties = (searchValue: string) => {
    router.push({
      pathname: '/properties',
      query: { location: searchValue },
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
              url: 'https://grihome.vercel.app/images/grihome-logo.png',
              width: 800,
              height: 600,
              alt: 'Grihome Logo',
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

      {/* Featured Properties Section */}
      <section className="featured-properties-section">
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Featured <span className="ad-slot-text-gradient">Properties</span>
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
                  className="relative border-2 border-black rounded-lg p-8 min-h-[200px] flex items-center justify-center hover:shadow-lg transition-shadow duration-300 bg-white"
                >
                  <div className="absolute top-4 left-4 text-sm font-bold">
                    <span className="text-black">Slot </span>
                    <span className="ad-slot-number">#{slot.slotNumber}</span>
                  </div>
                  <button onClick={() => handlePurchaseAd(slot.slotNumber)} className="text-center">
                    <div className="text-black text-base font-semibold">
                      Advertise your property <span className="ad-slot-text-gradient">here</span>
                    </div>
                  </button>
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
