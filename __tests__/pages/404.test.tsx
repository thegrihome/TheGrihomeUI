import React from 'react'
import { render, screen } from '@testing-library/react'
import Error404 from '@/pages/404'

jest.mock('@/components/Header', () => ({
  __esModule: true,
  default: () => <div data-testid="header">Header</div>,
}))

jest.mock('@/components/Footer', () => ({
  __esModule: true,
  default: () => <div data-testid="footer">Footer</div>,
}))

describe('404 Error Page', () => {
  it('should render 404 page', () => {
    render(<Error404 />)

    expect(screen.getByText('404')).toBeInTheDocument()
  })

  it('should render Header component', () => {
    render(<Error404 />)

    expect(screen.getByTestId('header')).toBeInTheDocument()
  })

  it('should render Footer component', () => {
    render(<Error404 />)

    expect(screen.getByTestId('footer')).toBeInTheDocument()
  })

  it('should display error message', () => {
    render(<Error404 />)

    expect(screen.getByText(/You've reached an invalid page in Grihome/i)).toBeInTheDocument()
  })

  it('should display description', () => {
    render(<Error404 />)

    expect(screen.getByText(/The page you're looking for doesn't exist/i)).toBeInTheDocument()
  })

  it('should have Return Home link', () => {
    render(<Error404 />)

    const link = screen.getByText('Return Home')
    expect(link).toBeInTheDocument()
    expect(link.closest('a')).toHaveAttribute('href', '/')
  })

  it('should have correct page title in Head', () => {
    render(<Error404 />)

    expect(document.title).toBe('404: Page was not found.')
  })

  it('should apply dark mode classes', () => {
    const { container } = render(<Error404 />)

    const darkBg = container.querySelector('.dark\\:bg-black')
    expect(darkBg).toBeInTheDocument()
  })

  it('should have responsive layout classes', () => {
    const { container } = render(<Error404 />)

    const flexContainer = container.querySelector('.md\\:flex-row')
    expect(flexContainer).toBeInTheDocument()
  })

  it('should display large 404 text', () => {
    const { container } = render(<Error404 />)

    const heading = screen.getByText('404')
    expect(heading.className).toContain('text-6xl')
    expect(heading.className).toContain('md:text-8xl')
  })
})
