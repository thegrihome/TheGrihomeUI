import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import ProjectSubmit from '@/pages/projects/submit'
import { mockRouter, mockSession, mockFetchSuccess, mockFetchError } from '@/__tests__/utils/test-utils'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}))

const mockBuilders = [
  { id: 'builder-1', name: 'Test Builder', website: 'https://testbuilder.com' },
  { id: 'builder-2', name: 'Another Builder', website: null },
]

describe('Project Submit Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useSession as jest.Mock).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    })

    // Mock builders fetch
    mockFetchSuccess({ builders: mockBuilders })
  })

  it('renders project submit page correctly', async () => {
    render(<ProjectSubmit />)

    await waitFor(() => {
      expect(screen.getByText(/submit new project/i)).toBeInTheDocument()
    })
  })

  it('requires authentication', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    render(<ProjectSubmit />)

    expect(screen.getByText(/please log in/i)).toBeInTheDocument()
  })

  it('shows all required form fields', async () => {
    render(<ProjectSubmit />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/project name/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/project description/i)).toBeInTheDocument()
      expect(screen.getByText(/select builder/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/location address/i)).toBeInTheDocument()
    })
  })

  it('shows builder selector dropdown', async () => {
    render(<ProjectSubmit />)

    await waitFor(() => {
      const builderSelector = screen.getByText(/select builder/i)
      expect(builderSelector).toBeInTheDocument()
    })
  })

  it('shows builder website and brochure URL inputs', async () => {
    render(<ProjectSubmit />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/builder website url/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/brochure url/i)).toBeInTheDocument()
    })
  })

  it('shows banner image uploader', async () => {
    render(<ProjectSubmit />)

    await waitFor(() => {
      expect(screen.getByText(/banner image/i)).toBeInTheDocument()
      expect(screen.getByText(/upload banner/i)).toBeInTheDocument()
    })
  })

  it('shows dynamic highlights list', async () => {
    render(<ProjectSubmit />)

    await waitFor(() => {
      expect(screen.getByText(/highlights/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/add highlight/i)).toBeInTheDocument()
    })
  })

  it('adds highlight to list', async () => {
    render(<ProjectSubmit />)

    await waitFor(() => {
      const highlightInput = screen.getByPlaceholderText(/add highlight/i)
      fireEvent.change(highlightInput, { target: { value: 'Great location' } })

      const addButton = screen.getAllByText('+')[0]
      fireEvent.click(addButton)
    })

    await waitFor(() => {
      expect(screen.getByText('Great location')).toBeInTheDocument()
    })
  })

  it('removes highlight from list', async () => {
    render(<ProjectSubmit />)

    await waitFor(() => {
      const highlightInput = screen.getByPlaceholderText(/add highlight/i)
      fireEvent.change(highlightInput, { target: { value: 'Great location' } })

      const addButton = screen.getAllByText('+')[0]
      fireEvent.click(addButton)
    })

    await waitFor(() => {
      const removeButton = screen.getByText('×')
      fireEvent.click(removeButton)
    })

    await waitFor(() => {
      expect(screen.queryByText('Great location')).not.toBeInTheDocument()
    })
  })

  it('shows dynamic amenities list', async () => {
    render(<ProjectSubmit />)

    await waitFor(() => {
      expect(screen.getByText(/amenities/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/add amenity/i)).toBeInTheDocument()
    })
  })

  it('adds amenity to list', async () => {
    render(<ProjectSubmit />)

    await waitFor(() => {
      const amenityInput = screen.getByPlaceholderText(/add amenity/i)
      fireEvent.change(amenityInput, { target: { value: 'Swimming Pool' } })

      const addButton = screen.getAllByText('+')[1]
      fireEvent.click(addButton)
    })

    await waitFor(() => {
      expect(screen.getByText('Swimming Pool')).toBeInTheDocument()
    })
  })

  it('shows image uploaders for floorplans, clubhouse, gallery', async () => {
    render(<ProjectSubmit />)

    await waitFor(() => {
      expect(screen.getByText(/floor plans \(up to 20\)/i)).toBeInTheDocument()
      expect(screen.getByText(/clubhouse images \(up to 10\)/i)).toBeInTheDocument()
      expect(screen.getByText(/gallery images \(up to 20\)/i)).toBeInTheDocument()
    })
  })

  it('shows walkthrough video URL input', async () => {
    render(<ProjectSubmit />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/youtube video url/i)).toBeInTheDocument()
    })
  })

  it('validates required fields on submit', async () => {
    render(<ProjectSubmit />)

    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /submit project/i })
      fireEvent.click(submitButton)
    })

    await waitFor(() => {
      expect(screen.getByText(/please fill in all required fields/i)).toBeInTheDocument()
    })
  })

  it('handles successful project submission', async () => {
    mockFetchSuccess({
      message: 'Project created successfully',
      project: { id: 'project-1' },
    })

    render(<ProjectSubmit />)

    await waitFor(() => {
      // Fill in required fields
      fireEvent.change(screen.getByPlaceholderText(/project name/i), {
        target: { value: 'Test Project' },
      })
      fireEvent.change(screen.getByPlaceholderText(/project description/i), {
        target: { value: 'A great project' },
      })
      fireEvent.change(screen.getByPlaceholderText(/location address/i), {
        target: { value: 'Hyderabad, Telangana' },
      })

      // Select builder
      const builderSelector = screen.getByText(/select builder/i)
      fireEvent.click(builderSelector)
    })

    await waitFor(() => {
      const builder = screen.getByText('Test Builder')
      fireEvent.click(builder)
    })

    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /submit project/i })
      fireEvent.click(submitButton)
    })

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/projects/project-1')
    })
  })

  it('shows error message on submission failure', async () => {
    mockFetchError('Failed to create project')

    render(<ProjectSubmit />)

    await waitFor(() => {
      // Fill in required fields
      fireEvent.change(screen.getByPlaceholderText(/project name/i), {
        target: { value: 'Test Project' },
      })
      fireEvent.change(screen.getByPlaceholderText(/project description/i), {
        target: { value: 'A great project' },
      })
      fireEvent.change(screen.getByPlaceholderText(/location address/i), {
        target: { value: 'Hyderabad, Telangana' },
      })

      const submitButton = screen.getByRole('button', { name: /submit project/i })
      fireEvent.click(submitButton)
    })

    await waitFor(() => {
      expect(screen.getByText(/failed to create project/i)).toBeInTheDocument()
    })
  })

  it('shows project type selector', async () => {
    render(<ProjectSubmit />)

    await waitFor(() => {
      expect(screen.getByText(/residential/i)).toBeInTheDocument()
      expect(screen.getByText(/commercial/i)).toBeInTheDocument()
    })
  })

  it('allows selecting project type', async () => {
    render(<ProjectSubmit />)

    await waitFor(() => {
      const commercialRadio = screen.getByLabelText(/commercial/i)
      fireEvent.click(commercialRadio)
    })

    await waitFor(() => {
      expect(screen.getByLabelText(/commercial/i)).toBeChecked()
    })
  })
})
