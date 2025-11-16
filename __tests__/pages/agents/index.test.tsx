import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import AgentsPage from '@/pages/agents/index'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
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
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />
  },
}))

jest.mock('next-seo', () => ({
  NextSeo: ({ title }: any) => {
    if (title) {
      document.title = title
    }
    return null
  },
}))

const mockAgents = [
  {
    id: '1',
    name: 'John Doe',
    username: 'johndoe',
    email: 'john@example.com',
    phone: '+911234567890',
    companyName: 'ABC Realty',
    image: 'https://example.com/john.jpg',
    createdAt: '2024-01-01T00:00:00.000Z',
    _count: { listedProperties: 5 },
  },
  {
    id: '2',
    name: 'Jane Smith',
    username: 'janesmith',
    email: 'jane@example.com',
    phone: '+919876543210',
    companyName: 'XYZ Properties',
    image: null,
    createdAt: '2024-02-01T00:00:00.000Z',
    _count: { listedProperties: 3 },
  },
  {
    id: '3',
    name: null,
    username: 'agent3',
    email: 'agent3@example.com',
    phone: null,
    companyName: null,
    image: null,
    createdAt: '2024-03-01T00:00:00.000Z',
    _count: { listedProperties: 0 },
  },
]

const mockAgentsResponse = {
  agents: mockAgents,
  pagination: {
    currentPage: 1,
    totalPages: 2,
    totalCount: 15,
    hasNextPage: true,
    hasPreviousPage: false,
  },
}

describe('AgentsPage - Comprehensive Tests', () => {
  const mockPush = jest.fn()
  const mockUseRouter = useRouter as jest.Mock
  const mockUseSession = useSession as jest.Mock

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

  describe('Initial Rendering', () => {
    it('should render page with header and footer', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAgentsResponse,
      })

      render(<AgentsPage />)

      await waitFor(() => {
        expect(screen.getByTestId('header')).toBeInTheDocument()
        expect(screen.getByTestId('footer')).toBeInTheDocument()
      })
    })

    it('should render page title', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAgentsResponse,
      })

      render(<AgentsPage />)

      await waitFor(() => {
        expect(screen.getByText('Real Estate Agents')).toBeInTheDocument()
      })
    })

    it('should render page description', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAgentsResponse,
      })

      render(<AgentsPage />)

      await waitFor(() => {
        expect(
          screen.getByText('Connect with qualified real estate professionals in your area')
        ).toBeInTheDocument()
      })
    })

    it('should render search input', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAgentsResponse,
      })

      render(<AgentsPage />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Search agents/)).toBeInTheDocument()
      })
    })

    it('should render table headers', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAgentsResponse,
      })

      render(<AgentsPage />)

      await waitFor(() => {
        expect(screen.getByText('Agent')).toBeInTheDocument()
        expect(screen.getByText('Company')).toBeInTheDocument()
        expect(screen.getByText('Contact')).toBeInTheDocument()
        expect(screen.getByText('Properties Listed')).toBeInTheDocument()
        expect(screen.getByText('Joined')).toBeInTheDocument()
      })
    })
  })

  describe('Loading State', () => {
    it('should show loading skeleton while fetching', () => {
      ;(global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}))

      render(<AgentsPage />)

      const skeletons = screen
        .getAllByRole('generic')
        .filter(el => el.className.includes('animate-pulse'))
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('should show 8 loading skeleton rows', () => {
      ;(global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}))

      render(<AgentsPage />)

      const loadingRows = screen.getAllByRole('row').slice(1) // Exclude header row
      expect(loadingRows.length).toBe(8)
    })
  })

  describe('Data Fetching', () => {
    it('should fetch agents on mount', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAgentsResponse,
      })

      render(<AgentsPage />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/agents?page=1&limit=12')
        )
      })
    })

    it('should display fetched agents', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAgentsResponse,
      })

      render(<AgentsPage />)

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      })
    })

    it('should handle fetch error', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      })

      render(<AgentsPage />)

      await waitFor(() => {
        expect(screen.getByText('Error loading agents')).toBeInTheDocument()
      })
    })

    it('should show retry button on error', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      })

      render(<AgentsPage />)

      await waitFor(() => {
        expect(screen.getByText('Try again')).toBeInTheDocument()
      })
    })

    it('should retry fetch on Try Again click', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false }).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAgentsResponse,
      })

      render(<AgentsPage />)

      await waitFor(() => {
        expect(screen.getByText('Try again')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Try again'))

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })
    })
  })

  describe('Agent Display', () => {
    it('should display agent name when available', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAgentsResponse,
      })

      render(<AgentsPage />)

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      })
    })

    it('should display username as fallback when name is null', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAgentsResponse,
      })

      render(<AgentsPage />)

      await waitFor(() => {
        expect(screen.getByText('agent3')).toBeInTheDocument()
      })
    })

    it('should display username with @ prefix', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAgentsResponse,
      })

      render(<AgentsPage />)

      await waitFor(() => {
        expect(screen.getByText('@johndoe')).toBeInTheDocument()
        expect(screen.getByText('@janesmith')).toBeInTheDocument()
      })
    })

    it('should display agent image when available', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAgentsResponse,
      })

      render(<AgentsPage />)

      await waitFor(() => {
        const image = screen.getByAltText('John Doe')
        expect(image).toBeInTheDocument()
        expect(image).toHaveAttribute('src', expect.stringContaining('john.jpg'))
      })
    })

    it('should display initials when image is not available', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAgentsResponse,
      })

      render(<AgentsPage />)

      await waitFor(() => {
        expect(screen.getByText('JS')).toBeInTheDocument() // Jane Smith
      })
    })

    it('should display company name when available', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAgentsResponse,
      })

      render(<AgentsPage />)

      await waitFor(() => {
        expect(screen.getByText('ABC Realty')).toBeInTheDocument()
        expect(screen.getByText('XYZ Properties')).toBeInTheDocument()
      })
    })

    it('should display "No company" when company is null', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAgentsResponse,
      })

      render(<AgentsPage />)

      await waitFor(() => {
        expect(screen.getByText('No company')).toBeInTheDocument()
      })
    })

    it('should display company initials', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAgentsResponse,
      })

      render(<AgentsPage />)

      await waitFor(() => {
        expect(screen.getByText('AR')).toBeInTheDocument() // ABC Realty
        expect(screen.getByText('XP')).toBeInTheDocument() // XYZ Properties
      })
    })

    it('should display properties count', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAgentsResponse,
      })

      render(<AgentsPage />)

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument()
        expect(screen.getByText('3')).toBeInTheDocument()
      })
    })

    it('should display zero when no properties', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAgentsResponse,
      })

      render(<AgentsPage />)

      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument()
      })
    })

    it('should display join date', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAgentsResponse,
      })

      render(<AgentsPage />)

      await waitFor(() => {
        // Check for formatted dates
        const dates = screen.getAllByText(/\//)
        expect(dates.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Contact Information - Authenticated', () => {
    it('should display email when authenticated', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAgentsResponse,
      })

      render(<AgentsPage />)

      await waitFor(() => {
        expect(screen.getByText('john@example.com')).toBeInTheDocument()
        expect(screen.getByText('jane@example.com')).toBeInTheDocument()
      })
    })

    it('should display phone when authenticated and available', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAgentsResponse,
      })

      render(<AgentsPage />)

      await waitFor(() => {
        expect(screen.getByText('+911234567890')).toBeInTheDocument()
        expect(screen.getByText('+919876543210')).toBeInTheDocument()
      })
    })
  })

  describe('Contact Information - Unauthenticated', () => {
    it('should hide contact details when not authenticated', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAgentsResponse,
      })

      render(<AgentsPage />)

      await waitFor(() => {
        expect(screen.getAllByText('Sign in to view email and mobile').length).toBeGreaterThan(0)
        expect(screen.queryByText('john@example.com')).not.toBeInTheDocument()
      })
    })
  })

  describe('Search Functionality', () => {
    it('should update search input on change', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockAgentsResponse,
      })

      render(<AgentsPage />)

      const searchInput = await screen.findByPlaceholderText(/Search agents/)
      fireEvent.change(searchInput, { target: { value: 'John' } })

      expect(searchInput).toHaveValue('John')
    })

    it('should debounce search input', async () => {
      jest.useFakeTimers()
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockAgentsResponse,
      })

      render(<AgentsPage />)

      const searchInput = await screen.findByPlaceholderText(/Search agents/)

      fireEvent.change(searchInput, { target: { value: 'J' } })
      fireEvent.change(searchInput, { target: { value: 'Jo' } })
      fireEvent.change(searchInput, { target: { value: 'John' } })

      // Should not fetch immediately
      expect(global.fetch).toHaveBeenCalledTimes(1) // Initial load only

      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('search=John'))
      })

      jest.useRealTimers()
    })

    it('should fetch agents with search query after debounce', async () => {
      jest.useFakeTimers()
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockAgentsResponse,
      })

      render(<AgentsPage />)

      const searchInput = await screen.findByPlaceholderText(/Search agents/)
      fireEvent.change(searchInput, { target: { value: 'Jane' } })

      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('search=Jane'))
      })

      jest.useRealTimers()
    })

    it('should reset to page 1 on search', async () => {
      jest.useFakeTimers()
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockAgentsResponse,
      })

      render(<AgentsPage />)

      const searchInput = await screen.findByPlaceholderText(/Search agents/)
      fireEvent.change(searchInput, { target: { value: 'Test' } })

      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('page=1'))
      })

      jest.useRealTimers()
    })
  })

  describe('Company Filter', () => {
    it('should apply company filter from URL', async () => {
      mockUseRouter.mockReturnValue({
        push: mockPush,
        query: { company: 'ABC Realty' },
        isReady: true,
      })
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAgentsResponse,
      })

      render(<AgentsPage />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('company=ABC%20Realty'))
      })
    })

    it('should show company filter badge when filtered', async () => {
      mockUseRouter.mockReturnValue({
        push: mockPush,
        query: { company: 'ABC Realty' },
        isReady: true,
      })
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAgentsResponse,
      })

      render(<AgentsPage />)

      await waitFor(() => {
        expect(screen.getByText(/Showing agents from:/)).toBeInTheDocument()
        expect(screen.getByText('ABC Realty')).toBeInTheDocument()
      })
    })

    it('should disable search when company filter is active', async () => {
      mockUseRouter.mockReturnValue({
        push: mockPush,
        query: { company: 'ABC Realty' },
        isReady: true,
      })
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAgentsResponse,
      })

      render(<AgentsPage />)

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/Search disabled/)
        expect(searchInput).toBeDisabled()
      })
    })

    it('should clear company filter on X click', async () => {
      mockUseRouter.mockReturnValue({
        push: mockPush,
        query: { company: 'ABC Realty' },
        isReady: true,
      })
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockAgentsResponse,
      })

      render(<AgentsPage />)

      await waitFor(() => {
        expect(screen.getByText(/Showing agents from:/)).toBeInTheDocument()
      })

      const closeButton = screen
        .getByText(/Showing agents from:/)
        .closest('div')
        ?.querySelector('button')
      if (closeButton) {
        fireEvent.click(closeButton)
      }

      expect(mockPush).toHaveBeenCalledWith('/agents')
    })

    it('should navigate to company filter on company name click', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAgentsResponse,
      })

      render(<AgentsPage />)

      await waitFor(() => {
        const companyButton = screen.getByText('ABC Realty')
        fireEvent.click(companyButton)
      })

      expect(mockPush).toHaveBeenCalledWith('/agents?company=ABC%20Realty')
    })
  })

  describe('Results Summary', () => {
    it('should show results count when agents exist', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAgentsResponse,
      })

      render(<AgentsPage />)

      await waitFor(() => {
        expect(screen.getByText(/Showing 3 of 15 agents/)).toBeInTheDocument()
      })
    })

    it('should show company name in results when filtered', async () => {
      mockUseRouter.mockReturnValue({
        push: mockPush,
        query: { company: 'ABC Realty' },
        isReady: true,
      })
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAgentsResponse,
      })

      render(<AgentsPage />)

      await waitFor(() => {
        expect(screen.getByText(/from ABC Realty/)).toBeInTheDocument()
      })
    })

    it('should show search query in results summary', async () => {
      jest.useFakeTimers()
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockAgentsResponse,
      })

      render(<AgentsPage />)

      const searchInput = await screen.findByPlaceholderText(/Search agents/)
      fireEvent.change(searchInput, { target: { value: 'John' } })

      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(screen.getByText(/for "John"/)).toBeInTheDocument()
      })

      jest.useRealTimers()
    })

    it('should show "No agents found" when results are empty', async () => {
      const emptyResponse = {
        agents: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => emptyResponse,
      })

      render(<AgentsPage />)

      await waitFor(() => {
        expect(screen.getByText(/No agents found/)).toBeInTheDocument()
      })
    })
  })

  describe('Empty State', () => {
    it('should display empty state when no agents', async () => {
      const emptyResponse = {
        agents: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => emptyResponse,
      })

      render(<AgentsPage />)

      await waitFor(() => {
        expect(screen.getByText('No agents found')).toBeInTheDocument()
      })
    })

    it('should show appropriate message for search with no results', async () => {
      jest.useFakeTimers()
      const emptyResponse = {
        agents: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => emptyResponse,
      })

      render(<AgentsPage />)

      const searchInput = await screen.findByPlaceholderText(/Search agents/)
      fireEvent.change(searchInput, { target: { value: 'NonExistent' } })

      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(screen.getByText(/Try different keywords/)).toBeInTheDocument()
      })

      jest.useRealTimers()
    })
  })

  describe('Pagination', () => {
    it('should show pagination when multiple pages exist', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAgentsResponse,
      })

      render(<AgentsPage />)

      await waitFor(() => {
        expect(screen.getAllByText('Previous').length).toBeGreaterThan(0)
        expect(screen.getAllByText('Next').length).toBeGreaterThan(0)
      })
    })

    it('should display current page information', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAgentsResponse,
      })

      render(<AgentsPage />)

      await waitFor(() => {
        expect(screen.getByText(/Showing page.*1.*of.*2/)).toBeInTheDocument()
      })
    })

    it('should disable Previous button on first page', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAgentsResponse,
      })

      render(<AgentsPage />)

      await waitFor(() => {
        const prevButtons = screen.getAllByText('Previous')
        expect(prevButtons[0]).toBeDisabled()
      })
    })

    it('should enable Next button when hasNextPage is true', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAgentsResponse,
      })

      render(<AgentsPage />)

      await waitFor(() => {
        const nextButtons = screen.getAllByText('Next')
        expect(nextButtons[0]).not.toBeDisabled()
      })
    })

    it('should fetch next page on Next click', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAgentsResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ...mockAgentsResponse,
            pagination: { ...mockAgentsResponse.pagination, currentPage: 2 },
          }),
        })

      render(<AgentsPage />)

      await waitFor(() => {
        expect(screen.getAllByText('Next')[0]).toBeInTheDocument()
      })

      fireEvent.click(screen.getAllByText('Next')[0])

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('page=2'))
      })
    })

    it('should scroll to top on page change', async () => {
      window.scrollTo = jest.fn()
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAgentsResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ...mockAgentsResponse,
            pagination: { ...mockAgentsResponse.pagination, currentPage: 2 },
          }),
        })

      render(<AgentsPage />)

      await waitFor(() => {
        expect(screen.getAllByText('Next')[0]).toBeInTheDocument()
      })

      fireEvent.click(screen.getAllByText('Next')[0])

      await waitFor(() => {
        expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
      })
    })
  })

  describe('Navigation', () => {
    it('should navigate to agent properties on properties count click', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAgentsResponse,
      })

      render(<AgentsPage />)

      await waitFor(() => {
        const propertiesCount = screen.getByText('5')
        fireEvent.click(propertiesCount)
      })

      expect(mockPush).toHaveBeenCalledWith('/agents/1/properties')
    })

    it('should not navigate when properties count is zero', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAgentsResponse,
      })

      render(<AgentsPage />)

      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument()
      })

      // Zero count should not be clickable
    })
  })

  describe('Accessibility', () => {
    it('should have proper alt text for agent images', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAgentsResponse,
      })

      render(<AgentsPage />)

      await waitFor(() => {
        const image = screen.getByAltText('John Doe')
        expect(image).toBeInTheDocument()
      })
    })

    it('should have accessible search input', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAgentsResponse,
      })

      render(<AgentsPage />)

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/Search agents/)
        expect(searchInput).toHaveAttribute('type', 'text')
      })
    })

    it('should have accessible table structure', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAgentsResponse,
      })

      render(<AgentsPage />)

      await waitFor(() => {
        const table = screen.getByRole('table')
        expect(table).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle agent with very long name', async () => {
      const longNameAgent = {
        ...mockAgents[0],
        name: 'Very Long Agent Name That Should Be Displayed Properly',
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockAgentsResponse,
          agents: [longNameAgent],
        }),
      })

      render(<AgentsPage />)

      await waitFor(() => {
        expect(
          screen.getByText('Very Long Agent Name That Should Be Displayed Properly')
        ).toBeInTheDocument()
      })
    })

    it('should handle agent with very long company name', async () => {
      const longCompanyAgent = {
        ...mockAgents[0],
        companyName: 'Very Long Company Name That Should Be Displayed Properly',
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockAgentsResponse,
          agents: [longCompanyAgent],
        }),
      })

      render(<AgentsPage />)

      await waitFor(() => {
        expect(
          screen.getByText('Very Long Company Name That Should Be Displayed Properly')
        ).toBeInTheDocument()
      })
    })

    it('should handle network error gracefully', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      render(<AgentsPage />)

      await waitFor(() => {
        expect(screen.getByText(/An error occurred/)).toBeInTheDocument()
      })
    })
  })

  describe('SEO', () => {
    it('should have correct SEO title', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAgentsResponse,
      })

      render(<AgentsPage />)

      await waitFor(() => {
        expect(document.title).toContain('Real Estate Agents')
      })
    })
  })
})
