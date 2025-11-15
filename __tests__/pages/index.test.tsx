import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/router'
import Home from '@/pages/index'
import { mockRouter } from '@/__tests__/utils/test-utils'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
}))

describe('Home Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
  })

  it('renders home page correctly', () => {
    render(<Home />)
    expect(screen.getByText(/redefining real estate/i)).toBeInTheDocument()
  })

  it('shows the main tagline', () => {
    render(<Home />)
    expect(screen.getByText(/with you/i)).toBeInTheDocument()
  })

  it('displays city links', () => {
    render(<Home />)

    expect(screen.getByText(/Hyderabad/i)).toBeInTheDocument()
    expect(screen.getByText(/Bengaluru/i)).toBeInTheDocument()
    expect(screen.getByText(/Mumbai/i)).toBeInTheDocument()
    expect(screen.getByText(/Delhi/i)).toBeInTheDocument()
  })

  it('shows search input', () => {
    render(<Home />)
    const searchInput = screen.getByPlaceholderText(/browse properties for free/i)
    expect(searchInput).toBeInTheDocument()
  })

  it('navigates to properties page on search submit', async () => {
    render(<Home />)

    const searchInput = screen.getByPlaceholderText(/browse properties for free/i)
    fireEvent.change(searchInput, { target: { value: 'Hyderabad' } })

    const form = searchInput.closest('form')
    fireEvent.submit(form!)

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith({
        pathname: '/properties',
        query: { location: 'Hyderabad' },
      })
    })
  })

  it('has search functionality', () => {
    render(<Home />)
    const searchInput = screen.getByPlaceholderText(/browse properties for free/i)
    expect(searchInput).toBeInTheDocument()
    expect(searchInput).toHaveAttribute('type', 'text')
  })

  it('displays benefits section', () => {
    render(<Home />)

    expect(screen.getByText(/for buyers/i)).toBeInTheDocument()
    expect(screen.getByText(/for sellers/i)).toBeInTheDocument()
    expect(screen.getByText(/for agents/i)).toBeInTheDocument()
    expect(screen.getByText(/for builders/i)).toBeInTheDocument()
  })

  it('shows buyers benefit description', () => {
    render(<Home />)
    expect(screen.getByText(/discover your dream home from verified listings/i)).toBeInTheDocument()
  })

  it('shows sellers benefit description', () => {
    render(<Home />)
    expect(screen.getByText(/list your property for free/i)).toBeInTheDocument()
  })

  it('shows agents benefit description', () => {
    render(<Home />)
    expect(screen.getByText(/grow your business with our platform/i)).toBeInTheDocument()
  })

  it('shows builders benefit description', () => {
    render(<Home />)
    expect(screen.getByText(/showcase your projects to qualified buyers/i)).toBeInTheDocument()
  })

  it('displays agents showcase section', () => {
    render(<Home />)
    expect(screen.getByText(/connect with top agents/i)).toBeInTheDocument()
    expect(screen.getByText(/browse all agents/i)).toBeInTheDocument()
  })

  it('displays builders showcase section', () => {
    render(<Home />)
    expect(screen.getByText(/explore premium projects/i)).toBeInTheDocument()
    expect(screen.getByText(/view all builders/i)).toBeInTheDocument()
  })

  it('has link to agents page', () => {
    render(<Home />)
    const agentsLink = screen.getByText(/browse all agents/i).closest('a')
    expect(agentsLink).toHaveAttribute('href', '/agents')
  })

  it('has link to builders page', () => {
    render(<Home />)
    const buildersLink = screen.getByText(/view all builders/i).closest('a')
    expect(buildersLink).toHaveAttribute('href', '/builders')
  })

  it('city links navigate to forum discussions', () => {
    render(<Home />)
    const hyderabadLink = screen.getByText(/Hyderabad/i).closest('a')
    expect(hyderabadLink).toHaveAttribute('href', '/forum/category/general-discussions/hyderabad')
  })
})
