import Head from 'next/head'
import Link from 'next/link'
import { NextSeo } from 'next-seo'
import { useEffect, useRef, useState } from 'react'
import { Loader } from '@googlemaps/js-api-loader'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function Home() {
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([])
  const [showPredictions, setShowPredictions] = useState(false)
  const [autocompleteService, setAutocompleteService] =
    useState<google.maps.places.AutocompleteService | null>(null)

  useEffect(() => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      // eslint-disable-next-line no-console
      console.error(
        'Google Maps API key is missing. Please set GOOGLE_MAPS_API_KEY environment variable.'
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

  const handlePredictionSelect = (prediction: google.maps.places.AutocompletePrediction) => {
    if (searchInputRef.current) {
      searchInputRef.current.value = prediction.description
    }
    setShowPredictions(false)
    setPredictions([])
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
                  <div className="home-city-icon">🏛️</div>
                  <span className="home-city-name">Hyderabad</span>
                </div>
                <div className="home-city-item">
                  <div className="home-city-icon">🏖️</div>
                  <span className="home-city-name">Chennai</span>
                </div>
                <div className="home-city-item">
                  <div className="home-city-icon">🌆</div>
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
              </div>

              <div className="home-search-container">
                <div className="home-search-wrapper">
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties Section */}
      <section className="featured-properties-section">
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
            Featured Properties
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {/* Generate 21 dummy property tiles (7 rows × 3 columns) */}
            {Array.from({ length: 21 }, (_, index) => (
              <div
                key={index}
                className="property-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <div className="property-image-container relative h-48 bg-gradient-to-br from-amber-50 to-orange-100">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-amber-700">
                      <div className="text-4xl mb-2">🏠</div>
                      <div className="text-sm font-medium">Property Image</div>
                    </div>
                  </div>
                  <div className="absolute top-4 left-4 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                    Featured
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 text-gray-800">
                    Sample Property {index + 1}
                  </h3>
                  <p className="text-gray-600 text-sm mb-2">
                    Luxury {index % 2 === 0 ? '2 BHK' : '3 BHK'} Apartment
                  </p>
                  <p className="text-gray-500 text-sm mb-3">
                    {['Kokapet', 'Gachibowli', 'Hitech City', 'Madhapur', 'Kondapur'][index % 5]},
                    Hyderabad
                  </p>
                  <div className="flex justify-between items-center">
                    <div className="text-blue-600 font-bold text-lg">
                      ₹{(((index * 7) % 30) / 10 + 1).toFixed(1)} Cr
                    </div>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
