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
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Property Not Found</h1>
            <button
              onClick={() => router.push('/properties')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
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

      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Property Images and Main Info */}
            <div className="lg:col-span-2">
              {/* Image Gallery */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                <div className="relative h-96">
                  <Image
                    src={
                      allImages[selectedImageIndex] ||
                      'https://via.placeholder.com/800x400?text=Property'
                    }
                    alt={`${property.project} - Image ${selectedImageIndex + 1}`}
                    fill
                    className="object-cover"
                  />
                  <div
                    className={`absolute top-4 left-4 px-3 py-1 rounded text-sm font-medium text-white ${
                      property.listingStatus === 'ACTIVE'
                        ? 'bg-green-600'
                        : property.listingStatus === 'SOLD'
                          ? 'bg-red-600'
                          : property.listingStatus === 'PENDING'
                            ? 'bg-yellow-600'
                            : 'bg-gray-600'
                    }`}
                  >
                    {property.listingStatus}
                  </div>
                  {property.price && (
                    <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded text-sm font-bold">
                      ₹{property.price}L
                    </div>
                  )}
                </div>

                {/* Image Thumbnails */}
                {allImages.length > 1 && (
                  <div className="flex gap-2 p-4 overflow-x-auto">
                    {allImages.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-16 rounded overflow-hidden border-2 ${
                          selectedImageIndex === index ? 'border-blue-500' : 'border-gray-200'
                        }`}
                      >
                        <Image
                          src={image || 'https://via.placeholder.com/80x64?text=Img'}
                          alt={`Thumbnail ${index + 1}`}
                          width={80}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Property Details */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">{propertyTypeInfo?.icon}</span>
                  <h1 className="text-3xl font-bold text-gray-900">{property.project}</h1>
                </div>

                <div className="mb-4">
                  <p className="text-gray-600 flex items-center gap-1 mb-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <p className="text-sm text-gray-500">
                    Zipcode: {property.location.zipcode} • Posted on{' '}
                    {formatDate(property.createdAt)}
                  </p>
                </div>

                {/* Property Features */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {property.sqFt && (
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-lg font-semibold text-gray-900">{property.sqFt}</div>
                      <div className="text-sm text-gray-600">Sq Ft</div>
                    </div>
                  )}
                  {property.bedrooms && (
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-lg font-semibold text-gray-900">{property.bedrooms}</div>
                      <div className="text-sm text-gray-600">Bedrooms</div>
                    </div>
                  )}
                  {property.bathrooms && (
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-lg font-semibold text-gray-900">
                        {property.bathrooms}
                      </div>
                      <div className="text-sm text-gray-600">Bathrooms</div>
                    </div>
                  )}
                  {property.plotSize && (
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-lg font-semibold text-gray-900">
                        {property.plotSize} {property.plotSizeUnit}
                      </div>
                      <div className="text-sm text-gray-600">Plot Size</div>
                    </div>
                  )}
                </div>

                {/* Description */}
                {property.description && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Description</h3>
                    <p className="text-gray-700 leading-relaxed">{property.description}</p>
                  </div>
                )}

                {/* Builder/Company Info */}
                {(property.builder !== 'Independent' || property.companyName) && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Builder Information</h3>
                    <p className="text-gray-700">
                      {property.builder !== 'Independent' && `Builder: ${property.builder}`}
                      {property.companyName && ` • Company: ${property.companyName}`}
                    </p>
                  </div>
                )}

                {/* Sold Information */}
                {property.listingStatus === 'SOLD' && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded mb-6">
                    <h3 className="text-lg font-semibold text-red-800 mb-2">Property Sold</h3>
                    <p className="text-red-700">
                      Sold to: {property.soldTo || 'External Buyer'}
                      {property.soldDate && ` on ${formatDate(property.soldDate)}`}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Contact/Interest Card */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Property Owner</h3>
                <div className="mb-4">
                  <p className="font-medium">{property.postedBy}</p>
                  <p className="text-sm text-gray-600">{property.userEmail}</p>
                  {property.userPhone && (
                    <p className="text-sm text-gray-600">{property.userPhone}</p>
                  )}
                </div>

                {/* Express Interest Button */}
                {!isOwner && status === 'authenticated' && property.listingStatus === 'ACTIVE' && (
                  <div className="mb-4">
                    {hasExpressedInterest ? (
                      <div className="bg-green-50 border border-green-200 rounded p-3 text-center">
                        <svg
                          className="w-6 h-6 text-green-600 mx-auto mb-2"
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
                        <p className="text-green-800 font-medium">Interest Expressed</p>
                        <p className="text-green-600 text-sm">The owner has your contact details</p>
                      </div>
                    ) : (
                      <button
                        onClick={handleExpressInterest}
                        disabled={expressing}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded font-medium hover:bg-blue-700"
                    >
                      Sign In to Express Interest
                    </button>
                  )}

                {/* Property Unavailable */}
                {property.listingStatus !== 'ACTIVE' && (
                  <div className="bg-gray-50 border border-gray-200 rounded p-3 text-center">
                    <p className="text-gray-600 font-medium">Property Not Available</p>
                    <p className="text-gray-500 text-sm">Status: {property.listingStatus}</p>
                  </div>
                )}
              </div>

              {/* Interested Buyers (Owner Only) */}
              {isOwner && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Interested Buyers ({property.interests.length})
                  </h3>
                  {property.interests.length === 0 ? (
                    <p className="text-gray-500">No one has expressed interest yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {property.interests.map(interest => (
                        <div key={interest.id} className="border rounded p-3">
                          <p className="font-medium">{interest.user.name}</p>
                          <p className="text-sm text-gray-600">{interest.user.email}</p>
                          <p className="text-sm text-gray-600">{interest.user.phone}</p>
                          <p className="text-xs text-gray-500 mt-1">
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
