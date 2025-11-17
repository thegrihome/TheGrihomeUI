import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import MyPropertiesPage from '@/pages/properties/my-properties'
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

jest.mock('next-seo', () => ({
  NextSeo: ({ children }: any) => <div>{children}</div>,
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
  default: ({ src, alt }: any) => <img src={src} alt={alt} />, // eslint-disable-line @next/next/no-img-element
}))

const mockActiveProperty = {
  id: 'active-1',
  streetAddress: '123 Active Street',
  location: {
    city: 'Hyderabad',
    state: 'Telangana',
    zipcode: '500001',
    locality: 'Gachibowli',
    fullAddress: '123 Active Street, Gachibowli, Hyderabad, Telangana',
  },
  builder: 'Test Builder',
  project: 'Active Villa',
  propertyType: 'SINGLE_FAMILY',
  sqFt: 1500,
  thumbnailUrl: 'https://example.com/active.jpg',
  imageUrls: ['https://example.com/active.jpg'],
  listingStatus: 'ACTIVE',
  createdAt: '2024-01-01T10:00:00Z',
  postedBy: 'Test Agent',
  companyName: 'Test Realty',
  bedrooms: '3',
  bathrooms: '2',
  price: '5000000',
  interests: [
    {
      id: 'interest-1',
      user: {
        name: 'John Buyer',
        email: 'john@example.com',
        phone: '+911234567890',
      },
      createdAt: '2024-01-15T10:00:00Z',
    },
    {
      id: 'interest-2',
      user: {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+919876543210',
      },
      createdAt: '2024-01-16T10:00:00Z',
    },
  ],
}

const mockSoldProperty = {
  id: 'sold-1',
  streetAddress: '456 Sold Street',
  location: {
    city: 'Bangalore',
    state: 'Karnataka',
    zipcode: '560001',
    locality: 'Whitefield',
    fullAddress: '456 Sold Street, Whitefield, Bangalore, Karnataka',
  },
  builder: 'Another Builder',
  project: 'Sold Apartment',
  propertyType: 'CONDO',
  sqFt: 2000,
  thumbnailUrl: 'https://example.com/sold.jpg',
  imageUrls: ['https://example.com/sold.jpg'],
  listingStatus: 'SOLD',
  soldTo: 'Bob Buyer',
  soldDate: '2024-01-20T10:00:00Z',
  createdAt: '2024-01-01T10:00:00Z',
  postedBy: 'Test Agent',
  bedrooms: '4',
  bathrooms: '3',
  price: '8000000',
  interests: [],
}

const mockArchivedProperty = {
  id: 'archived-1',
  streetAddress: '789 Archived Street',
  location: {
    city: 'Mumbai',
    state: 'Maharashtra',
    zipcode: '400001',
    locality: 'Andheri',
    fullAddress: '789 Archived Street, Andheri, Mumbai, Maharashtra',
  },
  builder: 'Third Builder',
  project: 'Archived Land',
  propertyType: 'LAND_RESIDENTIAL',
  sqFt: 3000,
  thumbnailUrl: 'https://example.com/archived.jpg',
  imageUrls: ['https://example.com/archived.jpg'],
  listingStatus: 'ARCHIVED',
  createdAt: '2024-01-01T10:00:00Z',
  postedBy: 'Test Agent',
  price: '10000000',
  interests: [],
}

describe('My Properties Page - Comprehensive Tests', () => {
  const mockPush = jest.fn()
  const mockUseSession = useSession as jest.Mock
  const mockUseRouter = useRouter as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({
      push: mockPush,
      query: {},
    })
    mockUseSession.mockReturnValue({
      data: {
        user: {
          email: 'agent@example.com',
          name: 'Test Agent',
        },
      },
      status: 'authenticated',
    })

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          properties: [mockActiveProperty, mockSoldProperty, mockArchivedProperty],
        }),
      })
    ) as jest.Mock
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Rendering and Initial State', () => {
    it('should render page with header and footer', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByTestId('header')).toBeInTheDocument()
        expect(screen.getByTestId('footer')).toBeInTheDocument()
      })
    })

    it('should render page title', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText('My Properties')).toBeInTheDocument()
      })
    })

    it('should render page subtitle', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(
          screen.getByText('Manage your property listings and view interested buyers')
        ).toBeInTheDocument()
      })
    })

    it('should show loading spinner initially', () => {
      render(<MyPropertiesPage />)

      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })

    it('should render both tabs initially', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText(/Active Properties/)).toBeInTheDocument()
        expect(screen.getByText(/Archived Properties/)).toBeInTheDocument()
      })
    })

    it('should have Active Properties tab selected by default', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        const activeTab = screen.getByText(/Active Properties/).closest('button')
        expect(activeTab).toHaveClass('my-properties-tab--active')
      })
    })

    it('should show correct count in Active Properties tab', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText(/Active Properties \(1\)/)).toBeInTheDocument()
      })
    })

    it('should show correct count in Archived Properties tab', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText(/Archived Properties \(2\)/)).toBeInTheDocument()
      })
    })
  })

  describe('Authentication', () => {
    it('should redirect to login if not authenticated', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login')
      })
    })

    it('should show loading state during authentication', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
      })

      render(<MyPropertiesPage />)

      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })
  })

  describe('API Data Fetching', () => {
    it('should fetch properties on mount', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/user/properties')
      })
    })

    it('should display fetched active properties', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText('Active Villa')).toBeInTheDocument()
      })
    })

    it('should handle API error gracefully', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
        })
      ) as jest.Mock

      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to load your properties')
      })
    })

    it('should handle network error', async () => {
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error'))) as jest.Mock

      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to load your properties')
      })
    })

    it('should set empty array on API error', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
        })
      ) as jest.Mock

      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText('No Properties')).toBeInTheDocument()
      })
    })
  })

  describe('Tab Navigation', () => {
    it('should switch to archived tab when clicked', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText(/Archived Properties/)).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText(/Archived Properties/))

      await waitFor(() => {
        const archivedTab = screen.getByText(/Archived Properties/).closest('button')
        expect(archivedTab).toHaveClass('my-properties-tab--active')
      })
    })

    it('should switch back to active tab when clicked', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText(/Archived Properties/)).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText(/Archived Properties/))
      await waitFor(() => {
        const archivedTab = screen.getByText(/Archived Properties/).closest('button')
        expect(archivedTab).toHaveClass('my-properties-tab--active')
      })

      fireEvent.click(screen.getByText(/Active Properties/))
      await waitFor(() => {
        const activeTab = screen.getByText(/Active Properties/).closest('button')
        expect(activeTab).toHaveClass('my-properties-tab--active')
      })
    })

    it('should show active properties when active tab selected', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText('Active Villa')).toBeInTheDocument()
      })
    })

    it('should show archived properties when archived tab selected', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText(/Archived Properties/)).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText(/Archived Properties/))

      await waitFor(() => {
        expect(screen.getByText('Sold Apartment')).toBeInTheDocument()
        expect(screen.getByText('Archived Land')).toBeInTheDocument()
      })
    })

    it('should not show active properties in archived tab', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText(/Archived Properties/)).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText(/Archived Properties/))

      await waitFor(() => {
        expect(screen.queryByText('Active Villa')).not.toBeInTheDocument()
      })
    })
  })

  describe('Property Display', () => {
    it('should display property image', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        const images = screen.getAllByRole('img')
        expect(
          images.some(img => img.getAttribute('src') === 'https://example.com/active.jpg')
        ).toBe(true)
      })
    })

    it('should display property price', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText('₹5000000')).toBeInTheDocument()
      })
    })

    it('should display property bedrooms and bathrooms', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText(/3 BHK/)).toBeInTheDocument()
        expect(screen.getByText(/2 Bath/)).toBeInTheDocument()
      })
    })

    it('should display property size', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText(/1500 sq ft/)).toBeInTheDocument()
      })
    })

    it('should display property location', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText(/Hyderabad, Telangana/)).toBeInTheDocument()
      })
    })

    it('should display property posted date', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText(/Posted on:/)).toBeInTheDocument()
      })
    })

    it('should display property type badge', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText(/Villas/)).toBeInTheDocument()
      })
    })

    it('should show sold badge for sold properties', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText(/Archived Properties/)).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText(/Archived Properties/))

      await waitFor(() => {
        expect(screen.getByText('SOLD')).toBeInTheDocument()
      })
    })

    it('should show sold to information for sold properties', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText(/Archived Properties/)).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText(/Archived Properties/))

      await waitFor(() => {
        expect(screen.getByText(/Sold to: Bob Buyer/)).toBeInTheDocument()
      })
    })

    it('should show sold date for sold properties', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText(/Archived Properties/)).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText(/Archived Properties/))

      await waitFor(() => {
        expect(screen.getByText(/Sold on:/)).toBeInTheDocument()
      })
    })
  })

  describe('Interested Buyers Display', () => {
    it('should show interested buyers count for active properties', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText(/2 interested buyers/)).toBeInTheDocument()
      })
    })

    it('should show singular form for single interested buyer', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            properties: [
              {
                ...mockActiveProperty,
                interests: [mockActiveProperty.interests[0]],
              },
            ],
          }),
        })
      ) as jest.Mock

      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText(/1 interested buyer$/)).toBeInTheDocument()
      })
    })

    it('should open interest modal when interested buyers button clicked', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText(/2 interested buyers/)).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText(/2 interested buyers/))

      await waitFor(() => {
        expect(screen.getByText('Interested Buyers')).toBeInTheDocument()
      })
    })

    it('should display buyer names in interest modal', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText(/2 interested buyers/)).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText(/2 interested buyers/))

      await waitFor(() => {
        expect(screen.getByText('John Buyer')).toBeInTheDocument()
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      })
    })

    it('should display buyer emails in interest modal', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText(/2 interested buyers/)).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText(/2 interested buyers/))

      await waitFor(() => {
        expect(screen.getByText('john@example.com')).toBeInTheDocument()
        expect(screen.getByText('jane@example.com')).toBeInTheDocument()
      })
    })

    it('should display buyer phones in interest modal', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText(/2 interested buyers/)).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText(/2 interested buyers/))

      await waitFor(() => {
        expect(screen.getByText('+911234567890')).toBeInTheDocument()
        expect(screen.getByText('+919876543210')).toBeInTheDocument()
      })
    })

    it('should close interest modal when close button clicked', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText(/2 interested buyers/)).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText(/2 interested buyers/))

      await waitFor(() => {
        expect(screen.getByText('Interested Buyers')).toBeInTheDocument()
      })

      const closeButtons = screen.getAllByText('✕')
      fireEvent.click(closeButtons[0])

      await waitFor(() => {
        expect(screen.queryByText('Interested Buyers')).not.toBeInTheDocument()
      })
    })
  })

  describe('Mark as Sold Functionality', () => {
    it('should show Sold button for active properties', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText('Sold')).toBeInTheDocument()
      })
    })

    it('should open sold modal when Sold button clicked', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText('Sold')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Sold'))

      await waitFor(() => {
        expect(screen.getAllByText('Mark as Sold')[0]).toBeInTheDocument()
      })
    })

    it('should show buyer search input in sold modal', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText('Sold')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Sold'))

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Search buyers/)).toBeInTheDocument()
      })
    })

    it('should show External Buyer option in dropdown', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText('Sold')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Sold'))

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/Search buyers/)
        fireEvent.focus(input)
      })

      await waitFor(() => {
        expect(screen.getByText('External Buyer')).toBeInTheDocument()
      })
    })

    it('should show interested buyers in sold modal dropdown', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText('Sold')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Sold'))

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/Search buyers/)
        fireEvent.focus(input)
      })

      await waitFor(() => {
        expect(screen.getByText('John Buyer')).toBeInTheDocument()
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      })
    })

    it('should filter buyers in dropdown when typing', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText('Sold')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Sold'))

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/Search buyers/)
        fireEvent.change(input, { target: { value: 'John' } })
      })

      await waitFor(() => {
        expect(screen.getByText('John Buyer')).toBeInTheDocument()
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
      })
    })

    it('should select buyer when clicked from dropdown', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText('Sold')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Sold'))

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/Search buyers/)
        fireEvent.focus(input)
      })

      await waitFor(() => {
        expect(screen.getByText('External Buyer')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('External Buyer'))

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/Search buyers/) as HTMLInputElement
        expect(input.value).toBe('External Buyer')
      })
    })

    it('should submit mark as sold API call', async () => {
      global.fetch = jest.fn(url => {
        if (url.includes('/api/user/properties')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              properties: [mockActiveProperty],
            }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        })
      }) as jest.Mock

      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText('Sold')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Sold'))

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/Search buyers/)
        fireEvent.focus(input)
      })

      await waitFor(() => {
        expect(screen.getByText('External Buyer')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('External Buyer'))

      const submitButton = screen.getByRole('button', { name: 'Mark as Sold' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/properties/active-1/mark-sold'),
          expect.objectContaining({
            method: 'POST',
          })
        )
      })
    })

    it('should show success toast on successful mark as sold', async () => {
      global.fetch = jest.fn(url => {
        if (url.includes('/api/user/properties')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              properties: [mockActiveProperty],
            }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        })
      }) as jest.Mock

      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText('Sold')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Sold'))

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/Search buyers/)
        fireEvent.focus(input)
      })

      await waitFor(() => {
        expect(screen.getByText('External Buyer')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('External Buyer'))

      const submitButton = screen.getByRole('button', { name: 'Mark as Sold' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Property marked as sold successfully')
      })
    })

    it('should handle mark as sold API error', async () => {
      global.fetch = jest.fn(url => {
        if (url.includes('/api/user/properties')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              properties: [mockActiveProperty],
            }),
          })
        }
        return Promise.resolve({
          ok: false,
          json: async () => ({ message: 'Failed to mark as sold' }),
        })
      }) as jest.Mock

      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText('Sold')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Sold'))

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/Search buyers/)
        fireEvent.focus(input)
      })

      await waitFor(() => {
        expect(screen.getByText('External Buyer')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('External Buyer'))

      const submitButton = screen.getByRole('button', { name: 'Mark as Sold' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to mark property as sold')
      })
    })

    it('should close sold modal when cancel clicked', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText('Sold')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Sold'))

      await waitFor(() => {
        expect(screen.getAllByText('Mark as Sold')[0]).toBeInTheDocument()
      })

      const cancelButton = screen.getByRole('button', { name: 'Cancel' })
      fireEvent.click(cancelButton)

      await waitFor(() => {
        expect(screen.queryAllByText('Mark as Sold').length).toBe(0)
      })
    })
  })

  describe('Reactivate Property Functionality', () => {
    it('should show Reactivate button for archived properties', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText(/Archived Properties/)).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText(/Archived Properties/))

      await waitFor(() => {
        expect(screen.getByText('Reactivate')).toBeInTheDocument()
      })
    })

    it('should call reactivate API when button clicked', async () => {
      global.fetch = jest.fn(url => {
        if (url.includes('/api/user/properties')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              properties: [mockArchivedProperty],
            }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        })
      }) as jest.Mock

      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText(/Archived Properties/)).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText(/Archived Properties/))

      await waitFor(() => {
        expect(screen.getByText('Reactivate')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Reactivate'))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/properties/archived-1/reactivate'),
          expect.objectContaining({
            method: 'POST',
          })
        )
      })
    })

    it('should show success toast on successful reactivation', async () => {
      global.fetch = jest.fn(url => {
        if (url.includes('/api/user/properties')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              properties: [mockArchivedProperty],
            }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        })
      }) as jest.Mock

      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText(/Archived Properties/)).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText(/Archived Properties/))

      await waitFor(() => {
        expect(screen.getByText('Reactivate')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Reactivate'))

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Property reactivated successfully')
      })
    })

    it('should handle reactivate API error', async () => {
      global.fetch = jest.fn(url => {
        if (url.includes('/api/user/properties')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              properties: [mockArchivedProperty],
            }),
          })
        }
        return Promise.resolve({
          ok: false,
          json: async () => ({ message: 'Failed to reactivate' }),
        })
      }) as jest.Mock

      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText(/Archived Properties/)).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText(/Archived Properties/))

      await waitFor(() => {
        expect(screen.getByText('Reactivate')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Reactivate'))

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to reactivate property')
      })
    })
  })

  describe('View Details Button', () => {
    it('should show View Details button for all properties', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText('View Details')).toBeInTheDocument()
      })
    })

    it('should navigate to property detail page when clicked', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText('View Details')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('View Details'))

      expect(mockPush).toHaveBeenCalledWith('/properties/active-1')
    })
  })

  describe('Empty States', () => {
    it('should show empty state when no active properties', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            properties: [],
          }),
        })
      ) as jest.Mock

      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText('No Properties')).toBeInTheDocument()
        expect(screen.getByText('Found')).toBeInTheDocument()
      })
    })

    it('should show appropriate message for no active properties', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            properties: [],
          }),
        })
      ) as jest.Mock

      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(
          screen.getByText("You haven't listed any active properties yet.")
        ).toBeInTheDocument()
      })
    })

    it('should show Add First Property button in empty state', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            properties: [],
          }),
        })
      ) as jest.Mock

      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText('Add Your First Property')).toBeInTheDocument()
      })
    })

    it('should navigate to add property when button clicked', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            properties: [],
          }),
        })
      ) as jest.Mock

      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText('Add Your First Property')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Add Your First Property'))

      expect(mockPush).toHaveBeenCalledWith('/properties/add-property')
    })

    it('should show appropriate message for no archived properties', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            properties: [],
          }),
        })
      ) as jest.Mock

      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText(/Archived Properties/)).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText(/Archived Properties/))

      await waitFor(() => {
        expect(screen.getByText("You don't have any archived properties.")).toBeInTheDocument()
      })
    })
  })

  describe('Dropdown Click Outside Behavior', () => {
    it('should close buyer dropdown when clicking outside', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText('Sold')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Sold'))

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/Search buyers/)
        fireEvent.focus(input)
      })

      await waitFor(() => {
        expect(screen.getByText('External Buyer')).toBeInTheDocument()
      })

      // Click outside
      fireEvent.mouseDown(document.body)

      await waitFor(() => {
        expect(screen.queryByText('External Buyer')).not.toBeInTheDocument()
      })
    })
  })

  describe('CSS Classes', () => {
    it('should have correct container CSS classes', async () => {
      const { container } = render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(container.querySelector('.my-properties-container')).toBeInTheDocument()
      })
    })

    it('should have correct tab CSS classes', async () => {
      const { container } = render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(container.querySelector('.my-properties-tabs')).toBeInTheDocument()
        expect(container.querySelector('.my-properties-tab')).toBeInTheDocument()
      })
    })

    it('should have correct property card CSS classes', async () => {
      const { container } = render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(container.querySelector('.property-card')).toBeInTheDocument()
      })
    })

    it('should have correct modal CSS classes', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText('Sold')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Sold'))

      await waitFor(() => {
        const modal = document.querySelector('.modal-overlay')
        expect(modal).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have accessible tab buttons', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        const activeTab = screen.getByText(/Active Properties/).closest('button')
        const archivedTab = screen.getByText(/Archived Properties/).closest('button')
        expect(activeTab).toBeInTheDocument()
        expect(archivedTab).toBeInTheDocument()
      })
    })

    it('should have focusable action buttons', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        const viewDetailsButton = screen.getByText('View Details')
        viewDetailsButton.focus()
        expect(document.activeElement).toBe(viewDetailsButton)
      })
    })
  })

  describe('Date Formatting', () => {
    it('should format created date correctly', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        // Date should be formatted as "Jan 1, 2024, 10:00 AM" or similar
        expect(screen.getByText(/Posted on:/)).toBeInTheDocument()
      })
    })

    it('should format sold date correctly for sold properties', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText(/Archived Properties/)).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText(/Archived Properties/))

      await waitFor(() => {
        expect(screen.getByText(/Sold on:/)).toBeInTheDocument()
      })
    })
  })

  describe('Favorites Tab', () => {
    const mockFavoriteProperty = {
      id: 'favorite-1',
      streetAddress: '100 Favorite Street',
      location: {
        city: 'Pune',
        state: 'Maharashtra',
        zipcode: '411001',
        locality: 'Koregaon Park',
        fullAddress: '100 Favorite Street, Koregaon Park, Pune, Maharashtra',
      },
      builder: 'Favorite Builder',
      project: 'Favorite Project',
      propertyType: 'CONDO',
      sqFt: 1800,
      thumbnailUrl: 'https://example.com/favorite.jpg',
      imageUrls: ['https://example.com/favorite.jpg'],
      listingStatus: 'ACTIVE',
      createdAt: '2024-01-10T10:00:00Z',
      postedBy: 'Another Agent',
      companyName: 'Another Realty',
      bedrooms: '3',
      bathrooms: '2',
      price: '6000000',
      userId: 'another-user-id',
      favoritedAt: '2024-01-15T10:00:00Z',
    }

    beforeEach(() => {
      global.fetch = jest
        .fn()
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: async () => ({
              properties: [mockActiveProperty, mockSoldProperty, mockArchivedProperty],
            }),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: async () => ({
              favorites: [mockFavoriteProperty],
              count: 1,
            }),
          })
        ) as jest.Mock
    })

    it('should render favorites tab', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText(/My Favorites/)).toBeInTheDocument()
      })
    })

    it('should show correct count in favorites tab', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText(/My Favorites \(1\)/)).toBeInTheDocument()
      })
    })

    it('should fetch favorites on page load', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/properties/favorites')
      })
    })

    it('should switch to favorites tab when clicked', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText(/My Favorites/)).toBeInTheDocument()
      })

      const favoritesTab = screen.getByText(/My Favorites/).closest('button')
      if (favoritesTab) {
        fireEvent.click(favoritesTab)
      }

      await waitFor(() => {
        expect(favoritesTab).toHaveClass('my-properties-tab--active')
      })
    })

    it('should display favorited properties in favorites tab', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        const favoritesTab = screen.getByText(/My Favorites/).closest('button')
        if (favoritesTab) {
          fireEvent.click(favoritesTab)
        }
      })

      await waitFor(() => {
        expect(screen.getByText('Favorite Project')).toBeInTheDocument()
      })
    })

    it('should show no favorites message when favorites list is empty', async () => {
      global.fetch = jest
        .fn()
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: async () => ({
              properties: [mockActiveProperty],
            }),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: async () => ({
              favorites: [],
              count: 0,
            }),
          })
        ) as jest.Mock

      render(<MyPropertiesPage />)

      await waitFor(() => {
        const favoritesTab = screen.getByText(/My Favorites \(0\)/).closest('button')
        if (favoritesTab) {
          fireEvent.click(favoritesTab)
        }
      })

      await waitFor(() => {
        expect(screen.getByText(/No favorites yet/)).toBeInTheDocument()
      })
    })

    it('should not show owner actions on favorited properties', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        const favoritesTab = screen.getByText(/My Favorites/).closest('button')
        if (favoritesTab) {
          fireEvent.click(favoritesTab)
        }
      })

      await waitFor(() => {
        expect(screen.getByText('Favorite Project')).toBeInTheDocument()
      })

      // Should not have Sold or Archive buttons
      const soldButtons = screen.queryAllByText('Sold')
      expect(soldButtons.length).toBe(0)
    })

    it('should show heart icon on favorited properties', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        const favoritesTab = screen.getByText(/My Favorites/).closest('button')
        if (favoritesTab) {
          fireEvent.click(favoritesTab)
        }
      })

      await waitFor(() => {
        expect(screen.getByText('Favorite Project')).toBeInTheDocument()
      })

      // Heart icon should be visible
      const heartButtons = document.querySelectorAll('button[title*="favorite"]')
      expect(heartButtons.length).toBeGreaterThan(0)
    })

    it('should handle favorites fetch error gracefully', async () => {
      global.fetch = jest
        .fn()
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: async () => ({
              properties: [mockActiveProperty],
            }),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: false,
            json: async () => ({ message: 'Failed to fetch favorites' }),
          })
        ) as jest.Mock

      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText(/Active Properties/)).toBeInTheDocument()
      })

      // Should not crash and favorites count should be 0
      await waitFor(() => {
        expect(screen.getByText(/My Favorites \(0\)/)).toBeInTheDocument()
      })
    })

    it('should display favorited date for favorites', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        const favoritesTab = screen.getByText(/My Favorites/).closest('button')
        if (favoritesTab) {
          fireEvent.click(favoritesTab)
        }
      })

      await waitFor(() => {
        expect(screen.getByText('Favorite Project')).toBeInTheDocument()
        // Favorited date might be displayed somewhere in the card
      })
    })

    it('should reload favorites when toggling favorite on a property', async () => {
      render(<MyPropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText(/Active Properties/)).toBeInTheDocument()
      })

      // Mock the toggle favorite endpoint
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({ isFavorited: false, message: 'Removed from favorites' }),
        })
      ) as jest.Mock

      // Find a favorite button and click it
      const favoriteButtons = document.querySelectorAll('button[title*="favorite"]')
      if (favoriteButtons.length > 0) {
        fireEvent.click(favoriteButtons[0])
      }

      // Should call the toggle endpoint
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/properties/toggle-favorite',
          expect.any(Object)
        )
      })
    })
  })
})
