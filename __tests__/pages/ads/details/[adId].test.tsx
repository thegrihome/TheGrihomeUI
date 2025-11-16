import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { GetServerSidePropsContext } from 'next'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import AdDetailPage, { getServerSideProps } from '@/pages/ads/details/[adId]'
import { prisma } from '@/lib/cockroachDB/prisma'

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
  default: (props: any) => <img {...props} />,
}))

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    ad: {
      findUnique: jest.fn(),
    },
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

const mockAdWithProperty = {
  id: 'ad1',
  slotNumber: 1,
  startDate: '2024-01-01T00:00:00.000Z',
  endDate: '2024-01-08T00:00:00.000Z',
  totalDays: 7,
  pricePerDay: 1500,
  totalAmount: 10500,
  status: 'ACTIVE',
  paymentStatus: 'COMPLETED',
  createdAt: '2024-01-01T00:00:00.000Z',
  user: {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
  },
  property: {
    id: 'prop1',
    streetAddress: '123 Main St',
    propertyType: 'APARTMENT',
    sqFt: 1200,
    thumbnailUrl: 'https://example.com/prop1.jpg',
    propertyDetails: {},
    location: {
      city: 'Mumbai',
      state: 'Maharashtra',
      locality: 'Bandra',
    },
  },
}

describe('AdDetailPage - Comprehensive Tests', () => {
  const mockPush = jest.fn()
  const mockReplace = jest.fn()
  const mockUseSession = useSession as jest.Mock
  const mockUseRouter = useRouter as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    })
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Owner Access', () => {
    it('should render ad details for owner', () => {
      render(<AdDetailPage ad={mockAdWithProperty} isOwner={true} />)

      expect(screen.getByTestId('header')).toBeInTheDocument()
      expect(screen.getByTestId('footer')).toBeInTheDocument()
      expect(screen.getByText('Ad Slot #1 Details')).toBeInTheDocument()
    })

    it('should display all ad information for owner', () => {
      render(<AdDetailPage ad={mockAdWithProperty} isOwner={true} />)

      expect(screen.getByText('Ad Slot #1 Details')).toBeInTheDocument()
      expect(screen.getByText('Active')).toBeInTheDocument()
      expect(screen.getByText('COMPLETED')).toBeInTheDocument()
    })

    it('should show property details', () => {
      render(<AdDetailPage ad={mockAdWithProperty} isOwner={true} />)

      expect(screen.getByText('123 Main St')).toBeInTheDocument()
      expect(screen.getByText(/APARTMENT/)).toBeInTheDocument()
      expect(screen.getByText(/1200 sq ft/)).toBeInTheDocument()
    })

    it('should display ad duration', () => {
      render(<AdDetailPage ad={mockAdWithProperty} isOwner={true} />)

      expect(screen.getByText('7 days')).toBeInTheDocument()
    })

    it('should display price information', () => {
      render(<AdDetailPage ad={mockAdWithProperty} isOwner={true} />)

      expect(screen.getByText('₹1500.00')).toBeInTheDocument()
      expect(screen.getByText('₹10500.00')).toBeInTheDocument()
    })

    it('should display start and end dates', () => {
      render(<AdDetailPage ad={mockAdWithProperty} isOwner={true} />)

      expect(screen.getAllByText(/January/)[0]).toBeInTheDocument()
    })
  })

  describe('Non-Owner Redirect', () => {
    it('should show loading for non-owner', () => {
      mockUseSession.mockReturnValue({
        data: { user: { email: 'other@example.com' } },
        status: 'authenticated',
      })

      render(<AdDetailPage ad={mockAdWithProperty} isOwner={false} />)

      expect(screen.getByRole('generic', { hidden: true })).toHaveClass('animate-spin')
    })

    it('should redirect non-owner to property page', () => {
      mockUseSession.mockReturnValue({
        data: { user: { email: 'other@example.com' } },
        status: 'authenticated',
      })

      render(<AdDetailPage ad={mockAdWithProperty} isOwner={false} />)

      waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/properties/prop1')
      })
    })

    it('should redirect to project page when ad is for project', () => {
      const adWithProject = {
        ...mockAdWithProperty,
        property: undefined,
        project: {
          id: 'proj1',
          name: 'Luxury Villas',
          description: 'Premium villas',
          thumbnailUrl: 'https://example.com/proj1.jpg',
          location: {
            city: 'Mumbai',
            state: 'Maharashtra',
            locality: 'Bandra',
          },
        },
      }

      mockUseSession.mockReturnValue({
        data: { user: { email: 'other@example.com' } },
        status: 'authenticated',
      })

      render(<AdDetailPage ad={adWithProject} isOwner={false} />)

      waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/projects/proj1')
      })
    })
  })

  describe('Ad Status Display', () => {
    it('should show Active status for active ad', () => {
      render(<AdDetailPage ad={mockAdWithProperty} isOwner={true} />)

      expect(screen.getByText('Active')).toBeInTheDocument()
    })

    it('should show Expired status for expired ad', () => {
      const expiredAd = {
        ...mockAdWithProperty,
        status: 'EXPIRED',
        endDate: '2023-01-01T00:00:00.000Z',
      }

      render(<AdDetailPage ad={expiredAd} isOwner={true} />)

      expect(screen.getAllByText('Expired')[0]).toBeInTheDocument()
    })

    it('should show expiring soon warning', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const expiringSoonAd = {
        ...mockAdWithProperty,
        endDate: tomorrow.toISOString(),
      }

      render(<AdDetailPage ad={expiringSoonAd} isOwner={true} />)

      expect(screen.getByText(/expiring soon/i)).toBeInTheDocument()
    })

    it('should show expired warning', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      const expiredAd = {
        ...mockAdWithProperty,
        status: 'EXPIRED',
        endDate: yesterday.toISOString(),
      }

      render(<AdDetailPage ad={expiredAd} isOwner={true} />)

      expect(screen.getByText(/has expired/i)).toBeInTheDocument()
    })
  })

  describe('Property Display', () => {
    it('should display property thumbnail when available', () => {
      render(<AdDetailPage ad={mockAdWithProperty} isOwner={true} />)

      const thumbnail = screen.getByAltText('123 Main St')
      expect(thumbnail).toBeInTheDocument()
      expect(thumbnail).toHaveAttribute('src', expect.stringContaining('prop1.jpg'))
    })

    it('should display placeholder when thumbnail not available', () => {
      const adWithoutThumbnail = {
        ...mockAdWithProperty,
        property: {
          ...mockAdWithProperty.property!,
          thumbnailUrl: null,
        },
      }

      render(<AdDetailPage ad={adWithoutThumbnail} isOwner={true} />)

      const placeholder = screen.getByAltText('123 Main St')
      expect(placeholder).toBeInTheDocument()
    })

    it('should display property location', () => {
      render(<AdDetailPage ad={mockAdWithProperty} isOwner={true} />)

      expect(screen.getByText(/Bandra, Mumbai, Maharashtra/)).toBeInTheDocument()
    })

    it('should have View Full Listing button', () => {
      render(<AdDetailPage ad={mockAdWithProperty} isOwner={true} />)

      const viewButton = screen.getByText('View Full Listing')
      expect(viewButton).toBeInTheDocument()
    })

    it('should navigate to property on View button click', () => {
      render(<AdDetailPage ad={mockAdWithProperty} isOwner={true} />)

      fireEvent.click(screen.getByText('View Full Listing'))

      expect(mockPush).toHaveBeenCalledWith('/properties/prop1')
    })
  })

  describe('Project Display', () => {
    it('should display project when ad is for project', () => {
      const adWithProject = {
        ...mockAdWithProperty,
        property: undefined,
        project: {
          id: 'proj1',
          name: 'Luxury Villas',
          description: 'Premium villas',
          thumbnailUrl: 'https://example.com/proj1.jpg',
          location: {
            city: 'Mumbai',
            state: 'Maharashtra',
            locality: 'Bandra',
          },
        },
      }

      render(<AdDetailPage ad={adWithProject} isOwner={true} />)

      expect(screen.getByText('Luxury Villas')).toBeInTheDocument()
      expect(screen.getByText('Premium villas')).toBeInTheDocument()
    })

    it('should navigate to project page on View button click', () => {
      const adWithProject = {
        ...mockAdWithProperty,
        property: undefined,
        project: {
          id: 'proj1',
          name: 'Luxury Villas',
          description: 'Premium villas',
          thumbnailUrl: 'https://example.com/proj1.jpg',
          location: {
            city: 'Mumbai',
            state: 'Maharashtra',
            locality: 'Bandra',
          },
        },
      }

      render(<AdDetailPage ad={adWithProject} isOwner={true} />)

      fireEvent.click(screen.getByText('View Full Listing'))

      expect(mockPush).toHaveBeenCalledWith('/projects/proj1')
    })
  })

  describe('Ad Details Section', () => {
    it('should display start date', () => {
      render(<AdDetailPage ad={mockAdWithProperty} isOwner={true} />)

      expect(screen.getByText('Start Date')).toBeInTheDocument()
    })

    it('should display end date', () => {
      render(<AdDetailPage ad={mockAdWithProperty} isOwner={true} />)

      expect(screen.getByText('End Date')).toBeInTheDocument()
    })

    it('should display duration', () => {
      render(<AdDetailPage ad={mockAdWithProperty} isOwner={true} />)

      expect(screen.getByText('Duration')).toBeInTheDocument()
      expect(screen.getByText('7 days')).toBeInTheDocument()
    })

    it('should display days remaining', () => {
      render(<AdDetailPage ad={mockAdWithProperty} isOwner={true} />)

      expect(screen.getByText('Days Remaining')).toBeInTheDocument()
    })

    it('should display price per day', () => {
      render(<AdDetailPage ad={mockAdWithProperty} isOwner={true} />)

      expect(screen.getByText('Price per Day')).toBeInTheDocument()
      expect(screen.getByText('₹1500.00')).toBeInTheDocument()
    })

    it('should display total amount', () => {
      render(<AdDetailPage ad={mockAdWithProperty} isOwner={true} />)

      expect(screen.getByText('Total Amount Paid')).toBeInTheDocument()
      expect(screen.getByText('₹10500.00')).toBeInTheDocument()
    })

    it('should display purchase date', () => {
      render(<AdDetailPage ad={mockAdWithProperty} isOwner={true} />)

      expect(screen.getByText('Purchase Date')).toBeInTheDocument()
    })

    it('should display slot position', () => {
      render(<AdDetailPage ad={mockAdWithProperty} isOwner={true} />)

      expect(screen.getByText('Slot Position')).toBeInTheDocument()
      expect(screen.getByText('Slot #1')).toBeInTheDocument()
    })
  })

  describe('Renewal Actions', () => {
    it('should show Renew button for expiring ad', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const expiringSoonAd = {
        ...mockAdWithProperty,
        endDate: tomorrow.toISOString(),
      }

      render(<AdDetailPage ad={expiringSoonAd} isOwner={true} />)

      expect(screen.getByText('Renew Advertisement')).toBeInTheDocument()
    })

    it('should show Renew button for expired ad', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      const expiredAd = {
        ...mockAdWithProperty,
        status: 'EXPIRED',
        endDate: yesterday.toISOString(),
      }

      render(<AdDetailPage ad={expiredAd} isOwner={true} />)

      expect(screen.getByText('Renew Advertisement')).toBeInTheDocument()
    })

    it('should navigate to renewal page on Renew click', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const expiringSoonAd = {
        ...mockAdWithProperty,
        endDate: tomorrow.toISOString(),
      }

      render(<AdDetailPage ad={expiringSoonAd} isOwner={true} />)

      fireEvent.click(screen.getByText('Renew Advertisement'))

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('/ads/purchase-ad?slot=1&renew=ad1')
      )
    })

    it('should include property ID in renewal URL for property ad', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const expiringSoonAd = {
        ...mockAdWithProperty,
        endDate: tomorrow.toISOString(),
      }

      render(<AdDetailPage ad={expiringSoonAd} isOwner={true} />)

      fireEvent.click(screen.getByText('Renew Advertisement'))

      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('propertyId=prop1'))
    })
  })

  describe('Other Actions', () => {
    it('should have My Properties button', () => {
      render(<AdDetailPage ad={mockAdWithProperty} isOwner={true} />)

      expect(screen.getByText('My Properties')).toBeInTheDocument()
    })

    it('should navigate to My Properties on button click', () => {
      render(<AdDetailPage ad={mockAdWithProperty} isOwner={true} />)

      fireEvent.click(screen.getByText('My Properties'))

      expect(mockPush).toHaveBeenCalledWith('/properties/my-properties')
    })

    it('should have Back to Home button', () => {
      render(<AdDetailPage ad={mockAdWithProperty} isOwner={true} />)

      expect(screen.getByText('Back to Home')).toBeInTheDocument()
    })

    it('should navigate to home on Back button click', () => {
      render(<AdDetailPage ad={mockAdWithProperty} isOwner={true} />)

      fireEvent.click(screen.getByText('Back to Home'))

      expect(mockPush).toHaveBeenCalledWith('/')
    })
  })

  describe('Edge Cases', () => {
    it('should handle ad without property or project', () => {
      const adWithoutListing = {
        ...mockAdWithProperty,
        property: undefined,
        project: undefined,
      }

      render(<AdDetailPage ad={adWithoutListing} isOwner={true} />)

      expect(screen.getByText('Ad Slot #1 Details')).toBeInTheDocument()
    })

    it('should calculate days remaining correctly', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 10)

      const futureAd = {
        ...mockAdWithProperty,
        endDate: futureDate.toISOString(),
      }

      render(<AdDetailPage ad={futureAd} isOwner={true} />)

      expect(screen.getByText(/10 days/)).toBeInTheDocument()
    })

    it('should show singular "day" for 1 day remaining', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const oneDayAd = {
        ...mockAdWithProperty,
        endDate: tomorrow.toISOString(),
      }

      render(<AdDetailPage ad={oneDayAd} isOwner={true} />)

      expect(screen.getAllByText(/1 day/)[0]).toBeInTheDocument()
    })
  })

  describe('SEO', () => {
    it('should have correct SEO title', () => {
      render(<AdDetailPage ad={mockAdWithProperty} isOwner={true} />)

      expect(document.title).toContain('Ad #ad1')
    })
  })
})

describe('getServerSideProps', () => {
  const mockPrismaFindUnique = prisma.ad.findUnique as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch ad with property', async () => {
    mockPrismaFindUnique.mockResolvedValue(mockAdWithProperty)

    const context = {
      params: { adId: 'ad1' },
      req: {},
      res: {},
    } as unknown as GetServerSidePropsContext

    const result = await getServerSideProps(context)

    expect(mockPrismaFindUnique).toHaveBeenCalledWith({
      where: { id: 'ad1' },
      include: expect.objectContaining({
        user: expect.any(Object),
        property: expect.any(Object),
        project: expect.any(Object),
      }),
    })

    expect(result).toHaveProperty('props')
  })

  it('should return notFound when ad not found', async () => {
    mockPrismaFindUnique.mockResolvedValue(null)

    const context = {
      params: { adId: 'invalid' },
      req: {},
      res: {},
    } as unknown as GetServerSidePropsContext

    const result = await getServerSideProps(context)

    expect(result).toEqual({ notFound: true })
  })

  it('should determine ownership correctly', async () => {
    mockPrismaFindUnique.mockResolvedValue(mockAdWithProperty)

    const context = {
      params: { adId: 'ad1' },
      req: {},
      res: {},
    } as unknown as GetServerSidePropsContext

    const result = await getServerSideProps(context)

    expect(result).toHaveProperty('props')
    expect((result as any).props).toHaveProperty('isOwner')
  })
})
