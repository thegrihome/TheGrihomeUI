import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { useRouter } from 'next/router'
import AgentProperties from '@/pages/agents/[id]/properties'
import { mockRouter, mockFetchSuccess, mockFetchError } from '@/__tests__/utils/test-utils'

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
    {
      id: 'prop-2',
      propertyType: 'SINGLE_FAMILY',
      listingType: 'RENT',
      sqFt: 2000,
      price: 30000,
      bedrooms: 4,
      bathrooms: 3,
      thumbnailUrl: 'https://example.com/property2.jpg',
      imageUrls: ['https://example.com/property2.jpg'],
      listingStatus: 'ACTIVE',
      createdAt: '2024-01-02',
      location: {
        id: 'loc-2',
        city: 'Hyderabad',
        state: 'Telangana',
        locality: 'Gachibowli',
        zipcode: '500085',
      },
      project: null,
      propertyDetails: {
        title: 'Spacious Villa',
      },
    },
  ],
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 2,
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
    })
  })

  it('renders agent properties page correctly', async () => {
    mockFetchSuccess(mockAgentData)

    render(<AgentProperties />)

    await waitFor(() => {
      expect(screen.getByText('Test Agent')).toBeInTheDocument()
    })
  })

  it('displays agent information', async () => {
    mockFetchSuccess(mockAgentData)

    render(<AgentProperties />)

    await waitFor(() => {
      expect(screen.getByText('Test Agent')).toBeInTheDocument()
      expect(screen.getByText('Test Realty')).toBeInTheDocument()
      expect(screen.getByText('agent@example.com')).toBeInTheDocument()
      expect(screen.getByText('+911234567890')).toBeInTheDocument()
    })
  })

  it('shows agent avatar', async () => {
    mockFetchSuccess(mockAgentData)

    render(<AgentProperties />)

    await waitFor(() => {
      const avatar = screen.getByAltText('Test Agent')
      expect(avatar).toBeInTheDocument()
      expect(avatar).toHaveAttribute('src', expect.stringContaining('avatar.jpg'))
    })
  })

  it('displays properties count', async () => {
    mockFetchSuccess(mockAgentData)

    render(<AgentProperties />)

    await waitFor(() => {
      expect(screen.getByText(/properties listed \(2\)/i)).toBeInTheDocument()
    })
  })

  it('displays all properties in grid', async () => {
    mockFetchSuccess(mockAgentData)

    render(<AgentProperties />)

    await waitFor(() => {
      expect(screen.getByText('Test Apartments')).toBeInTheDocument()
      expect(screen.getByText('Spacious Villa')).toBeInTheDocument()
    })
  })

  it('shows property details (bedrooms, bathrooms, sqft)', async () => {
    mockFetchSuccess(mockAgentData)

    render(<AgentProperties />)

    await waitFor(() => {
      expect(screen.getByText(/3 BHK/i)).toBeInTheDocument()
      expect(screen.getByText(/4 BHK/i)).toBeInTheDocument()
      expect(screen.getByText(/1500 sqft/i)).toBeInTheDocument()
      expect(screen.getByText(/2000 sqft/i)).toBeInTheDocument()
    })
  })

  it('displays property prices', async () => {
    mockFetchSuccess(mockAgentData)

    render(<AgentProperties />)

    await waitFor(() => {
      expect(screen.getByText(/₹5\.00 Cr/i)).toBeInTheDocument()
      expect(screen.getByText(/₹30,000/i)).toBeInTheDocument()
    })
  })

  it('shows listing status badges', async () => {
    mockFetchSuccess(mockAgentData)

    render(<AgentProperties />)

    await waitFor(() => {
      const statusBadges = screen.getAllByText('ACTIVE')
      expect(statusBadges).toHaveLength(2)
    })
  })

  it('shows listing type badges (SALE/RENT)', async () => {
    mockFetchSuccess(mockAgentData)

    render(<AgentProperties />)

    await waitFor(() => {
      expect(screen.getByText('SALE')).toBeInTheDocument()
      expect(screen.getByText('RENT')).toBeInTheDocument()
    })
  })

  it('links to individual property pages', async () => {
    mockFetchSuccess(mockAgentData)

    render(<AgentProperties />)

    await waitFor(() => {
      const propertyLink = screen.getByText('Test Apartments').closest('a')
      expect(propertyLink).toHaveAttribute('href', '/properties/prop-1')
    })
  })

  it('shows breadcrumb navigation', async () => {
    mockFetchSuccess(mockAgentData)

    render(<AgentProperties />)

    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('Agents')).toBeInTheDocument()
      expect(screen.getByText('Test Agent')).toBeInTheDocument()
    })
  })

  it('breadcrumb links navigate correctly', async () => {
    mockFetchSuccess(mockAgentData)

    render(<AgentProperties />)

    await waitFor(() => {
      const homeLink = screen.getByText('Home').closest('a')
      const agentsLink = screen.getByText('Agents').closest('a')

      expect(homeLink).toHaveAttribute('href', '/')
      expect(agentsLink).toHaveAttribute('href', '/agents')
    })
  })

  it('shows empty state when agent has no properties', async () => {
    mockFetchSuccess({
      ...mockAgentData,
      properties: [],
      pagination: {
        ...mockAgentData.pagination,
        totalCount: 0,
      },
    })

    render(<AgentProperties />)

    await waitFor(() => {
      expect(screen.getByText(/no properties found/i)).toBeInTheDocument()
      expect(screen.getByText(/this agent hasn't listed any properties yet/i)).toBeInTheDocument()
    })
  })

  it('shows pagination when there are multiple pages', async () => {
    mockFetchSuccess({
      ...mockAgentData,
      pagination: {
        currentPage: 1,
        totalPages: 3,
        totalCount: 30,
        hasNextPage: true,
        hasPreviousPage: false,
      },
    })

    render(<AgentProperties />)

    await waitFor(() => {
      expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
    })
  })

  it('shows error message when agent not found', async () => {
    mockFetchError('Agent not found', 404)

    render(<AgentProperties />)

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
      expect(screen.getByText(/agent not found/i)).toBeInTheDocument()
    })
  })

  it('has link back to agents page on error', async () => {
    mockFetchError('Agent not found', 404)

    render(<AgentProperties />)

    await waitFor(() => {
      const backLink = screen.getByText(/back to agents/i)
      expect(backLink).toBeInTheDocument()
      expect(backLink.closest('a')).toHaveAttribute('href', '/agents')
    })
  })

  it('shows loading state initially', () => {
    mockFetchSuccess(mockAgentData)

    render(<AgentProperties />)

    expect(screen.getByText(/loading agent properties/i)).toBeInTheDocument()
  })
})
