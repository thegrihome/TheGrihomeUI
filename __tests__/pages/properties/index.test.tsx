import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import PropertiesPage from '@/pages/properties/index'
import { mockRouter, mockFetchSuccess } from '@/__tests__/utils/test-utils'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}))

const mockProperties = [
  {
    id: '1',
    streetAddress: '123 Test Street',
    location: {
      city: 'Hyderabad',
      state: 'Telangana',
      zipcode: '500001',
      locality: 'Kukatpally',
      fullAddress: '123 Test Street, Kukatpally, Hyderabad, Telangana - 500001',
    },
    builder: 'Test Builder',
    project: 'Test Project',
    propertyType: 'CONDO',
    listingType: 'SALE',
    sqFt: 1500,
    thumbnailUrl: 'https://example.com/image.jpg',
    imageUrls: ['https://example.com/image.jpg'],
    listingStatus: 'ACTIVE',
    createdAt: '2024-01-01',
    postedBy: 'Test Agent',
    companyName: 'Test Realty',
    bedrooms: '3',
    bathrooms: '2',
    price: '5000000',
    userId: 'user-1',
    userEmail: 'agent@example.com',
  },
  {
    id: '2',
    streetAddress: '456 Sample Road',
    location: {
      city: 'Hyderabad',
      state: 'Telangana',
      zipcode: '500085',
      locality: 'Gachibowli',
      fullAddress: '456 Sample Road, Gachibowli, Hyderabad, Telangana - 500085',
    },
    builder: 'Another Builder',
    project: 'Another Project',
    propertyType: 'SINGLE_FAMILY',
    listingType: 'RENT',
    sqFt: 2000,
    thumbnailUrl: 'https://example.com/image2.jpg',
    imageUrls: ['https://example.com/image2.jpg'],
    listingStatus: 'ACTIVE',
    createdAt: '2024-01-02',
    postedBy: 'Another Agent',
    bedrooms: '4',
    bathrooms: '3',
    price: '30000',
    userId: 'user-2',
    userEmail: 'agent2@example.com',
  },
]

describe('Properties Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      ...mockRouter,
      query: {},
      isReady: true,
    })
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    mockFetchSuccess({
      properties: mockProperties,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalCount: 2,
        hasNextPage: false,
        hasPrevPage: false,
      },
    })
  })

  it('renders properties page correctly', async () => {
    render(<PropertiesPage />)

    await waitFor(() => {
      expect(screen.getByText(/properties/i)).toBeInTheDocument()
    })
  })

  it('displays list of properties', async () => {
    render(<PropertiesPage />)

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument()
      expect(screen.getByText('Another Project')).toBeInTheDocument()
    })
  })

  it('shows property details (bedrooms, bathrooms, sqft)', async () => {
    render(<PropertiesPage />)

    await waitFor(() => {
      expect(screen.getByText(/3 BHK/i)).toBeInTheDocument()
      expect(screen.getByText(/1500 sqft/i)).toBeInTheDocument()
    })
  })

  it('shows property prices', async () => {
    render(<PropertiesPage />)

    await waitFor(() => {
      expect(screen.getByText(/₹/)).toBeInTheDocument()
    })
  })

  it('filters properties by type', async () => {
    render(<PropertiesPage />)

    await waitFor(() => {
      const propertyTypeFilter = screen.getByText(/apartments/i)
      fireEvent.click(propertyTypeFilter)
    })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('propertyType=CONDO'))
    })
  })

  it('filters properties by listing type (Sale/Rent)', async () => {
    render(<PropertiesPage />)

    await waitFor(() => {
      const saleFilter = screen.getByText(/for sale/i)
      fireEvent.click(saleFilter)
    })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('listingType=SALE'))
    })
  })

  it('filters properties by bedrooms', async () => {
    render(<PropertiesPage />)

    await waitFor(() => {
      const bedroomsDropdown = screen.getByText(/bedrooms/i)
      fireEvent.click(bedroomsDropdown)
    })

    await waitFor(() => {
      const threeBedroomsOption = screen.getByText('3')
      fireEvent.click(threeBedroomsOption)
    })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('bedrooms=3'))
    })
  })

  it('searches properties by location', async () => {
    render(<PropertiesPage />)

    await waitFor(() => {
      const locationInput = screen.getByPlaceholderText(/search by location/i)
      fireEvent.change(locationInput, { target: { value: 'Kukatpally' } })
    })

    await waitFor(
      () => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('location=Kukatpally'))
      },
      { timeout: 1000 }
    )
  })

  it('sorts properties by price (low to high)', async () => {
    render(<PropertiesPage />)

    await waitFor(() => {
      const sortDropdown = screen.getByText(/sort by/i)
      fireEvent.click(sortDropdown)
    })

    await waitFor(() => {
      const priceLowToHigh = screen.getByText(/price: low to high/i)
      fireEvent.click(priceLowToHigh)
    })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('sortBy=price_asc'))
    })
  })

  it('sorts properties by newest first', async () => {
    render(<PropertiesPage />)

    await waitFor(() => {
      const sortDropdown = screen.getByText(/sort by/i)
      fireEvent.click(sortDropdown)
    })

    await waitFor(() => {
      const newestFirst = screen.getByText(/newest first/i)
      fireEvent.click(newestFirst)
    })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('sortBy=newest'))
    })
  })

  it('clears all filters', async () => {
    render(<PropertiesPage />)

    await waitFor(() => {
      const clearFiltersButton = screen.getByText(/clear filters/i)
      fireEvent.click(clearFiltersButton)
    })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.not.stringContaining('propertyType'))
    })
  })

  it('shows pagination when there are multiple pages', async () => {
    mockFetchSuccess({
      properties: mockProperties,
      pagination: {
        currentPage: 1,
        totalPages: 3,
        totalCount: 45,
        hasNextPage: true,
        hasPrevPage: false,
      },
    })

    render(<PropertiesPage />)

    await waitFor(() => {
      expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument()
    })
  })

  it('navigates to next page', async () => {
    mockFetchSuccess({
      properties: mockProperties,
      pagination: {
        currentPage: 1,
        totalPages: 3,
        totalCount: 45,
        hasNextPage: true,
        hasPrevPage: false,
      },
    })

    render(<PropertiesPage />)

    await waitFor(() => {
      const nextButton = screen.getByText(/next/i)
      fireEvent.click(nextButton)
    })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('page=2'))
    })
  })

  it('links to individual property detail pages', async () => {
    render(<PropertiesPage />)

    await waitFor(() => {
      const propertyLink = screen.getByText('Test Project').closest('a')
      expect(propertyLink).toHaveAttribute('href', '/properties/1')
    })
  })

  it('shows empty state when no properties found', async () => {
    mockFetchSuccess({
      properties: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalCount: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
    })

    render(<PropertiesPage />)

    await waitFor(() => {
      expect(screen.getByText(/no properties found/i)).toBeInTheDocument()
    })
  })

  it('initializes filters from URL query parameters', async () => {
    ;(useRouter as jest.Mock).mockReturnValue({
      ...mockRouter,
      query: {
        city: 'Hyderabad',
        locality: 'Kukatpally',
        propertyType: 'CONDO',
        type: 'buy',
      },
      isReady: true,
    })

    render(<PropertiesPage />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('location=Kukatpally%2C+Hyderabad')
      )
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('propertyType=CONDO'))
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('listingType=SALE'))
    })
  })
})
