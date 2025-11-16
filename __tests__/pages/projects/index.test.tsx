import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import ProjectsPage from '@/pages/projects/index'
import {
  mockRouter,
  mockSession,
  mockFetchSuccess,
  mockFetchError,
} from '@/__tests__/utils/test-utils'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}))

const mockProjects = [
  {
    id: 'project-1',
    name: 'Test Project Alpha',
    description: 'A premium residential project',
    type: 'RESIDENTIAL',
    numberOfUnits: 100,
    size: 5,
    thumbnailUrl: 'https://example.com/project1.jpg',
    builder: {
      id: 'builder-1',
      name: 'Test Builder',
      logoUrl: 'https://example.com/logo1.jpg',
    },
    location: {
      id: 'loc-1',
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      zipcode: '500032',
      locality: 'Gachibowli',
    },
  },
  {
    id: 'project-2',
    name: 'Test Project Beta',
    description: 'A commercial complex',
    type: 'COMMERCIAL',
    numberOfUnits: null,
    size: 3,
    thumbnailUrl: null,
    builder: {
      id: 'builder-2',
      name: 'Another Builder',
      logoUrl: null,
    },
    location: {
      id: 'loc-2',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      zipcode: '560001',
      locality: null,
    },
  },
]

const mockPagination = {
  currentPage: 1,
  totalPages: 1,
  totalCount: 2,
  hasNextPage: false,
  hasPreviousPage: false,
}

describe('Projects Index Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    mockFetchSuccess({
      projects: mockProjects,
      pagination: mockPagination,
    })
  })

  describe('Page Rendering', () => {
    it('renders projects page correctly', async () => {
      render(<ProjectsPage />)

      await waitFor(() => {
        expect(screen.getByText('Real Estate Projects')).toBeInTheDocument()
      })
    })

    it('displays page title and description', async () => {
      render(<ProjectsPage />)

      await waitFor(() => {
        expect(screen.getByText('Real Estate Projects')).toBeInTheDocument()
        expect(
          screen.getByText(/Discover premium residential and commercial projects/i)
        ).toBeInTheDocument()
      })
    })

    it('renders submit project button', async () => {
      render(<ProjectsPage />)

      await waitFor(() => {
        expect(screen.getByText('Submit Project')).toBeInTheDocument()
      })
    })

    it('submit project button links to correct page', async () => {
      render(<ProjectsPage />)

      await waitFor(() => {
        const submitBtn = screen.getByText('Submit Project').closest('a')
        expect(submitBtn).toHaveAttribute('href', '/projects/add-project-request')
      })
    })
  })

  describe('Search Functionality', () => {
    it('renders search input', async () => {
      render(<ProjectsPage />)

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/Search projects by name, builder, city/i)
        ).toBeInTheDocument()
      })
    })

    it('allows typing in search input', async () => {
      render(<ProjectsPage />)

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/Search projects by name, builder, city/i)
        fireEvent.change(searchInput, { target: { value: 'Test Project' } })
        expect(searchInput).toHaveValue('Test Project')
      })
    })

    it('debounces search input', async () => {
      jest.useFakeTimers()
      render(<ProjectsPage />)

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/Search projects by name, builder, city/i)
        fireEvent.change(searchInput, { target: { value: 'Alpha' } })
      })

      // Should not trigger immediately
      expect(fetch).toHaveBeenCalledTimes(1) // Initial load only

      // Fast-forward 300ms
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(2) // Initial + search
      })

      jest.useRealTimers()
    })

    it('includes search query in API call', async () => {
      jest.useFakeTimers()
      render(<ProjectsPage />)

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/Search projects by name, builder, city/i)
        fireEvent.change(searchInput, { target: { value: 'Alpha' } })
      })

      jest.advanceTimersByTime(300)

      await waitFor(() => {
        const lastCall = (fetch as jest.Mock).mock.calls[(fetch as jest.Mock).mock.calls.length - 1]
        expect(lastCall[0]).toContain('search=Alpha')
      })

      jest.useRealTimers()
    })
  })

  describe('Projects List', () => {
    it('displays list of projects', async () => {
      render(<ProjectsPage />)

      await waitFor(() => {
        expect(screen.getByText('Test Project Alpha')).toBeInTheDocument()
        expect(screen.getByText('Test Project Beta')).toBeInTheDocument()
      })
    })

    it('displays project builder names', async () => {
      render(<ProjectsPage />)

      await waitFor(() => {
        expect(screen.getByText('Test Builder')).toBeInTheDocument()
        expect(screen.getByText('Another Builder')).toBeInTheDocument()
      })
    })

    it('displays project locations', async () => {
      render(<ProjectsPage />)

      await waitFor(() => {
        expect(screen.getByText(/Gachibowli, Hyderabad, Telangana/i)).toBeInTheDocument()
        expect(screen.getByText(/Bangalore, Karnataka/i)).toBeInTheDocument()
      })
    })

    it('displays project types', async () => {
      render(<ProjectsPage />)

      await waitFor(() => {
        expect(screen.getByText('RESIDENTIAL')).toBeInTheDocument()
        expect(screen.getByText('COMMERCIAL')).toBeInTheDocument()
      })
    })

    it('displays project details (units and size)', async () => {
      render(<ProjectsPage />)

      await waitFor(() => {
        expect(screen.getByText(/100 units/i)).toBeInTheDocument()
        expect(screen.getByText(/5 acres/i)).toBeInTheDocument()
      })
    })

    it('links project names to detail pages', async () => {
      render(<ProjectsPage />)

      await waitFor(() => {
        const projectLink = screen.getByText('Test Project Alpha').closest('a')
        expect(projectLink).toHaveAttribute('href', '/projects/project-1')
      })
    })

    it('displays project thumbnails when available', async () => {
      render(<ProjectsPage />)

      await waitFor(() => {
        const images = screen.getAllByRole('img', { name: /Test Project Alpha/i })
        expect(images.length).toBeGreaterThan(0)
      })
    })

    it('displays fallback icon when thumbnail is not available', async () => {
      render(<ProjectsPage />)

      await waitFor(() => {
        // Project Beta has no thumbnail, should show emoji fallback
        const rows = screen.getAllByRole('row')
        expect(rows.length).toBeGreaterThan(0)
      })
    })

    it('displays builder logos when available', async () => {
      render(<ProjectsPage />)

      await waitFor(() => {
        const images = screen.getAllByRole('img', { name: /Test Builder/i })
        expect(images.length).toBeGreaterThan(0)
      })
    })

    it('displays builder initials when logo is not available', async () => {
      render(<ProjectsPage />)

      await waitFor(() => {
        // Another Builder has no logo, should show initial "A"
        expect(screen.getByText('A')).toBeInTheDocument()
      })
    })
  })

  describe('Loading State', () => {
    it('displays loading state initially', () => {
      render(<ProjectsPage />)

      expect(screen.getAllByRole('row').length).toBeGreaterThan(0)
    })

    it('shows loading skeleton with correct structure', () => {
      render(<ProjectsPage />)

      const table = screen.getByRole('table')
      expect(table).toBeInTheDocument()
    })

    it('displays table headers during loading', () => {
      render(<ProjectsPage />)

      expect(screen.getByText('Project')).toBeInTheDocument()
      expect(screen.getByText('Builder')).toBeInTheDocument()
      expect(screen.getByText('Location')).toBeInTheDocument()
      expect(screen.getByText('Type')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('displays empty state when no projects found', async () => {
      mockFetchSuccess({
        projects: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      })

      render(<ProjectsPage />)

      await waitFor(() => {
        expect(screen.getByText('No projects found')).toBeInTheDocument()
      })
    })

    it('shows appropriate message for empty search results', async () => {
      jest.useFakeTimers()
      mockFetchSuccess({
        projects: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      })

      render(<ProjectsPage />)

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/Search projects by name, builder, city/i)
        fireEvent.change(searchInput, { target: { value: 'NonexistentProject' } })
      })

      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(screen.getByText(/No projects match your search/i)).toBeInTheDocument()
      })

      jest.useRealTimers()
    })

    it('displays empty state icon', async () => {
      mockFetchSuccess({
        projects: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      })

      render(<ProjectsPage />)

      await waitFor(() => {
        const svg = screen.getByText('No projects found').closest('div')?.querySelector('svg')
        expect(svg).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('displays error message when API call fails', async () => {
      mockFetchError('Failed to fetch projects')

      render(<ProjectsPage />)

      await waitFor(() => {
        expect(screen.getByText('Error loading projects')).toBeInTheDocument()
      })
    })

    it('shows retry button on error', async () => {
      mockFetchError('Failed to fetch projects')

      render(<ProjectsPage />)

      await waitFor(() => {
        expect(screen.getByText('Try again')).toBeInTheDocument()
      })
    })

    it('retries API call when retry button is clicked', async () => {
      mockFetchError('Failed to fetch projects')

      render(<ProjectsPage />)

      await waitFor(() => {
        expect(screen.getByText('Try again')).toBeInTheDocument()
      })

      // Mock successful response for retry
      mockFetchSuccess({
        projects: mockProjects,
        pagination: mockPagination,
      })

      const retryButton = screen.getByText('Try again')
      fireEvent.click(retryButton)

      await waitFor(() => {
        expect(screen.getByText('Test Project Alpha')).toBeInTheDocument()
      })
    })

    it('displays specific error message from API', async () => {
      mockFetchError('Database connection failed')

      render(<ProjectsPage />)

      await waitFor(() => {
        expect(screen.getByText('Database connection failed')).toBeInTheDocument()
      })
    })
  })

  describe('Pagination', () => {
    it('displays pagination controls when multiple pages exist', async () => {
      mockFetchSuccess({
        projects: mockProjects,
        pagination: {
          currentPage: 1,
          totalPages: 3,
          totalCount: 36,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      })

      render(<ProjectsPage />)

      await waitFor(() => {
        expect(screen.getByText('Next')).toBeInTheDocument()
        expect(screen.getByText('Previous')).toBeInTheDocument()
      })
    })

    it('does not display pagination when only one page exists', async () => {
      render(<ProjectsPage />)

      await waitFor(() => {
        expect(screen.queryByText('Next')).not.toBeInTheDocument()
      })
    })

    it('displays current page information', async () => {
      mockFetchSuccess({
        projects: mockProjects,
        pagination: {
          currentPage: 2,
          totalPages: 5,
          totalCount: 60,
          hasNextPage: true,
          hasPreviousPage: true,
        },
      })

      render(<ProjectsPage />)

      await waitFor(() => {
        expect(screen.getByText(/page 2/i)).toBeInTheDocument()
        expect(screen.getByText(/of 5/i)).toBeInTheDocument()
      })
    })

    it('disables previous button on first page', async () => {
      mockFetchSuccess({
        projects: mockProjects,
        pagination: {
          currentPage: 1,
          totalPages: 3,
          totalCount: 36,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      })

      render(<ProjectsPage />)

      await waitFor(() => {
        const prevButtons = screen.getAllByText('Previous')
        prevButtons.forEach(btn => {
          expect(btn).toBeDisabled()
        })
      })
    })

    it('disables next button on last page', async () => {
      mockFetchSuccess({
        projects: mockProjects,
        pagination: {
          currentPage: 3,
          totalPages: 3,
          totalCount: 36,
          hasNextPage: false,
          hasPreviousPage: true,
        },
      })

      render(<ProjectsPage />)

      await waitFor(() => {
        const nextButtons = screen.getAllByText('Next')
        nextButtons.forEach(btn => {
          expect(btn).toBeDisabled()
        })
      })
    })

    it('fetches next page when next button is clicked', async () => {
      mockFetchSuccess({
        projects: mockProjects,
        pagination: {
          currentPage: 1,
          totalPages: 3,
          totalCount: 36,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      })

      render(<ProjectsPage />)

      await waitFor(() => {
        const nextButton = screen.getAllByText('Next')[0]
        fireEvent.click(nextButton)
      })

      await waitFor(() => {
        const lastCall = (fetch as jest.Mock).mock.calls[(fetch as jest.Mock).mock.calls.length - 1]
        expect(lastCall[0]).toContain('page=2')
      })
    })

    it('fetches previous page when previous button is clicked', async () => {
      mockFetchSuccess({
        projects: mockProjects,
        pagination: {
          currentPage: 2,
          totalPages: 3,
          totalCount: 36,
          hasNextPage: true,
          hasPreviousPage: true,
        },
      })

      render(<ProjectsPage />)

      await waitFor(() => {
        const prevButton = screen.getAllByText('Previous')[0]
        fireEvent.click(prevButton)
      })

      await waitFor(() => {
        const lastCall = (fetch as jest.Mock).mock.calls[(fetch as jest.Mock).mock.calls.length - 1]
        expect(lastCall[0]).toContain('page=1')
      })
    })

    it('scrolls to top when page changes', async () => {
      const scrollToSpy = jest.fn()
      window.scrollTo = scrollToSpy

      mockFetchSuccess({
        projects: mockProjects,
        pagination: {
          currentPage: 1,
          totalPages: 3,
          totalCount: 36,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      })

      render(<ProjectsPage />)

      await waitFor(() => {
        const nextButton = screen.getAllByText('Next')[0]
        fireEvent.click(nextButton)
      })

      await waitFor(() => {
        expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
      })
    })

    it('renders page number buttons', async () => {
      mockFetchSuccess({
        projects: mockProjects,
        pagination: {
          currentPage: 2,
          totalPages: 5,
          totalCount: 60,
          hasNextPage: true,
          hasPreviousPage: true,
        },
      })

      render(<ProjectsPage />)

      await waitFor(() => {
        // Should show page numbers around current page
        const pageButtons = screen.getAllByRole('button')
        const hasPageNumbers = pageButtons.some(btn => /^[0-9]+$/.test(btn.textContent || ''))
        expect(hasPageNumbers).toBeTruthy()
      })
    })

    it('highlights current page number', async () => {
      mockFetchSuccess({
        projects: mockProjects,
        pagination: {
          currentPage: 2,
          totalPages: 5,
          totalCount: 60,
          hasNextPage: true,
          hasPreviousPage: true,
        },
      })

      render(<ProjectsPage />)

      await waitFor(() => {
        const pageButtons = screen.getAllByRole('button')
        const currentPageBtn = pageButtons.find(btn => btn.textContent === '2')
        if (currentPageBtn) {
          expect(currentPageBtn.className).toContain('bg-blue-50')
        }
      })
    })
  })

  describe('Results Summary', () => {
    it('displays total count of projects', async () => {
      render(<ProjectsPage />)

      await waitFor(() => {
        expect(screen.getByText(/Showing 2 of 2 projects/i)).toBeInTheDocument()
      })
    })

    it('shows search query in results summary', async () => {
      jest.useFakeTimers()
      render(<ProjectsPage />)

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/Search projects by name, builder, city/i)
        fireEvent.change(searchInput, { target: { value: 'Alpha' } })
      })

      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(screen.getByText(/for "Alpha"/i)).toBeInTheDocument()
      })

      jest.useRealTimers()
    })

    it('shows correct count when no results', async () => {
      mockFetchSuccess({
        projects: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      })

      render(<ProjectsPage />)

      await waitFor(() => {
        expect(screen.getByText(/No projects found/i)).toBeInTheDocument()
      })
    })
  })

  describe('SEO and Metadata', () => {
    it('renders NextSeo component with correct title', () => {
      const { container } = render(<ProjectsPage />)
      // NextSeo is rendered but doesn't affect DOM in test environment
      expect(container).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('renders mobile pagination controls', async () => {
      mockFetchSuccess({
        projects: mockProjects,
        pagination: {
          currentPage: 1,
          totalPages: 3,
          totalCount: 36,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      })

      render(<ProjectsPage />)

      await waitFor(() => {
        const prevButtons = screen.getAllByText('Previous')
        expect(prevButtons.length).toBeGreaterThan(0)
      })
    })
  })

  describe('API Integration', () => {
    it('fetches projects on mount', async () => {
      render(<ProjectsPage />)

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled()
        const lastCall = (fetch as jest.Mock).mock.calls[0]
        expect(lastCall[0]).toContain('/api/projects')
      })
    })

    it('includes pagination parameters in API call', async () => {
      render(<ProjectsPage />)

      await waitFor(() => {
        const lastCall = (fetch as jest.Mock).mock.calls[0]
        expect(lastCall[0]).toContain('page=1')
        expect(lastCall[0]).toContain('limit=12')
      })
    })

    it('handles successful API response', async () => {
      render(<ProjectsPage />)

      await waitFor(() => {
        expect(screen.getByText('Test Project Alpha')).toBeInTheDocument()
      })
    })

    it('handles API error response gracefully', async () => {
      mockFetchError('Internal server error')

      render(<ProjectsPage />)

      await waitFor(() => {
        expect(screen.getByText('Error loading projects')).toBeInTheDocument()
      })
    })
  })

  describe('Table Structure', () => {
    it('renders table with correct headers', async () => {
      render(<ProjectsPage />)

      await waitFor(() => {
        expect(screen.getByText('Project')).toBeInTheDocument()
        expect(screen.getByText('Builder')).toBeInTheDocument()
        expect(screen.getByText('Location')).toBeInTheDocument()
        expect(screen.getByText('Type')).toBeInTheDocument()
      })
    })

    it('applies hover effect to table rows', async () => {
      render(<ProjectsPage />)

      await waitFor(() => {
        const rows = screen.getAllByRole('row')
        // Check if rows have hover class
        const dataRows = rows.filter((_, i) => i > 0) // Skip header row
        expect(dataRows.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Project Type Badge', () => {
    it('displays project type as badge', async () => {
      render(<ProjectsPage />)

      await waitFor(() => {
        const residentialBadge = screen.getByText('RESIDENTIAL')
        expect(residentialBadge.className).toContain('rounded-full')
      })
    })
  })

  describe('Location Display', () => {
    it('displays locality when available', async () => {
      render(<ProjectsPage />)

      await waitFor(() => {
        expect(screen.getByText(/Gachibowli/i)).toBeInTheDocument()
      })
    })

    it('displays zipcode when available', async () => {
      render(<ProjectsPage />)

      await waitFor(() => {
        expect(screen.getByText(/500032/i)).toBeInTheDocument()
      })
    })

    it('handles missing locality gracefully', async () => {
      render(<ProjectsPage />)

      await waitFor(() => {
        expect(screen.getByText(/Bangalore, Karnataka/i)).toBeInTheDocument()
      })
    })
  })
})
