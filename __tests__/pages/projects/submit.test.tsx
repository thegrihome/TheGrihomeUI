import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import ProjectSubmit from '@/pages/projects/submit'
import { mockRouter, mockSession, mockFetchSuccess } from '@/__tests__/utils/test-utils'

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

  it('redirects unauthenticated users to login', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    render(<ProjectSubmit />)

    expect(mockRouter.push).toHaveBeenCalledWith('/auth/login')
  })

  it('shows basic form structure', async () => {
    render(<ProjectSubmit />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/project name/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/project description/i)).toBeInTheDocument()
    })
  })
})
