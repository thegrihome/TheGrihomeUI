import React, { useState, useEffect, useCallback } from 'react'
import { NextSeo } from 'next-seo'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import toast from 'react-hot-toast'

interface ActiveListing {
  id: string
  title: string
  type: string
  sqFt: number
  location: {
    locality: string
    city: string
    state: string
  }
  thumbnail: string
  details: any
}

interface AdSlotConfig {
  slotNumber: number
  basePrice: number
  isActive: boolean
}

export default function PurchaseAdSlotPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { slot, renew } = router.query

  const [slotConfig, setSlotConfig] = useState<AdSlotConfig | null>(null)
  const [activeListings, setActiveListings] = useState<{
    properties: ActiveListing[]
    projects: ActiveListing[]
    hasActiveListings: boolean
  } | null>(null)
  const [selectedListing, setSelectedListing] = useState<{
    type: 'property' | 'project'
    id: string
    data: ActiveListing
  } | null>(null)
  const [selectedDays, setSelectedDays] = useState(7)
  const [totalAmount, setTotalAmount] = useState(0)
  const [expiryDate, setExpiryDate] = useState<Date | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<
    'UPI' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_ACCOUNT'
  >('UPI')
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [isRenewal, setIsRenewal] = useState(false)

  const loadSlotConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/ads/slots')
      if (!response.ok) {
        throw new Error('Failed to fetch slot config')
      }
      const data = await response.json()
      const targetSlot = data.adSlots.find((s: any) => s.slotNumber === parseInt(slot as string))

      if (!targetSlot) {
        throw new Error('Slot not found')
      }

      setSlotConfig(targetSlot)
    } catch (error) {
      toast.error('Failed to load slot configuration')
      router.push('/')
    }
  }, [slot, router])

  const loadActiveListings = useCallback(async () => {
    try {
      const response = await fetch('/api/user/active-listings')
      if (!response.ok) {
        throw new Error('Failed to fetch active listings')
      }
      const data = await response.json()
      setActiveListings(data)
    } catch (error) {
      toast.error('Failed to load your active listings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin')
      return
    }

    if (status === 'authenticated' && slot) {
      loadSlotConfig()
      loadActiveListings()
      setIsRenewal(!!renew)
    }
  }, [status, slot, renew, router, loadSlotConfig, loadActiveListings])

  useEffect(() => {
    if (slotConfig && selectedDays) {
      const amount = slotConfig.basePrice * selectedDays
      setTotalAmount(amount)

      const expiry = new Date()
      expiry.setDate(expiry.getDate() + selectedDays)
      setExpiryDate(expiry)
    }
  }, [slotConfig, selectedDays])

  const handleListingSelect = (type: 'property' | 'project', id: string, data: ActiveListing) => {
    setSelectedListing({ type, id, data })
  }

  const handlePurchase = async () => {
    if (!selectedListing || !slotConfig) {
      toast.error('Please select a property or project')
      return
    }

    setPurchasing(true)
    try {
      const response = await fetch('/api/ads/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slotNumber: slotConfig.slotNumber,
          propertyId: selectedListing.type === 'property' ? selectedListing.id : null,
          projectId: selectedListing.type === 'project' ? selectedListing.id : null,
          totalDays: selectedDays,
          paymentMethod,
          isRenewal,
          renewalAdId: renew || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to purchase ad')
      }

      const data = await response.json()
      toast.success(isRenewal ? 'Ad renewed successfully!' : 'Ad purchased successfully!')
      router.push('/')
    } catch (error: any) {
      toast.error(error.message || 'Failed to purchase ad')
    } finally {
      setPurchasing(false)
    }
  }

  const formatLocation = (location: any) => {
    const parts = []
    if (location.locality) parts.push(location.locality)
    parts.push(location.city)
    if (location.state) parts.push(location.state)
    return parts.join(', ')
  }

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

  if (!slotConfig || !activeListings) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Page</h1>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Back to Home
            </button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="purchase-ad-container">
      <NextSeo
        title={`${isRenewal ? 'Renew' : 'Purchase'} Ad Slot ${slotConfig.slotNumber} - Grihome`}
        description={`${isRenewal ? 'Renew your' : 'Purchase an'} advertisement slot for your property`}
        canonical={`https://grihome.vercel.app/purchase-ad-slot-${slotConfig.slotNumber}`}
      />

      <Header />

      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <button
                onClick={() => router.back()}
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
                Back
              </button>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {isRenewal ? 'Renew' : 'Purchase'} Ad Slot #{slotConfig.slotNumber}
              </h1>
              <p className="text-gray-600">
                {isRenewal ? 'Extend your advertisement' : 'Feature your property on the home page'}
              </p>
            </div>

            {/* No Active Properties Banner */}
            {activeListings && !activeListings.hasActiveListings && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <svg
                      className="w-6 h-6 text-yellow-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                      No Active Properties Found
                    </h3>
                    <p className="text-yellow-700 mb-4">
                      You need an active property to purchase ad slots. Please list a property
                      first.
                    </p>
                    <button
                      onClick={() => router.push('/add-property')}
                      className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
                    >
                      Add Property
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Property/Project Selection */}
                {activeListings?.hasActiveListings && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Select Property or Project</h2>

                    {/* Properties */}
                    {activeListings.properties.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-medium mb-3">Your Properties</h3>
                        <div className="space-y-3">
                          {activeListings.properties.map(property => (
                            <div
                              key={property.id}
                              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                                selectedListing?.id === property.id &&
                                selectedListing.type === 'property'
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => handleListingSelect('property', property.id, property)}
                            >
                              <div className="flex items-center space-x-4">
                                <div className="flex-shrink-0">
                                  <Image
                                    src={
                                      property.thumbnail ||
                                      'https://via.placeholder.com/80x60?text=Property'
                                    }
                                    alt={property.title}
                                    width={80}
                                    height={60}
                                    className="w-20 h-15 object-cover rounded"
                                  />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900">{property.title}</h4>
                                  <p className="text-sm text-gray-600">
                                    {property.type} • {property.sqFt} sq ft
                                    {property.details?.bedrooms &&
                                      ` • ${property.details.bedrooms} BHK`}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {formatLocation(property.location)}
                                  </p>
                                </div>
                                <div className="flex-shrink-0">
                                  <div
                                    className={`w-5 h-5 rounded-full border-2 ${
                                      selectedListing?.id === property.id &&
                                      selectedListing.type === 'property'
                                        ? 'border-blue-500 bg-blue-500'
                                        : 'border-gray-300'
                                    }`}
                                  >
                                    {selectedListing?.id === property.id &&
                                      selectedListing.type === 'property' && (
                                        <svg
                                          className="w-3 h-3 text-white ml-0.5 mt-0.5"
                                          fill="currentColor"
                                          viewBox="0 0 20 20"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                      )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Projects */}
                    {activeListings.projects.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium mb-3">Your Projects</h3>
                        <div className="space-y-3">
                          {activeListings.projects.map(project => (
                            <div
                              key={project.id}
                              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                                selectedListing?.id === project.id &&
                                selectedListing.type === 'project'
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => handleListingSelect('project', project.id, project)}
                            >
                              <div className="flex items-center space-x-4">
                                <div className="flex-shrink-0">
                                  <Image
                                    src={
                                      project.thumbnail ||
                                      'https://via.placeholder.com/80x60?text=Project'
                                    }
                                    alt={project.title}
                                    width={80}
                                    height={60}
                                    className="w-20 h-15 object-cover rounded"
                                  />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900">{project.title}</h4>
                                  <p className="text-sm text-gray-600">{project.type} Project</p>
                                  <p className="text-sm text-gray-500">
                                    {formatLocation(project.location)}
                                  </p>
                                </div>
                                <div className="flex-shrink-0">
                                  <div
                                    className={`w-5 h-5 rounded-full border-2 ${
                                      selectedListing?.id === project.id &&
                                      selectedListing.type === 'project'
                                        ? 'border-blue-500 bg-blue-500'
                                        : 'border-gray-300'
                                    }`}
                                  >
                                    {selectedListing?.id === project.id &&
                                      selectedListing.type === 'project' && (
                                        <svg
                                          className="w-3 h-3 text-white ml-0.5 mt-0.5"
                                          fill="currentColor"
                                          viewBox="0 0 20 20"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                      )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Duration Selection */}
                {activeListings?.hasActiveListings && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Ad Duration</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Number of Days
                        </label>
                        <select
                          value={selectedDays}
                          onChange={e => setSelectedDays(parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value={7}>7 Days</option>
                          <option value={14}>14 Days</option>
                          <option value={30}>30 Days</option>
                          <option value={60}>60 Days</option>
                          <option value={90}>90 Days</option>
                        </select>
                      </div>
                      {expiryDate && (
                        <div className="text-sm text-gray-600">
                          <strong>Expiry Date:</strong>{' '}
                          {expiryDate.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Payment Method */}
                {activeListings?.hasActiveListings && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { value: 'UPI', label: 'UPI', icon: '📱' },
                        { value: 'CREDIT_CARD', label: 'Credit Card', icon: '💳' },
                        { value: 'DEBIT_CARD', label: 'Debit Card', icon: '💳' },
                        { value: 'BANK_ACCOUNT', label: 'Bank Account', icon: '🏦' },
                      ].map(method => (
                        <div
                          key={method.value}
                          className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                            paymentMethod === method.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setPaymentMethod(method.value as any)}
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{method.icon}</span>
                            <span className="font-medium">{method.label}</span>
                            <div className="ml-auto">
                              <div
                                className={`w-5 h-5 rounded-full border-2 ${
                                  paymentMethod === method.value
                                    ? 'border-blue-500 bg-blue-500'
                                    : 'border-gray-300'
                                }`}
                              >
                                {paymentMethod === method.value && (
                                  <svg
                                    className="w-3 h-3 text-white ml-0.5 mt-0.5"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Order Summary */}
              {activeListings?.hasActiveListings && (
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
                    <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ad Slot</span>
                        <span className="font-medium">#{slotConfig.slotNumber}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-600">Price per day</span>
                        <span className="font-medium">₹{slotConfig.basePrice}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration</span>
                        <span className="font-medium">{selectedDays} days</span>
                      </div>

                      {selectedListing && (
                        <div className="border-t pt-4">
                          <span className="text-gray-600 text-sm">Selected:</span>
                          <div className="mt-2">
                            <p className="font-medium text-sm">{selectedListing.data.title}</p>
                            <p className="text-xs text-gray-500">
                              {formatLocation(selectedListing.data.location)}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="border-t pt-4">
                        <div className="flex justify-between text-lg font-semibold">
                          <span>Total Amount</span>
                          <span>₹{totalAmount}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handlePurchase}
                      disabled={!selectedListing || purchasing}
                      className="w-full mt-6 bg-blue-600 text-white py-3 px-4 rounded font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {purchasing ? (
                        <span className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </span>
                      ) : (
                        `Pay Now - ₹${totalAmount}`
                      )}
                    </button>

                    <p className="text-xs text-gray-500 mt-3 text-center">
                      This is a demo payment. No actual charges will be made.
                    </p>
                  </div>
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
