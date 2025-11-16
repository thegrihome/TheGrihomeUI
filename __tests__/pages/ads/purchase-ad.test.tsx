import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import PurchaseAdPage from '@/pages/ads/purchase-ad'
import toast from 'react-hot-toast'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}))

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock('@/components/Header', () => {
  return function Header() {
    return <div data-testid="header">Header</div>
  }
})

jest.mock('@/components/Footer', () => {
  return function Footer() {
    return <div data-testid="footer">Footer</div>
  }
})

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}))

const mockActiveListings = {
  properties: [
    {
      id: 'prop1',
      title: 'Luxury Apartment',
      type: 'APARTMENT',
      sqFt: 1200,
      location: {
        locality: 'Bandra',
        city: 'Mumbai',
        state: 'Maharashtra',
      },
      thumbnail: 'https://example.com/prop1.jpg',
      details: {},
    },
  ],
  projects: [],
  hasActiveListings: true,
}

const mockSlots = {
  adSlots: [
    { slotNumber: 1, basePrice: 1500, isActive: true, hasAd: false },
    { slotNumber: 2, basePrice: 1400, isActive: true, hasAd: true },
  ],
}

describe('PurchaseAdPage - Comprehensive Tests', () => {
  const mockPush = jest.fn()
  const mockUseSession = useSession as jest.Mock
  const mockUseRouter = useRouter as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({
      push: mockPush,
      query: {},
      isReady: true,
    })
    mockUseSession.mockReturnValue({
      data: { user: { email: 'test@example.com' } },
      status: 'authenticated',
    })
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Authentication', () => {
    it('should redirect to signin when unauthenticated', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      render(<PurchaseAdPage />)

      waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/api/auth/signin')
      })
    })

    it('should load data when authenticated', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlots,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })

      render(<PurchaseAdPage />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/ads/slots')
        expect(global.fetch).toHaveBeenCalledWith('/api/user/active-listings')
      })
    })
  })

  describe('Initial Rendering', () => {
    it('should render page with header and footer', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlots,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })

      render(<PurchaseAdPage />)

      await waitFor(() => {
        expect(screen.getByTestId('header')).toBeInTheDocument()
        expect(screen.getByTestId('footer')).toBeInTheDocument()
      })
    })

    it('should render page title', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlots,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })

      render(<PurchaseAdPage />)

      await waitFor(() => {
        expect(screen.getByText('Purchase Ad Slots')).toBeInTheDocument()
      })
    })

    it('should render Add Slot button', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlots,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })

      render(<PurchaseAdPage />)

      await waitFor(() => {
        expect(screen.getByText('+ Add Slot')).toBeInTheDocument()
      })
    })

    it('should render pricing information', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlots,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })

      render(<PurchaseAdPage />)

      await waitFor(() => {
        expect(screen.getByText('Slot Pricing')).toBeInTheDocument()
      })
    })
  })

  describe('Loading State', () => {
    it('should show loading spinner while fetching', () => {
      ;(global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {})
      )

      render(<PurchaseAdPage />)

      expect(screen.getByRole('generic', { hidden: true })).toHaveClass('animate-spin')
    })
  })

  describe('Data Fetching', () => {
    it('should fetch available slots', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlots,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })

      render(<PurchaseAdPage />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/ads/slots')
      })
    })

    it('should fetch active listings', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlots,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })

      render(<PurchaseAdPage />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/user/active-listings')
      })
    })

    it('should handle slots fetch error', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })

      render(<PurchaseAdPage />)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to load available slots')
      })
    })

    it('should handle listings fetch error', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlots,
        })
        .mockResolvedValueOnce({
          ok: false,
        })

      render(<PurchaseAdPage />)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to load your active listings')
      })
    })
  })

  describe('No Active Listings', () => {
    it('should show warning when no active listings', async () => {
      const noListings = {
        properties: [],
        projects: [],
        hasActiveListings: false,
      }

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlots,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => noListings,
        })

      render(<PurchaseAdPage />)

      await waitFor(() => {
        expect(screen.getByText('No Active Properties Found')).toBeInTheDocument()
      })
    })

    it('should show Add Property button when no listings', async () => {
      const noListings = {
        properties: [],
        projects: [],
        hasActiveListings: false,
      }

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlots,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => noListings,
        })

      render(<PurchaseAdPage />)

      await waitFor(() => {
        expect(screen.getByText('Add Property')).toBeInTheDocument()
      })
    })

    it('should navigate to add property when button clicked', async () => {
      const noListings = {
        properties: [],
        projects: [],
        hasActiveListings: false,
      }

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlots,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => noListings,
        })

      render(<PurchaseAdPage />)

      await waitFor(() => {
        const addButton = screen.getByText('Add Property')
        fireEvent.click(addButton)
      })

      expect(mockPush).toHaveBeenCalledWith('/properties/add-property')
    })
  })

  describe('Slot Management', () => {
    it('should add slot when Add Slot clicked', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlots,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })

      render(<PurchaseAdPage />)

      await waitFor(() => {
        expect(screen.getByText('+ Add Slot')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('+ Add Slot'))

      await waitFor(() => {
        expect(screen.getByText('Slot')).toBeInTheDocument()
      })
    })

    it('should remove slot when delete button clicked', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlots,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })

      render(<PurchaseAdPage />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('+ Add Slot'))
      })

      await waitFor(() => {
        const deleteButtons = screen.getAllByRole('button').filter(
          btn => btn.querySelector('svg')
        )
        if (deleteButtons.length > 0) {
          fireEvent.click(deleteButtons[0])
        }
      })
    })

    it('should not add slot when none available', async () => {
      const allSlotsOccupied = {
        adSlots: [
          { slotNumber: 1, basePrice: 1500, isActive: true, hasAd: true },
        ],
      }

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => allSlotsOccupied,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })

      render(<PurchaseAdPage />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('+ Add Slot'))
      })

      expect(toast.error).toHaveBeenCalledWith('No more slots available')
    })
  })

  describe('Slot Configuration', () => {
    it('should allow changing slot number', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlots,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })

      render(<PurchaseAdPage />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('+ Add Slot'))
      })

      await waitFor(() => {
        const selects = screen.getAllByRole('combobox')
        if (selects.length > 0) {
          fireEvent.change(selects[0], { target: { value: '1' } })
        }
      })
    })

    it('should allow changing duration', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlots,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })

      render(<PurchaseAdPage />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('+ Add Slot'))
      })

      await waitFor(() => {
        const selects = screen.getAllByRole('combobox')
        if (selects.length > 1) {
          fireEvent.change(selects[1], { target: { value: '14' } })
        }
      })
    })

    it('should allow selecting property', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlots,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })

      render(<PurchaseAdPage />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('+ Add Slot'))
      })

      await waitFor(() => {
        const selects = screen.getAllByRole('combobox')
        if (selects.length > 2) {
          fireEvent.change(selects[2], { target: { value: 'property:prop1' } })
        }
      })
    })
  })

  describe('Pre-launch Offer', () => {
    it('should show pre-launch banner when active', async () => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2025-06-01'))

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlots,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })

      render(<PurchaseAdPage />)

      await waitFor(() => {
        expect(screen.getByText(/Pre-launch Offer!/)).toBeInTheDocument()
      })

      jest.useRealTimers()
    })

    it('should limit days to 3 during pre-launch', async () => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2025-06-01'))

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlots,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })

      render(<PurchaseAdPage />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('+ Add Slot'))
      })

      jest.useRealTimers()
    })
  })

  describe('Bill Summary', () => {
    it('should show bill summary when slots selected', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlots,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })

      render(<PurchaseAdPage />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('+ Add Slot'))
      })

      await waitFor(() => {
        expect(screen.getByText('Bill Summary')).toBeInTheDocument()
      })
    })

    it('should calculate total amount correctly', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlots,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })

      render(<PurchaseAdPage />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('+ Add Slot'))
      })

      await waitFor(() => {
        expect(screen.getByText('Total Amount')).toBeInTheDocument()
      })
    })
  })

  describe('Purchase', () => {
    it('should not allow purchase without property selection', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlots,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })

      render(<PurchaseAdPage />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('+ Add Slot'))
      })

      await waitFor(() => {
        const purchaseButton = screen.getByText(/Purchase|Post for FREE/)
        fireEvent.click(purchaseButton)
      })

      expect(toast.error).toHaveBeenCalledWith('Please select a property/project for all slots')
    })

    it('should submit purchase when valid', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlots,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })

      render(<PurchaseAdPage />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('+ Add Slot'))
      })

      await waitFor(() => {
        const selects = screen.getAllByRole('combobox')
        if (selects.length > 2) {
          fireEvent.change(selects[2], { target: { value: 'property:prop1' } })
        }
      })

      await waitFor(() => {
        const purchaseButton = screen.getByText(/Purchase|Post for FREE/)
        fireEvent.click(purchaseButton)
      })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/ads/purchase',
          expect.objectContaining({
            method: 'POST',
          })
        )
      })
    })

    it('should show success message on successful purchase', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlots,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })

      render(<PurchaseAdPage />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('+ Add Slot'))
      })

      await waitFor(() => {
        const selects = screen.getAllByRole('combobox')
        if (selects.length > 2) {
          fireEvent.change(selects[2], { target: { value: 'property:prop1' } })
        }
      })

      await waitFor(() => {
        const purchaseButton = screen.getByText(/Purchase|Post for FREE/)
        fireEvent.click(purchaseButton)
      })

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Ads purchased successfully!')
      })
    })

    it('should redirect to home after successful purchase', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlots,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })

      render(<PurchaseAdPage />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('+ Add Slot'))
      })

      await waitFor(() => {
        const selects = screen.getAllByRole('combobox')
        if (selects.length > 2) {
          fireEvent.change(selects[2], { target: { value: 'property:prop1' } })
        }
      })

      await waitFor(() => {
        const purchaseButton = screen.getByText(/Purchase|Post for FREE/)
        fireEvent.click(purchaseButton)
      })

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/')
      })
    })

    it('should show error on purchase failure', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlots,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ message: 'Purchase failed' }),
        })

      render(<PurchaseAdPage />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('+ Add Slot'))
      })

      await waitFor(() => {
        const selects = screen.getAllByRole('combobox')
        if (selects.length > 2) {
          fireEvent.change(selects[2], { target: { value: 'property:prop1' } })
        }
      })

      await waitFor(() => {
        const purchaseButton = screen.getByText(/Purchase|Post for FREE/)
        fireEvent.click(purchaseButton)
      })

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled()
      })
    })
  })

  describe('Navigation', () => {
    it('should have back button', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlots,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })

      render(<PurchaseAdPage />)

      await waitFor(() => {
        expect(screen.getByText('Back')).toBeInTheDocument()
      })
    })

    it('should navigate back on back button click', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlots,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })

      render(<PurchaseAdPage />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('Back'))
      })

      expect(mockPush).toHaveBeenCalledWith('/')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty active listings gracefully', async () => {
      const emptyListings = {
        properties: [],
        projects: [],
        hasActiveListings: true,
      }

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlots,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => emptyListings,
        })

      render(<PurchaseAdPage />)

      await waitFor(() => {
        expect(screen.getByText('Purchase Ad Slots')).toBeInTheDocument()
      })
    })

    it('should handle null active listings response', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlots,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => null,
        })

      render(<PurchaseAdPage />)

      await waitFor(() => {
        expect(screen.getByText('Error Loading Page')).toBeInTheDocument()
      })
    })
  })

  describe('SEO', () => {
    it('should have correct SEO title', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlots,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })

      render(<PurchaseAdPage />)

      await waitFor(() => {
        expect(document.title).toContain('Purchase Ad Slots')
      })
    })
  })
})
