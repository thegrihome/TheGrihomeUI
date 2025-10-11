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
  const [allSlots, setAllSlots] = useState<AdSlotConfig[]>([])
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
      setAllSlots(data.adSlots)
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
    // eslint-disable-next-line no-console
    console.log('Auto-populate effect triggered:', {
      isReady: router.isReady,
      slot: router.query.slot,
      propertyId: router.query.propertyId,
      projectId: router.query.projectId,
      availableSlotsLength: availableSlots.length,
      hasActiveListings: !!activeListings,
      selectedSlotsLength: selectedSlots.length,
    })

    if (
      router.isReady &&
      router.query.slot &&
      allSlots.length > 0 &&
      activeListings &&
      selectedSlots.length === 0
    ) {
      const slotNumber = parseInt(router.query.slot as string)
      const isRenewal = !!router.query.renew
      // For renewals, look in all slots; for new purchases, look in available slots
      const slot = isRenewal
        ? allSlots.find(s => s.slotNumber === slotNumber)
        : availableSlots.find(s => s.slotNumber === slotNumber)
      // eslint-disable-next-line no-console
      console.log('Found slot:', slot, 'isRenewal:', isRenewal)

      if (slot) {
        // Check if propertyId or projectId is in URL params
        const propertyId = router.query.propertyId as string | undefined
        const projectId = router.query.projectId as string | undefined

        let propertyData = null
        let finalPropertyId = null
        let finalProjectId = null

        if (propertyId) {
          const property = activeListings.properties.find(p => p.id === propertyId)
          // eslint-disable-next-line no-console
          console.log('Looking for property:', propertyId, 'Found:', property)
          if (property) {
            propertyData = property
            finalPropertyId = propertyId
          }
        } else if (projectId) {
          const project = activeListings.projects.find(p => p.id === projectId)
          // eslint-disable-next-line no-console
          console.log('Looking for project:', projectId, 'Found:', project)
          if (project) {
            propertyData = project
            finalProjectId = projectId
          }
        }

        // eslint-disable-next-line no-console
        console.log('Setting slot with:', {
          slotNumber: slot.slotNumber,
          propertyId: finalPropertyId,
          projectId: finalProjectId,
          propertyData,
        })

        setSelectedSlots([
          {
            slotNumber: slot.slotNumber,
            days: 7,
            propertyId: finalPropertyId,
            projectId: finalProjectId,
            propertyData: propertyData,
          },
        ])
      }
    }
  }, [
    router.isReady,
    router.query.slot,
    router.query.renew,
    router.query.propertyId,
    router.query.projectId,
    allSlots,
    availableSlots,
    activeListings,
    selectedSlots.length,
  ])

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

  // Check if pre-launch offer is active (till December 31, 2025)
  const isPreLaunchActive = () => {
    const today = new Date()
    const offerEndDate = new Date('2025-12-31T23:59:59')
    return today <= offerEndDate
  }

  const getDiscount = (days: number): number => {
    // During pre-launch, all ads are free
    if (isPreLaunchActive()) {
      return 1.0 // 100% discount
    }
    if (days >= 15) return 0.3
    if (days >= 7) return 0.2
    if (days >= 3) return 0.1
    if (days > 0) return 0.05
    return 0
  }

  const calculateSlotCost = (slotNumber: number, days: number) => {
    // Look in all slots first (for renewals), then fall back to available slots
    const slot =
      allSlots.find(s => s.slotNumber === slotNumber) ||
      availableSlots.find(s => s.slotNumber === slotNumber)
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

    const invalidSlots = selectedSlots.filter(s => !s.propertyId && !s.projectId)
    if (invalidSlots.length > 0) {
      toast.error('Please select a property/project for all slots')
      return
    }

    setPurchasing(true)
    try {
      // Purchase all slots
      for (const slot of selectedSlots) {
        const slotCost = calculateSlotCost(slot.slotNumber, slot.days)
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
            totalAmount: slotCost.finalAmount,
            discountApplied: slotCost.discount,
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
              {isPreLaunchActive() && (
                <div className="mt-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-lg p-4">
                  <p className="text-sm text-green-800 font-semibold text-center">
                    🎉 <strong>Pre-launch Offer!</strong> Advertise for FREE till December 31, 2025
                    • Max 3 days per ad
                  </p>
                </div>
              )}
              <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-300 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3 text-center">
                  📊 Slot Pricing
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="text-center p-2 bg-white rounded-md shadow-sm">
                    <div className="text-xs text-gray-600 font-medium">Row 1-2</div>
                    <div className="text-sm font-bold text-blue-600">₹1,500-1,400</div>
                    <div className="text-xs text-gray-500">per day</div>
                  </div>
                  <div className="text-center p-2 bg-white rounded-md shadow-sm">
                    <div className="text-xs text-gray-600 font-medium">Row 3-4</div>
                    <div className="text-sm font-bold text-blue-600">₹1,300-1,200</div>
                    <div className="text-xs text-gray-500">per day</div>
                  </div>
                  <div className="text-center p-2 bg-white rounded-md shadow-sm">
                    <div className="text-xs text-gray-600 font-medium">Row 5-6</div>
                    <div className="text-sm font-bold text-blue-600">₹1,100-1,000</div>
                    <div className="text-xs text-gray-500">per day</div>
                  </div>
                  <div className="text-center p-2 bg-white rounded-md shadow-sm">
                    <div className="text-xs text-gray-600 font-medium">Row 7</div>
                    <div className="text-sm font-bold text-blue-600">₹900</div>
                    <div className="text-xs text-gray-500">per day</div>
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <p className="text-xs text-gray-600">
                    💡 <strong>Save more!</strong> Get up to 30% discount on longer durations
                  </p>
                </div>
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
                      onClick={() => router.push('/properties/add-property')}
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
                          // Check if this is a renewal - the slot might be in allSlots but not availableSlots
                          const isRenewal = !!router.query.renew
                          const currentSlot = isRenewal
                            ? allSlots.find(s => s.slotNumber === slot.slotNumber)
                            : availableSlots.find(s => s.slotNumber === slot.slotNumber)
                          const availableSlotsForDropdown = currentSlot
                            ? [currentSlot, ...unselectedSlots]
                            : unselectedSlots

                          return (
                            <div key={index} className="border rounded-lg p-4 bg-gray-50">
                              <div className="mb-4">
                                <div className="flex gap-4 mb-2">
                                  <div className="flex-shrink-0">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Slot
                                    </label>
                                    <select
                                      value={slot.slotNumber}
                                      onChange={e =>
                                        updateSlot(index, { slotNumber: parseInt(e.target.value) })
                                      }
                                      className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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

                                  <div className="flex-shrink-0">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Days
                                    </label>
                                    <select
                                      value={slot.days || 7}
                                      onChange={e =>
                                        updateSlot(index, { days: parseInt(e.target.value) })
                                      }
                                      className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    >
                                      {Array.from(
                                        { length: isPreLaunchActive() ? 3 : 30 },
                                        (_, i) => i + 1
                                      ).map(day => (
                                        <option key={day} value={day}>
                                          {day}
                                        </option>
                                      ))}
                                    </select>
                                    {isPreLaunchActive() && (
                                      <p className="text-xs text-green-600 mt-1 font-medium">
                                        Pre-launch: Max 3 days
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Property/Project
                                    </label>
                                    <select
                                      value={
                                        slot.propertyId
                                          ? `property:${slot.propertyId}`
                                          : slot.projectId
                                            ? `project:${slot.projectId}`
                                            : ''
                                      }
                                      onChange={e => {
                                        const value = e.target.value
                                        const [type, id] = value.split(':')
                                        updateSlotProperty(
                                          index,
                                          type as 'property' | 'project',
                                          id
                                        )
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 truncate"
                                      title={
                                        slot.propertyData?.title || 'Select a property or project'
                                      }
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

                                  <div className="flex-shrink-0 flex items-end">
                                    <button
                                      onClick={() => removeSlot(index)}
                                      className="text-red-600 hover:text-red-800 p-2"
                                    >
                                      <svg
                                        className="w-5 h-5"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
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
                            <span className={isPreLaunchActive() ? 'line-through' : ''}>
                              ₹{item.baseAmount}
                            </span>
                          </div>
                          {item.discount > 0 && (
                            <div className="flex justify-between text-sm text-green-600">
                              <span>
                                {isPreLaunchActive()
                                  ? 'Pre-launch Offer (100%)'
                                  : `Discount (${item.discountPercent}%)`}
                                :
                              </span>
                              <span>-₹{item.discount}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm font-medium mt-1">
                            <span>Subtotal:</span>
                            <span className={isPreLaunchActive() ? 'text-green-600 font-bold' : ''}>
                              ₹{item.finalAmount.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}

                      <div className="border-t pt-4">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total Amount</span>
                          <span className={isPreLaunchActive() ? 'text-green-600' : ''}>
                            ₹{billData.total.toFixed(2)}
                          </span>
                        </div>
                        {isPreLaunchActive() && (
                          <p className="text-sm text-green-600 mt-2 text-center font-semibold">
                            🎉 FREE during pre-launch offer!
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={handlePurchase}
                      disabled={selectedSlots.length === 0 || purchasing}
                      className={`w-full mt-6 py-3 px-4 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                        isPreLaunchActive()
                          ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
                          : 'bg-black text-white hover:bg-gray-800'
                      }`}
                    >
                      {purchasing ? (
                        <span className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </span>
                      ) : isPreLaunchActive() ? (
                        `Post for FREE`
                      ) : (
                        `Purchase`
                      )}
                    </button>
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
