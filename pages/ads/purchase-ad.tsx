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
  hasAd: boolean
}

interface SlotPurchase {
  slotNumber: number
  days: number
  propertyId: string | null
  projectId: string | null
  propertyData: ActiveListing | null
  daysError?: string
}

export default function PurchaseAdPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [availableSlots, setAvailableSlots] = useState<AdSlotConfig[]>([])
  const [activeListings, setActiveListings] = useState<{
    properties: ActiveListing[]
    projects: ActiveListing[]
    hasActiveListings: boolean
  } | null>(null)
  const [selectedSlots, setSelectedSlots] = useState<SlotPurchase[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)

  const loadAvailableSlots = useCallback(async () => {
    try {
      const response = await fetch('/api/ads/slots')
      if (!response.ok) {
        throw new Error('Failed to fetch slots')
      }
      const data = await response.json()
      const available = data.adSlots.filter((s: AdSlotConfig) => !s.hasAd)
      setAvailableSlots(available)
    } catch (error) {
      toast.error('Failed to load available slots')
    }
  }, [])

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

    if (status === 'authenticated') {
      loadAvailableSlots()
      loadActiveListings()
    }
  }, [status, router, loadAvailableSlots, loadActiveListings])

  // Auto-add slot if slot parameter is in URL
  useEffect(() => {
    if (
      router.isReady &&
      router.query.slot &&
      availableSlots.length > 0 &&
      selectedSlots.length === 0
    ) {
      const slotNumber = parseInt(router.query.slot as string)
      const slot = availableSlots.find(s => s.slotNumber === slotNumber)
      if (slot) {
        setSelectedSlots([
          {
            slotNumber: slot.slotNumber,
            days: 7,
            propertyId: null,
            projectId: null,
            propertyData: null,
          },
        ])
      }
    }
  }, [router.isReady, router.query.slot, availableSlots, selectedSlots.length])

  const getUnselectedSlots = () => {
    const selectedSlotNumbers = selectedSlots.map(s => s.slotNumber)
    return availableSlots.filter(slot => !selectedSlotNumbers.includes(slot.slotNumber))
  }

  const addSlot = () => {
    const unselected = getUnselectedSlots()
    if (unselected.length === 0) {
      toast.error('No more slots available')
      return
    }
    setSelectedSlots([
      ...selectedSlots,
      {
        slotNumber: unselected[0].slotNumber,
        days: 7,
        propertyId: null,
        projectId: null,
        propertyData: null,
      },
    ])
  }

  const removeSlot = (index: number) => {
    setSelectedSlots(selectedSlots.filter((_, i) => i !== index))
  }

  const updateSlot = (index: number, updates: Partial<SlotPurchase>) => {
    const newSlots = [...selectedSlots]
    newSlots[index] = { ...newSlots[index], ...updates }

    // Validate days if being updated
    if (updates.days !== undefined) {
      const days = updates.days
      if (!days || days < 1) {
        newSlots[index].daysError = 'Minimum 1 day required'
      } else if (days > 30) {
        newSlots[index].daysError = 'Maximum 30 days allowed'
      } else {
        newSlots[index].daysError = undefined
      }
    }

    setSelectedSlots(newSlots)
  }

  const updateSlotProperty = (index: number, type: 'property' | 'project', id: string) => {
    const listing =
      type === 'property'
        ? activeListings?.properties.find(p => p.id === id)
        : activeListings?.projects.find(p => p.id === id)

    if (listing) {
      updateSlot(index, {
        propertyId: type === 'property' ? id : null,
        projectId: type === 'project' ? id : null,
        propertyData: listing,
      })
    }
  }

  const getDiscount = (days: number): number => {
    if (days >= 30) return 0.3
    if (days >= 15) return 0.2
    if (days >= 7) return 0.1
    if (days >= 3) return 0.05
    return 0
  }

  const calculateSlotCost = (slotNumber: number, days: number) => {
    const slot = availableSlots.find(s => s.slotNumber === slotNumber)
    if (!slot) return { baseAmount: 0, discount: 0, discountPercent: 0, finalAmount: 0 }

    const baseAmount = slot.basePrice * days
    const discountPercent = getDiscount(days)
    const discount = baseAmount * discountPercent
    const finalAmount = baseAmount - discount

    return { baseAmount, discount, discountPercent: discountPercent * 100, finalAmount }
  }

  const calculateTotalBill = () => {
    let total = 0
    const breakdown: any[] = []

    selectedSlots.forEach((slot, index) => {
      const cost = calculateSlotCost(slot.slotNumber, slot.days)
      total += cost.finalAmount
      breakdown.push({
        slotNumber: slot.slotNumber,
        days: slot.days,
        baseAmount: cost.baseAmount,
        discount: cost.discount,
        discountPercent: cost.discountPercent,
        finalAmount: cost.finalAmount,
      })
    })

    return { total, breakdown }
  }

  const handlePurchase = async () => {
    if (selectedSlots.length === 0) {
      toast.error('Please add at least one slot')
      return
    }

    const slotsWithErrors = selectedSlots.filter(s => s.daysError)
    if (slotsWithErrors.length > 0) {
      toast.error('Please fix day errors before purchasing')
      return
    }

    const invalidSlots = selectedSlots.filter(s => !s.propertyId && !s.projectId)
    if (invalidSlots.length > 0) {
      toast.error('Please select a property/project for all slots')
      return
    }

    setPurchasing(true)
    try {
      // Simulate purchase for all slots
      for (const slot of selectedSlots) {
        const response = await fetch('/api/ads/purchase', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            slotNumber: slot.slotNumber,
            propertyId: slot.propertyId,
            projectId: slot.projectId,
            totalDays: slot.days,
            paymentMethod: 'UPI',
            isRenewal: false,
            renewalAdId: null,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Failed to purchase ad')
        }
      }

      toast.success('Ads purchased successfully!')
      router.push('/')
    } catch (error: any) {
      toast.error(error.message || 'Failed to purchase ads')
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

  const billData = calculateTotalBill()

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

  if (!activeListings) {
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
        title="Purchase Ad Slots - Grihome"
        description="Purchase advertisement slots for your properties"
        canonical="https://grihome.vercel.app/purchase-ad"
      />

      <Header />

      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
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
                Back
              </button>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Purchase Ad Slots</h1>
              <p className="text-gray-600">Feature your properties on the home page</p>
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Pricing:</strong> Row 1 (Slots 1-3): ₹1,000/day • Row 2 (Slots 4-6):
                  ₹900/day
                </p>
              </div>
            </div>

            {/* No Active Properties Banner */}
            {activeListings && !activeListings.hasActiveListings && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-yellow-600"
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
                    <div>
                      <h3 className="text-sm font-semibold text-yellow-800">
                        No Active Properties Found
                      </h3>
                      <p className="text-sm text-yellow-700">
                        You need an active property to purchase ad slots. Please list a property
                        first.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setActiveListings({
                          properties: [],
                          projects: [],
                          hasActiveListings: true,
                        })
                      }}
                      className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors font-medium text-sm whitespace-nowrap"
                    >
                      Skip (Testing)
                    </button>
                    <button
                      onClick={() => router.push('/add-property')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium text-sm whitespace-nowrap"
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
                {/* Slot Selection */}
                {activeListings?.hasActiveListings && availableSlots.length > 0 && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold">Select Ad Slots</h2>
                      <button
                        onClick={addSlot}
                        disabled={getUnselectedSlots().length === 0}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        + Add Slot
                      </button>
                    </div>

                    {/* Selected Slots */}
                    {selectedSlots.length > 0 ? (
                      <div className="space-y-4">
                        {selectedSlots.map((slot, index) => {
                          const unselectedSlots = getUnselectedSlots()
                          const currentSlot = availableSlots.find(
                            s => s.slotNumber === slot.slotNumber
                          )
                          const availableSlotsForDropdown = currentSlot
                            ? [currentSlot, ...unselectedSlots]
                            : unselectedSlots

                          return (
                            <div key={index} className="border rounded-lg p-4 bg-gray-50">
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Select Slot
                                    </label>
                                    <select
                                      value={slot.slotNumber}
                                      onChange={e =>
                                        updateSlot(index, { slotNumber: parseInt(e.target.value) })
                                      }
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    >
                                      {availableSlotsForDropdown.map(availSlot => (
                                        <option
                                          key={availSlot.slotNumber}
                                          value={availSlot.slotNumber}
                                        >
                                          Slot {availSlot.slotNumber} - ₹{availSlot.basePrice}/-
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Number of Days
                                    </label>
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      pattern="[0-9]*"
                                      value={slot.days || ''}
                                      onChange={e => {
                                        const value = e.target.value.replace(/\D/g, '')
                                        const numValue = value === '' ? 0 : parseInt(value)
                                        updateSlot(index, { days: numValue })
                                      }}
                                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                                        slot.daysError ? 'border-red-500' : 'border-gray-300'
                                      }`}
                                      placeholder="Enter days (1-30)"
                                    />
                                    {slot.daysError && (
                                      <p className="text-red-600 text-xs mt-1">{slot.daysError}</p>
                                    )}
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Select Property/Project
                                    </label>
                                    <select
                                      value={slot.propertyId || slot.projectId || ''}
                                      onChange={e => {
                                        const value = e.target.value
                                        const [type, id] = value.split(':')
                                        updateSlotProperty(
                                          index,
                                          type as 'property' | 'project',
                                          id
                                        )
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    >
                                      <option value="">Select...</option>
                                      {activeListings.properties.length > 0 && (
                                        <optgroup label="Properties">
                                          {activeListings.properties.map(property => (
                                            <option
                                              key={property.id}
                                              value={`property:${property.id}`}
                                            >
                                              {property.title}
                                            </option>
                                          ))}
                                        </optgroup>
                                      )}
                                      {activeListings.projects.length > 0 && (
                                        <optgroup label="Projects">
                                          {activeListings.projects.map(project => (
                                            <option
                                              key={project.id}
                                              value={`project:${project.id}`}
                                            >
                                              {project.title}
                                            </option>
                                          ))}
                                        </optgroup>
                                      )}
                                    </select>
                                  </div>
                                </div>
                                <button
                                  onClick={() => removeSlot(index)}
                                  className="text-red-600 hover:text-red-800 ml-4"
                                >
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                      fillRule="evenodd"
                                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </button>
                              </div>

                              {slot.propertyData && (
                                <div className="mt-4 flex items-center space-x-3 p-3 bg-white rounded border">
                                  <Image
                                    src={
                                      slot.propertyData.thumbnail ||
                                      'https://via.placeholder.com/60'
                                    }
                                    alt={slot.propertyData.title}
                                    width={60}
                                    height={45}
                                    className="w-15 h-12 object-cover rounded"
                                  />
                                  <div>
                                    <p className="text-sm font-medium">{slot.propertyData.title}</p>
                                    <p className="text-xs text-gray-500">
                                      {formatLocation(slot.propertyData.location)}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        Click &quot;+ Add Slot&quot; to select an ad slot
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bill Summary */}
              {activeListings?.hasActiveListings && selectedSlots.length > 0 && (
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
                    <h2 className="text-xl font-semibold mb-4">Bill Summary</h2>

                    <div className="space-y-4">
                      {billData.breakdown.map((item, index) => (
                        <div key={index} className="border-b pb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium">Slot #{item.slotNumber}</span>
                            <span className="text-gray-600">{item.days} days</span>
                          </div>
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Base:</span>
                            <span>₹{item.baseAmount}</span>
                          </div>
                          {item.discount > 0 && (
                            <div className="flex justify-between text-sm text-green-600">
                              <span>Discount ({item.discountPercent}%):</span>
                              <span>-₹{item.discount}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm font-medium mt-1">
                            <span>Subtotal:</span>
                            <span>₹{item.finalAmount}</span>
                          </div>
                        </div>
                      ))}

                      <div className="border-t pt-4">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total Amount</span>
                          <span>₹{billData.total}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handlePurchase}
                      disabled={
                        selectedSlots.length === 0 ||
                        purchasing ||
                        selectedSlots.some(s => s.daysError || s.days < 1 || s.days > 30)
                      }
                      className="w-full mt-6 bg-black text-white py-3 px-4 rounded font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {purchasing ? (
                        <span className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </span>
                      ) : (
                        `Purchase`
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
