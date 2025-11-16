import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import PurchaseAdSlotPage from '@/pages/ads/[slot]/purchase'
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

const mockSlotConfig = {
  adSlots: [{ slotNumber: 1, basePrice: 1500, isActive: true }],
}

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

describe('PurchaseAdSlotPage - Comprehensive Tests', () => {
  const mockPush = jest.fn()
  const mockBack = jest.fn()
  const mockUseSession = useSession as jest.Mock
  const mockUseRouter = useRouter as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: mockBack,
      query: { slot: '1' },
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

      render(<PurchaseAdSlotPage />)

      waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/api/auth/signin')
      })
    })

    it('should load data when authenticated', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlotConfig,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })

      render(<PurchaseAdSlotPage />)

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
          json: async () => mockSlotConfig,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })

      render(<PurchaseAdSlotPage />)

      await waitFor(() => {
        expect(screen.getByTestId('header')).toBeInTheDocument()
        expect(screen.getByTestId('footer')).toBeInTheDocument()
      })
    })

    it('should render page title with slot number', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlotConfig,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })

      render(<PurchaseAdSlotPage />)

      await waitFor(() => {
        expect(screen.getByText('Purchase Ad Slot #1')).toBeInTheDocument()
      })
    })

    it('should show renewal title when renew param present', async () => {
      mockUseRouter.mockReturnValue({
        push: mockPush,
        back: mockBack,
        query: { slot: '1', renew: 'true' },
        isReady: true,
      })
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlotConfig,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })

      render(<PurchaseAdSlotPage />)

      await waitFor(() => {
        expect(screen.getByText('Renew Ad Slot #1')).toBeInTheDocument()
      })
    })
  })

  describe('Loading State', () => {
    it('should show loading spinner while fetching', () => {
      ;(global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}))

      render(<PurchaseAdSlotPage />)

      expect(screen.getByRole('generic', { hidden: true })).toHaveClass('animate-spin')
    })
  })

  describe('Data Fetching', () => {
    it('should fetch slot configuration', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlotConfig,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })

      render(<PurchaseAdSlotPage />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/ads/slots')
      })
    })

    it('should redirect to home when slot not found', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ adSlots: [] }),
      })

      render(<PurchaseAdSlotPage />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/')
      })
    })

    it('should handle fetch error', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      })

      render(<PurchaseAdSlotPage />)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to load slot configuration')
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
          json: async () => mockSlotConfig,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => noListings,
        })

      render(<PurchaseAdSlotPage />)

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
          json: async () => mockSlotConfig,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => noListings,
        })

      render(<PurchaseAdSlotPage />)

      await waitFor(() => {
        expect(screen.getByText('Add Property')).toBeInTheDocument()
      })
    })
  })

  describe('Property/Project Selection', () => {
    it('should render property selection section', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlotConfig,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })

      render(<PurchaseAdSlotPage />)

      await waitFor(() => {
        expect(screen.getByText('Select Property or Project')).toBeInTheDocument()
      })
    })

    it('should display available properties', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlotConfig,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })

      render(<PurchaseAdSlotPage />)

      await waitFor(() => {
        expect(screen.getByText('Luxury Apartment')).toBeInTheDocument()
      })
    })

    it('should allow selecting a property', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlotConfig,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })

      render(<PurchaseAdSlotPage />)

      await waitFor(() => {
        const propertyCard = screen.getByText('Luxury Apartment').closest('div')
        if (propertyCard) {
          fireEvent.click(propertyCard)
        }
      })

      await waitFor(() => {
        const propertyCard = screen.getByText('Luxury Apartment').closest('div')
        expect(propertyCard?.className).toContain('border-blue-500')
      })
    })
  })

  describe('Duration Selection', () => {
    it('should render duration selection', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlotConfig,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })

      render(<PurchaseAdSlotPage />)

      await waitFor(() => {
        expect(screen.getByText('Ad Duration')).toBeInTheDocument()
      })
    })

    it('should allow changing duration', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlotConfig,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })

      render(<PurchaseAdSlotPage />)

      await waitFor(() => {
        const durationSelect = screen.getByLabelText('Number of Days')
        fireEvent.change(durationSelect, { target: { value: '14' } })
      })

      await waitFor(() => {
        expect(screen.getByLabelText('Number of Days')).toHaveValue('14')
      })
    })

    it('should show expiry date', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlotConfig,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })

      render(<PurchaseAdSlotPage />)

      await waitFor(() => {
        expect(screen.getByText(/Expiry Date:/)).toBeInTheDocument()
      })
    })
  })

  describe('Payment Method', () => {
    it('should render payment method section', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlotConfig,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })

      render(<PurchaseAdSlotPage />)

      await waitFor(() => {
        expect(screen.getByText('Payment Method')).toBeInTheDocument()
      })
    })

    it('should display all payment options', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlotConfig,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })

      render(<PurchaseAdSlotPage />)

      await waitFor(() => {
        expect(screen.getByText('UPI')).toBeInTheDocument()
        expect(screen.getByText('Credit Card')).toBeInTheDocument()
        expect(screen.getByText('Debit Card')).toBeInTheDocument()
        expect(screen.getByText('Bank Account')).toBeInTheDocument()
      })
    })

    it('should allow selecting payment method', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlotConfig,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })

      render(<PurchaseAdSlotPage />)

      await waitFor(() => {
        const creditCard = screen.getByText('Credit Card').closest('div')
        if (creditCard) {
          fireEvent.click(creditCard)
        }
      })

      await waitFor(() => {
        const creditCard = screen.getByText('Credit Card').closest('div')
        expect(creditCard?.className).toContain('border-blue-500')
      })
    })
  })

  describe('Order Summary', () => {
    it('should show order summary', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlotConfig,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })

      render(<PurchaseAdSlotPage />)

      await waitFor(() => {
        expect(screen.getByText('Order Summary')).toBeInTheDocument()
      })
    })

    it('should display slot number', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlotConfig,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })

      render(<PurchaseAdSlotPage />)

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument()
      })
    })

    it('should display price per day', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlotConfig,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })

      render(<PurchaseAdSlotPage />)

      await waitFor(() => {
        expect(screen.getByText('₹1500')).toBeInTheDocument()
      })
    })

    it('should display selected property in summary', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlotConfig,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })

      render(<PurchaseAdSlotPage />)

      await waitFor(() => {
        const propertyCard = screen.getByText('Luxury Apartment').closest('div')
        if (propertyCard) {
          fireEvent.click(propertyCard)
        }
      })

      await waitFor(() => {
        const summaryCards = screen.getAllByText('Luxury Apartment')
        expect(summaryCards.length).toBeGreaterThan(1)
      })
    })
  })

  describe('Purchase', () => {
    it('should not allow purchase without property selection', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlotConfig,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })

      render(<PurchaseAdSlotPage />)

      await waitFor(() => {
        const payButton = screen.getByText(/Pay Now/)
        fireEvent.click(payButton)
      })

      expect(toast.error).toHaveBeenCalledWith('Please select a property or project')
    })

    it('should submit purchase when valid', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlotConfig,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })

      render(<PurchaseAdSlotPage />)

      await waitFor(() => {
        const propertyCard = screen.getByText('Luxury Apartment').closest('div')
        if (propertyCard) {
          fireEvent.click(propertyCard)
        }
      })

      await waitFor(() => {
        const payButton = screen.getByText(/Pay Now/)
        fireEvent.click(payButton)
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
          json: async () => mockSlotConfig,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })

      render(<PurchaseAdSlotPage />)

      await waitFor(() => {
        const propertyCard = screen.getByText('Luxury Apartment').closest('div')
        if (propertyCard) {
          fireEvent.click(propertyCard)
        }
      })

      await waitFor(() => {
        const payButton = screen.getByText(/Pay Now/)
        fireEvent.click(payButton)
      })

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Ad purchased successfully!')
      })
    })

    it('should show renewal success message when renewing', async () => {
      mockUseRouter.mockReturnValue({
        push: mockPush,
        back: mockBack,
        query: { slot: '1', renew: 'true' },
        isReady: true,
      })
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlotConfig,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })

      render(<PurchaseAdSlotPage />)

      await waitFor(() => {
        const propertyCard = screen.getByText('Luxury Apartment').closest('div')
        if (propertyCard) {
          fireEvent.click(propertyCard)
        }
      })

      await waitFor(() => {
        const payButton = screen.getByText(/Pay Now/)
        fireEvent.click(payButton)
      })

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Ad renewed successfully!')
      })
    })
  })

  describe('Navigation', () => {
    it('should have back button', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlotConfig,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })

      render(<PurchaseAdSlotPage />)

      await waitFor(() => {
        expect(screen.getByText('Back')).toBeInTheDocument()
      })
    })

    it('should navigate back on back button click', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlotConfig,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })

      render(<PurchaseAdSlotPage />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('Back'))
      })

      expect(mockBack).toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing slot parameter', () => {
      mockUseRouter.mockReturnValue({
        push: mockPush,
        back: mockBack,
        query: {},
        isReady: true,
      })

      render(<PurchaseAdSlotPage />)

      expect(screen.getByTestId('header')).toBeInTheDocument()
    })

    it('should handle null active listings response', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlotConfig,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => null,
        })

      render(<PurchaseAdSlotPage />)

      await waitFor(() => {
        expect(screen.getByText('Error Loading Page')).toBeInTheDocument()
      })
    })
  })

  describe('SEO', () => {
    it('should have correct SEO title for purchase', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlotConfig,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })

      render(<PurchaseAdSlotPage />)

      await waitFor(() => {
        expect(document.title).toContain('Purchase Ad Slot 1')
      })
    })

    it('should have correct SEO title for renewal', async () => {
      mockUseRouter.mockReturnValue({
        push: mockPush,
        back: mockBack,
        query: { slot: '1', renew: 'true' },
        isReady: true,
      })
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSlotConfig,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActiveListings,
        })

      render(<PurchaseAdSlotPage />)

      await waitFor(() => {
        expect(document.title).toContain('Renew Ad Slot 1')
      })
    })
  })
})
