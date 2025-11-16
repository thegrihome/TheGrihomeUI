import React from 'react'
import { render, screen } from '@testing-library/react'
import CategoryPage from '@/pages/forum/category/[slug]'
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
    <div data-testid="next-seo" data-title={title} data-description={description} data-canonical={canonical} />
  ),
}))

describe('Category Page - Comprehensive Tests', () => {
  const mockUseRouter = useRouter as jest.Mock
  const mockUseSession = useSession as jest.Mock

  const mockCategory = {
    id: 'cat1',
    name: 'Member Introductions',
    slug: 'member-introductions',
    description: 'Introduce yourself to the community',
    city: null,
    parent: null,
  }

  const mockPosts = [
    {
      id: 'post1',
      title: 'Hello everyone!',
      slug: 'hello-everyone',
      content: 'Just joined the forum',
      viewCount: 50,
      replyCount: 10,
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
        replies: 10,
        reactions: 5,
      },
    },
    {
      id: 'post2',
      title: 'Greetings from Mumbai',
      slug: 'greetings-mumbai',
      content: 'Happy to be here',
      viewCount: 30,
      replyCount: 5,
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
        replies: 5,
        reactions: 2,
      },
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({
      query: {},
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
    it('should render category page with all components', () => {
      render(<CategoryPage category={mockCategory} posts={mockPosts} totalCount={2} currentPage={1} totalPages={1} />)

      expect(screen.getByTestId('header')).toBeInTheDocument()
      expect(screen.getByTestId('footer')).toBeInTheDocument()
      expect(screen.getByTestId('forum-search')).toBeInTheDocument()
    })

    it('should render category name', () => {
      render(<CategoryPage category={mockCategory} posts={mockPosts} totalCount={2} currentPage={1} totalPages={1} />)

      expect(screen.getByText('Member Introductions')).toBeInTheDocument()
    })

    it('should render category description', () => {
      render(<CategoryPage category={mockCategory} posts={mockPosts} totalCount={2} currentPage={1} totalPages={1} />)

      expect(screen.getByText('Introduce yourself to the community')).toBeInTheDocument()
    })

    it('should render thread count', () => {
      render(<CategoryPage category={mockCategory} posts={mockPosts} totalCount={2} currentPage={1} totalPages={1} />)

      expect(screen.getByText('2 threads')).toBeInTheDocument()
    })

    it('should render singular thread for count of 1', () => {
      render(<CategoryPage category={mockCategory} posts={mockPosts} totalCount={1} currentPage={1} totalPages={1} />)

      expect(screen.getByText('1 thread')).toBeInTheDocument()
    })

    it('should render category icon', () => {
      const { container } = render(<CategoryPage category={mockCategory} posts={mockPosts} totalCount={2} currentPage={1} totalPages={1} />)

      expect(container.querySelector('.forum-category-icon-large')).toBeInTheDocument()
    })
  })

  describe('Breadcrumb Navigation', () => {
    it('should render forum breadcrumb link', () => {
      const { container } = render(<CategoryPage category={mockCategory} posts={mockPosts} totalCount={2} currentPage={1} totalPages={1} />)

      const forumLink = container.querySelector('a[href="/forum"]')
      expect(forumLink).toBeInTheDocument()
    })

    it('should render current category in breadcrumb', () => {
      const { container } = render(<CategoryPage category={mockCategory} posts={mockPosts} totalCount={2} currentPage={1} totalPages={1} />)

      const current = container.querySelector('.forum-breadcrumb-current')
      expect(current).toHaveTextContent('Member Introductions')
    })

    it('should render parent category in breadcrumb when available', () => {
      const categoryWithParent = {
        ...mockCategory,
        parent: {
          id: 'parent1',
          name: 'General Discussions',
          slug: 'general-discussions',
          parent: null,
        },
        city: 'hyderabad',
      }

      render(<CategoryPage category={categoryWithParent} posts={mockPosts} totalCount={2} currentPage={1} totalPages={1} />)

      expect(screen.getByText('General Discussions')).toBeInTheDocument()
    })

    it('should render grandparent category in breadcrumb when available', () => {
      const categoryWithGrandparent = {
        ...mockCategory,
        parent: {
          id: 'parent1',
          name: 'Hyderabad',
          slug: 'hyderabad',
          parent: {
            id: 'grandparent1',
            name: 'General Discussions',
            slug: 'general-discussions',
          },
        },
        city: 'hyderabad',
      }

      render(<CategoryPage category={categoryWithGrandparent} posts={mockPosts} totalCount={2} currentPage={1} totalPages={1} />)

      expect(screen.getByText('General Discussions')).toBeInTheDocument()
      expect(screen.getByText('Hyderabad')).toBeInTheDocument()
    })

    it('should render breadcrumb separators', () => {
      render(<CategoryPage category={mockCategory} posts={mockPosts} totalCount={2} currentPage={1} totalPages={1} />)

      const separators = screen.getAllByText('›')
      expect(separators.length).toBeGreaterThan(0)
    })
  })

  describe('Post List Rendering', () => {
    it('should render all posts', () => {
      render(<CategoryPage category={mockCategory} posts={mockPosts} totalCount={2} currentPage={1} totalPages={1} />)

      expect(screen.getByText('Hello everyone!')).toBeInTheDocument()
      expect(screen.getByText('Greetings from Mumbai')).toBeInTheDocument()
    })

    it('should render post author information', () => {
      render(<CategoryPage category={mockCategory} posts={mockPosts} totalCount={2} currentPage={1} totalPages={1} />)

      expect(screen.getByText(/Posted by/)).toBeInTheDocument()
      expect(screen.getAllByText(/johndoe/).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/janedoe/).length).toBeGreaterThan(0)
    })

    it('should render post dates', () => {
      render(<CategoryPage category={mockCategory} posts={mockPosts} totalCount={2} currentPage={1} totalPages={1} />)

      expect(screen.getByText(/15 Jan 2024/)).toBeInTheDocument()
      expect(screen.getByText(/14 Jan 2024/)).toBeInTheDocument()
    })

    it('should render post statistics', () => {
      render(<CategoryPage category={mockCategory} posts={mockPosts} totalCount={2} currentPage={1} totalPages={1} />)

      expect(screen.getByText('10 replies')).toBeInTheDocument()
      expect(screen.getByText('5 replies')).toBeInTheDocument()
      expect(screen.getAllByText(/reactions/).length).toBeGreaterThan(0)
    })

    it('should render last reply time when available', () => {
      render(<CategoryPage category={mockCategory} posts={mockPosts} totalCount={2} currentPage={1} totalPages={1} />)

      expect(screen.getByText(/Last reply:/)).toBeInTheDocument()
      expect(screen.getByText(/16 Jan 2024/)).toBeInTheDocument()
    })

    it('should not render last reply when null', () => {
      const postsWithoutReply = [{
        ...mockPosts[0],
        lastReplyAt: null,
      }]

      render(<CategoryPage category={mockCategory} posts={postsWithoutReply} totalCount={1} currentPage={1} totalPages={1} />)

      const lastReplyElements = screen.queryAllByText(/Last reply:/)
      expect(lastReplyElements.length).toBe(0)
    })

    it('should link to thread correctly', () => {
      const { container } = render(<CategoryPage category={mockCategory} posts={mockPosts} totalCount={2} currentPage={1} totalPages={1} />)

      const postLink = container.querySelector('a[href="/forum/thread/hello-everyone"]')
      expect(postLink).toBeInTheDocument()
    })

    it('should link to user profile', () => {
      const { container } = render(<CategoryPage category={mockCategory} posts={mockPosts} totalCount={2} currentPage={1} totalPages={1} />)

      const userLink = container.querySelector('a[href="/forum/user/user1"]')
      expect(userLink).toBeInTheDocument()
    })
  })

  describe('Post Flags and Badges', () => {
    it('should render sticky flag for sticky posts', () => {
      render(<CategoryPage category={mockCategory} posts={mockPosts} totalCount={2} currentPage={1} totalPages={1} />)

      expect(screen.getByText('📌')).toBeInTheDocument()
    })

    it('should render locked flag for locked posts', () => {
      render(<CategoryPage category={mockCategory} posts={mockPosts} totalCount={2} currentPage={1} totalPages={1} />)

      expect(screen.getByText('🔒')).toBeInTheDocument()
    })

    it('should apply sticky class to sticky posts', () => {
      const { container } = render(<CategoryPage category={mockCategory} posts={mockPosts} totalCount={2} currentPage={1} totalPages={1} />)

      const stickyPost = container.querySelector('.forum-post-item.sticky')
      expect(stickyPost).toBeInTheDocument()
    })

    it('should not apply sticky class to non-sticky posts', () => {
      const nonStickyPosts = [{
        ...mockPosts[1],
      }]

      const { container } = render(<CategoryPage category={mockCategory} posts={nonStickyPosts} totalCount={1} currentPage={1} totalPages={1} />)

      const stickyPost = container.querySelector('.forum-post-item.sticky')
      expect(stickyPost).not.toBeInTheDocument()
    })
  })

  describe('Pagination', () => {
    it('should render pagination links for pages > 20 replies', () => {
      const postWithManyReplies = [{
        ...mockPosts[0],
        replyCount: 45,
      }]

      render(<CategoryPage category={mockCategory} posts={postWithManyReplies} totalCount={1} currentPage={1} totalPages={1} />)

      const pageLinks = screen.getAllByText(/[0-9]/)
      expect(pageLinks.length).toBeGreaterThan(0)
    })

    it('should show ellipsis for posts with many pages', () => {
      const postWithManyReplies = [{
        ...mockPosts[0],
        replyCount: 150,
      }]

      render(<CategoryPage category={mockCategory} posts={postWithManyReplies} totalCount={1} currentPage={1} totalPages={1} />)

      const ellipsis = screen.getAllByText('...')
      expect(ellipsis.length).toBeGreaterThan(0)
    })

    it('should show all page numbers when totalPages <= 5', () => {
      const postWithModerateReplies = [{
        ...mockPosts[0],
        replyCount: 80,
      }]

      render(<CategoryPage category={mockCategory} posts={postWithModerateReplies} totalCount={1} currentPage={1} totalPages={1} />)

      // Should show pages 1, 2, 3, 4
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText('4')).toBeInTheDocument()
    })

    it('should render pagination controls when multiple pages', () => {
      render(<CategoryPage category={mockCategory} posts={mockPosts} totalCount={25} currentPage={1} totalPages={2} />)

      expect(screen.getByText('Next →')).toBeInTheDocument()
      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument()
    })

    it('should render Previous link when not on first page', () => {
      render(<CategoryPage category={mockCategory} posts={mockPosts} totalCount={25} currentPage={2} totalPages={2} />)

      expect(screen.getByText('← Previous')).toBeInTheDocument()
    })

    it('should not render Previous link on first page', () => {
      render(<CategoryPage category={mockCategory} posts={mockPosts} totalCount={25} currentPage={1} totalPages={2} />)

      expect(screen.queryByText('← Previous')).not.toBeInTheDocument()
    })

    it('should not render Next link on last page', () => {
      render(<CategoryPage category={mockCategory} posts={mockPosts} totalCount={25} currentPage={2} totalPages={2} />)

      expect(screen.queryByText('Next →')).not.toBeInTheDocument()
    })

    it('should link to correct page number', () => {
      const { container } = render(<CategoryPage category={mockCategory} posts={mockPosts} totalCount={25} currentPage={1} totalPages={2} />)

      const nextLink = container.querySelector('a[href="/forum/category/member-introductions?page=2"]')
      expect(nextLink).toBeInTheDocument()
    })
  })

  describe('New Thread Button', () => {
    it('should render New Thread button for authenticated users', () => {
      render(<CategoryPage category={mockCategory} posts={mockPosts} totalCount={2} currentPage={1} totalPages={1} />)

      expect(screen.getByText('New Thread')).toBeInTheDocument()
    })

    it('should render Login to Post button for unauthenticated users', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      render(<CategoryPage category={mockCategory} posts={mockPosts} totalCount={2} currentPage={1} totalPages={1} />)

      expect(screen.getByText('Login to Post')).toBeInTheDocument()
    })

    it('should link to new post page with category', () => {
      const { container } = render(<CategoryPage category={mockCategory} posts={mockPosts} totalCount={2} currentPage={1} totalPages={1} />)

      const newThreadLink = container.querySelector('a[href="/forum/new-post?category=cat1"]')
      expect(newThreadLink).toBeInTheDocument()
    })

    it('should link to login page for unauthenticated users', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      const { container } = render(<CategoryPage category={mockCategory} posts={mockPosts} totalCount={2} currentPage={1} totalPages={1} />)

      const loginLink = container.querySelector('a[href="/login"]')
      expect(loginLink).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('should render empty state when no posts', () => {
      render(<CategoryPage category={mockCategory} posts={[]} totalCount={0} currentPage={1} totalPages={1} />)

      expect(screen.getByText('No threads yet')).toBeInTheDocument()
    })

    it('should render helpful message in empty state', () => {
      render(<CategoryPage category={mockCategory} posts={[]} totalCount={0} currentPage={1} totalPages={1} />)

      expect(screen.getByText(/Be the first to start a discussion/)).toBeInTheDocument()
    })

    it('should have empty state class', () => {
      const { container } = render(<CategoryPage category={mockCategory} posts={[]} totalCount={0} currentPage={1} totalPages={1} />)

      expect(container.querySelector('.forum-empty-state')).toBeInTheDocument()
    })
  })

  describe('SEO', () => {
    it('should render NextSeo with correct title', () => {
      render(<CategoryPage category={mockCategory} posts={mockPosts} totalCount={2} currentPage={1} totalPages={1} />)

      const seo = screen.getByTestId('next-seo')
      expect(seo).toHaveAttribute('data-title', 'Member Introductions - Forum - Grihome')
    })

    it('should render NextSeo with correct description', () => {
      render(<CategoryPage category={mockCategory} posts={mockPosts} totalCount={2} currentPage={1} totalPages={1} />)

      const seo = screen.getByTestId('next-seo')
      expect(seo).toHaveAttribute('data-description', 'Introduce yourself to the community')
    })

    it('should render default description when category description is null', () => {
      const categoryWithoutDesc = {
        ...mockCategory,
        description: null,
      }

      render(<CategoryPage category={categoryWithoutDesc} posts={mockPosts} totalCount={2} currentPage={1} totalPages={1} />)

      const seo = screen.getByTestId('next-seo')
      expect(seo).toHaveAttribute('data-description', 'Discussion forum for Member Introductions on Grihome')
    })

    it('should render NextSeo with correct canonical URL', () => {
      render(<CategoryPage category={mockCategory} posts={mockPosts} totalCount={2} currentPage={1} totalPages={1} />)

      const seo = screen.getByTestId('next-seo')
      expect(seo).toHaveAttribute('data-canonical', 'https://grihome.vercel.app/forum/category/member-introductions')
    })
  })

  describe('CSS Classes', () => {
    it('should have correct container classes', () => {
      const { container } = render(<CategoryPage category={mockCategory} posts={mockPosts} totalCount={2} currentPage={1} totalPages={1} />)

      expect(container.querySelector('.forum-container')).toBeInTheDocument()
      expect(container.querySelector('.forum-main')).toBeInTheDocument()
      expect(container.querySelector('.forum-content')).toBeInTheDocument()
    })

    it('should have correct header classes', () => {
      const { container } = render(<CategoryPage category={mockCategory} posts={mockPosts} totalCount={2} currentPage={1} totalPages={1} />)

      expect(container.querySelector('.forum-header')).toBeInTheDocument()
      expect(container.querySelector('.forum-header-content')).toBeInTheDocument()
      expect(container.querySelector('.forum-title')).toBeInTheDocument()
    })

    it('should have correct post list classes', () => {
      const { container } = render(<CategoryPage category={mockCategory} posts={mockPosts} totalCount={2} currentPage={1} totalPages={1} />)

      expect(container.querySelector('.forum-posts-list')).toBeInTheDocument()
      expect(container.querySelector('.forum-post-item')).toBeInTheDocument()
    })

    it('should have correct breadcrumb classes', () => {
      const { container } = render(<CategoryPage category={mockCategory} posts={mockPosts} totalCount={2} currentPage={1} totalPages={1} />)

      expect(container.querySelector('.forum-breadcrumb')).toBeInTheDocument()
      expect(container.querySelector('.forum-breadcrumb-link')).toBeInTheDocument()
      expect(container.querySelector('.forum-breadcrumb-current')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<CategoryPage category={mockCategory} posts={mockPosts} totalCount={2} currentPage={1} totalPages={1} />)

      const h1 = screen.getByRole('heading', { level: 1 })
      expect(h1).toBeInTheDocument()
    })

    it('should have accessible links', () => {
      const { container } = render(<CategoryPage category={mockCategory} posts={mockPosts} totalCount={2} currentPage={1} totalPages={1} />)

      const links = container.querySelectorAll('a')
      links.forEach(link => {
        expect(link).toHaveAttribute('href')
      })
    })

    it('should have main landmark', () => {
      const { container } = render(<CategoryPage category={mockCategory} posts={mockPosts} totalCount={2} currentPage={1} totalPages={1} />)

      const main = container.querySelector('main')
      expect(main).toBeInTheDocument()
    })
  })

  describe('Title Formatting', () => {
    it('should apply gradient class to title elements', () => {
      const { container } = render(<CategoryPage category={mockCategory} posts={mockPosts} totalCount={2} currentPage={1} totalPages={1} />)

      const gradients = container.querySelectorAll('.forum-title-gradient')
      expect(gradients.length).toBeGreaterThan(0)
    })

    it('should format title with correct text', () => {
      render(<CategoryPage category={mockCategory} posts={mockPosts} totalCount={2} currentPage={1} totalPages={1} />)

      expect(screen.getByText('Member Introductions')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero posts correctly', () => {
      render(<CategoryPage category={mockCategory} posts={[]} totalCount={0} currentPage={1} totalPages={1} />)

      expect(screen.getByText('0 threads')).toBeInTheDocument()
    })

    it('should handle very large post counts', () => {
      render(<CategoryPage category={mockCategory} posts={mockPosts} totalCount={10000} currentPage={1} totalPages={500} />)

      expect(screen.getByText('10000 threads')).toBeInTheDocument()
    })

    it('should handle posts with no reactions', () => {
      const postWithoutReactions = [{
        ...mockPosts[0],
        _count: {
          replies: 0,
          reactions: 0,
        },
      }]

      render(<CategoryPage category={mockCategory} posts={postWithoutReactions} totalCount={1} currentPage={1} totalPages={1} />)

      expect(screen.getByText('0 reactions')).toBeInTheDocument()
    })

    it('should handle posts with very long titles', () => {
      const longTitlePost = [{
        ...mockPosts[0],
        title: 'A'.repeat(200),
      }]

      const { container } = render(<CategoryPage category={mockCategory} posts={longTitlePost} totalCount={1} currentPage={1} totalPages={1} />)

      expect(container.querySelector('.forum-post-title')).toBeInTheDocument()
    })
  })
})
