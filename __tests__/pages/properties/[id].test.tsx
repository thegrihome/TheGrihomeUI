import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import PropertyDetailPage from '@/pages/properties/[id]'
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
    loading: jest.fn(),
    dismiss: jest.fn(),
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
  default: ({ src, alt, fill }: any) => <img src={src} alt={alt} data-fill={fill} />,
}))

jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: () => {
    return function PropertyMap() {
      return <div data-testid="property-map">Map</div>
    }
  },
}))

const mockProperty = {
  id: 'property-1',
  streetAddress: '123 Test Street',
  location: {
    city: 'Hyderabad',
    state: 'Telangana',
    zipcode: '500001',
    locality: 'Gachibowli',
    fullAddress: '123 Test Street, Gachibowli, Hyderabad, Telangana - 500001',
    latitude: 17.385,
    longitude: 78.4867,
    formattedAddress: '123 Test Street, Gachibowli, Hyderabad, Telangana - 500001',
  },
  builder: 'Test Builder',
  project: 'Luxury Villa',
  propertyType: 'SINGLE_FAMILY',
  sqFt: 1500,
  thumbnailUrl: 'https://example.com/thumb.jpg',
  imageUrls: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
  listingStatus: 'ACTIVE',
  createdAt: '2024-01-01T10:00:00Z',
  postedBy: 'Test Agent',
  companyName: 'Test Realty',
  bedrooms: '3',
  bathrooms: '2',
  price: '5000000',
  size: '1500',
  sizeUnit: 'SQ_FT',
  plotSize: '2000',
  plotSizeUnit: 'SQ_FT',
  description: 'Beautiful property with modern amenities',
  userId: 'owner-1',
  userEmail: 'owner@example.com',
  userPhone: '+911234567890',
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
  ],
}

describe('Property Detail Page - Comprehensive Tests', () => {
  const mockPush = jest.fn()
  const mockBack = jest.fn()
  const mockUseSession = useSession as jest.Mock
  const mockUseRouter = useRouter as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: mockBack,
      query: { id: 'property-1' },
    })
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ property: mockProperty }),
      })
    ) as jest.Mock
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Rendering and Initial State', () => {
    it('should render page with header and footer', async () => {
      render(<PropertyDetailPage />)

      await waitFor(() => {
        expect(screen.getByTestId('header')).toBeInTheDocument()
        expect(screen.getByTestId('footer')).toBeInTheDocument()
      })
    })

    it('should show loading spinner initially', () => {
      render(<PropertyDetailPage />)

      const spinner = document.querySelector('.property-detail-spinner')
      expect(spinner).toBeInTheDocument()
    })

    it('should render back button', async () => {
      render(<PropertyDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Back')).toBeInTheDocument()
      })
    })

    it('should render property title', async () => {
      render(<PropertyDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Luxury Villa')).toBeInTheDocument()
      })
    })

    it('should render property price', async () => {
      render(<PropertyDetailPage />)

      await waitFor(() => {
        expect(screen.getByText(/₹50,00,000/)).toBeInTheDocument()
      })
    })

    it('should render property location', async () => {
      render(<PropertyDetailPage />)

      await waitFor(() => {
        expect(
          screen.getByText(/123 Test Street, Gachibowli, Hyderabad, Telangana - 500001/)
        ).toBeInTheDocument()
      })
    })

    it('should render property description', async () => {
      render(<PropertyDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Beautiful property with modern amenities')).toBeInTheDocument()
      })
    })

    it('should render property features', async () => {
      render(<PropertyDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument()
        expect(screen.getByText('Bedrooms')).toBeInTheDocument()
        expect(screen.getByText('2')).toBeInTheDocument()
        expect(screen.getByText('Bathrooms')).toBeInTheDocument()
      })
    })

    it('should render listing status badge', async () => {
      render(<PropertyDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('ACTIVE')).toBeInTheDocument()
      })
    })
  })

  describe('API Data Fetching', () => {
    it('should fetch property on mount', async () => {
      render(<PropertyDetailPage />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/properties/property-1')
      })
    })

    it('should handle API error', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
        })
      ) as jest.Mock

      render(<PropertyDetailPage />)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to load property details')
      })
    })

    it('should redirect to properties page on error', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
        })
      ) as jest.Mock

      render(<PropertyDetailPage />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/properties')
      })
    })

    it('should show not found message when property is null', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({ property: null }),
        })
      ) as jest.Mock

      render(<PropertyDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Property Not Found')).toBeInTheDocument()
      })
    })
  })

  describe('Image Gallery', () => {
    it('should render main image', async () => {
      render(<PropertyDetailPage />)

      await waitFor(() => {
        const images = screen.getAllByRole('img')
        expect(
          images.some(img => img.getAttribute('src') === 'https://example.com/thumb.jpg')
        ).toBe(true)
      })
    })

    it('should show navigation arrows when multiple images', async () => {
      render(<PropertyDetailPage />)

      await waitFor(() => {
        const prevButton = screen.getByLabelText('Previous image')
        const nextButton = screen.getByLabelText('Next image')
        expect(prevButton).toBeInTheDocument()
        expect(nextButton).toBeInTheDocument()
      })
    })

    it('should navigate to next image when next arrow clicked', async () => {
      render(<PropertyDetailPage />)

      await waitFor(() => {
        const nextButton = screen.getByLabelText('Next image')
        expect(nextButton).toBeInTheDocument()
      })

      const nextButton = screen.getByLabelText('Next image')
      fireEvent.click(nextButton)

      await waitFor(() => {
        const images = screen.getAllByRole('img')
        expect(
          images.some(img => img.getAttribute('src') === 'https://example.com/image1.jpg')
        ).toBe(true)
      })
    })

    it('should navigate to previous image when prev arrow clicked', async () => {
      render(<PropertyDetailPage />)

      await waitFor(() => {
        const prevButton = screen.getByLabelText('Previous image')
        expect(prevButton).toBeInTheDocument()
      })

      const prevButton = screen.getByLabelText('Previous image')
      fireEvent.click(prevButton)

      // Should wrap to last image
      await waitFor(() => {
        const images = screen.getAllByRole('img')
        expect(
          images.some(img => img.getAttribute('src') === 'https://example.com/image2.jpg')
        ).toBe(true)
      })
    })
  })

  describe('Owner Actions', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            email: 'owner@example.com',
            isEmailVerified: true,
            isMobileVerified: true,
          },
        },
        status: 'authenticated',
      })
    })

    it('should show Edit Listing button for owner', async () => {
      render(<PropertyDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Edit Listing')).toBeInTheDocument()
      })
    })

    it('should show Mark as Sold button for owner', async () => {
      render(<PropertyDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Mark as Sold')).toBeInTheDocument()
      })
    })

    it('should navigate to edit page when Edit button clicked', async () => {
      render(<PropertyDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Edit Listing')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Edit Listing'))

      expect(mockPush).toHaveBeenCalledWith('/properties/edit/property-1')
    })

    it('should show sold modal when Mark as Sold clicked', async () => {
      render(<PropertyDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Mark as Sold')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: 'Mark as Sold' }))

      await waitFor(() => {
        expect(screen.getByText('Mark Property as Sold')).toBeInTheDocument()
      })
    })

    it('should show interested buyers section for owner', async () => {
      render(<PropertyDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Interested Buyers (1)')).toBeInTheDocument()
      })
    })

    it('should display buyer information in sidebar', async () => {
      render(<PropertyDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('John Buyer')).toBeInTheDocument()
        expect(screen.getByText('john@example.com')).toBeInTheDocument()
        expect(screen.getByText('+911234567890')).toBeInTheDocument()
      })
    })

    it('should show no buyers message when no interests', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            property: { ...mockProperty, interests: [] },
          }),
        })
      ) as jest.Mock

      render(<PropertyDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('No one has expressed interest yet.')).toBeInTheDocument()
      })
    })
  })

  describe('Non-Owner Actions', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            email: 'buyer@example.com',
            isEmailVerified: true,
            isMobileVerified: true,
          },
        },
        status: 'authenticated',
      })
    })

    it('should show Send Interest button for verified non-owner', async () => {
      render(<PropertyDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Send Interest')).toBeInTheDocument()
      })
    })

    it('should not show Edit Listing button for non-owner', async () => {
      render(<PropertyDetailPage />)

      await waitFor(() => {
        expect(screen.queryByText('Edit Listing')).not.toBeInTheDocument()
      })
    })

    it('should not show Mark as Sold button for non-owner', async () => {
      render(<PropertyDetailPage />)

      await waitFor(() => {
        expect(screen.queryByText('Mark as Sold')).not.toBeInTheDocument()
      })
    })

    it('should not show interested buyers section for non-owner', async () => {
      render(<PropertyDetailPage />)

      await waitFor(() => {
        expect(screen.queryByText('Interested Buyers')).not.toBeInTheDocument()
      })
    })

    it('should send interest when Send Interest button clicked', async () => {
      global.fetch = jest.fn(url => {
        if (url.includes('/api/properties/')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ property: mockProperty }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        })
      }) as jest.Mock

      render(<PropertyDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Send Interest')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Send Interest'))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/interests/express',
          expect.objectContaining({
            method: 'POST',
          })
        )
      })
    })

    it('should show success message after sending interest', async () => {
      global.fetch = jest.fn(url => {
        if (url.includes('/api/properties/')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ property: mockProperty }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        })
      }) as jest.Mock

      render(<PropertyDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Send Interest')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Send Interest'))

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Interest sent to property owner!')
      })
    })

    it('should change button text after interest expressed', async () => {
      global.fetch = jest.fn(url => {
        if (url.includes('/api/properties/')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ property: mockProperty }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        })
      }) as jest.Mock

      render(<PropertyDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Send Interest')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Send Interest'))

      await waitFor(() => {
        expect(screen.getByText('✓ Interest Expressed')).toBeInTheDocument()
      })
    })

    it('should show verify message for unverified users', async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            email: 'buyer@example.com',
            isEmailVerified: false,
            isMobileVerified: false,
          },
        },
        status: 'authenticated',
      })

      render(<PropertyDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Verify to Send Interest')).toBeInTheDocument()
      })
    })

    it('should navigate to userinfo when verify button clicked', async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            email: 'buyer@example.com',
            isEmailVerified: false,
            isMobileVerified: false,
          },
        },
        status: 'authenticated',
      })

      render(<PropertyDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Verify to Send Interest')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Verify to Send Interest'))

      expect(mockPush).toHaveBeenCalledWith('/auth/userinfo')
    })
  })

  describe('Unauthenticated User', () => {
    it('should show Sign In button for unauthenticated users', async () => {
      render(<PropertyDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Sign In to Send Interest')).toBeInTheDocument()
      })
    })

    it('should navigate to signin when Sign In button clicked', async () => {
      render(<PropertyDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Sign In to Send Interest')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Sign In to Send Interest'))

      expect(mockPush).toHaveBeenCalledWith('/auth/signin')
    })
  })

  describe('Mark as Sold Modal', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            email: 'owner@example.com',
            isEmailVerified: true,
          },
        },
        status: 'authenticated',
      })
    })

    it('should render buyer name input', async () => {
      render(<PropertyDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Mark as Sold')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: 'Mark as Sold' }))

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter buyer name...')).toBeInTheDocument()
      })
    })

    it('should update buyer name input', async () => {
      render(<PropertyDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Mark as Sold')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: 'Mark as Sold' }))

      await waitFor(() => {
        const input = screen.getByPlaceholderText('Enter buyer name...') as HTMLInputElement
        fireEvent.change(input, { target: { value: 'Bob Buyer' } })
        expect(input.value).toBe('Bob Buyer')
      })
    })

    it('should close modal when Cancel clicked', async () => {
      render(<PropertyDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Mark as Sold')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: 'Mark as Sold' }))

      await waitFor(() => {
        expect(screen.getByText('Mark Property as Sold')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

      await waitFor(() => {
        expect(screen.queryByText('Mark Property as Sold')).not.toBeInTheDocument()
      })
    })

    it('should submit mark as sold', async () => {
      global.fetch = jest.fn(url => {
        if (url.includes('/api/properties/property-1')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ property: mockProperty }),
          })
        }
        if (url.includes('/archive')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({}),
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        })
      }) as jest.Mock

      render(<PropertyDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Mark as Sold')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: 'Mark as Sold' }))

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter buyer name...')).toBeInTheDocument()
      })

      const confirmButton = screen.getAllByText('Mark as Sold')[1]
      fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/properties/property-1/archive'),
          expect.objectContaining({
            method: 'POST',
          })
        )
      })
    })

    it('should show success message on mark as sold', async () => {
      global.fetch = jest.fn(url => {
        if (url.includes('/api/properties/property-1')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ property: mockProperty }),
          })
        }
        if (url.includes('/archive')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({}),
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        })
      }) as jest.Mock

      render(<PropertyDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Mark as Sold')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: 'Mark as Sold' }))

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter buyer name...')).toBeInTheDocument()
      })

      const confirmButton = screen.getAllByText('Mark as Sold')[1]
      fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Property marked as sold!')
      })
    })

    it('should redirect to my-properties after marking as sold', async () => {
      global.fetch = jest.fn(url => {
        if (url.includes('/api/properties/property-1')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ property: mockProperty }),
          })
        }
        if (url.includes('/archive')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({}),
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        })
      }) as jest.Mock

      render(<PropertyDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Mark as Sold')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: 'Mark as Sold' }))

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter buyer name...')).toBeInTheDocument()
      })

      const confirmButton = screen.getAllByText('Mark as Sold')[1]
      fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/my-properties')
      })
    })

    it('should handle mark as sold error', async () => {
      global.fetch = jest.fn(url => {
        if (url.includes('/api/properties/property-1')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ property: mockProperty }),
          })
        }
        if (url.includes('/archive')) {
          return Promise.resolve({
            ok: false,
            json: async () => ({ message: 'Failed' }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        })
      }) as jest.Mock

      render(<PropertyDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Mark as Sold')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: 'Mark as Sold' }))

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter buyer name...')).toBeInTheDocument()
      })

      const confirmButton = screen.getAllByText('Mark as Sold')[1]
      fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled()
      })
    })
  })

  describe('Location Map', () => {
    it('should render map when coordinates available', async () => {
      render(<PropertyDetailPage />)

      await waitFor(() => {
        expect(screen.getByTestId('property-map')).toBeInTheDocument()
      })
    })

    it('should not render map when coordinates missing', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            property: {
              ...mockProperty,
              location: { ...mockProperty.location, latitude: undefined, longitude: undefined },
            },
          }),
        })
      ) as jest.Mock

      render(<PropertyDetailPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('property-map')).not.toBeInTheDocument()
      })
    })
  })

  describe('Back Button', () => {
    it('should navigate back when back button clicked', async () => {
      render(<PropertyDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Back')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Back'))

      expect(mockBack).toHaveBeenCalled()
    })
  })

  describe('Sold Property Display', () => {
    it('should show sold information for sold properties', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            property: {
              ...mockProperty,
              listingStatus: 'SOLD',
              soldTo: 'Bob Buyer',
              soldDate: '2024-01-20T10:00:00Z',
            },
          }),
        })
      ) as jest.Mock

      render(<PropertyDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Property Sold')).toBeInTheDocument()
        expect(screen.getByText(/Sold to: Bob Buyer/)).toBeInTheDocument()
      })
    })

    it('should show External Buyer when sold to is not specified', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            property: {
              ...mockProperty,
              listingStatus: 'SOLD',
              soldTo: null,
              soldDate: '2024-01-20T10:00:00Z',
            },
          }),
        })
      ) as jest.Mock

      render(<PropertyDetailPage />)

      await waitFor(() => {
        expect(screen.getByText(/External Buyer/)).toBeInTheDocument()
      })
    })
  })

  describe('CSS Classes', () => {
    it('should have correct container class', async () => {
      const { container } = render(<PropertyDetailPage />)

      await waitFor(() => {
        expect(container.querySelector('.property-detail-container')).toBeInTheDocument()
      })
    })

    it('should have correct main class', async () => {
      const { container } = render(<PropertyDetailPage />)

      await waitFor(() => {
        expect(container.querySelector('.property-detail-main')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have accessible navigation buttons', async () => {
      render(<PropertyDetailPage />)

      await waitFor(() => {
        const prevButton = screen.getByLabelText('Previous image')
        const nextButton = screen.getByLabelText('Next image')
        expect(prevButton).toBeInTheDocument()
        expect(nextButton).toBeInTheDocument()
      })
    })

    it('should have focusable back button', async () => {
      render(<PropertyDetailPage />)

      await waitFor(() => {
        const backButton = screen.getByText('Back')
        backButton.focus()
        expect(document.activeElement).toBe(backButton)
      })
    })
  })

  describe('Date Formatting', () => {
    it('should format posted date correctly', async () => {
      render(<PropertyDetailPage />)

      await waitFor(() => {
        expect(screen.getByText(/Posted on/)).toBeInTheDocument()
      })
    })
  })

  describe('Builder Information', () => {
    it('should show builder info when not Independent', async () => {
      render(<PropertyDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Builder Information')).toBeInTheDocument()
        expect(screen.getByText(/Builder: Test Builder/)).toBeInTheDocument()
      })
    })

    it('should not show builder section for Independent properties', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            property: {
              ...mockProperty,
              builder: 'Independent',
              companyName: null,
            },
          }),
        })
      ) as jest.Mock

      render(<PropertyDetailPage />)

      await waitFor(() => {
        expect(screen.queryByText('Builder Information')).not.toBeInTheDocument()
      })
    })
  })
})
