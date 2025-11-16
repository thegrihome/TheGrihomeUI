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

    // Check if Google Maps is already loaded
    if (window.google?.maps?.places?.AutocompleteService) {
      const service = new google.maps.places.AutocompleteService()
      setAutocompleteService(service)
      return
    }

    // Only load if not already loaded
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

                {/* States */}
                <Link href="/forum/category/general-discussions/states" className="home-city-item">
                  <div className="home-city-icon">🇮🇳</div>
                  <span className="home-city-name">States & UTs</span>
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

      {/* Mission Section */}
      <section className="mission-section">
        <div className="mission-container">
          <div className="mission-content">
            <div className="mission-vision">
              <h2 className="mission-heading">Vision</h2>
              <p className="mission-text">
                Grihome.com aims to become India&apos;s most user-friendly real estate platform by
                combining seamless property discovery with a community-driven forum. Unlike
                traditional portals (99Acres, MagicBricks, NoBroker) that restrict access behind
                paywalls, Grihome will allow free browsing of listings and open discussions,
                building user trust and engagement. This is already present in the US real estate
                market in websites like redfin, zillow, homes.com where users can browse all the
                listings without any restriction. Although India doesn&apos;t have a centralized or
                local MLS, we would ensure the initial data is all loaded into the website through
                a combination of manual labor and AI agents.
              </p>
            </div>
            <div className="mission-fundamentals">
              <h2 className="mission-heading">Fundamentals</h2>
              <ul className="mission-list">
                <li className="mission-list-item">
                  <strong>Free Access for Users</strong>
                  <p>
                    Grihome will never charge users to browse property listings, contact sellers, or
                    participate in the community forum. Placing these core actions behind a paywall
                    would make Grihome no different from existing platforms in India, which we aim
                    to disrupt by offering a more open and seamless experience.
                  </p>
                </li>
                <li className="mission-list-item">
                  <strong>Verified Participation</strong>
                  <p>
                    While browsing remains free, registration with a verified email and/or mobile
                    number will be required to post in the forum or to contact Grihome, sellers, or
                    agents. This ensures that only genuine, verified users progress through the
                    platform, reducing spam and improving trust.
                  </p>
                </li>
                <li className="mission-list-item">
                  <strong>Low-Cost, Scalable Infrastructure</strong>
                  <p>
                    To keep the cost of delivering the user experience extremely low, Grihome will
                    serve images, videos, and brochures directly from builder-hosted URLs instead of
                    duplicating and storing them. This approach minimizes storage costs and ensures
                    users always see the most up-to-date media.
                  </p>
                </li>
                <li className="mission-list-item">
                  <strong>Automated Data Accuracy</strong>
                  <p>
                    Grihome will leverage LLM-powered agents to automatically update property pages,
                    mark sold-out projects, and maintain data accuracy. In the early stages, manual
                    verification will complement this process, but over time, the system will evolve
                    into a largely automated, self-updating platform.
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <div className="benefits-container">
          {/* Vertical Timeline with Multicolor Indicators */}
          <div className="benefits-vertical-timeline">
            {/* Left Item - For Buyers */}
            <div className="benefit-timeline-item benefit-timeline-left">
              <div className="benefit-timeline-marker benefit-marker-blue"></div>
              <div className="benefit-item">
                <div className="benefit-divider benefit-divider-blue"></div>
                <div className="benefit-content">
                  <div className="benefit-icon">🏠</div>
                  <h3 className="benefit-title">For Buyers</h3>
                  <p className="benefit-description">
                    Discover your dream home from verified listings. Browse properties, compare
                    prices, and connect directly with sellers and agents.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Item - For Sellers */}
            <div className="benefit-timeline-item benefit-timeline-right">
              <div className="benefit-timeline-marker benefit-marker-green"></div>
              <div className="benefit-item">
                <div className="benefit-divider benefit-divider-green"></div>
                <div className="benefit-content">
                  <div className="benefit-icon">💼</div>
                  <h3 className="benefit-title">For Sellers</h3>
                  <p className="benefit-description">
                    List your property for free. Reach thousands of potential buyers with detailed
                    listings, photos, and virtual tours.
                  </p>
                </div>
              </div>
            </div>

            {/* Left Item - For Agents */}
            <div className="benefit-timeline-item benefit-timeline-left">
              <div className="benefit-timeline-marker benefit-marker-purple"></div>
              <div className="benefit-item">
                <div className="benefit-divider benefit-divider-purple"></div>
                <div className="benefit-content">
                  <div className="benefit-icon">🤝</div>
                  <h3 className="benefit-title">For Agents</h3>
                  <p className="benefit-description">
                    Grow your business with our platform. Manage multiple listings, connect with
                    clients, and build your reputation.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Item - For Builders */}
            <div className="benefit-timeline-item benefit-timeline-right">
              <div className="benefit-timeline-marker benefit-marker-orange"></div>
              <div className="benefit-item">
                <div className="benefit-divider benefit-divider-orange"></div>
                <div className="benefit-content">
                  <div className="benefit-icon">🏗️</div>
                  <h3 className="benefit-title">For Builders</h3>
                  <p className="benefit-description">
                    Showcase your projects to qualified buyers. Feature floor plans, amenities, and
                    walkthrough videos to attract customers.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Agents Showcase - Left Aligned */}
          <div className="showcase-section showcase-left">
            <h2 className="showcase-title">Connect with Top Agents</h2>
            <p className="showcase-subtitle">
              Work with experienced real estate professionals who understand the market
            </p>
            <Link href="/agents" className="showcase-link">
              <button className="showcase-button-compact">
                Browse All Agents
                <svg
                  className="showcase-arrow"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </Link>
          </div>

          {/* Builders Showcase - Right Aligned */}
          <div className="showcase-section showcase-right">
            <h2 className="showcase-title">Find Top Builders</h2>
            <p className="showcase-subtitle">
              Discover trusted builders across India
            </p>
            <Link href="/builders" className="showcase-link">
              <button className="showcase-button-compact">
                Discover Builders
                <svg
                  className="showcase-arrow"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
