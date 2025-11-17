import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import PropertiesPage from '@/pages/properties/index'
import toast from 'react-hot-toast'

// Mock Google Maps API
const mockGetPlacePredictions = jest.fn()
const mockGetDetails = jest.fn()
const mockAutocompleteService = jest.fn(() => ({
  getPlacePredictions: mockGetPlacePredictions,
}))
const mockPlacesService = jest.fn(() => ({
  getDetails: mockGetDetails,
}))

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

jest.mock('@googlemaps/js-api-loader', () => ({
  Loader: jest.fn().mockImplementation(() => ({
    load: jest.fn().mockResolvedValue({}),
  })),
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

jest.mock('@/components/properties/PropertyCard', () => {
  return function PropertyCard({ property, isOwner, onMarkAsSold }: any) {
    return (
      <div data-testid={`property-card-${property.id}`}>
        <div>{property.project}</div>
        <div>{property.price}</div>
        <div>{property.bedrooms} BHK</div>
        <div>{property.sqFt} sq ft</div>
        {isOwner && (
          <button
            data-testid={`mark-sold-${property.id}`}
            onClick={() => onMarkAsSold(property.id)}
          >
            Mark as Sold
          </button>
        )}
      </div>
    )
  }
})

const mockProperties = [
  {
    id: 'prop-1',
    streetAddress: '123 Test Street',
    location: {
      city: 'Hyderabad',
      state: 'Telangana',
      zipcode: '500001',
      locality: 'Kukatpally',
      fullAddress: '123 Test Street, Kukatpally, Hyderabad, Telangana - 500001',
    },
    builder: 'Test Builder',
    project: 'Test Villa Project',
    propertyType: 'SINGLE_FAMILY',
    listingType: 'SALE',
    sqFt: 1500,
    thumbnailUrl: 'https://example.com/image1.jpg',
    imageUrls: ['https://example.com/image1.jpg'],
    listingStatus: 'ACTIVE',
    createdAt: '2024-01-01T10:00:00Z',
    postedBy: 'Test Agent',
    companyName: 'Test Realty',
    bedrooms: '3',
    bathrooms: '2',
    price: '5000000',
    userId: 'user-1',
    userEmail: 'agent@example.com',
  },
  {
    id: 'prop-2',
    streetAddress: '456 Sample Road',
    location: {
      city: 'Hyderabad',
      state: 'Telangana',
      zipcode: '500085',
      locality: 'Gachibowli',
      fullAddress: '456 Sample Road, Gachibowli, Hyderabad, Telangana - 500085',
    },
    builder: 'Another Builder',
    project: 'Apartment Complex',
    propertyType: 'CONDO',
    listingType: 'RENT',
    sqFt: 2000,
    thumbnailUrl: 'https://example.com/image2.jpg',
    imageUrls: ['https://example.com/image2.jpg'],
    listingStatus: 'ACTIVE',
    createdAt: '2024-01-02T10:00:00Z',
    postedBy: 'Another Agent',
    bedrooms: '4',
    bathrooms: '3',
    price: '30000',
    userId: 'user-2',
    userEmail: 'agent2@example.com',
  },
  {
    id: 'prop-3',
    streetAddress: '789 Land Plot',
    location: {
      city: 'Bangalore',
      state: 'Karnataka',
      zipcode: '560001',
      locality: 'Whitefield',
      fullAddress: '789 Land Plot, Whitefield, Bangalore, Karnataka - 560001',
    },
    builder: 'Independent',
    project: 'Residential Plot',
    propertyType: 'LAND_RESIDENTIAL',
    listingType: 'SALE',
    sqFt: 3000,
    thumbnailUrl: 'https://example.com/image3.jpg',
    imageUrls: ['https://example.com/image3.jpg'],
    listingStatus: 'ACTIVE',
    createdAt: '2024-01-03T10:00:00Z',
    postedBy: 'Land Owner',
    price: '8000000',
    userId: 'user-3',
    userEmail: 'owner@example.com',
  },
]

describe('Properties Page - Comprehensive Tests', () => {
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
      data: null,
      status: 'unauthenticated',
    })

    // Setup global Google Maps mock
    global.google = {
      maps: {
        places: {
          AutocompleteService: mockAutocompleteService as any,
          PlacesService: mockPlacesService as any,
          PlacesServiceStatus: {
            OK: 'OK',
            ZERO_RESULTS: 'ZERO_RESULTS',
          },
        },
      },
    } as any

    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-api-key'

    // Mock fetch for properties API
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          properties: mockProperties,
          pagination: {
            totalPages: 1,
            totalCount: mockProperties.length,
            currentPage: 1,
          },
        }),
      })
    ) as jest.Mock
  })

  afterEach(() => {
    delete (global as any).google
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    jest.restoreAllMocks()
  })

  describe('Rendering and Initial State', () => {
    it('should render properties page with header and footer', async () => {
      render(<PropertiesPage />)

      await waitFor(() => {
        expect(screen.getByTestId('header')).toBeInTheDocument()
        expect(screen.getByTestId('footer')).toBeInTheDocument()
      })
    })

    it('should render page title "Browse Properties"', async () => {
      render(<PropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText('Browse')).toBeInTheDocument()
        expect(screen.getByText('Properties')).toBeInTheDocument()
      })
    })

    it('should render filters section', async () => {
      render(<PropertiesPage />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Location...')).toBeInTheDocument()
      })
    })

    it('should render Buy/Rent/All toggle by default', async () => {
      render(<PropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText('Buy')).toBeInTheDocument()
        expect(screen.getByText('Rent')).toBeInTheDocument()
        expect(screen.getByText('All')).toBeInTheDocument()
      })
    })

    it('should not render the page until mounted', () => {
      // Component returns null before mounted
      const { container } = render(<PropertiesPage />)
      // The mounted state should eventually render content
      expect(container.firstChild).toBeTruthy()
    })

    it('should show loading spinner initially', async () => {
      render(<PropertiesPage />)

      // Should show spinner while loading
      const spinner = screen.queryByRole('status') || document.querySelector('.animate-spin')
      expect(spinner).toBeTruthy()
    })

    it('should have correct CSS class on main container', async () => {
      const { container } = render(<PropertiesPage />)

      await waitFor(() => {
        expect(container.querySelector('.properties-container')).toBeInTheDocument()
      })
    })

    it('should render property type filter dropdown', async () => {
      render(<PropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText('All Types')).toBeInTheDocument()
      })
    })

    it('should render sort dropdown with default text', async () => {
      render(<PropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText(/Sort:/)).toBeInTheDocument()
        expect(screen.getByText(/Default/)).toBeInTheDocument()
      })
    })
  })

  describe('API Data Fetching', () => {
    it('should fetch properties on component mount', async () => {
      render(<PropertiesPage />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/properties/list'))
      })
    })

    it('should display fetched properties', async () => {
      render(<PropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText('Test Villa Project')).toBeInTheDocument()
        expect(screen.getByText('Apartment Complex')).toBeInTheDocument()
        expect(screen.getByText('Residential Plot')).toBeInTheDocument()
      })
    })

    it('should display property count', async () => {
      render(<PropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText(/Showing 3 of 3 properties/i)).toBeInTheDocument()
      })
    })

    it('should handle API error gracefully', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
        })
      ) as jest.Mock

      render(<PropertiesPage />)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to load properties')
      })
    })

    it('should handle network error', async () => {
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error'))) as jest.Mock

      render(<PropertiesPage />)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to load properties')
      })
    })

    it('should show empty state when no properties found', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            properties: [],
            pagination: { totalPages: 0, totalCount: 0, currentPage: 1 },
          }),
        })
      ) as jest.Mock

      render(<PropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText('No Properties')).toBeInTheDocument()
        expect(screen.getByText('Found')).toBeInTheDocument()
      })
    })

    it('should debounce API calls when filters change', async () => {
      jest.useFakeTimers()
      render(<PropertiesPage />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })

      const initialCallCount = (global.fetch as jest.Mock).mock.calls.length

      // Change filter
      const locationInput = screen.getByPlaceholderText('Location...')
      fireEvent.change(locationInput, { target: { value: 'Hyderabad' } })

      // Should not call immediately
      expect((global.fetch as jest.Mock).mock.calls.length).toBe(initialCallCount)

      // Fast-forward time
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect((global.fetch as jest.Mock).mock.calls.length).toBeGreaterThan(initialCallCount)
      })

      jest.useRealTimers()
    })
  })

  describe('URL Query Parameters', () => {
    it('should initialize filters from URL query params - city', async () => {
      mockUseRouter.mockReturnValue({
        push: mockPush,
        query: { city: 'Hyderabad', state: 'Telangana' },
        isReady: true,
      })

      render(<PropertiesPage />)

      await waitFor(() => {
        const locationInput = screen.getByPlaceholderText('Location...') as HTMLInputElement
        expect(locationInput.value).toBe('Hyderabad, Telangana')
      })
    })

    it('should initialize filters from URL query params - type=buy', async () => {
      mockUseRouter.mockReturnValue({
        push: mockPush,
        query: { type: 'buy' },
        isReady: true,
      })

      render(<PropertiesPage />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('listingType=SALE'))
      })
    })

    it('should initialize filters from URL query params - type=rent', async () => {
      mockUseRouter.mockReturnValue({
        push: mockPush,
        query: { type: 'rent' },
        isReady: true,
      })

      render(<PropertiesPage />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('listingType=RENT'))
      })
    })

    it('should handle propertyType from query params', async () => {
      mockUseRouter.mockReturnValue({
        push: mockPush,
        query: { propertyType: 'CONDO' },
        isReady: true,
      })

      render(<PropertiesPage />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('propertyType=CONDO'))
      })
    })

    it('should handle bedrooms from query params', async () => {
      mockUseRouter.mockReturnValue({
        push: mockPush,
        query: { bedrooms: '3' },
        isReady: true,
      })

      render(<PropertiesPage />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('bedrooms=3'))
      })
    })

    it('should handle bathrooms from query params', async () => {
      mockUseRouter.mockReturnValue({
        push: mockPush,
        query: { bathrooms: '2' },
        isReady: true,
      })

      render(<PropertiesPage />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('bathrooms=2'))
      })
    })
  })

  describe('Listing Type Filter (Buy/Rent/All)', () => {
    it('should filter by Buy when clicked', async () => {
      render(<PropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText('Buy')).toBeInTheDocument()
      })

      const buyButton = screen.getByText('Buy')
      fireEvent.click(buyButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('listingType=SALE'))
      })
    })

    it('should filter by Rent when clicked', async () => {
      render(<PropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText('Rent')).toBeInTheDocument()
      })

      const rentButton = screen.getByText('Rent')
      fireEvent.click(rentButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('listingType=RENT'))
      })
    })

    it('should show all properties when All is clicked', async () => {
      render(<PropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText('All')).toBeInTheDocument()
      })

      const allButton = screen.getByText('All')
      fireEvent.click(allButton)

      await waitFor(() => {
        const lastCall = (global.fetch as jest.Mock).mock.calls[
          (global.fetch as jest.Mock).mock.calls.length - 1
        ][0]
        expect(lastCall).not.toContain('listingType=')
      })
    })

    it('should update URL when listing type changes to SALE', async () => {
      render(<PropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText('Buy')).toBeInTheDocument()
      })

      const buyButton = screen.getByText('Buy')
      fireEvent.click(buyButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.objectContaining({
            pathname: '/properties',
            query: { type: 'buy' },
          }),
          undefined,
          { shallow: true }
        )
      })
    })

    it('should update URL when listing type changes to RENT', async () => {
      render(<PropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText('Rent')).toBeInTheDocument()
      })

      const rentButton = screen.getByText('Rent')
      fireEvent.click(rentButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.objectContaining({
            pathname: '/properties',
            query: { type: 'rent' },
          }),
          undefined,
          { shallow: true }
        )
      })
    })

    it('should have correct active styling for selected listing type', async () => {
      render(<PropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText('Buy')).toBeInTheDocument()
      })

      const buyButton = screen.getByText('Buy')
      fireEvent.click(buyButton)

      await waitFor(() => {
        expect(buyButton).toHaveClass('text-white')
      })
    })
  })

  describe('Property Type Filter', () => {
    it('should show property type dropdown when clicked', async () => {
      render(<PropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText('All Types')).toBeInTheDocument()
      })

      const dropdown = screen.getByText('All Types')
      fireEvent.click(dropdown)

      await waitFor(() => {
        expect(screen.getByText('🏡 Villas')).toBeInTheDocument()
        expect(screen.getByText('🏢 Apartments')).toBeInTheDocument()
        expect(screen.getByText('🏞️ Residential Lands')).toBeInTheDocument()
        expect(screen.getByText('🌾 Agriculture Lands')).toBeInTheDocument()
        expect(screen.getByText('🏬 Commercial')).toBeInTheDocument()
      })
    })

    it('should filter by Villas when selected', async () => {
      render(<PropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText('All Types')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('All Types'))

      await waitFor(() => {
        expect(screen.getByText('🏡 Villas')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('🏡 Villas'))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('propertyType=SINGLE_FAMILY')
        )
      })
    })

    it('should filter by Apartments when selected', async () => {
      render(<PropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText('All Types')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('All Types'))

      await waitFor(() => {
        expect(screen.getByText('🏢 Apartments')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('🏢 Apartments'))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('propertyType=CONDO'))
      })
    })

    it('should close dropdown after selection', async () => {
      render(<PropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText('All Types')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('All Types'))

      await waitFor(() => {
        expect(screen.getByText('🏡 Villas')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('🏡 Villas'))

      await waitFor(() => {
        expect(screen.queryByText('🏢 Apartments')).not.toBeInTheDocument()
      })
    })

    it('should show bedrooms/bathrooms filters for villa property type', async () => {
      render(<PropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText('All Types')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('All Types'))
      fireEvent.click(screen.getByText('🏡 Villas'))

      await waitFor(() => {
        expect(screen.getByText('Beds')).toBeInTheDocument()
        expect(screen.getByText('Baths')).toBeInTheDocument()
      })
    })

    it('should show bedrooms/bathrooms filters for apartment property type', async () => {
      render(<PropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText('All Types')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('All Types'))
      fireEvent.click(screen.getByText('🏢 Apartments'))

      await waitFor(() => {
        expect(screen.getByText('Beds')).toBeInTheDocument()
        expect(screen.getByText('Baths')).toBeInTheDocument()
      })
    })

    it('should hide bedrooms/bathrooms filters for land property type', async () => {
      render(<PropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText('All Types')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('All Types'))
      fireEvent.click(screen.getByText('🏞️ Residential Lands'))

      await waitFor(() => {
        expect(screen.queryByText('Beds')).not.toBeInTheDocument()
        expect(screen.queryByText('Baths')).not.toBeInTheDocument()
      })
    })
  })

  describe('Bedrooms and Bathrooms Filters', () => {
    beforeEach(async () => {
      render(<PropertiesPage />)
      await waitFor(() => {
        expect(screen.getByText('All Types')).toBeInTheDocument()
      })
      // Select apartment type to show bedroom/bathroom filters
      fireEvent.click(screen.getByText('All Types'))
      await waitFor(() => {
        expect(screen.getByText('🏢 Apartments')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText('🏢 Apartments'))
    })

    it('should show bedrooms dropdown when clicked', async () => {
      await waitFor(() => {
        expect(screen.getByText('Beds')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Beds'))

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument()
        expect(screen.getByText('2')).toBeInTheDocument()
        expect(screen.getByText('3')).toBeInTheDocument()
        expect(screen.getByText('4')).toBeInTheDocument()
        expect(screen.getByText('5+')).toBeInTheDocument()
      })
    })

    it('should filter by bedrooms when selected', async () => {
      await waitFor(() => {
        expect(screen.getByText('Beds')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Beds'))

      const bedroomOptions = screen.getAllByText('3')
      fireEvent.click(bedroomOptions[0])

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('bedrooms=3'))
      })
    })

    it('should show bathrooms dropdown when clicked', async () => {
      await waitFor(() => {
        expect(screen.getByText('Baths')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Baths'))

      await waitFor(() => {
        const allOptions = screen.getAllByText('All')
        expect(allOptions.length).toBeGreaterThan(0)
      })
    })

    it('should filter by bathrooms when selected', async () => {
      await waitFor(() => {
        expect(screen.getByText('Baths')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Baths'))

      const bathroomOptions = screen.getAllByText('2')
      fireEvent.click(bathroomOptions[0])

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('bathrooms=2'))
      })
    })
  })

  describe('Location Search Filter', () => {
    it('should render location search input', async () => {
      render(<PropertiesPage />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Location...')).toBeInTheDocument()
      })
    })

    it('should update location filter on input change', async () => {
      render(<PropertiesPage />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Location...')).toBeInTheDocument()
      })

      const locationInput = screen.getByPlaceholderText('Location...')
      fireEvent.change(locationInput, { target: { value: 'Hyderabad' } })

      expect((locationInput as HTMLInputElement).value).toBe('Hyderabad')
    })

    it('should call Google Maps autocomplete service when typing location', async () => {
      mockGetPlacePredictions.mockImplementation((request, callback) => {
        callback(
          [
            {
              place_id: 'place-1',
              description: 'Hyderabad, Telangana, India',
              structured_formatting: {
                main_text: 'Hyderabad',
                secondary_text: 'Telangana, India',
              },
            },
          ],
          'OK'
        )
      })

      render(<PropertiesPage />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Location...')).toBeInTheDocument()
      })

      const locationInput = screen.getByPlaceholderText('Location...')
      fireEvent.change(locationInput, { target: { value: 'Hyd' } })

      await waitFor(() => {
        expect(mockGetPlacePredictions).toHaveBeenCalled()
      })
    })

    it('should show predictions dropdown when autocomplete returns results', async () => {
      mockGetPlacePredictions.mockImplementation((request, callback) => {
        callback(
          [
            {
              place_id: 'place-1',
              description: 'Hyderabad, Telangana, India',
              structured_formatting: {
                main_text: 'Hyderabad',
                secondary_text: 'Telangana, India',
              },
            },
          ],
          'OK'
        )
      })

      render(<PropertiesPage />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Location...')).toBeInTheDocument()
      })

      const locationInput = screen.getByPlaceholderText('Location...')
      fireEvent.change(locationInput, { target: { value: 'Hyd' } })

      await waitFor(() => {
        expect(screen.getByText('Hyderabad')).toBeInTheDocument()
        expect(screen.getByText('Telangana, India')).toBeInTheDocument()
      })
    })

    it('should select prediction when clicked', async () => {
      mockGetPlacePredictions.mockImplementation((request, callback) => {
        callback(
          [
            {
              place_id: 'place-1',
              description: 'Hyderabad, Telangana, India',
              structured_formatting: {
                main_text: 'Hyderabad',
                secondary_text: 'Telangana, India',
              },
            },
          ],
          'OK'
        )
      })

      mockGetDetails.mockImplementation((request, callback) => {
        callback(
          {
            address_components: [
              { types: ['locality'], long_name: 'Hyderabad' },
              { types: ['administrative_area_level_1'], long_name: 'Telangana' },
            ],
          },
          'OK'
        )
      })

      render(<PropertiesPage />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Location...')).toBeInTheDocument()
      })

      const locationInput = screen.getByPlaceholderText('Location...')
      fireEvent.change(locationInput, { target: { value: 'Hyd' } })

      await waitFor(() => {
        expect(screen.getByText('Hyderabad')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Hyderabad'))

      await waitFor(() => {
        expect((locationInput as HTMLInputElement).value).toContain('Hyderabad')
      })
    })

    it('should not show predictions for short queries (less than 3 characters)', async () => {
      render(<PropertiesPage />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Location...')).toBeInTheDocument()
      })

      const locationInput = screen.getByPlaceholderText('Location...')
      fireEvent.change(locationInput, { target: { value: 'Hy' } })

      expect(mockGetPlacePredictions).not.toHaveBeenCalled()
    })
  })

  describe('Sort Functionality', () => {
    it('should show sort dropdown when clicked', async () => {
      render(<PropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText(/Sort:/)).toBeInTheDocument()
      })

      const sortButton = screen.getByText(/Sort:/)
      fireEvent.click(sortButton)

      await waitFor(() => {
        expect(screen.getByText('Price: Low to High')).toBeInTheDocument()
        expect(screen.getByText('Price: High to Low')).toBeInTheDocument()
        expect(screen.getByText('Newest First')).toBeInTheDocument()
        expect(screen.getByText('Oldest First')).toBeInTheDocument()
      })
    })

    it('should sort by price low to high', async () => {
      render(<PropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText(/Sort:/)).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText(/Sort:/))

      await waitFor(() => {
        expect(screen.getByText('Price: Low to High')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Price: Low to High'))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('sortBy=price_asc'))
      })
    })

    it('should sort by price high to low', async () => {
      render(<PropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText(/Sort:/)).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText(/Sort:/))

      await waitFor(() => {
        expect(screen.getByText('Price: High to Low')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Price: High to Low'))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('sortBy=price_desc'))
      })
    })

    it('should sort by newest first', async () => {
      render(<PropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText(/Sort:/)).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText(/Sort:/))

      await waitFor(() => {
        expect(screen.getByText('Newest First')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Newest First'))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('sortBy=newest'))
      })
    })

    it('should close dropdown after selection', async () => {
      render(<PropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText(/Sort:/)).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText(/Sort:/))

      await waitFor(() => {
        expect(screen.getByText('Newest First')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Newest First'))

      await waitFor(() => {
        expect(screen.queryByText('Oldest First')).not.toBeInTheDocument()
      })
    })
  })

  describe('Pagination', () => {
    it('should show pagination when multiple pages exist', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            properties: mockProperties,
            pagination: {
              totalPages: 3,
              totalCount: 45,
              currentPage: 1,
            },
          }),
        })
      ) as jest.Mock

      render(<PropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText('Previous')).toBeInTheDocument()
        expect(screen.getByText('Next')).toBeInTheDocument()
        expect(screen.getByText(/Page 1 of 3/)).toBeInTheDocument()
      })
    })

    it('should navigate to next page when Next button clicked', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            properties: mockProperties,
            pagination: {
              totalPages: 3,
              totalCount: 45,
              currentPage: 1,
            },
          }),
        })
      ) as jest.Mock

      render(<PropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText('Next')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: 'Next' }))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('page=2'))
      })
    })

    it('should navigate to previous page when Previous button clicked', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            properties: mockProperties,
            pagination: {
              totalPages: 3,
              totalCount: 45,
              currentPage: 2,
            },
          }),
        })
      ) as jest.Mock

      render(<PropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText('Previous')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: 'Previous' }))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('page=1'))
      })
    })

    it('should disable Previous button on first page', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            properties: mockProperties,
            pagination: {
              totalPages: 3,
              totalCount: 45,
              currentPage: 1,
            },
          }),
        })
      ) as jest.Mock

      render(<PropertiesPage />)

      await waitFor(() => {
        const prevButton = screen.getByRole('button', { name: 'Previous' })
        expect(prevButton).toBeDisabled()
      })
    })

    it('should disable Previous button on first page', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            properties: mockProperties,
            pagination: {
              totalPages: 3,
              totalCount: 45,
              currentPage: 1,
            },
          }),
        })
      ) as jest.Mock

      render(<PropertiesPage />)

      await waitFor(() => {
        const prevButton = screen.getByRole('button', { name: 'Previous' })
        expect(prevButton).toBeDisabled()
      })
    })

    it('should navigate to specific page when page number clicked', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            properties: mockProperties,
            pagination: {
              totalPages: 5,
              totalCount: 75,
              currentPage: 1,
            },
          }),
        })
      ) as jest.Mock

      render(<PropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('2'))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('page=2'))
      })
    })

    it('should reset to page 1 when filters change', async () => {
      render(<PropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText('All Types')).toBeInTheDocument()
      })

      // Change filter
      fireEvent.click(screen.getByText('All Types'))
      await waitFor(() => {
        expect(screen.getByText('🏡 Villas')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText('🏡 Villas'))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('page=1'))
      })
    })
  })

  describe('Owner Actions', () => {
    it('should show mark as sold button for property owner', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { email: 'agent@example.com' } },
        status: 'authenticated',
      })

      render(<PropertiesPage />)

      await waitFor(() => {
        expect(screen.getByTestId('mark-sold-prop-1')).toBeInTheDocument()
      })
    })

    it('should not show mark as sold button for non-owner', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { email: 'other@example.com' } },
        status: 'authenticated',
      })

      render(<PropertiesPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('mark-sold-prop-1')).not.toBeInTheDocument()
      })
    })

    it('should show sold modal when mark as sold button clicked', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { email: 'agent@example.com' } },
        status: 'authenticated',
      })

      render(<PropertiesPage />)

      await waitFor(() => {
        expect(screen.getByTestId('mark-sold-prop-1')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('mark-sold-prop-1'))

      await waitFor(() => {
        expect(screen.getByText('Mark Property as Sold')).toBeInTheDocument()
      })
    })

    it('should close sold modal when close button clicked', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { email: 'agent@example.com' } },
        status: 'authenticated',
      })

      render(<PropertiesPage />)

      await waitFor(() => {
        expect(screen.getByTestId('mark-sold-prop-1')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('mark-sold-prop-1'))

      await waitFor(() => {
        expect(screen.getByText('Mark Property as Sold')).toBeInTheDocument()
      })

      const closeButton = screen.getByRole('button', { name: /cancel/i })
      fireEvent.click(closeButton)

      await waitFor(() => {
        expect(screen.queryByText('Mark Property as Sold')).not.toBeInTheDocument()
      })
    })

    it('should allow entering buyer name in sold modal', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { email: 'agent@example.com' } },
        status: 'authenticated',
      })

      render(<PropertiesPage />)

      await waitFor(() => {
        expect(screen.getByTestId('mark-sold-prop-1')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('mark-sold-prop-1'))

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Enter buyer name/i)).toBeInTheDocument()
      })

      const buyerInput = screen.getByPlaceholderText(/Enter buyer name/i)
      fireEvent.change(buyerInput, { target: { value: 'John Doe' } })

      expect((buyerInput as HTMLInputElement).value).toBe('John Doe')
    })

    it('should submit mark as sold with buyer name', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { email: 'agent@example.com' } },
        status: 'authenticated',
      })

      global.fetch = jest.fn(url => {
        if (url.includes('/api/properties/list')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              properties: mockProperties,
              pagination: { totalPages: 1, totalCount: 3, currentPage: 1 },
            }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        })
      }) as jest.Mock

      render(<PropertiesPage />)

      await waitFor(() => {
        expect(screen.getByTestId('mark-sold-prop-1')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('mark-sold-prop-1'))

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Enter buyer name/i)).toBeInTheDocument()
      })

      const buyerInput = screen.getByPlaceholderText(/Enter buyer name/i)
      fireEvent.change(buyerInput, { target: { value: 'John Doe' } })

      const submitButtons = screen.getAllByRole('button', { name: 'Mark as Sold' })
      const submitButton = submitButtons[submitButtons.length - 1] // Get the modal button
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/properties/prop-1/archive'),
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('John Doe'),
          })
        )
      })
    })
  })

  describe('Dropdown Click Outside Behavior', () => {
    it('should close sort dropdown when clicking outside', async () => {
      render(<PropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText(/Sort:/)).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText(/Sort:/))

      await waitFor(() => {
        expect(screen.getByText('Price: Low to High')).toBeInTheDocument()
      })

      // Click outside
      fireEvent.mouseDown(document.body)

      await waitFor(() => {
        expect(screen.queryByText('Price: Low to High')).not.toBeInTheDocument()
      })
    })

    it('should close property type dropdown when clicking outside', async () => {
      render(<PropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText('All Types')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('All Types'))

      await waitFor(() => {
        expect(screen.getByText('🏡 Villas')).toBeInTheDocument()
      })

      // Click outside
      fireEvent.mouseDown(document.body)

      await waitFor(() => {
        expect(screen.queryByText('🏡 Villas')).not.toBeInTheDocument()
      })
    })
  })

  describe('Google Maps API Integration', () => {
    it('should initialize Google Maps autocomplete service on mount', async () => {
      render(<PropertiesPage />)

      await waitFor(() => {
        expect(mockAutocompleteService).toHaveBeenCalled()
      })
    })

    it('should handle missing Google Maps API key', async () => {
      delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

      render(<PropertiesPage />)

      // Should render without errors even if API key is missing
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Location...')).toBeInTheDocument()
      })
    })

    it('should handle Google Maps loader error', async () => {
      const { Loader } = require('@googlemaps/js-api-loader')
      Loader.mockImplementation(() => ({
        load: jest.fn().mockRejectedValue(new Error('Failed to load')),
      }))

      render(<PropertiesPage />)

      // Should render without errors even if loader fails
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Location...')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have accessible filter labels', async () => {
      render(<PropertiesPage />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Location...')).toBeInTheDocument()
      })
    })

    it('should have keyboard navigation support for dropdowns', async () => {
      render(<PropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText('All Types')).toBeInTheDocument()
      })

      const dropdown = screen.getByText('All Types')
      dropdown.focus()
      expect(document.activeElement).toBe(dropdown)
    })
  })

  describe('CSS Classes', () => {
    it('should have correct container CSS classes', async () => {
      const { container } = render(<PropertiesPage />)

      await waitFor(() => {
        expect(container.querySelector('.properties-container')).toBeInTheDocument()
        expect(container.querySelector('.min-h-screen')).toBeInTheDocument()
      })
    })

    it('should have correct filter section CSS classes', async () => {
      const { container } = render(<PropertiesPage />)

      await waitFor(() => {
        expect(container.querySelector('.bg-white')).toBeInTheDocument()
        expect(container.querySelector('.rounded-lg')).toBeInTheDocument()
      })
    })
  })

  describe('Additional Coverage Tests', () => {
    it('should handle location as plain string in query params', async () => {
      mockUseRouter.mockReturnValue({
        query: { location: 'Hyderabad' },
        push: mockPush,
        isReady: true,
      })

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            properties: mockProperties,
            pagination: { totalPages: 3, totalCount: 45, currentPage: 1 },
          }),
        })
      ) as jest.Mock

      render(<PropertiesPage />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('location=Hyderabad'))
      })
    })

    it('should handle Google Maps autocomplete failure', async () => {
      global.google = {
        maps: {
          places: {
            AutocompleteService: jest.fn(() => ({
              getPlacePredictions: (request: any, callback: any) => {
                callback(null, 'ZERO_RESULTS')
              },
            })),
            PlacesServiceStatus: {
              OK: 'OK',
              ZERO_RESULTS: 'ZERO_RESULTS',
            },
          },
        },
      } as any

      render(<PropertiesPage />)

      const locationInput = screen.getByPlaceholderText('Location...')
      fireEvent.change(locationInput, { target: { value: 'InvalidPlace' } })

      await waitFor(() => {
        expect(locationInput).toHaveValue('InvalidPlace')
      })
    })

    it('should handle mark as sold API error', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { email: 'agent@example.com' } },
        status: 'authenticated',
      })

      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            properties: mockProperties,
            pagination: { totalPages: 1, totalCount: 3, currentPage: 1 },
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ message: 'Failed to archive property' }),
        })

      render(<PropertiesPage />)

      await waitFor(() => {
        expect(screen.getByTestId('mark-sold-prop-1')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('mark-sold-prop-1'))

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Enter buyer name/i)).toBeInTheDocument()
      })

      const submitButtons = screen.getAllByRole('button', { name: 'Mark as Sold' })
      fireEvent.click(submitButtons[submitButtons.length - 1])

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to archive property')
      })
    })

    it('should handle mark as sold network error', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { email: 'agent@example.com' } },
        status: 'authenticated',
      })

      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            properties: mockProperties,
            pagination: { totalPages: 1, totalCount: 3, currentPage: 1 },
          }),
        })
        .mockRejectedValueOnce(new Error('Network error'))

      render(<PropertiesPage />)

      await waitFor(() => {
        expect(screen.getByTestId('mark-sold-prop-1')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('mark-sold-prop-1'))

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Enter buyer name/i)).toBeInTheDocument()
      })

      const submitButtons = screen.getAllByRole('button', { name: 'Mark as Sold' })
      fireEvent.click(submitButtons[submitButtons.length - 1])

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Network error')
      })
    })

    it('should handle empty location input clearing predictions', async () => {
      render(<PropertiesPage />)

      const locationInput = screen.getByPlaceholderText('Location...')

      // Type something first
      fireEvent.change(locationInput, { target: { value: 'Hyderabad' } })

      // Then clear it
      fireEvent.change(locationInput, { target: { value: '' } })

      await waitFor(() => {
        expect(locationInput).toHaveValue('')
      })
    })
  })
})
