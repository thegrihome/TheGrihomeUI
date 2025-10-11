import { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { prisma } from '@/lib/cockroachDB/prisma'
import { useEffect } from 'react'

interface AdDetailProps {
  ad: {
    id: string
    slotNumber: number
    startDate: string
    endDate: string
    totalDays: number
    pricePerDay: number
    totalAmount: number
    status: string
    paymentStatus: string
    createdAt: string
    user: {
      id: string
      name: string
      email: string
    }
    property?: {
      id: string
      streetAddress: string
      propertyType: string
      sqFt: number
      thumbnailUrl: string
      propertyDetails: any
      location: {
        city: string
        state: string
        locality: string
      }
    }
    project?: {
      id: string
      name: string
      description: string
      thumbnailUrl: string
      location: {
        city: string
        state: string
        locality: string
      }
    }
  }
  isOwner: boolean
}

export default function AdDetailPage({ ad, isOwner }: AdDetailProps) {
  const router = useRouter()
  const { data: session, status } = useSession()

  // Redirect non-owners to the property/project page
  useEffect(() => {
    if (!isOwner && status !== 'loading') {
      if (ad.property) {
        router.replace(`/properties/${ad.property.id}`)
      } else if (ad.project) {
        router.replace(`/projects/${ad.project.id}`)
      } else {
        router.replace('/')
      }
    }
  }, [isOwner, ad, router, status])

  if (!isOwner) {
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

  const startDate = new Date(ad.startDate)
  const endDate = new Date(ad.endDate)
  const now = new Date()
  const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const isExpiringSoon = daysRemaining <= 2 && daysRemaining > 0
  const isExpired = ad.status === 'EXPIRED' || daysRemaining <= 0

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatLocation = (location: any) => {
    const parts = []
    if (location.locality) parts.push(location.locality)
    parts.push(location.city)
    if (location.state) parts.push(location.state)
    return parts.join(', ')
  }

  const handleRenewAd = () => {
    const params = new URLSearchParams({
      slot: ad.slotNumber.toString(),
      renew: ad.id,
    })

    if (ad.property) {
      params.append('propertyId', ad.property.id)
    } else if (ad.project) {
      params.append('projectId', ad.project.id)
    }

    router.push(`/ads/purchase-ad?${params.toString()}`)
  }

  const handleViewListing = () => {
    if (ad.property) {
      router.push(`/properties/${ad.property.id}`)
    } else if (ad.project) {
      router.push(`/projects/${ad.project.id}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NextSeo
        title={`Ad #${ad.id} - Grihome`}
        description="Advertisement details"
        canonical={`https://grihome.vercel.app/ads/${ad.id}`}
      />

      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Expiring Soon Banner - AT TOP */}
          {isExpiringSoon && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                ⚠️ Your advertisement is expiring soon! Renew now to continue featuring your listing
                on the home page.
              </p>
            </div>
          )}
          {isExpired && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                ⚠️ Your advertisement has expired. Renew it to feature your listing on the home page
                again.
              </p>
            </div>
          )}

          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Home
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Ad Slot #{ad.slotNumber} Details
            </h1>
            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  isExpired
                    ? 'bg-red-100 text-red-800'
                    : isExpiringSoon
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                }`}
              >
                {isExpired
                  ? 'Expired'
                  : isExpiringSoon
                    ? `Expiring in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`
                    : 'Active'}
              </span>
              <span className="text-gray-600">
                Payment: <span className="font-medium">{ad.paymentStatus}</span>
              </span>
            </div>
          </div>

          {/* Property/Project Info */}
          {(ad.property || ad.project) && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Featured Listing</h2>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <Image
                    src={
                      ad.property?.thumbnailUrl ||
                      ad.project?.thumbnailUrl ||
                      'https://via.placeholder.com/200x150'
                    }
                    alt={
                      ad.property
                        ? ad.property.streetAddress
                        : ad.project
                          ? ad.project.name
                          : 'Listing'
                    }
                    width={200}
                    height={150}
                    className="w-48 h-36 object-cover rounded"
                  />
                </div>
                <div className="flex-1">
                  {ad.property && (
                    <>
                      <h3 className="text-lg font-semibold mb-2">{ad.property.streetAddress}</h3>
                      <p className="text-gray-600 mb-1">
                        Type: {ad.property.propertyType.replace(/_/g, ' ')}
                      </p>
                      <p className="text-gray-600 mb-1">Size: {ad.property.sqFt} sq ft</p>
                      <p className="text-gray-600 mb-3">
                        Location: {formatLocation(ad.property.location)}
                      </p>
                    </>
                  )}
                  {ad.project && (
                    <>
                      <h3 className="text-lg font-semibold mb-2">{ad.project.name}</h3>
                      <p className="text-gray-600 mb-3">{ad.project.description}</p>
                      <p className="text-gray-600 mb-3">
                        Location: {formatLocation(ad.project.location)}
                      </p>
                    </>
                  )}
                  <button
                    onClick={handleViewListing}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm"
                  >
                    View Full Listing
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Ad Details */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Advertisement Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600 text-sm">Start Date</p>
                <p className="font-semibold">{formatDate(ad.startDate)}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">End Date</p>
                <p className="font-semibold">{formatDate(ad.endDate)}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Duration</p>
                <p className="font-semibold">{ad.totalDays} days</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Days Remaining</p>
                <p
                  className={`font-semibold ${
                    isExpired
                      ? 'text-red-600'
                      : isExpiringSoon
                        ? 'text-yellow-600'
                        : 'text-green-600'
                  }`}
                >
                  {isExpired ? 'Expired' : `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Price per Day</p>
                <p className="font-semibold">₹{ad.pricePerDay.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total Amount Paid</p>
                <p className="font-semibold text-lg">₹{ad.totalAmount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Purchase Date</p>
                <p className="font-semibold">{formatDate(ad.createdAt)}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Slot Position</p>
                <p className="font-semibold">Slot #{ad.slotNumber}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Actions</h2>
            <div className="flex flex-wrap gap-4">
              {(isExpiringSoon || isExpired) && (
                <button
                  onClick={handleRenewAd}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Renew Advertisement
                </button>
              )}
              <button
                onClick={() => router.push('/properties/my-properties')}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                My Properties
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ params, req, res }) => {
  const { adId } = params!

  // Get session to check ownership
  const { getServerSession } = await import('next-auth/next')
  const { authOptions } = await import('../../api/auth/[...nextauth]')
  const session = await getServerSession(req, res, authOptions)

  // Fetch ad details
  const ad = await prisma.ad.findUnique({
    where: { id: adId as string },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      property: {
        include: {
          location: {
            select: {
              city: true,
              state: true,
              locality: true,
            },
          },
        },
      },
      project: {
        include: {
          location: {
            select: {
              city: true,
              state: true,
              locality: true,
            },
          },
        },
      },
    },
  })

  if (!ad) {
    return {
      notFound: true,
    }
  }

  const isOwner = session?.user ? (session.user as any).email === ad.user.email : false

  return {
    props: {
      ad: JSON.parse(JSON.stringify(ad)),
      isOwner,
    },
  }
}
