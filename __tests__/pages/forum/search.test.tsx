import React from 'react'
import { render, screen } from '@testing-library/react'
import SearchPage from '@/pages/forum/search'
import { useRouter } from 'next/router'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
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

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, width, height, className }: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} width={width} height={height} className={className} />
  ),
}))

describe('Forum Search Page - Comprehensive Tests', () => {
  const mockUseRouter = useRouter as jest.Mock

  const mockSearchResults = {
    posts: [
      {
        id: '1',
        title: 'Best properties in Hyderabad',
        slug: 'best-properties-hyderabad',
        content: 'Looking for the best properties in Hyderabad area',
        viewCount: 150,
        replyCount: 25,
        createdAt: '2024-01-15T10:00:00Z',
        author: {
          id: 'user1',
          username: 'johndoe',
          image: '/avatar.jpg',
        },
        category: {
          name: 'Hyderabad Apartments',
          slug: 'hyderabad-apartments',
          city: 'hyderabad',
          propertyType: 'APARTMENTS',
        },
        _count: {
          replies: 25,
          reactions: 10,
        },
      },
      {
        id: '2',
        title: 'Property investment tips',
        slug: 'property-investment-tips',
        content: 'Share your best property investment tips here',
        viewCount: 200,
        replyCount: 35,
        createdAt: '2024-01-14T09:00:00Z',
        author: {
          id: 'user2',
          username: 'janedoe',
          image: null,
        },
        category: {
          name: 'General Discussions',
          slug: 'general-discussions',
          city: null,
          propertyType: null,
        },
        _count: {
          replies: 35,
          reactions: 15,
        },
      },
    ],
    categories: [
      {
        id: 'cat1',
        name: 'Hyderabad',
        slug: 'hyderabad',
        description: 'Hyderabad real estate discussions',
        city: 'hyderabad',
        propertyType: null,
        _count: { posts: 100 },
        parent: null,
      },
      {
        id: 'cat2',
        name: 'Apartments in Chennai',
        slug: 'chennai-apartments',
        description: 'Chennai apartment discussions',
        city: 'chennai',
        propertyType: 'APARTMENTS',
        _count: { posts: 50 },
        parent: {
          name: 'Chennai',
          slug: 'chennai',
        },
      },
    ],
    query: 'property',
    totalResults: 4,
    currentPage: 1,
    totalPages: 1,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({
      query: { q: 'property' },
      push: jest.fn(),
      pathname: '/forum/search',
    })
  })

  describe('Rendering and Initial State', () => {
    it('should render search page with all components', () => {
      render(<SearchPage results={mockSearchResults} />)

      expect(screen.getByTestId('header')).toBeInTheDocument()
      expect(screen.getByTestId('footer')).toBeInTheDocument()
      expect(screen.getByTestId('forum-search')).toBeInTheDocument()
    })

    it('should render search results title', () => {
      render(<SearchPage results={mockSearchResults} />)

      expect(screen.getByText('Search Results')).toBeInTheDocument()
    })

    it('should render search query in results count', () => {
      render(<SearchPage results={mockSearchResults} />)

      expect(screen.getByText(/Found 4 results for/)).toBeInTheDocument()
      expect(screen.getByText(/property/)).toBeInTheDocument()
    })

    it('should render breadcrumb navigation', () => {
      render(<SearchPage results={mockSearchResults} />)

      expect(screen.getByText('Forum')).toBeInTheDocument()
      expect(screen.getByText('Search Results')).toBeInTheDocument()
    })

    it('should render breadcrumb separator', () => {
      render(<SearchPage results={mockSearchResults} />)

      const separators = screen.getAllByText('›')
      expect(separators.length).toBeGreaterThan(0)
    })
  })

  describe('Search Results - Posts', () => {
    it('should render all post results', () => {
      render(<SearchPage results={mockSearchResults} />)

      expect(screen.getByText('Best properties in Hyderabad')).toBeInTheDocument()
      expect(screen.getByText('Property investment tips')).toBeInTheDocument()
    })

    it('should render post content preview', () => {
      render(<SearchPage results={mockSearchResults} />)

      expect(screen.getByText(/Looking for the best properties/)).toBeInTheDocument()
      expect(screen.getByText(/Share your best property investment/)).toBeInTheDocument()
    })

    it('should render post author information', () => {
      render(<SearchPage results={mockSearchResults} />)

      expect(screen.getByText(/by johndoe/)).toBeInTheDocument()
      expect(screen.getByText(/by janedoe/)).toBeInTheDocument()
    })

    it('should render post statistics', () => {
      render(<SearchPage results={mockSearchResults} />)

      expect(screen.getByText('25 replies')).toBeInTheDocument()
      expect(screen.getByText('35 replies')).toBeInTheDocument()
      expect(screen.getByText('150 views')).toBeInTheDocument()
      expect(screen.getByText('200 views')).toBeInTheDocument()
    })

    it('should render post reactions count', () => {
      render(<SearchPage results={mockSearchResults} />)

      expect(screen.getByText('10 reactions')).toBeInTheDocument()
      expect(screen.getByText('15 reactions')).toBeInTheDocument()
    })

    it('should render post category names', () => {
      render(<SearchPage results={mockSearchResults} />)

      expect(screen.getByText(/in Hyderabad Apartments/)).toBeInTheDocument()
      expect(screen.getByText(/in General Discussions/)).toBeInTheDocument()
    })

    it('should render post dates', () => {
      render(<SearchPage results={mockSearchResults} />)

      expect(screen.getByText(/15 Jan 2024/)).toBeInTheDocument()
      expect(screen.getByText(/14 Jan 2024/)).toBeInTheDocument()
    })

    it('should link to post thread', () => {
      const { container } = render(<SearchPage results={mockSearchResults} />)

      const postLink = container.querySelector('a[href="/forum/thread/best-properties-hyderabad"]')
      expect(postLink).toBeInTheDocument()
    })

    it('should render user avatar when available', () => {
      render(<SearchPage results={mockSearchResults} />)

      const avatar = screen.getByAltText('johndoe')
      expect(avatar).toBeInTheDocument()
      expect(avatar).toHaveAttribute('src', '/avatar.jpg')
    })

    it('should render avatar placeholder when image is null', () => {
      const { container } = render(<SearchPage results={mockSearchResults} />)

      const placeholder = container.querySelector('.forum-avatar-placeholder')
      expect(placeholder).toBeInTheDocument()
      expect(placeholder).toHaveTextContent('J')
    })
  })

  describe('Search Results - Categories', () => {
    it('should render categories section header', () => {
      render(<SearchPage results={mockSearchResults} />)

      expect(screen.getByText('Sections')).toBeInTheDocument()
    })

    it('should render all category results', () => {
      render(<SearchPage results={mockSearchResults} />)

      expect(screen.getByText('Hyderabad')).toBeInTheDocument()
      expect(screen.getByText('Apartments in Chennai')).toBeInTheDocument()
    })

    it('should render category descriptions', () => {
      render(<SearchPage results={mockSearchResults} />)

      expect(screen.getByText('Hyderabad real estate discussions')).toBeInTheDocument()
      expect(screen.getByText('Chennai apartment discussions')).toBeInTheDocument()
    })

    it('should render category post counts', () => {
      render(<SearchPage results={mockSearchResults} />)

      expect(screen.getByText('100 posts')).toBeInTheDocument()
      expect(screen.getByText('50 posts')).toBeInTheDocument()
    })

    it('should render singular post for count of 1', () => {
      const singlePostResult = {
        ...mockSearchResults,
        categories: [
          {
            ...mockSearchResults.categories[0],
            _count: { posts: 1 },
          },
        ],
      }

      render(<SearchPage results={singlePostResult} />)
      expect(screen.getByText('1 post')).toBeInTheDocument()
    })

    it('should render category parent information', () => {
      render(<SearchPage results={mockSearchResults} />)

      expect(screen.getByText(/in Chennai/)).toBeInTheDocument()
    })

    it('should link to category correctly for city', () => {
      const { container } = render(<SearchPage results={mockSearchResults} />)

      const cityLink = container.querySelector(
        'a[href="/forum/category/general-discussions/hyderabad"]'
      )
      expect(cityLink).toBeInTheDocument()
    })

    it('should link to category correctly for city with property type', () => {
      const { container } = render(<SearchPage results={mockSearchResults} />)

      const propertyLink = container.querySelector(
        'a[href="/forum/category/general-discussions/chennai/apartments"]'
      )
      expect(propertyLink).toBeInTheDocument()
    })

    it('should render city icons for city categories', () => {
      const { container } = render(<SearchPage results={mockSearchResults} />)

      const icons = container.querySelectorAll('.forum-category-icon')
      expect(icons.length).toBeGreaterThan(0)
    })

    it('should render property type icons', () => {
      render(<SearchPage results={mockSearchResults} />)

      const apartmentIcon = screen.getAllByText('🏢')
      expect(apartmentIcon.length).toBeGreaterThan(0)
    })
  })

  describe('Empty Results', () => {
    it('should render no results message when totalResults is 0', () => {
      const emptyResults = {
        ...mockSearchResults,
        posts: [],
        categories: [],
        totalResults: 0,
      }

      render(<SearchPage results={emptyResults} />)

      expect(screen.getByText('No results found')).toBeInTheDocument()
    })

    it('should render helpful message for no results', () => {
      const emptyResults = {
        ...mockSearchResults,
        posts: [],
        categories: [],
        totalResults: 0,
      }

      render(<SearchPage results={emptyResults} />)

      expect(screen.getByText(/No posts or sections match your search/)).toBeInTheDocument()
      expect(
        screen.getByText(/Try different keywords or browse our categories/)
      ).toBeInTheDocument()
    })

    it('should render browse forum link when no results', () => {
      const emptyResults = {
        ...mockSearchResults,
        posts: [],
        categories: [],
        totalResults: 0,
      }

      render(<SearchPage results={emptyResults} />)

      expect(screen.getByText('Browse Forum')).toBeInTheDocument()
    })

    it('should link to forum home from empty state', () => {
      const emptyResults = {
        ...mockSearchResults,
        posts: [],
        categories: [],
        totalResults: 0,
      }

      const { container } = render(<SearchPage results={emptyResults} />)

      const forumLink = container.querySelector('a[href="/forum"]')
      expect(forumLink).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should render error message when error prop is provided', () => {
      render(<SearchPage results={null} error="Search failed" />)

      expect(screen.getByText('Search failed')).toBeInTheDocument()
    })

    it('should not render results when error is present', () => {
      render(<SearchPage results={null} error="Search failed" />)

      expect(screen.queryByText('Sections')).not.toBeInTheDocument()
      expect(screen.queryByText('Posts')).not.toBeInTheDocument()
    })

    it('should render error in error message container', () => {
      const { container } = render(<SearchPage results={null} error="Search failed" />)

      const errorDiv = container.querySelector('.forum-error-message')
      expect(errorDiv).toBeInTheDocument()
    })
  })

  describe('SEO', () => {
    it('should render NextSeo with correct title', () => {
      render(<SearchPage results={mockSearchResults} />)

      const seo = screen.getByTestId('next-seo')
      expect(seo).toHaveAttribute('data-title', 'Search Results for "property" - Forum - Grihome')
    })

    it('should render NextSeo with correct description', () => {
      render(<SearchPage results={mockSearchResults} />)

      const seo = screen.getByTestId('next-seo')
      expect(seo).toHaveAttribute(
        'data-description',
        'Search results for "property" in Grihome community forum'
      )
    })

    it('should render NextSeo with correct canonical URL', () => {
      render(<SearchPage results={mockSearchResults} />)

      const seo = screen.getByTestId('next-seo')
      expect(seo).toHaveAttribute(
        'data-canonical',
        'https://grihome.vercel.app/forum/search?q=property'
      )
    })
  })

  describe('CSS Classes', () => {
    it('should have correct container classes', () => {
      const { container } = render(<SearchPage results={mockSearchResults} />)

      expect(container.querySelector('.forum-container')).toBeInTheDocument()
      expect(container.querySelector('.forum-main')).toBeInTheDocument()
      expect(container.querySelector('.forum-content')).toBeInTheDocument()
    })

    it('should have correct search result classes', () => {
      const { container } = render(<SearchPage results={mockSearchResults} />)

      expect(container.querySelector('.forum-search-results')).toBeInTheDocument()
      expect(container.querySelector('.forum-search-result-item')).toBeInTheDocument()
      expect(container.querySelector('.forum-search-result-content')).toBeInTheDocument()
    })

    it('should have correct header classes', () => {
      const { container } = render(<SearchPage results={mockSearchResults} />)

      expect(container.querySelector('.forum-header')).toBeInTheDocument()
      expect(container.querySelector('.forum-header-content')).toBeInTheDocument()
      expect(container.querySelector('.forum-header-main')).toBeInTheDocument()
    })

    it('should have correct section classes', () => {
      const { container } = render(<SearchPage results={mockSearchResults} />)

      expect(container.querySelector('.forum-search-section')).toBeInTheDocument()
      expect(container.querySelector('.forum-search-section-title')).toBeInTheDocument()
    })

    it('should have correct stats classes', () => {
      const { container } = render(<SearchPage results={mockSearchResults} />)

      expect(container.querySelector('.forum-search-result-stats')).toBeInTheDocument()
      expect(container.querySelector('.forum-stat')).toBeInTheDocument()
    })

    it('should have empty state class when no results', () => {
      const emptyResults = {
        ...mockSearchResults,
        posts: [],
        categories: [],
        totalResults: 0,
      }

      const { container } = render(<SearchPage results={emptyResults} />)

      expect(container.querySelector('.forum-empty-state')).toBeInTheDocument()
    })
  })

  describe('Content Formatting', () => {
    it('should truncate long content', () => {
      const longContent = {
        ...mockSearchResults,
        posts: [
          {
            ...mockSearchResults.posts[0],
            content: 'A'.repeat(300),
          },
        ],
      }

      render(<SearchPage results={longContent} />)

      const content = screen.getByText(/A+\.\.\./)
      expect(content).toBeInTheDocument()
    })

    it('should not truncate short content', () => {
      const shortContent = {
        ...mockSearchResults,
        posts: [
          {
            ...mockSearchResults.posts[0],
            content: 'Short content',
          },
        ],
      }

      render(<SearchPage results={shortContent} />)

      expect(screen.getByText('Short content')).toBeInTheDocument()
    })

    it('should format dates correctly', () => {
      render(<SearchPage results={mockSearchResults} />)

      expect(screen.getByText(/2024/)).toBeInTheDocument()
    })
  })

  describe('Section Rendering', () => {
    it('should render Posts section when posts exist', () => {
      render(<SearchPage results={mockSearchResults} />)

      expect(screen.getByText('Posts')).toBeInTheDocument()
    })

    it('should not render Posts section when no posts', () => {
      const noPosts = {
        ...mockSearchResults,
        posts: [],
      }

      render(<SearchPage results={noPosts} />)

      expect(screen.queryByText('Posts')).not.toBeInTheDocument()
    })

    it('should render Sections section when categories exist', () => {
      render(<SearchPage results={mockSearchResults} />)

      expect(screen.getByText('Sections')).toBeInTheDocument()
    })

    it('should not render Sections section when no categories', () => {
      const noCategories = {
        ...mockSearchResults,
        categories: [],
      }

      render(<SearchPage results={noCategories} />)

      expect(screen.queryByText('Sections')).not.toBeInTheDocument()
    })
  })

  describe('Breadcrumb Navigation', () => {
    it('should render breadcrumb with forum link', () => {
      const { container } = render(<SearchPage results={mockSearchResults} />)

      const forumLink = container.querySelector('a.forum-breadcrumb-link[href="/forum"]')
      expect(forumLink).toBeInTheDocument()
    })

    it('should render current breadcrumb item', () => {
      const { container } = render(<SearchPage results={mockSearchResults} />)

      const current = container.querySelector('.forum-breadcrumb-current')
      expect(current).toHaveTextContent('Search Results')
    })

    it('should have breadcrumb class', () => {
      const { container } = render(<SearchPage results={mockSearchResults} />)

      expect(container.querySelector('.forum-breadcrumb')).toBeInTheDocument()
    })
  })

  describe('Search Header', () => {
    it('should render search in header area', () => {
      const { container } = render(<SearchPage results={mockSearchResults} />)

      expect(container.querySelector('.forum-header-search')).toBeInTheDocument()
    })

    it('should render header text section', () => {
      const { container } = render(<SearchPage results={mockSearchResults} />)

      expect(container.querySelector('.forum-header-text')).toBeInTheDocument()
    })

    it('should render results count in subtitle', () => {
      const { container } = render(<SearchPage results={mockSearchResults} />)

      const subtitle = container.querySelector('.forum-subtitle')
      expect(subtitle).toBeInTheDocument()
    })
  })

  describe('Category URL Generation', () => {
    it('should generate correct URL for category with city only', () => {
      const cityOnly = {
        ...mockSearchResults,
        categories: [
          {
            ...mockSearchResults.categories[0],
            propertyType: null,
          },
        ],
      }

      const { container } = render(<SearchPage results={cityOnly} />)

      const link = container.querySelector(
        'a[href="/forum/category/general-discussions/hyderabad"]'
      )
      expect(link).toBeInTheDocument()
    })

    it('should generate correct URL for regular category', () => {
      const regularCategory = {
        ...mockSearchResults,
        categories: [
          {
            ...mockSearchResults.categories[0],
            city: null,
            slug: 'member-introductions',
          },
        ],
      }

      const { container } = render(<SearchPage results={regularCategory} />)

      const link = container.querySelector('a[href="/forum/category/member-introductions"]')
      expect(link).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<SearchPage results={mockSearchResults} />)

      const h1 = screen.getByRole('heading', { level: 1 })
      expect(h1).toHaveTextContent('Search Results')
    })

    it('should have accessible links', () => {
      const { container } = render(<SearchPage results={mockSearchResults} />)

      const links = container.querySelectorAll('a')
      links.forEach(link => {
        expect(link).toHaveAttribute('href')
      })
    })

    it('should have main landmark', () => {
      const { container } = render(<SearchPage results={mockSearchResults} />)

      const main = container.querySelector('main')
      expect(main).toBeInTheDocument()
    })

    it('should have alt text for images', () => {
      render(<SearchPage results={mockSearchResults} />)

      const img = screen.getByAltText('johndoe')
      expect(img).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle null results gracefully', () => {
      render(<SearchPage results={null} />)

      expect(screen.queryByText('Search Results')).toBeInTheDocument()
    })

    it('should handle empty query', () => {
      mockUseRouter.mockReturnValue({
        query: { q: '' },
      })

      render(<SearchPage results={null} />)

      expect(screen.getByText('Search Results')).toBeInTheDocument()
    })

    it('should handle very long category names', () => {
      const longName = {
        ...mockSearchResults,
        categories: [
          {
            ...mockSearchResults.categories[0],
            name: 'A'.repeat(100),
          },
        ],
      }

      const { container } = render(<SearchPage results={longName} />)
      expect(container.querySelector('.forum-search-result-title')).toBeInTheDocument()
    })

    it('should handle special characters in search query', () => {
      const specialQuery = {
        ...mockSearchResults,
        query: 'property & <> "quotes"',
      }

      render(<SearchPage results={specialQuery} />)

      expect(screen.getByText(/property & <> "quotes"/)).toBeInTheDocument()
    })

    it('should handle missing category parent', () => {
      const noParent = {
        ...mockSearchResults,
        categories: [
          {
            ...mockSearchResults.categories[0],
            parent: null,
          },
        ],
      }

      render(<SearchPage results={noParent} />)

      expect(screen.queryByText(/in Chennai/)).not.toBeInTheDocument()
    })
  })

  describe('Stats Rendering', () => {
    it('should render all post stats', () => {
      const { container } = render(<SearchPage results={mockSearchResults} />)

      const stats = container.querySelectorAll('.forum-search-result-stats')
      expect(stats.length).toBeGreaterThan(0)
    })

    it('should display view counts', () => {
      render(<SearchPage results={mockSearchResults} />)

      expect(screen.getByText('150 views')).toBeInTheDocument()
    })

    it('should display reply counts', () => {
      render(<SearchPage results={mockSearchResults} />)

      expect(screen.getByText('25 replies')).toBeInTheDocument()
    })

    it('should display reaction counts', () => {
      render(<SearchPage results={mockSearchResults} />)

      expect(screen.getByText('10 reactions')).toBeInTheDocument()
    })
  })
})
