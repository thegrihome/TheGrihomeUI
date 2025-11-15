import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { useRouter } from 'next/router'
import AgentProperties from '@/pages/agents/[id]/properties'
import { mockRouter, mockFetchSuccess } from '@/__tests__/utils/test-utils'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

const mockAgentData = {
  agent: {
    id: 'agent-1',
    name: 'Test Agent',
    username: 'testagent',
    email: 'agent@example.com',
    phone: '+911234567890',
    companyName: 'Test Realty',
    image: 'https://example.com/avatar.jpg',
  },
  properties: [
    {
      id: 'prop-1',
      propertyType: 'CONDO',
      listingType: 'SALE',
      sqFt: 1500,
      price: 5000000,
      bedrooms: 3,
      bathrooms: 2,
      thumbnailUrl: 'https://example.com/property1.jpg',
      imageUrls: ['https://example.com/property1.jpg'],
      listingStatus: 'ACTIVE',
      createdAt: '2024-01-01',
      location: {
        id: 'loc-1',
        city: 'Hyderabad',
        state: 'Telangana',
        locality: 'Kukatpally',
        zipcode: '500072',
      },
      project: {
        id: 'proj-1',
        name: 'Test Apartments',
      },
      propertyDetails: {
        title: 'Beautiful 3BHK Apartment',
      },
    },
  ],
  pagination: {
    total: 1,
    page: 1,
    limit: 12,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  },
}

describe('Agent Properties Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      ...mockRouter,
      query: { id: 'agent-1' },
      isReady: true,
    })

    mockFetchSuccess(mockAgentData)
  })

  it('renders agent properties page correctly', async () => {
    render(<AgentProperties />)

    await waitFor(() => {
      expect(screen.getByText(/properties by/i)).toBeInTheDocument()
    })
  })

  it('displays agent name', async () => {
    render(<AgentProperties />)

    await waitFor(() => {
      expect(screen.getByText('Test Agent')).toBeInTheDocument()
    })
  })

  it('displays properties', async () => {
    render(<AgentProperties />)

    await waitFor(() => {
      expect(screen.getByText('Test Apartments')).toBeInTheDocument()
    })
  })
})
