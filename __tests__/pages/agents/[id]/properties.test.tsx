import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/router'
import AgentProperties from '@/pages/agents/[id]/properties'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
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
  return function PropertyCard({ property }: any) {
    return <div data-testid="property-card">{property.streetAddress}</div>
  }
})

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}))

const mockAgent = {
  id: '1',
  name: 'John Doe',
  username: 'johndoe',
  email: 'john@example.com',
  phone: '+911234567890',
  companyName: 'ABC Realty',
  image: 'https://example.com/john.jpg',
}

const mockProperties = [
  {
    id: 'prop1',
    streetAddress: '123 Main St',
    location: {
      city: 'Mumbai',
      state: 'Maharashtra',
      zipcode: '400001',
      locality: 'Bandra',
      fullAddress: '123 Main St, Bandra, Mumbai',
    },
    builder: 'Builder1',
    project: 'Project1',
    propertyType: 'APARTMENT',
    listingType: 'SALE',
    sqFt: 1200,
    thumbnailUrl: 'https://example.com/prop1.jpg',
    imageUrls: ['https://example.com/prop1.jpg'],
    listingStatus: 'ACTIVE',
    createdAt: '2024-01-01T00:00:00.000Z',
    postedBy: 'John Doe',
    companyName: 'ABC Realty',
    bedrooms: 2,
    bathrooms: 2,
    price: 5000000,
    userId: '1',
    userEmail: 'john@example.com',
  },
]

const mockResponse = {
  agent: mockAgent,
  properties: mockProperties,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  },
  activePropertiesCount: 1,
}

describe('AgentProperties - Comprehensive Tests', () => {
  const mockPush = jest.fn()
  const mockUseRouter = useRouter as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({
      push: mockPush,
      query: { id: '1' },
      isReady: true,
    })
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Initial Rendering', () => {
    it('should render page with header and footer', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      render(<AgentProperties />)

      await waitFor(() => {
        expect(screen.getByTestId('header')).toBeInTheDocument()
        expect(screen.getByTestId('footer')).toBeInTheDocument()
      })
    })

    it('should render agent name', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      render(<AgentProperties />)

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })
    })

    it('should render company name when available', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      render(<AgentProperties />)

      await waitFor(() => {
        expect(screen.getByText('ABC Realty')).toBeInTheDocument()
      })
    })

    it('should render agent email', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      render(<AgentProperties />)

      await waitFor(() => {
        expect(screen.getByText('john@example.com')).toBeInTheDocument()
      })
    })

    it('should render agent phone', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      render(<AgentProperties />)

      await waitFor(() => {
        expect(screen.getByText('+911234567890')).toBeInTheDocument()
      })
    })

    it('should render breadcrumb navigation', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      render(<AgentProperties />)

      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument()
        expect(screen.getByText('Agents')).toBeInTheDocument()
      })
    })

    it('should render Active Properties tab', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      render(<AgentProperties />)

      await waitFor(() => {
        expect(screen.getByText('Active Properties')).toBeInTheDocument()
      })
    })

    it('should render Sold Properties tab', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      render(<AgentProperties />)

      await waitFor(() => {
        expect(screen.getByText('Sold Properties')).toBeInTheDocument()
      })
    })
  })

  describe('Loading State', () => {
    it('should show loading message during initial load', () => {
      ;(global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {})
      )

      render(<AgentProperties />)

      expect(screen.getByText('Loading agent properties...')).toBeInTheDocument()
    })

    it('should show loading during property fetch', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        })
        .mockImplementationOnce(() => new Promise(() => {}))

      render(<AgentProperties />)

      await waitFor(() => {
        expect(screen.getByText('Active Properties')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Sold Properties'))

      await waitFor(() => {
        expect(screen.getByText('Loading properties...')).toBeInTheDocument()
      })
    })
  })

  describe('Data Fetching', () => {
    it('should fetch agent properties on mount', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      render(<AgentProperties />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/agents/1/properties?page=1&limit=12&status=ACTIVE')
        )
      })
    })

    it('should display fetched properties', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      render(<AgentProperties />)

      await waitFor(() => {
        expect(screen.getByTestId('property-card')).toBeInTheDocument()
        expect(screen.getByText('123 Main St')).toBeInTheDocument()
      })
    })

    it('should handle fetch error', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Agent not found' }),
      })

      render(<AgentProperties />)

      await waitFor(() => {
        expect(screen.getByText('Agent not found')).toBeInTheDocument()
      })
    })

    it('should show error screen when agent not found', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Agent not found' }),
      })

      render(<AgentProperties />)

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument()
        expect(screen.getByText('← Back to Agents')).toBeInTheDocument()
      })
    })
  })

  describe('Agent Display', () => {
    it('should display agent image when available', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      render(<AgentProperties />)

      await waitFor(() => {
        const image = screen.getByAlt('John Doe')
        expect(image).toBeInTheDocument()
        expect(image).toHaveAttribute('src', expect.stringContaining('john.jpg'))
      })
    })

    it('should display initials when image is not available', async () => {
      const agentWithoutImage = {
        ...mockResponse,
        agent: { ...mockAgent, image: null },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => agentWithoutImage,
      })

      render(<AgentProperties />)

      await waitFor(() => {
        expect(screen.getByText('J')).toBeInTheDocument()
      })
    })

    it('should not display company when not available', async () => {
      const agentWithoutCompany = {
        ...mockResponse,
        agent: { ...mockAgent, companyName: null },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => agentWithoutCompany,
      })

      render(<AgentProperties />)

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.queryByText('ABC Realty')).not.toBeInTheDocument()
      })
    })

    it('should not display phone when not available', async () => {
      const agentWithoutPhone = {
        ...mockResponse,
        agent: { ...mockAgent, phone: null },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => agentWithoutPhone,
      })

      render(<AgentProperties />)

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.queryByText('+911234567890')).not.toBeInTheDocument()
      })
    })
  })

  describe('Tab Functionality', () => {
    it('should have ACTIVE tab selected by default', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      render(<AgentProperties />)

      await waitFor(() => {
        const activeTab = screen.getByText('Active Properties')
        expect(activeTab.className).toContain('border-blue-600')
      })
    })

    it('should fetch SOLD properties when Sold tab clicked', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ...mockResponse, properties: [] }),
        })

      render(<AgentProperties />)

      await waitFor(() => {
        expect(screen.getByText('Sold Properties')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Sold Properties'))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('status=SOLD')
        )
      })
    })

    it('should reset to page 1 when switching tabs', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        })

      render(<AgentProperties />)

      await waitFor(() => {
        expect(screen.getByText('Sold Properties')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Sold Properties'))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('page=1')
        )
      })
    })

    it('should update tab styling when switched', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        })

      render(<AgentProperties />)

      await waitFor(() => {
        expect(screen.getByText('Sold Properties')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Sold Properties'))

      await waitFor(() => {
        const soldTab = screen.getByText('Sold Properties')
        expect(soldTab.className).toContain('border-blue-600')
      })
    })
  })

  describe('Properties Display', () => {
    it('should display properties count', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      render(<AgentProperties />)

      await waitFor(() => {
        expect(screen.getByText(/Active Properties \(1\)/)).toBeInTheDocument()
      })
    })

    it('should render properties in grid', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      render(<AgentProperties />)

      await waitFor(() => {
        const propertyCard = screen.getByTestId('property-card')
        expect(propertyCard).toBeInTheDocument()
      })
    })

    it('should display no properties message when empty', async () => {
      const emptyResponse = {
        ...mockResponse,
        properties: [],
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => emptyResponse,
      })

      render(<AgentProperties />)

      await waitFor(() => {
        expect(screen.getByText('No properties found')).toBeInTheDocument()
      })
    })

    it('should show appropriate message for empty list', async () => {
      const emptyResponse = {
        ...mockResponse,
        properties: [],
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => emptyResponse,
      })

      render(<AgentProperties />)

      await waitFor(() => {
        expect(screen.getByText('This agent has not listed any properties yet.')).toBeInTheDocument()
      })
    })
  })

  describe('Pagination', () => {
    it('should show pagination when multiple pages exist', async () => {
      const multiPageResponse = {
        ...mockResponse,
        pagination: {
          currentPage: 1,
          totalPages: 3,
          totalCount: 25,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => multiPageResponse,
      })

      render(<AgentProperties />)

      await waitFor(() => {
        expect(screen.getByText('Previous')).toBeInTheDocument()
        expect(screen.getByText('Next')).toBeInTheDocument()
      })
    })

    it('should display current page and total pages', async () => {
      const multiPageResponse = {
        ...mockResponse,
        pagination: {
          currentPage: 1,
          totalPages: 3,
          totalCount: 25,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => multiPageResponse,
      })

      render(<AgentProperties />)

      await waitFor(() => {
        expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
      })
    })

    it('should disable Previous button on first page', async () => {
      const multiPageResponse = {
        ...mockResponse,
        pagination: {
          currentPage: 1,
          totalPages: 3,
          totalCount: 25,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => multiPageResponse,
      })

      render(<AgentProperties />)

      await waitFor(() => {
        const prevButton = screen.getByText('Previous')
        expect(prevButton).toBeDisabled()
      })
    })

    it('should enable Next button when hasNextPage is true', async () => {
      const multiPageResponse = {
        ...mockResponse,
        pagination: {
          currentPage: 1,
          totalPages: 3,
          totalCount: 25,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => multiPageResponse,
      })

      render(<AgentProperties />)

      await waitFor(() => {
        const nextButton = screen.getByText('Next')
        expect(nextButton).not.toBeDisabled()
      })
    })

    it('should fetch next page on Next click', async () => {
      const multiPageResponse = {
        ...mockResponse,
        pagination: {
          currentPage: 1,
          totalPages: 3,
          totalCount: 25,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      }

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => multiPageResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ...multiPageResponse,
            pagination: { ...multiPageResponse.pagination, currentPage: 2 },
          }),
        })

      render(<AgentProperties />)

      await waitFor(() => {
        expect(screen.getByText('Next')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Next'))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('page=2')
        )
      })
    })

    it('should not show pagination when only one page', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      render(<AgentProperties />)

      await waitFor(() => {
        expect(screen.queryByText('Previous')).not.toBeInTheDocument()
        expect(screen.queryByText('Next')).not.toBeInTheDocument()
      })
    })
  })

  describe('Navigation', () => {
    it('should have breadcrumb link to home', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      render(<AgentProperties />)

      await waitFor(() => {
        const homeLink = screen.getByText('Home').closest('a')
        expect(homeLink).toHaveAttribute('href', '/')
      })
    })

    it('should have breadcrumb link to agents', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      render(<AgentProperties />)

      await waitFor(() => {
        const agentsLink = screen.getByText('Agents').closest('a')
        expect(agentsLink).toHaveAttribute('href', '/agents')
      })
    })

    it('should navigate to agents page on back click', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Error' }),
      })

      render(<AgentProperties />)

      await waitFor(() => {
        const backLink = screen.getByText('← Back to Agents')
        fireEvent.click(backLink)
      })

      expect(mockPush).toHaveBeenCalledWith('/agents')
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing router id', () => {
      mockUseRouter.mockReturnValue({
        push: mockPush,
        query: {},
        isReady: true,
      })

      render(<AgentProperties />)

      // Should not crash
      expect(screen.getByTestId('header')).toBeInTheDocument()
    })

    it('should handle network error', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      render(<AgentProperties />)

      await waitFor(() => {
        expect(screen.getByText('An error occurred')).toBeInTheDocument()
      })
    })

    it('should handle very long agent name', async () => {
      const longNameAgent = {
        ...mockResponse,
        agent: { ...mockAgent, name: 'A'.repeat(100) },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => longNameAgent,
      })

      render(<AgentProperties />)

      await waitFor(() => {
        expect(screen.getByText('A'.repeat(100))).toBeInTheDocument()
      })
    })

    it('should handle many properties', async () => {
      const manyPropertiesResponse = {
        ...mockResponse,
        properties: Array.from({ length: 50 }, (_, i) => ({
          ...mockProperties[0],
          id: `prop${i}`,
          streetAddress: `${i} Main St`,
        })),
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => manyPropertiesResponse,
      })

      render(<AgentProperties />)

      await waitFor(() => {
        const cards = screen.getAllByTestId('property-card')
        expect(cards.length).toBe(50)
      })
    })
  })

  describe('Accessibility', () => {
    it('should have accessible breadcrumb navigation', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      render(<AgentProperties />)

      await waitFor(() => {
        const nav = screen.getByText('Home').closest('nav')
        expect(nav).toBeInTheDocument()
      })
    })

    it('should have accessible tab buttons', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      render(<AgentProperties />)

      await waitFor(() => {
        const tabs = screen.getAllByRole('button')
        expect(tabs.length).toBeGreaterThan(0)
      })
    })
  })

  describe('SEO', () => {
    it('should have correct SEO title', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      render(<AgentProperties />)

      await waitFor(() => {
        expect(document.title).toContain('Properties by John Doe')
      })
    })
  })
})
