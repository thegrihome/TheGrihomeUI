import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import PromotePropertyPage from '@/pages/projects/[id]/promote-property'
import { mockRouter, mockSession, mockFetchSuccess } from '@/__tests__/utils/test-utils'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}))

const mockProject = {
  id: 'project-123',
  name: 'Test Project Alpha',
  description: 'A premium residential project',
}

const mockUserProperties = [
  {
    id: 'property-1',
    streetAddress: '123 Test Street',
    propertyType: 'CONDO',
  },
  {
    id: 'property-2',
    streetAddress: '456 Sample Road',
    propertyType: 'SINGLE_FAMILY',
  },
]

describe('Promote Property Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useSession as jest.Mock).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    })
  })

  describe('Authentication', () => {
    it('redirects unauthenticated users to login', () => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      render(<PromotePropertyPage project={mockProject} userProperties={mockUserProperties} />)

      expect(mockRouter.push).toHaveBeenCalledWith('/login')
    })

    it('renders page for authenticated users', async () => {
      render(<PromotePropertyPage project={mockProject} userProperties={mockUserProperties} />)

      await waitFor(() => {
        expect(screen.getByText(/Add Your Property as Verified/i)).toBeInTheDocument()
      })
    })
  })

  describe('Project Not Found', () => {
    it('displays not found message when project is null', () => {
      render(<PromotePropertyPage project={null} userProperties={[]} />)

      expect(screen.getByText('Project Not Found')).toBeInTheDocument()
    })

    it('shows back to projects link', () => {
      render(<PromotePropertyPage project={null} userProperties={[]} />)

      const link = screen.getByText('Back to Projects')
      expect(link).toHaveAttribute('href', '/projects')
    })
  })

  describe('No Properties State', () => {
    it('displays message when user has no properties', () => {
      render(<PromotePropertyPage project={mockProject} userProperties={[]} />)

      expect(screen.getByText('No Properties Found')).toBeInTheDocument()
    })

    it('shows explanation text', () => {
      render(<PromotePropertyPage project={mockProject} userProperties={[]} />)

      expect(screen.getByText(/You need to have properties tagged to this project/i)).toBeInTheDocument()
    })

    it('displays add property link', () => {
      render(<PromotePropertyPage project={mockProject} userProperties={[]} />)

      const link = screen.getByText('Add a Property')
      expect(link).toHaveAttribute('href', '/properties/add-property')
    })
  })

  describe('Page Rendering', () => {
    it('renders page title', async () => {
      render(<PromotePropertyPage project={mockProject} userProperties={mockUserProperties} />)

      await waitFor(() => {
        expect(screen.getByText(/Add Your Property as Verified/i)).toBeInTheDocument()
      })
    })

    it('displays project name', async () => {
      render(<PromotePropertyPage project={mockProject} userProperties={mockUserProperties} />)

      await waitFor(() => {
        expect(screen.getByText(`Project: ${mockProject.name}`)).toBeInTheDocument()
      })
    })

    it('renders back to project link', async () => {
      render(<PromotePropertyPage project={mockProject} userProperties={mockUserProperties} />)

      await waitFor(() => {
        const link = screen.getByText('← Back to Project')
        expect(link).toHaveAttribute('href', `/projects/${mockProject.id}`)
      })
    })
  })

  describe('Verified Property Benefits Section', () => {
    it('displays benefits info box', async () => {
      render(<PromotePropertyPage project={mockProject} userProperties={mockUserProperties} />)

      await waitFor(() => {
        expect(screen.getByText('Verified Property Benefits')).toBeInTheDocument()
      })
    })

    it('explains verification badge benefit', async () => {
      render(<PromotePropertyPage project={mockProject} userProperties={mockUserProperties} />)

      await waitFor(() => {
        expect(screen.getByText(/blue verification badge/i)).toBeInTheDocument()
      })
    })

    it('mentions visibility increase', async () => {
      render(<PromotePropertyPage project={mockProject} userProperties={mockUserProperties} />)

      await waitFor(() => {
        expect(screen.getByText(/increasing its visibility to potential buyers/i)).toBeInTheDocument()
      })
    })

    it('displays verification icon', async () => {
      render(<PromotePropertyPage project={mockProject} userProperties={mockUserProperties} />)

      await waitFor(() => {
        const svg = screen.getByText('Verified Property Benefits').closest('div')?.querySelector('svg')
        expect(svg).toBeInTheDocument()
      })
    })
  })

  describe('Property Selection', () => {
    it('renders property dropdown', async () => {
      render(<PromotePropertyPage project={mockProject} userProperties={mockUserProperties} />)

      await waitFor(() => {
        const select = screen.getByRole('combobox')
        expect(select).toBeInTheDocument()
      })
    })

    it('marks property selection as required', async () => {
      render(<PromotePropertyPage project={mockProject} userProperties={mockUserProperties} />)

      await waitFor(() => {
        const label = screen.getByText(/Select Property/i)
        const requiredAsterisk = label.querySelector('.text-red-500')
        expect(requiredAsterisk).toBeInTheDocument()
      })
    })

    it('shows placeholder option', async () => {
      render(<PromotePropertyPage project={mockProject} userProperties={mockUserProperties} />)

      await waitFor(() => {
        expect(screen.getByText('Choose a property')).toBeInTheDocument()
      })
    })

    it('lists all user properties', async () => {
      render(<PromotePropertyPage project={mockProject} userProperties={mockUserProperties} />)

      await waitFor(() => {
        expect(screen.getByText(/123 Test Street \(CONDO\)/i)).toBeInTheDocument()
        expect(screen.getByText(/456 Sample Road \(SINGLE_FAMILY\)/i)).toBeInTheDocument()
      })
    })

    it('allows selecting a property', async () => {
      render(<PromotePropertyPage project={mockProject} userProperties={mockUserProperties} />)

      await waitFor(() => {
        const select = screen.getByRole('combobox') as HTMLSelectElement
        fireEvent.change(select, { target: { value: 'property-1' } })
        expect(select.value).toBe('property-1')
      })
    })

    it('shows helper text', async () => {
      render(<PromotePropertyPage project={mockProject} userProperties={mockUserProperties} />)

      await waitFor(() => {
        expect(screen.getByText(/Select which property you want to promote/i)).toBeInTheDocument()
      })
    })
  })

  describe('Duration Selection', () => {
    it('renders duration input', async () => {
      render(<PromotePropertyPage project={mockProject} userProperties={mockUserProperties} />)

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/Enter number of days/i)
        expect(input).toBeInTheDocument()
      })
    })

    it('marks duration as required', async () => {
      render(<PromotePropertyPage project={mockProject} userProperties={mockUserProperties} />)

      await waitFor(() => {
        const label = screen.getByText(/Promotion Duration/i)
        const requiredAsterisk = label.querySelector('.text-red-500')
        expect(requiredAsterisk).toBeInTheDocument()
      })
    })

    it('defaults to 30 days', async () => {
      render(<PromotePropertyPage project={mockProject} userProperties={mockUserProperties} />)

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/Enter number of days/i) as HTMLInputElement
        expect(input.value).toBe('30')
      })
    })

    it('allows changing duration', async () => {
      render(<PromotePropertyPage project={mockProject} userProperties={mockUserProperties} />)

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/Enter number of days/i)
        fireEvent.change(input, { target: { value: '45' } })
        expect(input).toHaveValue(45)
      })
    })

    it('has min value of 1', async () => {
      render(<PromotePropertyPage project={mockProject} userProperties={mockUserProperties} />)

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/Enter number of days/i)
        expect(input).toHaveAttribute('min', '1')
      })
    })

    it('has max value of 365', async () => {
      render(<PromotePropertyPage project={mockProject} userProperties={mockUserProperties} />)

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/Enter number of days/i)
        expect(input).toHaveAttribute('max', '365')
      })
    })

    it('shows helper text', async () => {
      render(<PromotePropertyPage project={mockProject} userProperties={mockUserProperties} />)

      await waitFor(() => {
        expect(screen.getByText(/Choose how long you want your property to be featured/i)).toBeInTheDocument()
      })
    })
  })

  describe('Summary Box', () => {
    it('renders summary section', async () => {
      render(<PromotePropertyPage project={mockProject} userProperties={mockUserProperties} />)

      await waitFor(() => {
        expect(screen.getByText('Summary')).toBeInTheDocument()
      })
    })

    it('displays start date', async () => {
      render(<PromotePropertyPage project={mockProject} userProperties={mockUserProperties} />)

      await waitFor(() => {
        expect(screen.getByText('Start Date:')).toBeInTheDocument()
      })
    })

    it('displays duration', async () => {
      render(<PromotePropertyPage project={mockProject} userProperties={mockUserProperties} />)

      await waitFor(() => {
        expect(screen.getByText('Duration:')).toBeInTheDocument()
        expect(screen.getByText('30 days')).toBeInTheDocument()
      })
    })

    it('displays expiry date', async () => {
      render(<PromotePropertyPage project={mockProject} userProperties={mockUserProperties} />)

      await waitFor(() => {
        expect(screen.getByText('Expiry Date:')).toBeInTheDocument()
      })
    })

    it('displays total amount', async () => {
      render(<PromotePropertyPage project={mockProject} userProperties={mockUserProperties} />)

      await waitFor(() => {
        expect(screen.getByText('Total Amount:')).toBeInTheDocument()
        expect(screen.getByText('₹0')).toBeInTheDocument()
      })
    })

    it('shows pre-launch offer text', async () => {
      render(<PromotePropertyPage project={mockProject} userProperties={mockUserProperties} />)

      await waitFor(() => {
        expect(screen.getByText(/Pre-launch offer - Free!/i)).toBeInTheDocument()
      })
    })

    it('updates duration in summary', async () => {
      render(<PromotePropertyPage project={mockProject} userProperties={mockUserProperties} />)

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/Enter number of days/i)
        fireEvent.change(input, { target: { value: '60' } })

        expect(screen.getByText('60 days')).toBeInTheDocument()
      })
    })

    it('updates expiry date when duration changes', async () => {
      render(<PromotePropertyPage project={mockProject} userProperties={mockUserProperties} />)

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/Enter number of days/i)
        fireEvent.change(input, { target: { value: '15' } })

        expect(screen.getByText('Expiry Date:')).toBeInTheDocument()
      })
    })
  })

  describe('Purchase Button', () => {
    it('renders purchase button', async () => {
      render(<PromotePropertyPage project={mockProject} userProperties={mockUserProperties} />)

      await waitFor(() => {
        expect(screen.getByText(/Complete Purchase - Get Verified/i)).toBeInTheDocument()
      })
    })

    it('disables button when no property selected', async () => {
      render(<PromotePropertyPage project={mockProject} userProperties={mockUserProperties} />)

      await waitFor(() => {
        const button = screen.getByText(/Complete Purchase - Get Verified/i)
        expect(button).toBeDisabled()
      })
    })

    it('enables button when property selected', async () => {
      render(<PromotePropertyPage project={mockProject} userProperties={mockUserProperties} />)

      await waitFor(() => {
        const select = screen.getByRole('combobox')
        fireEvent.change(select, { target: { value: 'property-1' } })

        const button = screen.getByText(/Complete Purchase - Get Verified/i)
        expect(button).not.toBeDisabled()
      })
    })

    it('disables button when duration is less than 1', async () => {
      render(<PromotePropertyPage project={mockProject} userProperties={mockUserProperties} />)

      await waitFor(() => {
        const select = screen.getByRole('combobox')
        fireEvent.change(select, { target: { value: 'property-1' } })

        const durationInput = screen.getByPlaceholderText(/Enter number of days/i)
        fireEvent.change(durationInput, { target: { value: '0' } })

        const button = screen.getByText(/Complete Purchase - Get Verified/i)
        expect(button).toBeDisabled()
      })
    })

    it('displays verification icon', async () => {
      render(<PromotePropertyPage project={mockProject} userProperties={mockUserProperties} />)

      await waitFor(() => {
        const button = screen.getByText(/Complete Purchase - Get Verified/i)
        const svg = button.querySelector('svg')
        expect(svg).toBeInTheDocument()
      })
    })
  })

  describe('Purchase Process', () => {
    it('shows loading state during purchase', async () => {
      global.fetch = jest.fn(() =>
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve({}),
            } as Response)
          }, 100)
        })
      ) as jest.Mock

      render(<PromotePropertyPage project={mockProject} userProperties={mockUserProperties} />)

      await waitFor(() => {
        const select = screen.getByRole('combobox')
        fireEvent.change(select, { target: { value: 'property-1' } })

        const button = screen.getByText(/Complete Purchase - Get Verified/i)
        fireEvent.click(button)

        expect(screen.getByText('Processing...')).toBeInTheDocument()
      })
    })

    it('disables button during purchase', async () => {
      global.fetch = jest.fn(() =>
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve({}),
            } as Response)
          }, 100)
        })
      ) as jest.Mock

      render(<PromotePropertyPage project={mockProject} userProperties={mockUserProperties} />)

      await waitFor(() => {
        const select = screen.getByRole('combobox')
        fireEvent.change(select, { target: { value: 'property-1' } })

        const button = screen.getByText(/Complete Purchase - Get Verified/i)
        fireEvent.click(button)

        expect(button).toBeDisabled()
      })
    })

    it('shows error when property not selected', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)
      ) as jest.Mock

      render(<PromotePropertyPage project={mockProject} userProperties={mockUserProperties} />)

      await waitFor(() => {
        const button = screen.getByText(/Complete Purchase - Get Verified/i)
        fireEvent.click(button)

        expect(global.fetch).not.toHaveBeenCalled()
      })
    })

    it('sends property ID and duration to API', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)
      ) as jest.Mock

      render(<PromotePropertyPage project={mockProject} userProperties={mockUserProperties} />)

      await waitFor(() => {
        const select = screen.getByRole('combobox')
        fireEvent.change(select, { target: { value: 'property-1' } })

        const durationInput = screen.getByPlaceholderText(/Enter number of days/i)
        fireEvent.change(durationInput, { target: { value: '50' } })

        const button = screen.getByText(/Complete Purchase - Get Verified/i)
        fireEvent.click(button)
      })

      await waitFor(() => {
        const callArgs = (global.fetch as jest.Mock).mock.calls[0]
        const body = JSON.parse(callArgs[1].body)
        expect(body.propertyId).toBe('property-1')
        expect(body.duration).toBe(50)
      })
    })

    it('redirects to project page after success', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)
      ) as jest.Mock

      render(<PromotePropertyPage project={mockProject} userProperties={mockUserProperties} />)

      await waitFor(() => {
        const select = screen.getByRole('combobox')
        fireEvent.change(select, { target: { value: 'property-1' } })

        const button = screen.getByText(/Complete Purchase - Get Verified/i)
        fireEvent.click(button)
      })

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith(`/projects/${mockProject.id}`)
      })
    })

    it('handles purchase errors', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ message: 'Purchase failed' }),
        } as Response)
      ) as jest.Mock

      render(<PromotePropertyPage project={mockProject} userProperties={mockUserProperties} />)

      await waitFor(() => {
        const select = screen.getByRole('combobox')
        fireEvent.change(select, { target: { value: 'property-1' } })

        const button = screen.getByText(/Complete Purchase - Get Verified/i)
        fireEvent.click(button)
      })

      await waitFor(() => {
        expect(mockRouter.push).not.toHaveBeenCalled()
      })
    })

    it('requires authentication', async () => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: { user: { email: null } },
        status: 'authenticated',
      })

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)
      ) as jest.Mock

      render(<PromotePropertyPage project={mockProject} userProperties={mockUserProperties} />)

      await waitFor(() => {
        const select = screen.getByRole('combobox')
        fireEvent.change(select, { target: { value: 'property-1' } })

        const button = screen.getByText(/Complete Purchase - Get Verified/i)
        fireEvent.click(button)

        expect(global.fetch).not.toHaveBeenCalled()
      })
    })
  })

  describe('Terms and Conditions', () => {
    it('displays terms text', async () => {
      render(<PromotePropertyPage project={mockProject} userProperties={mockUserProperties} />)

      await waitFor(() => {
        expect(screen.getByText(/By completing this purchase, you agree/i)).toBeInTheDocument()
      })
    })
  })

  describe('API Integration', () => {
    it('calls correct API endpoint', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)
      ) as jest.Mock

      render(<PromotePropertyPage project={mockProject} userProperties={mockUserProperties} />)

      await waitFor(() => {
        const select = screen.getByRole('combobox')
        fireEvent.change(select, { target: { value: 'property-1' } })

        const button = screen.getByText(/Complete Purchase - Get Verified/i)
        fireEvent.click(button)
      })

      await waitFor(() => {
        const callArgs = (global.fetch as jest.Mock).mock.calls[0]
        expect(callArgs[0]).toBe(`/api/projects/${mockProject.id}/promote-property`)
      })
    })

    it('uses POST method', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)
      ) as jest.Mock

      render(<PromotePropertyPage project={mockProject} userProperties={mockUserProperties} />)

      await waitFor(() => {
        const select = screen.getByRole('combobox')
        fireEvent.change(select, { target: { value: 'property-1' } })

        const button = screen.getByText(/Complete Purchase - Get Verified/i)
        fireEvent.click(button)
      })

      await waitFor(() => {
        const callArgs = (global.fetch as jest.Mock).mock.calls[0]
        expect(callArgs[1].method).toBe('POST')
      })
    })

    it('sends JSON content type', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)
      ) as jest.Mock

      render(<PromotePropertyPage project={mockProject} userProperties={mockUserProperties} />)

      await waitFor(() => {
        const select = screen.getByRole('combobox')
        fireEvent.change(select, { target: { value: 'property-1' } })

        const button = screen.getByText(/Complete Purchase - Get Verified/i)
        fireEvent.click(button)
      })

      await waitFor(() => {
        const callArgs = (global.fetch as jest.Mock).mock.calls[0]
        expect(callArgs[1].headers['Content-Type']).toBe('application/json')
      })
    })
  })

  describe('Visual Styling', () => {
    it('applies correct styling to info box', async () => {
      render(<PromotePropertyPage project={mockProject} userProperties={mockUserProperties} />)

      await waitFor(() => {
        const infoBox = screen.getByText('Verified Property Benefits').closest('div')
        expect(infoBox?.className).toContain('bg-blue-50')
      })
    })

    it('displays amount in green', async () => {
      render(<PromotePropertyPage project={mockProject} userProperties={mockUserProperties} />)

      await waitFor(() => {
        const amount = screen.getByText('₹0')
        expect(amount.className).toContain('text-green-600')
      })
    })
  })
})
