import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import BuilderSelector from '@/components/projects/BuilderSelector'
import { useSession } from 'next-auth/react'

jest.mock('next-auth/react')
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

describe('BuilderSelector Component', () => {
  const mockOnChange = jest.fn()
  const mockBuilders = [
    {
      id: 'builder1',
      name: 'Builder One',
      description: 'Test builder 1',
      logoUrl: null,
      website: 'https://builder1.com',
      projectCount: 5,
    },
    {
      id: 'builder2',
      name: 'Builder Two',
      description: null,
      logoUrl: null,
      website: null,
      projectCount: 3,
    },
    {
      id: 'builder3',
      name: 'ABC Builders',
      description: 'ABC Description',
      logoUrl: 'https://example.com/logo.png',
      website: 'https://abc.com',
      projectCount: 10,
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
    mockUseSession.mockReturnValue({
      data: {
        user: { email: 'test@example.com', name: 'Test User' },
        expires: '2024-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Rendering', () => {
    it('renders with placeholder when no value selected', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ builders: mockBuilders }),
      })

      render(<BuilderSelector value={null} onChange={mockOnChange} />)

      await waitFor(() => {
        expect(screen.getByText('Select a builder...')).toBeInTheDocument()
      })
    })

    it('renders with selected builder name when value provided', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ builders: mockBuilders }),
      })

      render(<BuilderSelector value="builder1" onChange={mockOnChange} />)

      await waitFor(() => {
        expect(screen.getByText(/Builder One/)).toBeInTheDocument()
      })
    })

    it('applies custom className', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ builders: [] }),
      })

      const { container } = render(
        <BuilderSelector value={null} onChange={mockOnChange} className="custom-class" />
      )

      await waitFor(() => {
        expect(container.firstChild).toHaveClass('custom-class')
      })
    })

    it('renders dropdown chevron icon', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ builders: [] }),
      })

      const { container } = render(<BuilderSelector value={null} onChange={mockOnChange} />)

      await waitFor(() => {
        const chevron = container.querySelector('svg')
        expect(chevron).toBeInTheDocument()
      })
    })
  })

  describe('Fetching Builders', () => {
    it('fetches builders on mount', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ builders: mockBuilders }),
      })

      render(<BuilderSelector value={null} onChange={mockOnChange} />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/builders?search='))
      })
    })

    it('fetches builders with search query', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ builders: mockBuilders }),
      })

      render(<BuilderSelector value={null} onChange={mockOnChange} />)

      // Open dropdown
      const selector = screen.getByText('Select a builder...')
      fireEvent.click(selector)

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search builders...')
        expect(searchInput).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search builders...')
      fireEvent.change(searchInput, { target: { value: 'ABC' } })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('search=ABC'))
      })
    })

    it('handles fetch error gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      render(<BuilderSelector value={null} onChange={mockOnChange} />)

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled()
      })

      consoleError.mockRestore()
    })

    it('handles failed response', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Error' }),
      })

      render(<BuilderSelector value={null} onChange={mockOnChange} />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })
    })
  })

  describe('Dropdown Interaction', () => {
    it('opens dropdown when clicked', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ builders: mockBuilders }),
      })

      render(<BuilderSelector value={null} onChange={mockOnChange} />)

      const selector = screen.getByText('Select a builder...')
      fireEvent.click(selector)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search builders...')).toBeInTheDocument()
      })
    })

    it('closes dropdown when clicking selector again', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ builders: mockBuilders }),
      })

      render(<BuilderSelector value={null} onChange={mockOnChange} />)

      const selector = screen.getByText('Select a builder...')
      fireEvent.click(selector)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search builders...')).toBeInTheDocument()
      })

      fireEvent.click(selector)

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Search builders...')).not.toBeInTheDocument()
      })
    })

    it('rotates chevron icon when dropdown is open', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ builders: [] }),
      })

      const { container } = render(<BuilderSelector value={null} onChange={mockOnChange} />)

      const selector = screen.getByText('Select a builder...')
      const chevron = container.querySelector('svg')

      expect(chevron).not.toHaveClass('rotate-180')

      fireEvent.click(selector)

      await waitFor(() => {
        expect(chevron).toHaveClass('rotate-180')
      })
    })

    it('closes dropdown when clicking outside', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ builders: mockBuilders }),
      })

      render(
        <div>
          <BuilderSelector value={null} onChange={mockOnChange} />
          <div data-testid="outside">Outside</div>
        </div>
      )

      const selector = screen.getByText('Select a builder...')
      fireEvent.click(selector)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search builders...')).toBeInTheDocument()
      })

      const outside = screen.getByTestId('outside')
      fireEvent.mouseDown(outside)

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Search builders...')).not.toBeInTheDocument()
      })
    })
  })

  describe('Builder Selection', () => {
    it('calls onChange when builder is selected', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ builders: mockBuilders }),
      })

      render(<BuilderSelector value={null} onChange={mockOnChange} />)

      const selector = screen.getByText('Select a builder...')
      fireEvent.click(selector)

      await waitFor(() => {
        expect(screen.getByText(/Builder One/)).toBeInTheDocument()
      })

      const builderOption = screen.getByText(/Builder One/)
      fireEvent.click(builderOption)

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('builder1')
      })
    })

    it('updates selected builder display after selection', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ builders: mockBuilders }),
      })

      const { rerender } = render(<BuilderSelector value={null} onChange={mockOnChange} />)

      const selector = screen.getByText('Select a builder...')
      fireEvent.click(selector)

      await waitFor(() => {
        const builderOption = screen.getAllByText('Builder One')[0]
        fireEvent.click(builderOption)
      })

      rerender(<BuilderSelector value="builder1" onChange={mockOnChange} />)

      await waitFor(() => {
        expect(screen.getByText(/Builder One/)).toBeInTheDocument()
      })
    })

    it('closes dropdown after selection', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ builders: mockBuilders }),
      })

      render(<BuilderSelector value={null} onChange={mockOnChange} />)

      const selector = screen.getByText('Select a builder...')
      fireEvent.click(selector)

      await waitFor(() => {
        const builderOption = screen.getAllByText('Builder One')[0]
        fireEvent.click(builderOption)
      })

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Search builders...')).not.toBeInTheDocument()
      })
    })

    it('highlights selected builder in dropdown', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ builders: mockBuilders }),
      })

      render(<BuilderSelector value="builder1" onChange={mockOnChange} />)

      const selector = screen.getByText(/Builder One/)
      fireEvent.click(selector)

      await waitFor(() => {
        const builderElements = screen.getAllByText('Builder One')
        const dropdownItem = builderElements.find(el =>
          el.parentElement?.classList.contains('bg-blue-50')
        )
        expect(dropdownItem).toBeDefined()
      })
    })
  })

  describe('Builder List Display', () => {
    it('displays all builders in dropdown', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ builders: mockBuilders }),
      })

      render(<BuilderSelector value={null} onChange={mockOnChange} />)

      const selector = screen.getByText('Select a builder...')
      fireEvent.click(selector)

      await waitFor(() => {
        expect(screen.getByText(/Builder One/)).toBeInTheDocument()
        expect(screen.getByText('Builder Two')).toBeInTheDocument()
        expect(screen.getByText('ABC Builders')).toBeInTheDocument()
      })
    })

    it('displays builder websites', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ builders: mockBuilders }),
      })

      render(<BuilderSelector value={null} onChange={mockOnChange} />)

      const selector = screen.getByText('Select a builder...')
      fireEvent.click(selector)

      await waitFor(() => {
        expect(screen.getByText('https://builder1.com')).toBeInTheDocument()
        expect(screen.getByText('https://abc.com')).toBeInTheDocument()
      })
    })

    it('displays project counts', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ builders: mockBuilders }),
      })

      render(<BuilderSelector value={null} onChange={mockOnChange} />)

      const selector = screen.getByText('Select a builder...')
      fireEvent.click(selector)

      await waitFor(() => {
        expect(screen.getByText('5 projects')).toBeInTheDocument()
        expect(screen.getByText('3 projects')).toBeInTheDocument()
        expect(screen.getByText('10 projects')).toBeInTheDocument()
      })
    })

    it('shows singular project for count of 1', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          builders: [{ ...mockBuilders[0], projectCount: 1 }],
        }),
      })

      render(<BuilderSelector value={null} onChange={mockOnChange} />)

      const selector = screen.getByText('Select a builder...')
      fireEvent.click(selector)

      await waitFor(() => {
        expect(screen.getByText('1 project')).toBeInTheDocument()
      })
    })

    it('displays empty state when no builders found', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ builders: [] }),
      })

      render(<BuilderSelector value={null} onChange={mockOnChange} />)

      const selector = screen.getByText('Select a builder...')
      fireEvent.click(selector)

      await waitFor(() => {
        expect(
          screen.getByText('No builders found. Try a different search or add a new builder.')
        ).toBeInTheDocument()
      })
    })
  })

  describe('Search Functionality', () => {
    it('filters builders based on search query', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ builders: mockBuilders }),
      })

      render(<BuilderSelector value={null} onChange={mockOnChange} />)

      const selector = screen.getByText('Select a builder...')
      fireEvent.click(selector)

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search builders...')
        fireEvent.change(searchInput, { target: { value: 'ABC' } })
      })

      await waitFor(() => {
        expect(screen.getByText('ABC Builders')).toBeInTheDocument()
      })
    })

    it('search is case-insensitive', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ builders: mockBuilders }),
      })

      render(<BuilderSelector value={null} onChange={mockOnChange} />)

      const selector = screen.getByText('Select a builder...')
      fireEvent.click(selector)

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search builders...')
        fireEvent.change(searchInput, { target: { value: 'abc' } })
      })

      await waitFor(() => {
        expect(screen.getByText('ABC Builders')).toBeInTheDocument()
      })
    })

    it('search input has autofocus', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ builders: mockBuilders }),
      })

      render(<BuilderSelector value={null} onChange={mockOnChange} />)

      const selector = screen.getByText('Select a builder...')
      fireEvent.click(selector)

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search builders...')
        expect(searchInput).toHaveAttribute('autoFocus')
      })
    })
  })

  describe('Add New Builder', () => {
    it('shows add builder form when button clicked', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ builders: mockBuilders }),
      })

      render(<BuilderSelector value={null} onChange={mockOnChange} />)

      const selector = screen.getByText('Select a builder...')
      fireEvent.click(selector)

      await waitFor(() => {
        const addButton = screen.getByText('+ Add New Builder')
        fireEvent.click(addButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Builder Name')).toBeInTheDocument()
        expect(screen.getByText('Website (Optional)')).toBeInTheDocument()
      })
    })

    it('hides add builder form when cancel clicked', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ builders: mockBuilders }),
      })

      render(<BuilderSelector value={null} onChange={mockOnChange} />)

      const selector = screen.getByText('Select a builder...')
      fireEvent.click(selector)

      await waitFor(() => {
        const addButton = screen.getByText('+ Add New Builder')
        fireEvent.click(addButton)
      })

      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: 'Cancel' })
        fireEvent.click(cancelButton)
      })

      await waitFor(() => {
        expect(screen.queryByText('Builder Name')).not.toBeInTheDocument()
      })
    })

    it('clears form when cancel clicked', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ builders: mockBuilders }),
      })

      render(<BuilderSelector value={null} onChange={mockOnChange} />)

      const selector = screen.getByText('Select a builder...')
      fireEvent.click(selector)

      await waitFor(() => {
        const addButton = screen.getByText('+ Add New Builder')
        fireEvent.click(addButton)
      })

      const nameInput = screen.getByPlaceholderText('Enter builder name')
      fireEvent.change(nameInput, { target: { value: 'Test Builder' } })

      const cancelButton = screen.getByRole('button', { name: 'Cancel' })
      fireEvent.click(cancelButton)

      // Reopen form
      const addButton = screen.getByText('+ Add New Builder')
      fireEvent.click(addButton)

      await waitFor(() => {
        const nameInputAfter = screen.getByPlaceholderText('Enter builder name')
        expect(nameInputAfter).toHaveValue('')
      })
    })

    it('validates builder name is required', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ builders: mockBuilders }),
      })

      const mockToastError = jest.fn()
      jest.mock('react-hot-toast', () => ({
        error: mockToastError,
      }))

      render(<BuilderSelector value={null} onChange={mockOnChange} />)

      const selector = screen.getByText('Select a builder...')
      fireEvent.click(selector)

      await waitFor(() => {
        const addButton = screen.getByText('+ Add New Builder')
        fireEvent.click(addButton)
      })

      const submitButton = screen.getByText('Add Builder')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(global.fetch).not.toHaveBeenCalledWith('/api/builders/create', expect.any(Object))
      })
    })

    it('successfully adds new builder', async () => {
      const newBuilder = {
        id: 'new-builder',
        name: 'New Builder',
        description: null,
        logoUrl: null,
        website: 'https://newbuilder.com',
        projectCount: 0,
      }

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ builders: mockBuilders }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ builder: newBuilder }),
        })

      render(<BuilderSelector value={null} onChange={mockOnChange} />)

      const selector = screen.getByText('Select a builder...')
      fireEvent.click(selector)

      await waitFor(() => {
        const addButton = screen.getByText('+ Add New Builder')
        fireEvent.click(addButton)
      })

      const nameInput = screen.getByPlaceholderText('Enter builder name')
      const websiteInput = screen.getByPlaceholderText('https://example.com')

      fireEvent.change(nameInput, { target: { value: 'New Builder' } })
      fireEvent.change(websiteInput, { target: { value: 'https://newbuilder.com' } })

      const submitButton = screen.getByText('Add Builder')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/builders/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'New Builder',
            website: 'https://newbuilder.com',
          }),
        })
      })

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('new-builder')
      })
    })

    it('handles empty website as null', async () => {
      const newBuilder = {
        id: 'new-builder',
        name: 'New Builder',
        description: null,
        logoUrl: null,
        website: null,
        projectCount: 0,
      }

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ builders: mockBuilders }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ builder: newBuilder }),
        })

      render(<BuilderSelector value={null} onChange={mockOnChange} />)

      const selector = screen.getByText('Select a builder...')
      fireEvent.click(selector)

      await waitFor(() => {
        const addButton = screen.getByText('+ Add New Builder')
        fireEvent.click(addButton)
      })

      const nameInput = screen.getByPlaceholderText('Enter builder name')
      fireEvent.change(nameInput, { target: { value: 'New Builder' } })

      const submitButton = screen.getByText('Add Builder')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/builders/create',
          expect.objectContaining({
            body: JSON.stringify({
              name: 'New Builder',
              website: null,
            }),
          })
        )
      })
    })

    it('handles add builder API error', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ builders: mockBuilders }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ message: 'Builder already exists' }),
        })

      render(<BuilderSelector value={null} onChange={mockOnChange} />)

      const selector = screen.getByText('Select a builder...')
      fireEvent.click(selector)

      await waitFor(() => {
        const addButton = screen.getByText('+ Add New Builder')
        fireEvent.click(addButton)
      })

      const nameInput = screen.getByPlaceholderText('Enter builder name')
      fireEvent.change(nameInput, { target: { value: 'Duplicate' } })

      const submitButton = screen.getByText('Add Builder')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/builders/create', expect.any(Object))
      })
    })

    it('handles add builder network error', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ builders: mockBuilders }),
        })
        .mockRejectedValueOnce(new Error('Network error'))

      render(<BuilderSelector value={null} onChange={mockOnChange} />)

      const selector = screen.getByText('Select a builder...')
      fireEvent.click(selector)

      await waitFor(() => {
        const addButton = screen.getByText('+ Add New Builder')
        fireEvent.click(addButton)
      })

      const nameInput = screen.getByPlaceholderText('Enter builder name')
      fireEvent.change(nameInput, { target: { value: 'New Builder' } })

      const submitButton = screen.getByText('Add Builder')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/builders/create', expect.any(Object))
      })
    })

    it('disables submit button while adding', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ builders: mockBuilders }),
        })
        .mockImplementationOnce(
          () =>
            new Promise(resolve =>
              setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100)
            )
        )

      render(<BuilderSelector value={null} onChange={mockOnChange} />)

      const selector = screen.getByText('Select a builder...')
      fireEvent.click(selector)

      await waitFor(() => {
        const addButton = screen.getByText('+ Add New Builder')
        fireEvent.click(addButton)
      })

      const nameInput = screen.getByPlaceholderText('Enter builder name')
      fireEvent.change(nameInput, { target: { value: 'New Builder' } })

      const submitButton = screen.getByText('Add Builder')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Adding...')).toBeInTheDocument()
      })

      const disabledButton = screen.getByText('Adding...')
      expect(disabledButton).toBeDisabled()
    })

    it('requires authentication to add builder', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      })
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ builders: mockBuilders }),
      })

      render(<BuilderSelector value={null} onChange={mockOnChange} />)

      const selector = screen.getByText('Select a builder...')
      fireEvent.click(selector)

      await waitFor(() => {
        const addButton = screen.getByText('+ Add New Builder')
        fireEvent.click(addButton)
      })

      const nameInput = screen.getByPlaceholderText('Enter builder name')
      fireEvent.change(nameInput, { target: { value: 'New Builder' } })

      const submitButton = screen.getByText('Add Builder')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(global.fetch).not.toHaveBeenCalledWith('/api/builders/create', expect.any(Object))
      })
    })
  })

  describe('CSS Classes and Styling', () => {
    it('applies hover styles to selector', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ builders: [] }),
      })

      const { container } = render(<BuilderSelector value={null} onChange={mockOnChange} />)

      await waitFor(() => {
        const selectorDiv = container.querySelector('.cursor-pointer')
        expect(selectorDiv).toHaveClass('hover:border-blue-500')
      })
    })

    it('applies correct classes to dropdown', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ builders: mockBuilders }),
      })

      render(<BuilderSelector value={null} onChange={mockOnChange} />)

      const selector = screen.getByText('Select a builder...')
      fireEvent.click(selector)

      await waitFor(() => {
        const dropdown = screen.getByPlaceholderText('Search builders...').closest('.absolute')
        expect(dropdown).toHaveClass('z-50', 'bg-white', 'shadow-lg')
      })
    })

    it('applies required field asterisk', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ builders: mockBuilders }),
      })

      render(<BuilderSelector value={null} onChange={mockOnChange} />)

      const selector = screen.getByText('Select a builder...')
      fireEvent.click(selector)

      await waitFor(() => {
        const addButton = screen.getByText('+ Add New Builder')
        fireEvent.click(addButton)
      })

      await waitFor(() => {
        const asterisks = document.querySelectorAll('.text-red-500')
        expect(asterisks.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Accessibility', () => {
    it('renders label for builder name input', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ builders: mockBuilders }),
      })

      render(<BuilderSelector value={null} onChange={mockOnChange} />)

      const selector = screen.getByText('Select a builder...')
      fireEvent.click(selector)

      await waitFor(() => {
        const addButton = screen.getByText('+ Add New Builder')
        fireEvent.click(addButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Builder Name')).toBeInTheDocument()
      })
    })

    it('renders label for website input', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ builders: mockBuilders }),
      })

      render(<BuilderSelector value={null} onChange={mockOnChange} />)

      const selector = screen.getByText('Select a builder...')
      fireEvent.click(selector)

      await waitFor(() => {
        const addButton = screen.getByText('+ Add New Builder')
        fireEvent.click(addButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Website (Optional)')).toBeInTheDocument()
      })
    })
  })
})
