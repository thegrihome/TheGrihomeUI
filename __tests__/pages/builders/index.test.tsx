import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import BuildersPage from '@/pages/builders/index'

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

const mockBuilders = [
  {
    id: '1',
    name: 'Builder One',
    description: 'Premier real estate developer',
    logoUrl: 'https://example.com/logo1.png',
    website: 'https://builderone.com',
    projectCount: 5,
  },
  {
    id: '2',
    name: 'Builder Two',
    description: 'Trusted construction company',
    logoUrl: null,
    website: 'https://buildertwo.com',
    projectCount: 3,
  },
  {
    id: '3',
    name: 'Independent',
    description: 'Independent projects',
    logoUrl: null,
    website: null,
    projectCount: 10,
  },
]

const mockBuildersResponse = {
  builders: mockBuilders,
  pagination: {
    currentPage: 1,
    totalPages: 2,
    totalCount: 15,
    hasNextPage: true,
    hasPreviousPage: false,
  },
}

describe('BuildersPage - Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Initial Rendering', () => {
    it('should render the page with header and footer', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBuildersResponse,
      })

      render(<BuildersPage />)

      await waitFor(() => {
        expect(screen.getByTestId('header')).toBeInTheDocument()
        expect(screen.getByTestId('footer')).toBeInTheDocument()
      })
    })

    it('should render page title', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBuildersResponse,
      })

      render(<BuildersPage />)

      await waitFor(() => {
        expect(screen.getByText('Builders')).toBeInTheDocument()
      })
    })

    it('should render page description', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBuildersResponse,
      })

      render(<BuildersPage />)

      await waitFor(() => {
        expect(
          screen.getByText('Browse all builders and real estate developers')
        ).toBeInTheDocument()
      })
    })

    it('should render Add Builder button', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBuildersResponse,
      })

      render(<BuildersPage />)

      await waitFor(() => {
        expect(screen.getByText('Add Builder')).toBeInTheDocument()
      })
    })

    it('should render search input', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBuildersResponse,
      })

      render(<BuildersPage />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search builders by name...')).toBeInTheDocument()
      })
    })

    it('should have correct SEO title', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBuildersResponse,
      })

      render(<BuildersPage />)

      await waitFor(() => {
        expect(document.title).toContain('Builders')
      })
    })
  })

  describe('Loading State', () => {
    it('should show loading skeleton while fetching', () => {
      ;(global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      render(<BuildersPage />)

      const skeletons = screen
        .getAllByRole('generic')
        .filter(el => el.className.includes('animate-pulse'))
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('should show 8 loading skeleton cards', () => {
      ;(global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      render(<BuildersPage />)

      const skeletons = screen
        .getAllByRole('generic')
        .filter(el => el.className.includes('bg-gray-200'))
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('should not show builders while loading', () => {
      ;(global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      render(<BuildersPage />)

      expect(screen.queryByText('Builder One')).not.toBeInTheDocument()
    })
  })

  describe('Data Fetching', () => {
    it('should fetch builders on mount', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBuildersResponse,
      })

      render(<BuildersPage />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/builders?page=1&limit=12')
        )
      })
    })

    it('should display fetched builders', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBuildersResponse,
      })

      render(<BuildersPage />)

      await waitFor(() => {
        expect(screen.getByText('Builder One')).toBeInTheDocument()
        expect(screen.getByText('Builder Two')).toBeInTheDocument()
      })
    })

    it('should display builder project counts', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBuildersResponse,
      })

      render(<BuildersPage />)

      await waitFor(() => {
        expect(screen.getByText('5 Projects')).toBeInTheDocument()
        expect(screen.getByText('3 Projects')).toBeInTheDocument()
      })
    })

    it('should display singular "Project" for count of 1', async () => {
      const singleProjectBuilder = {
        builders: [
          {
            id: '1',
            name: 'Solo Builder',
            description: null,
            logoUrl: null,
            website: null,
            projectCount: 1,
          },
        ],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalCount: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => singleProjectBuilder,
      })

      render(<BuildersPage />)

      await waitFor(() => {
        expect(screen.getByText('1 Project')).toBeInTheDocument()
      })
    })

    it('should handle fetch error', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      })

      render(<BuildersPage />)

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch builders')).toBeInTheDocument()
      })
    })

    it('should show error with retry button on fetch failure', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      })

      render(<BuildersPage />)

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument()
      })
    })

    it('should retry fetch on Try Again click', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockBuildersResponse,
        })

      render(<BuildersPage />)

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Try Again'))

      await waitFor(() => {
        expect(screen.getByText('Builder One')).toBeInTheDocument()
      })
    })
  })

  describe('Builder Display', () => {
    it('should display builder logo when available', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBuildersResponse,
      })

      render(<BuildersPage />)

      await waitFor(() => {
        const logo = screen.getByAltText('Builder One')
        expect(logo).toBeInTheDocument()
        expect(logo).toHaveAttribute('src', 'https://example.com/logo1.png')
      })
    })

    it('should display placeholder when logo is not available', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBuildersResponse,
      })

      render(<BuildersPage />)

      await waitFor(() => {
        expect(screen.getByText('B')).toBeInTheDocument() // First letter of "Builder Two"
      })
    })

    it('should display builder description when available', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBuildersResponse,
      })

      render(<BuildersPage />)

      await waitFor(() => {
        expect(screen.getByText('Premier real estate developer')).toBeInTheDocument()
      })
    })

    it('should not display description when not available', async () => {
      const noDescBuilders = {
        builders: [
          {
            id: '1',
            name: 'Test Builder',
            description: null,
            logoUrl: null,
            website: null,
            projectCount: 1,
          },
        ],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalCount: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => noDescBuilders,
      })

      render(<BuildersPage />)

      await waitFor(() => {
        expect(screen.getByText('Test Builder')).toBeInTheDocument()
      })
    })

    it('should render Independent builder without link', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBuildersResponse,
      })

      render(<BuildersPage />)

      await waitFor(() => {
        const independentCard = screen.getByText('Independent').closest('div')
        expect(independentCard).not.toHaveAttribute('href')
      })
    })

    it('should render clickable cards for non-Independent builders', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBuildersResponse,
      })

      render(<BuildersPage />)

      await waitFor(() => {
        const builderOneCard = screen.getByText('Builder One').closest('a')
        expect(builderOneCard).toHaveAttribute('href', '/builders/1')
      })
    })
  })

  describe('Search Functionality', () => {
    it('should update search input on change', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockBuildersResponse,
      })

      render(<BuildersPage />)

      const searchInput = await screen.findByPlaceholderText('Search builders by name...')
      fireEvent.change(searchInput, { target: { value: 'Test' } })

      expect(searchInput).toHaveValue('Test')
    })

    it('should debounce search input', async () => {
      jest.useFakeTimers()
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockBuildersResponse,
      })

      render(<BuildersPage />)

      const searchInput = await screen.findByPlaceholderText('Search builders by name...')

      fireEvent.change(searchInput, { target: { value: 'T' } })
      fireEvent.change(searchInput, { target: { value: 'Te' } })
      fireEvent.change(searchInput, { target: { value: 'Test' } })

      // Should not fetch immediately
      expect(global.fetch).toHaveBeenCalledTimes(1) // Initial load only

      // Fast-forward time
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('search=Test'))
      })

      jest.useRealTimers()
    })

    it('should fetch builders with search query after debounce', async () => {
      jest.useFakeTimers()
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockBuildersResponse,
      })

      render(<BuildersPage />)

      const searchInput = await screen.findByPlaceholderText('Search builders by name...')
      fireEvent.change(searchInput, { target: { value: 'Builder One' } })

      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('search=Builder'))
      })

      jest.useRealTimers()
    })

    it('should trim search query before sending', async () => {
      jest.useFakeTimers()
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockBuildersResponse,
      })

      render(<BuildersPage />)

      const searchInput = await screen.findByPlaceholderText('Search builders by name...')
      fireEvent.change(searchInput, { target: { value: '  Test  ' } })

      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('search=Test'))
      })

      jest.useRealTimers()
    })

    it('should reset to page 1 on search', async () => {
      jest.useFakeTimers()
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockBuildersResponse,
      })

      render(<BuildersPage />)

      const searchInput = await screen.findByPlaceholderText('Search builders by name...')
      fireEvent.change(searchInput, { target: { value: 'Test' } })

      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('page=1'))
      })

      jest.useRealTimers()
    })
  })

  describe('Results Summary', () => {
    it('should show results count when builders exist', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBuildersResponse,
      })

      render(<BuildersPage />)

      await waitFor(() => {
        expect(screen.getByText(/Showing 3 of 15 builders/)).toBeInTheDocument()
      })
    })

    it('should show search query in results summary', async () => {
      jest.useFakeTimers()
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockBuildersResponse,
      })

      render(<BuildersPage />)

      const searchInput = await screen.findByPlaceholderText('Search builders by name...')
      fireEvent.change(searchInput, { target: { value: 'Test' } })

      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(screen.getByText(/for "Test"/)).toBeInTheDocument()
      })

      jest.useRealTimers()
    })

    it('should show "No builders found" when results are empty', async () => {
      const emptyResponse = {
        builders: [],
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

      render(<BuildersPage />)

      await waitFor(() => {
        expect(screen.getByText(/No builders found/)).toBeInTheDocument()
      })
    })
  })

  describe('Empty State', () => {
    it('should display empty state when no builders', async () => {
      const emptyResponse = {
        builders: [],
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

      render(<BuildersPage />)

      await waitFor(() => {
        expect(screen.getByText('No Builders Found')).toBeInTheDocument()
      })
    })

    it('should show appropriate message for search with no results', async () => {
      jest.useFakeTimers()
      const emptyResponse = {
        builders: [],
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

      render(<BuildersPage />)

      const searchInput = await screen.findByPlaceholderText('Search builders by name...')
      fireEvent.change(searchInput, { target: { value: 'NonExistent' } })

      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(screen.getByText('Try adjusting your search')).toBeInTheDocument()
      })

      jest.useRealTimers()
    })

    it('should show "Add Builder" button in empty state', async () => {
      const emptyResponse = {
        builders: [],
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

      render(<BuildersPage />)

      await waitFor(() => {
        const addButtons = screen.getAllByText('Add Builder')
        expect(addButtons.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Pagination', () => {
    it('should show pagination when multiple pages exist', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBuildersResponse,
      })

      render(<BuildersPage />)

      await waitFor(() => {
        expect(screen.getByText('Previous')).toBeInTheDocument()
        expect(screen.getByText('Next')).toBeInTheDocument()
      })
    })

    it('should display current page and total pages', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBuildersResponse,
      })

      render(<BuildersPage />)

      await waitFor(() => {
        expect(screen.getByText('Page 1 of 2')).toBeInTheDocument()
      })
    })

    it('should disable Previous button on first page', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBuildersResponse,
      })

      render(<BuildersPage />)

      await waitFor(() => {
        const prevButton = screen.getByRole('button', { name: 'Previous' })
        expect(prevButton).toBeDisabled()
      })
    })

    it('should enable Next button when hasNextPage is true', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBuildersResponse,
      })

      render(<BuildersPage />)

      await waitFor(() => {
        const nextButton = screen.getByRole('button', { name: 'Next' })
        expect(nextButton).not.toBeDisabled()
      })
    })

    it('should fetch next page on Next click', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockBuildersResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ...mockBuildersResponse,
            pagination: { ...mockBuildersResponse.pagination, currentPage: 2 },
          }),
        })

      render(<BuildersPage />)

      await waitFor(() => {
        expect(screen.getByText('Next')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: 'Next' }))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('page=2'))
      })
    })

    it('should fetch previous page on Previous click', async () => {
      const page2Response = {
        ...mockBuildersResponse,
        pagination: {
          currentPage: 2,
          totalPages: 2,
          totalCount: 15,
          hasNextPage: false,
          hasPreviousPage: true,
        },
      }

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => page2Response,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockBuildersResponse,
        })

      render(<BuildersPage />)

      await waitFor(() => {
        expect(screen.getByText('Previous')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: 'Previous' }))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('page=1'))
      })
    })

    it('should not show pagination when only one page', async () => {
      const singlePageResponse = {
        builders: mockBuilders.slice(0, 1),
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalCount: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => singlePageResponse,
      })

      render(<BuildersPage />)

      await waitFor(() => {
        expect(screen.queryByText('Previous')).not.toBeInTheDocument()
        expect(screen.queryByText('Next')).not.toBeInTheDocument()
      })
    })
  })

  describe('Navigation', () => {
    it('should have link to add builder page', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBuildersResponse,
      })

      render(<BuildersPage />)

      await waitFor(() => {
        const addBuilderLink = screen.getAllByText('Add Builder')[0].closest('a')
        expect(addBuilderLink).toHaveAttribute('href', '/builders/add-builder')
      })
    })

    it('should link to builder detail page', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBuildersResponse,
      })

      render(<BuildersPage />)

      await waitFor(() => {
        const builderCard = screen.getByText('Builder One').closest('a')
        expect(builderCard).toHaveAttribute('href', '/builders/1')
      })
    })
  })

  describe('Grid Layout', () => {
    it('should render builders in a grid', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBuildersResponse,
      })

      render(<BuildersPage />)

      await waitFor(() => {
        expect(screen.getByText('Builder One')).toBeInTheDocument()
      })
    })

    it('should display all builders from response', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBuildersResponse,
      })

      render(<BuildersPage />)

      await waitFor(() => {
        mockBuilders.forEach(builder => {
          expect(screen.getByText(builder.name)).toBeInTheDocument()
        })
      })
    })
  })

  describe('Error Handling', () => {
    it('should show error message on API failure', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      render(<BuildersPage />)

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch builders')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper alt text for builder logos', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBuildersResponse,
      })

      render(<BuildersPage />)

      await waitFor(() => {
        const logo = screen.getByAltText('Builder One')
        expect(logo).toBeInTheDocument()
      })
    })

    it('should have accessible search input', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBuildersResponse,
      })

      render(<BuildersPage />)

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search builders by name...')
        expect(searchInput).toHaveAttribute('type', 'text')
      })
    })

    it('should have accessible buttons', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBuildersResponse,
      })

      render(<BuildersPage />)

      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        expect(buttons.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty search query', async () => {
      jest.useFakeTimers()
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockBuildersResponse,
      })

      render(<BuildersPage />)

      const searchInput = await screen.findByPlaceholderText('Search builders by name...')
      fireEvent.change(searchInput, { target: { value: '   ' } })

      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.not.stringContaining('search='))
      })

      jest.useRealTimers()
    })

    it('should handle builder with very long name', async () => {
      const longNameBuilder = {
        builders: [
          {
            id: '1',
            name: 'Very Long Builder Name That Should Be Displayed Properly Even Though It Is Extremely Long',
            description: null,
            logoUrl: null,
            website: null,
            projectCount: 1,
          },
        ],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalCount: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => longNameBuilder,
      })

      render(<BuildersPage />)

      await waitFor(() => {
        expect(
          screen.getByText(
            'Very Long Builder Name That Should Be Displayed Properly Even Though It Is Extremely Long'
          )
        ).toBeInTheDocument()
      })
    })

    it('should handle zero project count', async () => {
      const zeroProjectBuilder = {
        builders: [
          {
            id: '1',
            name: 'New Builder',
            description: null,
            logoUrl: null,
            website: null,
            projectCount: 0,
          },
        ],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalCount: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => zeroProjectBuilder,
      })

      render(<BuildersPage />)

      await waitFor(() => {
        expect(screen.getByText('0 Projects')).toBeInTheDocument()
      })
    })
  })
})
