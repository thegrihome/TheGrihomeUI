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
    } catch (error) {
      toast.error('Failed to load ad slots')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAdSlots()
  }, [loadAdSlots])

  useEffect(() => {
    const loadActiveListings = async () => {
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
    }

    if (status === 'authenticated') {
      loadActiveListings()
    }
  }, [status])

  const handlePurchaseAd = (slotNumber: number) => {
    if (status !== 'authenticated') {
      router.push('/api/auth/signin')
      return
    }

    router.push(`/ads/purchase-ad?slot=${slotNumber}`)
  }

  const handleRenewAd = (adId: string, slotNumber: number) => {
    // Find the ad to get property/project info
    const slot = adSlots.find(s => s.ad?.id === adId)
    // eslint-disable-next-line no-console
    console.log('handleRenewAd called:', { adId, slotNumber, slot, adSlots })
    if (!slot?.ad) {
      // eslint-disable-next-line no-console
      console.log('No slot or ad found')
      return
    }

    const propertyId = slot.ad.property?.id
    const projectId = slot.ad.project?.id

    // eslint-disable-next-line no-console
    console.log('Property/Project IDs:', { propertyId, projectId })

    // Navigate to purchase-ad page with slot and property/project pre-filled
    const params = new URLSearchParams({
      slot: slotNumber.toString(),
      renew: adId,
    })

    if (propertyId) {
      params.append('propertyId', propertyId)
    } else if (projectId) {
      params.append('projectId', projectId)
    }

    // eslint-disable-next-line no-console
    console.log('Navigating to:', `/ads/purchase-ad?${params.toString()}`)
    router.push(`/ads/purchase-ad?${params.toString()}`)
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
                    placeholder="browse properties for free"
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
                  className="relative border-2 border-black rounded-lg min-h-[200px] hover:shadow-lg transition-shadow duration-300 bg-white overflow-hidden"
                >
                  <div className="absolute top-4 left-4 text-sm font-bold z-10 bg-white/90 px-2 py-1 rounded">
                    <span className="text-black">Slot </span>
                    <span className="ad-slot-number">#{slot.slotNumber}</span>
                  </div>
                  {slot.isUserAd && slot.isExpiringSoon && slot.ad && (
                    <button
                      onClick={() => handleRenewAd(slot.ad!.id, slot.slotNumber)}
                      className="absolute top-4 right-4 z-10 bg-red-600 text-white px-3 py-1 rounded text-xs font-semibold animate-pulse hover:bg-red-700"
                    >
                      Expiring Soon
                    </button>
                  )}
                  {slot.hasAd && slot.ad?.property ? (
                    <Link href={`/properties/${slot.ad.property.id}`} className="block h-full">
                      <div className="relative h-full min-h-[200px]">
                        <Image
                          src={slot.ad.property.thumbnail || 'https://via.placeholder.com/400x300'}
                          alt={slot.ad.property.title}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                          <h3 className="text-white font-semibold text-lg truncate">
                            {slot.ad.property.title}
                          </h3>
                          <p className="text-white/90 text-sm">
                            {slot.ad.property.location.city}, {slot.ad.property.location.state}
                          </p>
                          {slot.ad.user && (
                            <p className="text-white/80 text-xs mt-1">
                              Posted by {slot.ad.user.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ) : slot.hasAd && slot.ad?.project ? (
                    <Link href={`/projects/${slot.ad.project.id}`} className="block h-full">
                      <div className="relative h-full min-h-[200px]">
                        <Image
                          src={slot.ad.project.thumbnail || 'https://via.placeholder.com/400x300'}
                          alt={slot.ad.project.name}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                          <h3 className="text-white font-semibold text-lg truncate">
                            {slot.ad.project.name}
                          </h3>
                          <p className="text-white/90 text-sm">
                            {slot.ad.project.location.city}, {slot.ad.project.location.state}
                          </p>
                          {slot.ad.user && (
                            <p className="text-white/80 text-xs mt-1">
                              Posted by {slot.ad.user.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <button
                      onClick={() => handlePurchaseAd(slot.slotNumber)}
                      className="w-full h-full min-h-[200px] flex items-center justify-center p-8"
                    >
                      <div className="text-center">
                        <div className="text-black text-base font-semibold">
                          Advertise your property{' '}
                          <span className="ad-slot-text-gradient">here</span>
                        </div>
                      </div>
                    </button>
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
