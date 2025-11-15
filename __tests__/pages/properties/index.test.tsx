import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
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

    // Mock properties list API response
    mockFetchSuccess({
      properties: mockProperties,
      pagination: {
        total: 2,
        page: 1,
        limit: 15,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    })
  })

  it('renders properties page correctly', async () => {
    render(<PropertiesPage />)

    await waitFor(() => {
      expect(screen.getByText('Properties')).toBeInTheDocument()
      expect(screen.getByText(/showing/i)).toBeInTheDocument()
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
      expect(screen.getByText(/1500 sq ft/i)).toBeInTheDocument()
    })
  })

  it('shows property prices', async () => {
    render(<PropertiesPage />)

    await waitFor(() => {
      const priceElements = screen.getAllByText(/₹/)
      expect(priceElements.length).toBeGreaterThan(0)
    })
  })
})
