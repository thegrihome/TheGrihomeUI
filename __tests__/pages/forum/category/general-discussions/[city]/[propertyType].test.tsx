import React from 'react'
import { render, screen } from '@testing-library/react'
import PropertyTypePage from '@/pages/forum/category/general-discussions/[city]/[propertyType]'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'

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

jest.mock('@/components/forum/ForumSearch', () => {
  return function ForumSearch() {
    return <div data-testid="forum-search">Forum Search</div>
  }
})

jest.mock('next-seo', () => ({
  NextSeo: ({ title, description, canonical }: any) => (
    <div
      data-testid="next-seo"
      data-title={title}
      data-description={description}
      data-canonical={canonical}
    />
  ),
}))

describe('Property Type Page - Comprehensive Tests', () => {
  const mockUseRouter = useRouter as jest.Mock
  const mockUseSession = useSession as jest.Mock

  const mockCategory = {
    id: 'cat1',
    name: 'Apartments in Hyderabad',
    slug: 'hyderabad-apartments',
    description: null,
    propertyType: 'APARTMENTS',
  }

  const mockCity = {
    name: 'Hyderabad',
    slug: 'hyderabad',
    city: 'hyderabad',
    isState: false,
  }

  const mockPosts = [
    {
      id: 'post1',
      title: 'Best apartment complexes',
      slug: 'best-apartment-complexes',
      content: 'Looking for recommendations',
      viewCount: 100,
      replyCount: 15,
      isSticky: true,
      isLocked: false,
      createdAt: '2024-01-15T10:00:00Z',
      lastReplyAt: '2024-01-16T12:00:00Z',
      author: {
        id: 'user1',
        username: 'johndoe',
        image: '/avatar.jpg',
        createdAt: '2024-01-01T00:00:00Z',
      },
      _count: {
        replies: 15,
        reactions: 5,
      },
    },
    {
      id: 'post2',
      title: 'Apartment pricing trends',
      slug: 'apartment-pricing-trends',
      content: 'Discussion on pricing',
      viewCount: 50,
      replyCount: 8,
      isSticky: false,
      isLocked: true,
      createdAt: '2024-01-14T09:00:00Z',
      lastReplyAt: null,
      author: {
        id: 'user2',
        username: 'janedoe',
        image: null,
        createdAt: '2024-01-02T00:00:00Z',
      },
      _count: {
        replies: 8,
        reactions: 3,
      },
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({
      query: { propertyType: 'apartments' },
      push: jest.fn(),
    })
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'user1',
          email: 'test@example.com',
        },
      },
      status: 'authenticated',
    })
  })

  describe('Rendering and Initial State', () => {
    it('should render property type page with all components', () => {
      render(
        <PropertyTypePage
          category={mockCategory}
          city={mockCity}
          posts={mockPosts}
          totalCount={2}
          currentPage={1}
          totalPages={1}
        />
      )

      expect(screen.getByTestId('header')).toBeInTheDocument()
      expect(screen.getByTestId('footer')).toBeInTheDocument()
      expect(screen.getByTestId('forum-search')).toBeInTheDocument()
    })

    it('should render category name', () => {
      render(
        <PropertyTypePage
          category={mockCategory}
          city={mockCity}
          posts={mockPosts}
          totalCount={2}
          currentPage={1}
          totalPages={1}
        />
      )

      expect(screen.getByText(/Apartments in Hyderabad/)).toBeInTheDocument()
    })

    it('should render thread count', () => {
      render(
        <PropertyTypePage
          category={mockCategory}
          city={mockCity}
          posts={mockPosts}
          totalCount={2}
          currentPage={1}
          totalPages={1}
        />
      )

      expect(screen.getByText('2 threads')).toBeInTheDocument()
    })

    it('should render singular thread for count of 1', () => {
      render(
        <PropertyTypePage
          category={mockCategory}
          city={mockCity}
          posts={mockPosts}
          totalCount={1}
          currentPage={1}
          totalPages={1}
        />
      )

      expect(screen.getByText('1 thread')).toBeInTheDocument()
    })

    it('should render property type icon', () => {
      render(
        <PropertyTypePage
          category={mockCategory}
          city={mockCity}
          posts={mockPosts}
          totalCount={2}
          currentPage={1}
          totalPages={1}
        />
      )

      const icon = screen.getByText('🏢')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('Breadcrumb Navigation', () => {
    it('should render forum breadcrumb link', () => {
      const { container } = render(
        <PropertyTypePage
          category={mockCategory}
          city={mockCity}
          posts={mockPosts}
          totalCount={2}
          currentPage={1}
          totalPages={1}
        />
      )

      const forumLink = container.querySelector('a[href="/forum"]')
      expect(forumLink).toBeInTheDocument()
    })

    it('should render general discussions breadcrumb link', () => {
      const { container } = render(
        <PropertyTypePage
          category={mockCategory}
          city={mockCity}
          posts={mockPosts}
          totalCount={2}
          currentPage={1}
          totalPages={1}
        />
      )

      const gdLink = container.querySelector('a[href="/forum/category/general-discussions"]')
      expect(gdLink).toBeInTheDocument()
    })

    it('should render city breadcrumb link', () => {
      const { container } = render(
        <PropertyTypePage
          category={mockCategory}
          city={mockCity}
          posts={mockPosts}
          totalCount={2}
          currentPage={1}
          totalPages={1}
        />
      )

      const cityLink = container.querySelector(
        'a[href="/forum/category/general-discussions/hyderabad"]'
      )
      expect(cityLink).toBeInTheDocument()
    })

    it('should render states link for state locations', () => {
      const stateCity = {
        ...mockCity,
        isState: true,
        city: null,
        slug: 'karnataka',
        name: 'Karnataka',
      }

      render(
        <PropertyTypePage
          category={mockCategory}
          city={stateCity}
          posts={mockPosts}
          totalCount={2}
          currentPage={1}
          totalPages={1}
        />
      )

      expect(screen.getByText('States & Union Territories')).toBeInTheDocument()
    })

    it('should render current category in breadcrumb', () => {
      const { container } = render(
        <PropertyTypePage
          category={mockCategory}
          city={mockCity}
          posts={mockPosts}
          totalCount={2}
          currentPage={1}
          totalPages={1}
        />
      )

      const current = container.querySelector('.forum-breadcrumb-current')
      expect(current).toHaveTextContent('Apartments in Hyderabad')
    })

    it('should render breadcrumb separators', () => {
      render(
        <PropertyTypePage
          category={mockCategory}
          city={mockCity}
          posts={mockPosts}
          totalCount={2}
          currentPage={1}
          totalPages={1}
        />
      )

      const separators = screen.getAllByText('›')
      expect(separators.length).toBeGreaterThan(0)
    })
  })

  describe('Post List Rendering', () => {
    it('should render all posts', () => {
      render(
        <PropertyTypePage
          category={mockCategory}
          city={mockCity}
          posts={mockPosts}
          totalCount={2}
          currentPage={1}
          totalPages={1}
        />
      )

      expect(screen.getByText('Best apartment complexes')).toBeInTheDocument()
      expect(screen.getByText('Apartment pricing trends')).toBeInTheDocument()
    })

    it('should render post author information', () => {
      render(
        <PropertyTypePage
          category={mockCategory}
          city={mockCity}
          posts={mockPosts}
          totalCount={2}
          currentPage={1}
          totalPages={1}
        />
      )

      expect(screen.getByText(/Posted by/)).toBeInTheDocument()
      expect(screen.getAllByText(/johndoe/).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/janedoe/).length).toBeGreaterThan(0)
    })

    it('should render post dates', () => {
      render(
        <PropertyTypePage
          category={mockCategory}
          city={mockCity}
          posts={mockPosts}
          totalCount={2}
          currentPage={1}
          totalPages={1}
        />
      )

      expect(screen.getByText(/15 Jan 2024/)).toBeInTheDocument()
      expect(screen.getByText(/14 Jan 2024/)).toBeInTheDocument()
    })

    it('should render post statistics', () => {
      render(
        <PropertyTypePage
          category={mockCategory}
          city={mockCity}
          posts={mockPosts}
          totalCount={2}
          currentPage={1}
          totalPages={1}
        />
      )

      expect(screen.getByText('15 replies')).toBeInTheDocument()
      expect(screen.getByText('8 replies')).toBeInTheDocument()
    })

    it('should render last reply time when available', () => {
      render(
        <PropertyTypePage
          category={mockCategory}
          city={mockCity}
          posts={mockPosts}
          totalCount={2}
          currentPage={1}
          totalPages={1}
        />
      )

      expect(screen.getByText(/Last reply:/)).toBeInTheDocument()
    })

    it('should link to thread correctly', () => {
      const { container } = render(
        <PropertyTypePage
          category={mockCategory}
          city={mockCity}
          posts={mockPosts}
          totalCount={2}
          currentPage={1}
          totalPages={1}
        />
      )

      const postLink = container.querySelector('a[href="/forum/thread/best-apartment-complexes"]')
      expect(postLink).toBeInTheDocument()
    })

    it('should link to user profile', () => {
      const { container } = render(
        <PropertyTypePage
          category={mockCategory}
          city={mockCity}
          posts={mockPosts}
          totalCount={2}
          currentPage={1}
          totalPages={1}
        />
      )

      const userLink = container.querySelector('a[href="/forum/user/user1"]')
      expect(userLink).toBeInTheDocument()
    })
  })

  describe('Post Flags and Badges', () => {
    it('should render sticky flag for sticky posts', () => {
      render(
        <PropertyTypePage
          category={mockCategory}
          city={mockCity}
          posts={mockPosts}
          totalCount={2}
          currentPage={1}
          totalPages={1}
        />
      )

      expect(screen.getByText('📌')).toBeInTheDocument()
    })

    it('should render locked flag for locked posts', () => {
      render(
        <PropertyTypePage
          category={mockCategory}
          city={mockCity}
          posts={mockPosts}
          totalCount={2}
          currentPage={1}
          totalPages={1}
        />
      )

      expect(screen.getByText('🔒')).toBeInTheDocument()
    })

    it('should apply sticky class to sticky posts', () => {
      const { container } = render(
        <PropertyTypePage
          category={mockCategory}
          city={mockCity}
          posts={mockPosts}
          totalCount={2}
          currentPage={1}
          totalPages={1}
        />
      )

      const stickyPost = container.querySelector('.forum-post-item.sticky')
      expect(stickyPost).toBeInTheDocument()
    })
  })

  describe('Pagination', () => {
    it('should render pagination links for posts with many replies', () => {
      const postWithManyReplies = [
        {
          ...mockPosts[0],
          replyCount: 45,
        },
      ]

      render(
        <PropertyTypePage
          category={mockCategory}
          city={mockCity}
          posts={postWithManyReplies}
          totalCount={1}
          currentPage={1}
          totalPages={1}
        />
      )

      const pageLinks = screen.getAllByText(/[0-9]/)
      expect(pageLinks.length).toBeGreaterThan(0)
    })

    it('should show ellipsis for posts with many pages', () => {
      const postWithManyReplies = [
        {
          ...mockPosts[0],
          replyCount: 150,
        },
      ]

      render(
        <PropertyTypePage
          category={mockCategory}
          city={mockCity}
          posts={postWithManyReplies}
          totalCount={1}
          currentPage={1}
          totalPages={1}
        />
      )

      const ellipsis = screen.getAllByText('...')
      expect(ellipsis.length).toBeGreaterThan(0)
    })

    it('should render pagination controls when multiple pages', () => {
      render(
        <PropertyTypePage
          category={mockCategory}
          city={mockCity}
          posts={mockPosts}
          totalCount={25}
          currentPage={1}
          totalPages={2}
        />
      )

      expect(screen.getByText('Next →')).toBeInTheDocument()
      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument()
    })

    it('should render Previous link when not on first page', () => {
      render(
        <PropertyTypePage
          category={mockCategory}
          city={mockCity}
          posts={mockPosts}
          totalCount={25}
          currentPage={2}
          totalPages={2}
        />
      )

      expect(screen.getByText('← Previous')).toBeInTheDocument()
    })

    it('should not render Previous link on first page', () => {
      render(
        <PropertyTypePage
          category={mockCategory}
          city={mockCity}
          posts={mockPosts}
          totalCount={25}
          currentPage={1}
          totalPages={2}
        />
      )

      expect(screen.queryByText('← Previous')).not.toBeInTheDocument()
    })

    it('should not render Next link on last page', () => {
      render(
        <PropertyTypePage
          category={mockCategory}
          city={mockCity}
          posts={mockPosts}
          totalCount={25}
          currentPage={2}
          totalPages={2}
        />
      )

      expect(screen.queryByText('Next →')).not.toBeInTheDocument()
    })

    it('should link to correct page number', () => {
      const { container } = render(
        <PropertyTypePage
          category={mockCategory}
          city={mockCity}
          posts={mockPosts}
          totalCount={25}
          currentPage={1}
          totalPages={2}
        />
      )

      const nextLink = container.querySelector('a[href*="page=2"]')
      expect(nextLink).toBeInTheDocument()
    })
  })

  describe('New Thread Button', () => {
    it('should render New Thread button for authenticated users', () => {
      render(
        <PropertyTypePage
          category={mockCategory}
          city={mockCity}
          posts={mockPosts}
          totalCount={2}
          currentPage={1}
          totalPages={1}
        />
      )

      expect(screen.getByText('New Thread')).toBeInTheDocument()
    })

    it('should render Login to Post button for unauthenticated users', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      render(
        <PropertyTypePage
          category={mockCategory}
          city={mockCity}
          posts={mockPosts}
          totalCount={2}
          currentPage={1}
          totalPages={1}
        />
      )

      expect(screen.getByText('Login to Post')).toBeInTheDocument()
    })

    it('should link to new post page with category', () => {
      const { container } = render(
        <PropertyTypePage
          category={mockCategory}
          city={mockCity}
          posts={mockPosts}
          totalCount={2}
          currentPage={1}
          totalPages={1}
        />
      )

      const newThreadLink = container.querySelector('a[href="/forum/new-post?category=cat1"]')
      expect(newThreadLink).toBeInTheDocument()
    })

    it('should link to login page for unauthenticated users', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      const { container } = render(
        <PropertyTypePage
          category={mockCategory}
          city={mockCity}
          posts={mockPosts}
          totalCount={2}
          currentPage={1}
          totalPages={1}
        />
      )

      const loginLink = container.querySelector('a[href="/login"]')
      expect(loginLink).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('should render empty state when no posts', () => {
      render(
        <PropertyTypePage
          category={mockCategory}
          city={mockCity}
          posts={[]}
          totalCount={0}
          currentPage={1}
          totalPages={1}
        />
      )

      expect(screen.getByText('No threads yet')).toBeInTheDocument()
    })

    it('should render helpful message in empty state', () => {
      render(
        <PropertyTypePage
          category={mockCategory}
          city={mockCity}
          posts={[]}
          totalCount={0}
          currentPage={1}
          totalPages={1}
        />
      )

      expect(screen.getByText(/Be the first to start a discussion/)).toBeInTheDocument()
    })
  })

  describe('SEO', () => {
    it('should render NextSeo with correct title', () => {
      render(
        <PropertyTypePage
          category={mockCategory}
          city={mockCity}
          posts={mockPosts}
          totalCount={2}
          currentPage={1}
          totalPages={1}
        />
      )

      const seo = screen.getByTestId('next-seo')
      expect(seo).toHaveAttribute(
        'data-title',
        'Apartments in Hyderabad in Hyderabad - General Discussions - Forum - Grihome'
      )
    })

    it('should render NextSeo with correct description', () => {
      render(
        <PropertyTypePage
          category={mockCategory}
          city={mockCity}
          posts={mockPosts}
          totalCount={2}
          currentPage={1}
          totalPages={1}
        />
      )

      const seo = screen.getByTestId('next-seo')
      expect(seo).toHaveAttribute(
        'data-description',
        'Browse apartments in hyderabad discussions and listings in Hyderabad on Grihome community forum'
      )
    })

    it('should render NextSeo with correct canonical URL', () => {
      render(
        <PropertyTypePage
          category={mockCategory}
          city={mockCity}
          posts={mockPosts}
          totalCount={2}
          currentPage={1}
          totalPages={1}
        />
      )

      const seo = screen.getByTestId('next-seo')
      expect(seo).toHaveAttribute(
        'data-canonical',
        'https://grihome.vercel.app/forum/category/general-discussions/hyderabad/apartments'
      )
    })
  })

  describe('CSS Classes', () => {
    it('should have correct container classes', () => {
      const { container } = render(
        <PropertyTypePage
          category={mockCategory}
          city={mockCity}
          posts={mockPosts}
          totalCount={2}
          currentPage={1}
          totalPages={1}
        />
      )

      expect(container.querySelector('.forum-container')).toBeInTheDocument()
      expect(container.querySelector('.forum-main')).toBeInTheDocument()
      expect(container.querySelector('.forum-posts-list')).toBeInTheDocument()
    })

    it('should have correct header classes', () => {
      const { container } = render(
        <PropertyTypePage
          category={mockCategory}
          city={mockCity}
          posts={mockPosts}
          totalCount={2}
          currentPage={1}
          totalPages={1}
        />
      )

      expect(container.querySelector('.forum-header')).toBeInTheDocument()
      expect(container.querySelector('.forum-header-content')).toBeInTheDocument()
      expect(container.querySelector('.forum-title')).toBeInTheDocument()
    })

    it('should have correct post item classes', () => {
      const { container } = render(
        <PropertyTypePage
          category={mockCategory}
          city={mockCity}
          posts={mockPosts}
          totalCount={2}
          currentPage={1}
          totalPages={1}
        />
      )

      expect(container.querySelector('.forum-post-item')).toBeInTheDocument()
      expect(container.querySelector('.forum-post-row-1')).toBeInTheDocument()
      expect(container.querySelector('.forum-post-row-2')).toBeInTheDocument()
    })
  })

  describe('Title Formatting', () => {
    it('should apply gradient class to city name in title', () => {
      const { container } = render(
        <PropertyTypePage
          category={mockCategory}
          city={mockCity}
          posts={mockPosts}
          totalCount={2}
          currentPage={1}
          totalPages={1}
        />
      )

      const gradients = container.querySelectorAll('.forum-title-gradient')
      expect(gradients.length).toBeGreaterThan(0)
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(
        <PropertyTypePage
          category={mockCategory}
          city={mockCity}
          posts={mockPosts}
          totalCount={2}
          currentPage={1}
          totalPages={1}
        />
      )

      const h1 = screen.getByRole('heading', { level: 1 })
      expect(h1).toBeInTheDocument()
    })

    it('should have accessible links', () => {
      const { container } = render(
        <PropertyTypePage
          category={mockCategory}
          city={mockCity}
          posts={mockPosts}
          totalCount={2}
          currentPage={1}
          totalPages={1}
        />
      )

      const links = container.querySelectorAll('a')
      links.forEach(link => {
        expect(link).toHaveAttribute('href')
      })
    })

    it('should have main landmark', () => {
      const { container } = render(
        <PropertyTypePage
          category={mockCategory}
          city={mockCity}
          posts={mockPosts}
          totalCount={2}
          currentPage={1}
          totalPages={1}
        />
      )

      const main = container.querySelector('main')
      expect(main).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero posts correctly', () => {
      render(
        <PropertyTypePage
          category={mockCategory}
          city={mockCity}
          posts={[]}
          totalCount={0}
          currentPage={1}
          totalPages={1}
        />
      )

      expect(screen.getByText('0 threads')).toBeInTheDocument()
    })

    it('should handle very large post counts', () => {
      render(
        <PropertyTypePage
          category={mockCategory}
          city={mockCity}
          posts={mockPosts}
          totalCount={10000}
          currentPage={1}
          totalPages={500}
        />
      )

      expect(screen.getByText('10000 threads')).toBeInTheDocument()
    })

    it('should handle posts with no reactions', () => {
      const postWithoutReactions = [
        {
          ...mockPosts[0],
          _count: {
            replies: 0,
            reactions: 0,
          },
        },
      ]

      render(
        <PropertyTypePage
          category={mockCategory}
          city={mockCity}
          posts={postWithoutReactions}
          totalCount={1}
          currentPage={1}
          totalPages={1}
        />
      )

      expect(screen.getByText('0 reactions')).toBeInTheDocument()
    })
  })

  describe('Property Type Icons', () => {
    it('should render villas icon', () => {
      const villasCategory = {
        ...mockCategory,
        propertyType: 'VILLAS',
        name: 'Villas in Hyderabad',
      }

      render(
        <PropertyTypePage
          category={villasCategory}
          city={mockCity}
          posts={mockPosts}
          totalCount={2}
          currentPage={1}
          totalPages={1}
        />
      )

      const icon = screen.getByText('🏡')
      expect(icon).toBeInTheDocument()
    })

    it('should render residential lands icon', () => {
      const landsCategory = {
        ...mockCategory,
        propertyType: 'RESIDENTIAL_LANDS',
        name: 'Residential Lands in Hyderabad',
      }

      render(
        <PropertyTypePage
          category={landsCategory}
          city={mockCity}
          posts={mockPosts}
          totalCount={2}
          currentPage={1}
          totalPages={1}
        />
      )

      const icon = screen.getByText('🏞️')
      expect(icon).toBeInTheDocument()
    })

    it('should render agriculture lands icon', () => {
      const agricultureCategory = {
        ...mockCategory,
        propertyType: 'AGRICULTURE_LANDS',
        name: 'Agriculture Lands in Hyderabad',
      }

      render(
        <PropertyTypePage
          category={agricultureCategory}
          city={mockCity}
          posts={mockPosts}
          totalCount={2}
          currentPage={1}
          totalPages={1}
        />
      )

      const icon = screen.getByText('🌾')
      expect(icon).toBeInTheDocument()
    })

    it('should render commercial properties icon', () => {
      const commercialCategory = {
        ...mockCategory,
        propertyType: 'COMMERCIAL_PROPERTIES',
        name: 'Commercial Properties in Hyderabad',
      }

      render(
        <PropertyTypePage
          category={commercialCategory}
          city={mockCity}
          posts={mockPosts}
          totalCount={2}
          currentPage={1}
          totalPages={1}
        />
      )

      const icon = screen.getByText('🏬')
      expect(icon).toBeInTheDocument()
    })

    it('should render default icon for unknown property type', () => {
      const unknownCategory = {
        ...mockCategory,
        propertyType: null,
      }

      const { container } = render(
        <PropertyTypePage
          category={unknownCategory}
          city={mockCity}
          posts={mockPosts}
          totalCount={2}
          currentPage={1}
          totalPages={1}
        />
      )

      expect(container.querySelector('.forum-property-type-icon')).toBeInTheDocument()
    })
  })

  describe('State Support', () => {
    it('should handle state locations correctly', () => {
      const stateCity = {
        name: 'Karnataka',
        slug: 'karnataka',
        city: null,
        isState: true,
      }

      render(
        <PropertyTypePage
          category={mockCategory}
          city={stateCity}
          posts={mockPosts}
          totalCount={2}
          currentPage={1}
          totalPages={1}
        />
      )

      expect(screen.getByText('States & Union Territories')).toBeInTheDocument()
    })

    it('should link correctly for state property types', () => {
      const stateCity = {
        name: 'Karnataka',
        slug: 'karnataka',
        city: null,
        isState: true,
      }

      const { container } = render(
        <PropertyTypePage
          category={mockCategory}
          city={stateCity}
          posts={mockPosts}
          totalCount={2}
          currentPage={1}
          totalPages={1}
        />
      )

      const cityLink = container.querySelector(
        'a[href="/forum/category/general-discussions/karnataka"]'
      )
      expect(cityLink).toBeInTheDocument()
    })
  })

  describe('Layout Structure', () => {
    it('should have property header section', () => {
      const { container } = render(
        <PropertyTypePage
          category={mockCategory}
          city={mockCity}
          posts={mockPosts}
          totalCount={2}
          currentPage={1}
          totalPages={1}
        />
      )

      expect(container.querySelector('.forum-property-header-section')).toBeInTheDocument()
    })

    it('should have category actions header', () => {
      const { container } = render(
        <PropertyTypePage
          category={mockCategory}
          city={mockCity}
          posts={mockPosts}
          totalCount={2}
          currentPage={1}
          totalPages={1}
        />
      )

      expect(container.querySelector('.forum-category-actions-header')).toBeInTheDocument()
    })

    it('should have breadcrumb container', () => {
      const { container } = render(
        <PropertyTypePage
          category={mockCategory}
          city={mockCity}
          posts={mockPosts}
          totalCount={2}
          currentPage={1}
          totalPages={1}
        />
      )

      expect(container.querySelector('.forum-breadcrumb-container')).toBeInTheDocument()
    })
  })
})
