import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { NextSeo } from 'next-seo'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import { Loader } from '@googlemaps/js-api-loader'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function Home() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([])
  const [showPredictions, setShowPredictions] = useState(false)
  const [autocompleteService, setAutocompleteService] =
    useState<google.maps.places.AutocompleteService | null>(null)

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
                <Link
                  href="/forum/category/general-discussions/bengaluru"
                  className="home-city-item"
                >
                  <div className="home-city-icon">🌳</div>
                  <span className="home-city-name">Bengaluru</span>
                </Link>
                <Link href="/forum/category/general-discussions/chennai" className="home-city-item">
                  <div className="home-city-icon">🏖️</div>
                  <span className="home-city-name">Chennai</span>
                </Link>
                <Link href="/forum/category/general-discussions/delhi" className="home-city-item">
                  <div className="home-city-icon">🏛️</div>
                  <span className="home-city-name">Delhi</span>
                </Link>
                <Link href="/forum/category/general-discussions/gurgaon" className="home-city-item">
                  <div className="home-city-icon">🏢</div>
                  <span className="home-city-name">Gurgaon</span>
                </Link>
                <Link
                  href="/forum/category/general-discussions/hyderabad"
                  className="home-city-item"
                >
                  <div className="home-city-icon">💎</div>
                  <span className="home-city-name">Hyderabad</span>
                </Link>
                <Link href="/forum/category/general-discussions/kolkata" className="home-city-item">
                  <div className="home-city-icon">🌉</div>
                  <span className="home-city-name">Kolkata</span>
                </Link>
                <Link href="/forum/category/general-discussions/mumbai" className="home-city-item">
                  <div className="home-city-icon">🏙️</div>
                  <span className="home-city-name">Mumbai</span>
                </Link>
                <Link href="/forum/category/general-discussions/noida" className="home-city-item">
                  <div className="home-city-icon">🌇</div>
                  <span className="home-city-name">Noida</span>
                </Link>
                <Link href="/forum/category/general-discussions/pune" className="home-city-item">
                  <div className="home-city-icon">🎓</div>
                  <span className="home-city-name">Pune</span>
                </Link>

                {/* States and Union Territories */}
                <Link
                  href="/forum/category/general-discussions/andhra-pradesh"
                  className="home-city-item"
                >
                  <div className="home-city-icon">🌾</div>
                  <span className="home-city-name">Andhra Pradesh</span>
                </Link>
                <Link
                  href="/forum/category/general-discussions/arunachal-pradesh"
                  className="home-city-item"
                >
                  <div className="home-city-icon">🏔️</div>
                  <span className="home-city-name">Arunachal Pradesh</span>
                </Link>
                <Link href="/forum/category/general-discussions/assam" className="home-city-item">
                  <div className="home-city-icon">🍵</div>
                  <span className="home-city-name">Assam</span>
                </Link>
                <Link href="/forum/category/general-discussions/bihar" className="home-city-item">
                  <div className="home-city-icon">📚</div>
                  <span className="home-city-name">Bihar</span>
                </Link>
                <Link
                  href="/forum/category/general-discussions/chhattisgarh"
                  className="home-city-item"
                >
                  <div className="home-city-icon">🌲</div>
                  <span className="home-city-name">Chhattisgarh</span>
                </Link>
                <Link href="/forum/category/general-discussions/goa" className="home-city-item">
                  <div className="home-city-icon">🏖️</div>
                  <span className="home-city-name">Goa</span>
                </Link>
                <Link href="/forum/category/general-discussions/gujarat" className="home-city-item">
                  <div className="home-city-icon">🦁</div>
                  <span className="home-city-name">Gujarat</span>
                </Link>
                <Link href="/forum/category/general-discussions/haryana" className="home-city-item">
                  <div className="home-city-icon">🌾</div>
                  <span className="home-city-name">Haryana</span>
                </Link>
                <Link
                  href="/forum/category/general-discussions/himachal-pradesh"
                  className="home-city-item"
                >
                  <div className="home-city-icon">⛰️</div>
                  <span className="home-city-name">Himachal Pradesh</span>
                </Link>
                <Link
                  href="/forum/category/general-discussions/jammu-and-kashmir"
                  className="home-city-item"
                >
                  <div className="home-city-icon">🏔️</div>
                  <span className="home-city-name">Jammu and Kashmir</span>
                </Link>
                <Link
                  href="/forum/category/general-discussions/jharkhand"
                  className="home-city-item"
                >
                  <div className="home-city-icon">⛰️</div>
                  <span className="home-city-name">Jharkhand</span>
                </Link>
                <Link
                  href="/forum/category/general-discussions/karnataka"
                  className="home-city-item"
                >
                  <div className="home-city-icon">🌳</div>
                  <span className="home-city-name">Karnataka</span>
                </Link>
                <Link href="/forum/category/general-discussions/kerala" className="home-city-item">
                  <div className="home-city-icon">🌴</div>
                  <span className="home-city-name">Kerala</span>
                </Link>
                <Link
                  href="/forum/category/general-discussions/madhya-pradesh"
                  className="home-city-item"
                >
                  <div className="home-city-icon">🐅</div>
                  <span className="home-city-name">Madhya Pradesh</span>
                </Link>
                <Link
                  href="/forum/category/general-discussions/maharashtra"
                  className="home-city-item"
                >
                  <div className="home-city-icon">🏙️</div>
                  <span className="home-city-name">Maharashtra</span>
                </Link>
                <Link href="/forum/category/general-discussions/manipur" className="home-city-item">
                  <div className="home-city-icon">🏔️</div>
                  <span className="home-city-name">Manipur</span>
                </Link>
                <Link
                  href="/forum/category/general-discussions/meghalaya"
                  className="home-city-item"
                >
                  <div className="home-city-icon">☁️</div>
                  <span className="home-city-name">Meghalaya</span>
                </Link>
                <Link href="/forum/category/general-discussions/mizoram" className="home-city-item">
                  <div className="home-city-icon">🌄</div>
                  <span className="home-city-name">Mizoram</span>
                </Link>
                <Link
                  href="/forum/category/general-discussions/nagaland"
                  className="home-city-item"
                >
                  <div className="home-city-icon">⛰️</div>
                  <span className="home-city-name">Nagaland</span>
                </Link>
                <Link href="/forum/category/general-discussions/odisha" className="home-city-item">
                  <div className="home-city-icon">🏛️</div>
                  <span className="home-city-name">Odisha</span>
                </Link>
                <Link href="/forum/category/general-discussions/punjab" className="home-city-item">
                  <div className="home-city-icon">🌾</div>
                  <span className="home-city-name">Punjab</span>
                </Link>
                <Link
                  href="/forum/category/general-discussions/rajasthan"
                  className="home-city-item"
                >
                  <div className="home-city-icon">🏜️</div>
                  <span className="home-city-name">Rajasthan</span>
                </Link>
                <Link href="/forum/category/general-discussions/sikkim" className="home-city-item">
                  <div className="home-city-icon">🏔️</div>
                  <span className="home-city-name">Sikkim</span>
                </Link>
                <Link
                  href="/forum/category/general-discussions/tamil-nadu"
                  className="home-city-item"
                >
                  <div className="home-city-icon">🏛️</div>
                  <span className="home-city-name">Tamil Nadu</span>
                </Link>
                <Link
                  href="/forum/category/general-discussions/telangana"
                  className="home-city-item"
                >
                  <div className="home-city-icon">💎</div>
                  <span className="home-city-name">Telangana</span>
                </Link>
                <Link href="/forum/category/general-discussions/tripura" className="home-city-item">
                  <div className="home-city-icon">🌳</div>
                  <span className="home-city-name">Tripura</span>
                </Link>
                <Link
                  href="/forum/category/general-discussions/uttarakhand"
                  className="home-city-item"
                >
                  <div className="home-city-icon">⛰️</div>
                  <span className="home-city-name">Uttarakhand</span>
                </Link>
                <Link
                  href="/forum/category/general-discussions/uttar-pradesh"
                  className="home-city-item"
                >
                  <div className="home-city-icon">🕌</div>
                  <span className="home-city-name">Uttar Pradesh</span>
                </Link>
                <Link
                  href="/forum/category/general-discussions/west-bengal"
                  className="home-city-item"
                >
                  <div className="home-city-icon">🎭</div>
                  <span className="home-city-name">West Bengal</span>
                </Link>
                <Link
                  href="/forum/category/general-discussions/andaman-and-nicobar-islands"
                  className="home-city-item"
                >
                  <div className="home-city-icon">🏝️</div>
                  <span className="home-city-name">Andaman and Nicobar Islands</span>
                </Link>
                <Link
                  href="/forum/category/general-discussions/chandigarh"
                  className="home-city-item"
                >
                  <div className="home-city-icon">🏙️</div>
                  <span className="home-city-name">Chandigarh</span>
                </Link>
                <Link
                  href="/forum/category/general-discussions/dadra-and-nagar-haveli"
                  className="home-city-item"
                >
                  <div className="home-city-icon">🌳</div>
                  <span className="home-city-name">Dadra and Nagar Haveli</span>
                </Link>
                <Link
                  href="/forum/category/general-discussions/daman-and-diu"
                  className="home-city-item"
                >
                  <div className="home-city-icon">🏖️</div>
                  <span className="home-city-name">Daman and Diu</span>
                </Link>
                <Link
                  href="/forum/category/general-discussions/lakshadweep"
                  className="home-city-item"
                >
                  <div className="home-city-icon">🏝️</div>
                  <span className="home-city-name">Lakshadweep</span>
                </Link>
                <Link
                  href="/forum/category/general-discussions/puducherry"
                  className="home-city-item"
                >
                  <div className="home-city-icon">🌊</div>
                  <span className="home-city-name">Puducherry</span>
                </Link>
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
                    placeholder="Browse properties for free"
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

      <Footer />
    </div>
  )
}
