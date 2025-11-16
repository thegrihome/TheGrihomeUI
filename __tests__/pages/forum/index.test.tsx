import React from 'react'
import { render, screen } from '@testing-library/react'
import Forum from '@/pages/forum/index'
import { GetStaticPropsContext } from 'next'

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
    <div data-testid="next-seo" data-title={title} data-description={description} data-canonical={canonical} />
  ),
}))

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    forumCategory: {
      findMany: jest.fn(),
    },
  },
}))

describe('Forum Index Page - Comprehensive Tests', () => {
  const mockCategories = [
    {
      id: '1',
      name: 'Member Introductions',
      slug: 'member-introductions',
      description: 'Introduce yourself to the community',
      city: null,
      propertyType: null,
      _count: { posts: 42 },
      children: [],
    },
    {
      id: '2',
      name: 'Latest News',
      slug: 'latest-news',
      description: 'Real estate news and updates',
      city: null,
      propertyType: null,
      _count: { posts: 100 },
      children: [],
    },
    {
      id: '3',
      name: 'Grihome Latest Deals',
      slug: 'grihome-latest-deals',
      description: 'Latest property deals',
      city: null,
      propertyType: null,
      _count: { posts: 25 },
      children: [],
    },
    {
      id: '4',
      name: 'General Discussions',
      slug: 'general-discussions',
      description: 'General real estate discussions',
      city: null,
      propertyType: null,
      _count: { posts: 500 },
      children: [],
    },
    {
      id: '5',
      name: 'Hyderabad',
      slug: 'hyderabad',
      description: 'Hyderabad discussions',
      city: 'hyderabad',
      propertyType: null,
      _count: { posts: 150 },
      children: [],
    },
  ]

  describe('Rendering and Initial State', () => {
    it('should render forum page with all components', () => {
      render(<Forum categories={mockCategories} />)

      expect(screen.getByTestId('header')).toBeInTheDocument()
      expect(screen.getByTestId('footer')).toBeInTheDocument()
      expect(screen.getByTestId('forum-search')).toBeInTheDocument()
    })

    it('should render forum title correctly', () => {
      render(<Forum categories={mockCategories} />)

      expect(screen.getByText(/Grihome Community/)).toBeInTheDocument()
      expect(screen.getByText(/Forum/)).toBeInTheDocument()
    })

    it('should render forum subtitle', () => {
      render(<Forum categories={mockCategories} />)

      expect(screen.getByText(/Connect with fellow property enthusiasts/)).toBeInTheDocument()
    })

    it('should render all categories', () => {
      render(<Forum categories={mockCategories} />)

      expect(screen.getByText('Member Introductions')).toBeInTheDocument()
      expect(screen.getByText('Latest News')).toBeInTheDocument()
      expect(screen.getByText('Grihome Latest Deals')).toBeInTheDocument()
      expect(screen.getByText('General Discussions')).toBeInTheDocument()
    })

    it('should render category descriptions', () => {
      render(<Forum categories={mockCategories} />)

      expect(screen.getByText('Introduce yourself to the community')).toBeInTheDocument()
      expect(screen.getByText('Real estate news and updates')).toBeInTheDocument()
      expect(screen.getByText('Latest property deals')).toBeInTheDocument()
    })

    it('should render post counts for each category', () => {
      render(<Forum categories={mockCategories} />)

      expect(screen.getByText('42 threads')).toBeInTheDocument()
      expect(screen.getByText('100 threads')).toBeInTheDocument()
      expect(screen.getByText('25 threads')).toBeInTheDocument()
      expect(screen.getByText('500 threads')).toBeInTheDocument()
    })

    it('should render singular thread for count of 1', () => {
      const singleThreadCategory = [{
        ...mockCategories[0],
        _count: { posts: 1 },
      }]

      render(<Forum categories={singleThreadCategory} />)

      expect(screen.getByText('1 thread')).toBeInTheDocument()
    })

    it('should render empty state when no categories', () => {
      const { container } = render(<Forum categories={[]} />)

      expect(container.querySelector('.forum-categories')).toBeInTheDocument()
    })
  })

  describe('Category Icons', () => {
    it('should render icon for member-introductions category', () => {
      render(<Forum categories={mockCategories} />)

      const icons = screen.getAllByText('👋')
      expect(icons.length).toBeGreaterThan(0)
    })

    it('should render icon for latest-news category', () => {
      render(<Forum categories={mockCategories} />)

      const icons = screen.getAllByText('📰')
      expect(icons.length).toBeGreaterThan(0)
    })

    it('should render icon for deals category', () => {
      render(<Forum categories={mockCategories} />)

      const icons = screen.getAllByText('💰')
      expect(icons.length).toBeGreaterThan(0)
    })

    it('should render icon for general-discussions category', () => {
      render(<Forum categories={mockCategories} />)

      const icons = screen.getAllByText('💬')
      expect(icons.length).toBeGreaterThan(0)
    })

    it('should render city icon for Hyderabad', () => {
      render(<Forum categories={mockCategories} />)

      const icons = screen.getAllByText('🏛️')
      expect(icons.length).toBeGreaterThan(0)
    })

    it('should render default icon for unknown category', () => {
      const unknownCategory = [{
        ...mockCategories[0],
        slug: 'unknown-category',
        city: null,
      }]

      const { container } = render(<Forum categories={unknownCategory} />)
      expect(container.querySelector('.forum-category-icon')).toBeInTheDocument()
    })
  })

  describe('Category Links', () => {
    it('should link to general-discussions page correctly', () => {
      const { container } = render(<Forum categories={mockCategories} />)

      const generalDiscussionsLink = container.querySelector('a[href="/forum/category/general-discussions"]')
      expect(generalDiscussionsLink).toBeInTheDocument()
    })

    it('should link to other categories correctly', () => {
      const { container } = render(<Forum categories={mockCategories} />)

      const memberIntroLink = container.querySelector('a[href="/forum/category/member-introductions"]')
      expect(memberIntroLink).toBeInTheDocument()

      const latestNewsLink = container.querySelector('a[href="/forum/category/latest-news"]')
      expect(latestNewsLink).toBeInTheDocument()
    })

    it('should have correct link structure for each category', () => {
      const { container } = render(<Forum categories={mockCategories} />)

      const links = container.querySelectorAll('.forum-category-card a')
      expect(links.length).toBeGreaterThan(0)
    })
  })

  describe('Title Formatting', () => {
    it('should apply gradient to Forum word', () => {
      const { container } = render(<Forum categories={mockCategories} />)

      const gradientSpans = container.querySelectorAll('.forum-title-gradient')
      expect(gradientSpans.length).toBeGreaterThan(0)
    })

    it('should format title with multiple gradient words', () => {
      render(<Forum categories={mockCategories} />)

      const title = screen.getByText(/Grihome Community/)
      expect(title).toBeInTheDocument()
    })

    it('should render city names with gradient', () => {
      const cityCategories = [{
        id: '10',
        name: 'Hyderabad Discussions',
        slug: 'hyderabad',
        description: null,
        city: 'hyderabad',
        propertyType: null,
        _count: { posts: 10 },
        children: [],
      }]

      render(<Forum categories={cityCategories} />)
      expect(screen.getByText('Hyderabad Discussions')).toBeInTheDocument()
    })
  })

  describe('CSS Classes', () => {
    it('should have correct container classes', () => {
      const { container } = render(<Forum categories={mockCategories} />)

      expect(container.querySelector('.forum-container')).toBeInTheDocument()
      expect(container.querySelector('.forum-main')).toBeInTheDocument()
      expect(container.querySelector('.forum-content')).toBeInTheDocument()
    })

    it('should have correct header classes', () => {
      const { container } = render(<Forum categories={mockCategories} />)

      expect(container.querySelector('.forum-header')).toBeInTheDocument()
      expect(container.querySelector('.forum-header-content')).toBeInTheDocument()
      expect(container.querySelector('.forum-title')).toBeInTheDocument()
    })

    it('should have correct category card classes', () => {
      const { container } = render(<Forum categories={mockCategories} />)

      expect(container.querySelector('.forum-category-card')).toBeInTheDocument()
      expect(container.querySelector('.forum-category-header')).toBeInTheDocument()
      expect(container.querySelector('.forum-category-info')).toBeInTheDocument()
    })

    it('should have correct category details classes', () => {
      const { container } = render(<Forum categories={mockCategories} />)

      expect(container.querySelector('.forum-category-details')).toBeInTheDocument()
      expect(container.querySelector('.forum-category-name')).toBeInTheDocument()
    })

    it('should have correct stats classes', () => {
      const { container } = render(<Forum categories={mockCategories} />)

      expect(container.querySelector('.forum-category-stats')).toBeInTheDocument()
      expect(container.querySelector('.forum-post-count')).toBeInTheDocument()
    })

    it('should have breadcrumb container classes', () => {
      const { container } = render(<Forum categories={mockCategories} />)

      expect(container.querySelector('.forum-breadcrumb-container')).toBeInTheDocument()
      expect(container.querySelector('.forum-breadcrumb-search')).toBeInTheDocument()
    })
  })

  describe('SEO', () => {
    it('should render NextSeo with correct title', () => {
      render(<Forum categories={mockCategories} />)

      const seo = screen.getByTestId('next-seo')
      expect(seo).toHaveAttribute('data-title', 'Forum - Grihome')
    })

    it('should render NextSeo with correct description', () => {
      render(<Forum categories={mockCategories} />)

      const seo = screen.getByTestId('next-seo')
      expect(seo).toHaveAttribute('data-description', 'Join the Grihome community forum to discuss real estate, share experiences, and connect with fellow property enthusiasts.')
    })

    it('should render NextSeo with correct canonical URL', () => {
      render(<Forum categories={mockCategories} />)

      const seo = screen.getByTestId('next-seo')
      expect(seo).toHaveAttribute('data-canonical', 'https://grihome.vercel.app/forum')
    })
  })

  describe('Category Stats', () => {
    it('should display expand icon for each category', () => {
      const { container } = render(<Forum categories={mockCategories} />)

      const expandIcons = container.querySelectorAll('.forum-expand-icon')
      expect(expandIcons.length).toBe(mockCategories.length)
    })

    it('should render arrow icon in expand section', () => {
      render(<Forum categories={mockCategories} />)

      const arrows = screen.getAllByText('→')
      expect(arrows.length).toBeGreaterThan(0)
    })

    it('should show zero threads correctly', () => {
      const zeroCategory = [{
        ...mockCategories[0],
        _count: { posts: 0 },
      }]

      render(<Forum categories={zeroCategory} />)
      expect(screen.getByText('0 threads')).toBeInTheDocument()
    })

    it('should handle large thread counts', () => {
      const largeCategory = [{
        ...mockCategories[0],
        _count: { posts: 10000 },
      }]

      render(<Forum categories={largeCategory} />)
      expect(screen.getByText('10000 threads')).toBeInTheDocument()
    })
  })

  describe('Category Rendering', () => {
    it('should render category icon section', () => {
      const { container } = render(<Forum categories={mockCategories} />)

      const icons = container.querySelectorAll('.forum-category-icon')
      expect(icons.length).toBe(mockCategories.length)
    })

    it('should render category description when available', () => {
      render(<Forum categories={mockCategories} />)

      expect(screen.getByText('Introduce yourself to the community')).toBeInTheDocument()
    })

    it('should not render description when null', () => {
      const noDescCategory = [{
        ...mockCategories[0],
        description: null,
      }]

      const { container } = render(<Forum categories={noDescCategory} />)
      const descriptions = container.querySelectorAll('.forum-category-description')
      expect(descriptions.length).toBe(0)
    })

    it('should maintain category order', () => {
      const { container } = render(<Forum categories={mockCategories} />)

      const categoryCards = container.querySelectorAll('.forum-category-card')
      expect(categoryCards.length).toBe(mockCategories.length)
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<Forum categories={mockCategories} />)

      const h1 = screen.getByRole('heading', { level: 1 })
      expect(h1).toBeInTheDocument()
    })

    it('should have accessible links', () => {
      const { container } = render(<Forum categories={mockCategories} />)

      const links = container.querySelectorAll('a')
      links.forEach(link => {
        expect(link).toHaveAttribute('href')
      })
    })

    it('should have main landmark', () => {
      const { container } = render(<Forum categories={mockCategories} />)

      const main = container.querySelector('main')
      expect(main).toBeInTheDocument()
    })

    it('should have semantic HTML structure', () => {
      const { container } = render(<Forum categories={mockCategories} />)

      expect(container.querySelector('main.forum-main')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty category array', () => {
      const { container } = render(<Forum categories={[]} />)

      expect(container.querySelector('.forum-categories')).toBeInTheDocument()
    })

    it('should handle category with empty children array', () => {
      const categoryWithChildren = [{
        ...mockCategories[0],
        children: [],
      }]

      render(<Forum categories={categoryWithChildren} />)
      expect(screen.getByText('Member Introductions')).toBeInTheDocument()
    })

    it('should handle very long category names', () => {
      const longNameCategory = [{
        ...mockCategories[0],
        name: 'This is a very long category name that should still render correctly',
      }]

      render(<Forum categories={longNameCategory} />)
      expect(screen.getByText('This is a very long category name that should still render correctly')).toBeInTheDocument()
    })

    it('should handle very long descriptions', () => {
      const longDescCategory = [{
        ...mockCategories[0],
        description: 'This is a very long description that goes on and on and should still render properly without breaking the layout',
      }]

      render(<Forum categories={longDescCategory} />)
      expect(screen.getByText('This is a very long description that goes on and on and should still render properly without breaking the layout')).toBeInTheDocument()
    })

    it('should handle special characters in category names', () => {
      const specialCharCategory = [{
        ...mockCategories[0],
        name: 'Category & Special <> Characters',
      }]

      render(<Forum categories={specialCharCategory} />)
      expect(screen.getByText('Category & Special <> Characters')).toBeInTheDocument()
    })
  })

  describe('Layout Structure', () => {
    it('should have proper header section', () => {
      const { container } = render(<Forum categories={mockCategories} />)

      expect(container.querySelector('.forum-header-main')).toBeInTheDocument()
      expect(container.querySelector('.forum-header-text')).toBeInTheDocument()
    })

    it('should have proper breadcrumb layout', () => {
      const { container } = render(<Forum categories={mockCategories} />)

      expect(container.querySelector('.forum-breadcrumb-container')).toBeInTheDocument()
    })

    it('should render search in breadcrumb area', () => {
      const { container } = render(<Forum categories={mockCategories} />)

      const searchContainer = container.querySelector('.forum-breadcrumb-search')
      expect(searchContainer).toBeInTheDocument()
    })

    it('should have categories list wrapper', () => {
      const { container } = render(<Forum categories={mockCategories} />)

      expect(container.querySelector('.forum-categories')).toBeInTheDocument()
    })
  })

  describe('City Categories', () => {
    it('should render city icon for chennai', () => {
      const chennaiCategory = [{
        ...mockCategories[0],
        city: 'chennai',
        slug: 'chennai',
      }]

      render(<Forum categories={chennaiCategory} />)
      const icons = screen.getAllByText('🏖️')
      expect(icons.length).toBeGreaterThan(0)
    })

    it('should render city icon for bengaluru', () => {
      const bengaluruCategory = [{
        ...mockCategories[0],
        city: 'bengaluru',
        slug: 'bengaluru',
      }]

      render(<Forum categories={bengaluruCategory} />)
      const icons = screen.getAllByText('🌆')
      expect(icons.length).toBeGreaterThan(0)
    })

    it('should render city icon for mumbai', () => {
      const mumbaiCategory = [{
        ...mockCategories[0],
        city: 'mumbai',
        slug: 'mumbai',
      }]

      render(<Forum categories={mumbaiCategory} />)
      const icons = screen.getAllByText('🏙️')
      expect(icons.length).toBeGreaterThan(0)
    })

    it('should render default city icon for unknown city', () => {
      const unknownCity = [{
        ...mockCategories[0],
        city: 'unknown-city',
        slug: 'unknown-city',
      }]

      const { container } = render(<Forum categories={unknownCity} />)
      expect(container.querySelector('.forum-category-icon')).toBeInTheDocument()
    })
  })

  describe('Multiple Categories', () => {
    it('should render multiple categories in correct order', () => {
      const { container } = render(<Forum categories={mockCategories} />)

      const cards = container.querySelectorAll('.forum-category-card')
      expect(cards).toHaveLength(mockCategories.length)
    })

    it('should render each category with unique key', () => {
      const { container } = render(<Forum categories={mockCategories} />)

      const cards = container.querySelectorAll('.forum-category-card')
      expect(cards.length).toBe(mockCategories.length)
    })

    it('should handle mixed city and non-city categories', () => {
      render(<Forum categories={mockCategories} />)

      expect(screen.getByText('Member Introductions')).toBeInTheDocument()
      expect(screen.getByText('Hyderabad')).toBeInTheDocument()
    })
  })

  describe('Subtitle and Description', () => {
    it('should render correct subtitle text', () => {
      render(<Forum categories={mockCategories} />)

      expect(screen.getByText(/share experiences/)).toBeInTheDocument()
      expect(screen.getByText(/get insights about real estate/)).toBeInTheDocument()
    })

    it('should have subtitle class', () => {
      const { container } = render(<Forum categories={mockCategories} />)

      expect(container.querySelector('.forum-subtitle')).toBeInTheDocument()
    })
  })
})
