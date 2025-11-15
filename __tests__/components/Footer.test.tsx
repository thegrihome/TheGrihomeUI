import React from 'react'
import { render, screen } from '@testing-library/react'
import { useRouter } from 'next/router'
import Footer from '@/components/Footer'
import { mockRouter } from '@/__tests__/utils/test-utils'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

describe('Footer Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
  })

  it('renders footer correctly', () => {
    render(<Footer />)
    expect(screen.getByText(/copyright: © grihome\. all rights reserved/i)).toBeInTheDocument()
  })

  it('shows copyright notice', () => {
    render(<Footer />)
    expect(screen.getByText(/grihome/i)).toBeInTheDocument()
    expect(screen.getByText(/all rights reserved/i)).toBeInTheDocument()
  })

  it('does not show builders link (removed from footer)', () => {
    render(<Footer />)
    // Builders link was removed per requirements
    const buildersLinks = screen.queryAllByText(/builders/i)
    expect(buildersLinks).toHaveLength(0)
  })

  it('does not show agents link (removed from footer)', () => {
    render(<Footer />)
    // Agents link was removed per requirements
    const agentsLinks = screen.queryAllByText(/agents/i)
    expect(agentsLinks).toHaveLength(0)
  })

  it('shows social media links', () => {
    render(<Footer />)

    const emailLink = screen.getByLabelText(/mail/i)
    const twitterLink = screen.getByLabelText(/x/i)
    const instagramLink = screen.getByLabelText(/instagram/i)
    const facebookLink = screen.getByLabelText(/facebook/i)

    expect(emailLink).toBeInTheDocument()
    expect(twitterLink).toBeInTheDocument()
    expect(instagramLink).toBeInTheDocument()
    expect(facebookLink).toBeInTheDocument()
  })

  it('email link has correct mailto', () => {
    render(<Footer />)

    const emailLink = screen.getByLabelText(/mail/i)
    expect(emailLink).toHaveAttribute('href', 'mailto:thegrihome@gmail.com?subject=From Grihome!')
  })

  it('twitter link opens in new tab', () => {
    render(<Footer />)

    const twitterLink = screen.getByLabelText(/x/i)
    expect(twitterLink).toHaveAttribute('target', '_blank')
    expect(twitterLink).toHaveAttribute('rel', 'noreferrer')
    expect(twitterLink).toHaveAttribute('href', 'https://x.com/grihome')
  })

  it('instagram link opens in new tab', () => {
    render(<Footer />)

    const instagramLink = screen.getByLabelText(/instagram/i)
    expect(instagramLink).toHaveAttribute('target', '_blank')
    expect(instagramLink).toHaveAttribute('rel', 'noreferrer')
    expect(instagramLink).toHaveAttribute('href', 'https://instagram.com/gri.home')
  })

  it('facebook link opens in new tab', () => {
    render(<Footer />)

    const facebookLink = screen.getByLabelText(/facebook/i)
    expect(facebookLink).toHaveAttribute('target', '_blank')
    expect(facebookLink).toHaveAttribute('rel', 'noreferrer')
    expect(facebookLink).toHaveAttribute(
      'href',
      'https://www.facebook.com/profile.php?id=61579380794505'
    )
  })

  it('renders footer structure', () => {
    render(<Footer />)
    // Just verify footer renders without error
    const footerElement = screen.getByText(/copyright/i)
    expect(footerElement).toBeInTheDocument()
  })
})
