import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import toast from 'react-hot-toast'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { prisma } from '@/lib/cockroachDB/prisma'
import { PROPERTY_TYPE_LABELS } from '@/lib/constants'

const DURATION_OPTIONS = Array.from({ length: 14 }, (_, i) => i + 1)

interface Project {
  id: string
  name: string
  description: string
}

interface Property {
  id: string
  title: string
  streetAddress: string
  propertyType: string
}

interface PromotePropertyPageProps {
  project: Project | null
  userProperties: Property[]
}

export default function PromotePropertyPage({ project, userProperties }: PromotePropertyPageProps) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('')
  const [duration, setDuration] = useState<number>(14)
  const [isProcessing, setIsProcessing] = useState(false)
  const [expiryDate, setExpiryDate] = useState<Date>(new Date())

  // Property dropdown state
  const [showPropertyDropdown, setShowPropertyDropdown] = useState(false)
  const [propertySearch, setPropertySearch] = useState('')
  const propertyDropdownRef = useRef<HTMLDivElement>(null)
  const propertySearchRef = useRef<HTMLInputElement>(null)

  // Duration dropdown state
  const [showDurationDropdown, setShowDurationDropdown] = useState(false)
  const [durationSearch, setDurationSearch] = useState('')
  const durationDropdownRef = useRef<HTMLDivElement>(null)
  const durationSearchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Redirect unverified users
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const isVerified = session.user.isEmailVerified || session.user.isMobileVerified
      if (!isVerified) {
        toast.error('Please verify your email or mobile to promote your property')
        router.push('/auth/userinfo')
      }
    }
  }, [status, session, router])

  useEffect(() => {
    // Calculate expiry date whenever duration changes
    const today = new Date()
    const expiry = new Date(today.getTime() + duration * 24 * 60 * 60 * 1000)
    setExpiryDate(expiry)
  }, [duration])

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        propertyDropdownRef.current &&
        !propertyDropdownRef.current.contains(event.target as Node)
      ) {
        setShowPropertyDropdown(false)
        setPropertySearch('')
      }
      if (
        durationDropdownRef.current &&
        !durationDropdownRef.current.contains(event.target as Node)
      ) {
        setShowDurationDropdown(false)
        setDurationSearch('')
      }
    }

    if (showPropertyDropdown || showDurationDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showPropertyDropdown, showDurationDropdown])

  useEffect(() => {
    if (showPropertyDropdown && propertySearchRef.current) {
      propertySearchRef.current.focus()
    }
  }, [showPropertyDropdown])

  useEffect(() => {
    if (showDurationDropdown && durationSearchRef.current) {
      durationSearchRef.current.focus()
    }
  }, [showDurationDropdown])

  const filteredProperties = userProperties.filter(
    p =>
      p.title.toLowerCase().includes(propertySearch.toLowerCase()) ||
      p.streetAddress.toLowerCase().includes(propertySearch.toLowerCase()) ||
      p.propertyType.toLowerCase().includes(propertySearch.toLowerCase())
  )

  const filteredDurations = DURATION_OPTIONS.filter(d => d.toString().includes(durationSearch))

  const selectedProperty = userProperties.find(p => p.id === selectedPropertyId)

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="container mx-auto px-4 py-16 flex-1">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Project Not Found</h1>
            <Link href="/projects" className="text-blue-600 hover:text-blue-700">
              Back to Projects
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (userProperties.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="container mx-auto px-4 py-16 flex-1">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">No Properties Found</h1>
            <p className="text-gray-600 mb-6">
              You need to have properties tagged to this project to promote them.
            </p>
            <Link
              href="/properties/add-property"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
            >
              Add a Property
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const handlePurchase = async () => {
    if (!session?.user?.email) {
      toast.error('Please login to continue')
      return
    }

    if (!selectedPropertyId) {
      toast.error('Please select a property')
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch(`/api/projects/${project.id}/promote-property`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId: selectedPropertyId,
          duration,
        }),
      })

      if (response.ok) {
        toast.success('Property successfully verified!')
        router.push(`/projects/${project.id}`)
      } else {
        const data = await response.json()
        toast.error(data.message || 'Failed to complete purchase')
      }
    } catch (error) {
      toast.error('Error processing request. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const paymentAmount = 0 // Currently free

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Head>
        <title>Promote Property - {project.name}</title>
      </Head>
      <Header />
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-6 space-y-1">
            <Link
              href={`/projects/${project.id}`}
              className="text-blue-600 hover:text-blue-700 text-sm block"
            >
              ← Back to Project
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 !mt-1">
              Add Your Property as Verified
            </h1>
            <p className="text-gray-600">Project: {project.name}</p>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-lg shadow-md p-8">
            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg
                  className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">Verified Property Benefits</h3>
                  <p className="text-sm text-blue-800">
                    Your property will be displayed at the top of the properties list with a blue
                    verification badge, increasing its visibility to potential buyers.
                  </p>
                </div>
              </div>
            </div>

            {/* Property Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Property <span className="text-red-500">*</span>
              </label>
              <div className="relative" ref={propertyDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowPropertyDropdown(!showPropertyDropdown)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-left flex items-center justify-between"
                >
                  <span className={selectedProperty ? 'text-gray-900' : 'text-gray-500'}>
                    {selectedProperty
                      ? `${selectedProperty.title} (${PROPERTY_TYPE_LABELS[selectedProperty.propertyType as keyof typeof PROPERTY_TYPE_LABELS] || selectedProperty.propertyType})`
                      : 'Choose a property'}
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${showPropertyDropdown ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {showPropertyDropdown && (
                  <div className="absolute z-50 w-full top-full mt-0 bg-white border border-gray-300 rounded-md shadow-lg">
                    <div className="p-2 border-b border-gray-200">
                      <input
                        ref={propertySearchRef}
                        type="text"
                        placeholder="Search properties..."
                        value={propertySearch}
                        onChange={e => setPropertySearch(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <ul className="max-h-48 overflow-y-auto">
                      {filteredProperties.length > 0 ? (
                        filteredProperties.map(property => (
                          <li
                            key={property.id}
                            onClick={() => {
                              setSelectedPropertyId(property.id)
                              setShowPropertyDropdown(false)
                              setPropertySearch('')
                            }}
                            className={`px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm ${
                              selectedPropertyId === property.id ? 'bg-blue-50 font-medium' : ''
                            }`}
                          >
                            {property.title} (
                            {PROPERTY_TYPE_LABELS[
                              property.propertyType as keyof typeof PROPERTY_TYPE_LABELS
                            ] || property.propertyType}
                            )
                          </li>
                        ))
                      ) : (
                        <li className="px-4 py-2 text-sm text-gray-500">No properties found</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Select which property you want to promote
              </p>
            </div>

            {/* Duration Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Promotion Duration (Days) <span className="text-red-500">*</span>
              </label>
              <div className="relative" ref={durationDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowDurationDropdown(!showDurationDropdown)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-left flex items-center justify-between"
                >
                  <span>
                    {duration} {duration === 1 ? 'day' : 'days'}
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${showDurationDropdown ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {showDurationDropdown && (
                  <div className="absolute z-50 w-full top-full mt-0 bg-white border border-gray-300 rounded-md shadow-lg">
                    <div className="p-2 border-b border-gray-200">
                      <input
                        ref={durationSearchRef}
                        type="text"
                        placeholder="Search days..."
                        value={durationSearch}
                        onChange={e => setDurationSearch(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <ul className="max-h-48 overflow-y-auto">
                      {filteredDurations.length > 0 ? (
                        filteredDurations.map(d => (
                          <li
                            key={d}
                            onClick={() => {
                              setDuration(d)
                              setShowDurationDropdown(false)
                              setDurationSearch('')
                            }}
                            className={`px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm ${
                              duration === d ? 'bg-blue-50 font-medium' : ''
                            }`}
                          >
                            {d} {d === 1 ? 'day' : 'days'}
                          </li>
                        ))
                      ) : (
                        <li className="px-4 py-2 text-sm text-gray-500">No results found</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Choose how long you want your property to be featured
              </p>
            </div>

            {/* Summary Box */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6 space-y-3">
              <h3 className="font-semibold text-gray-900 mb-4">Summary</h3>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Start Date:</span>
                <span className="font-medium text-gray-900">
                  {new Date().toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium text-gray-900">{duration} days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Expiry Date:</span>
                <span className="font-medium text-gray-900">
                  {expiryDate.toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                  <span className="text-2xl font-bold text-green-600">₹{paymentAmount}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1 text-right">Pre-launch offer - Free!</p>
              </div>
            </div>

            {/* Purchase Button */}
            <button
              onClick={handlePurchase}
              disabled={isProcessing || duration < 1 || !selectedPropertyId}
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-md font-semibold text-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Complete Purchase - Get Verified
                </>
              )}
            </button>

            <p className="text-xs text-center text-gray-500 mt-4">
              By completing this purchase, you agree to our terms and conditions
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async context => {
  try {
    const { id } = context.params || {}

    if (!id || typeof id !== 'string') {
      return {
        props: {
          project: null,
          userProperties: [],
        },
      }
    }

    const project = await prisma.project.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
      },
    })

    // Get user's properties for this project
    const session = await require('next-auth').getServerSession(
      context.req,
      context.res,
      require('../../api/auth/[...nextauth]').authOptions
    )

    let userProperties: Property[] = []
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      })

      if (user) {
        const propertiesFromDB = await prisma.property.findMany({
          where: {
            userId: user.id,
            projectId: id,
          },
          select: {
            id: true,
            streetAddress: true,
            propertyType: true,
            propertyDetails: true,
          },
        })
        // Transform to include title from propertyDetails
        userProperties = propertiesFromDB.map(p => {
          const details = p.propertyDetails as { title?: string } | null
          return {
            id: p.id,
            title: details?.title || p.streetAddress,
            streetAddress: p.streetAddress,
            propertyType: p.propertyType,
          }
        })
      }
    }

    return {
      props: {
        project: project ? JSON.parse(JSON.stringify(project)) : null,
        userProperties: JSON.parse(JSON.stringify(userProperties)),
      },
    }
  } catch (error) {
    return {
      props: {
        project: null,
        userProperties: [],
      },
    }
  }
}
