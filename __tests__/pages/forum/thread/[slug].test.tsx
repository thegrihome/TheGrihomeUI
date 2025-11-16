import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ThreadPage from '@/pages/forum/thread/[slug]'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'

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

jest.mock('@/components/forum/UserStats', () => {
  return function UserStats({ username }: any) {
    return <div data-testid="user-stats">{username}</div>
  }
})

jest.mock('@/components/forum/ContentRenderer', () => {
  return function ContentRenderer({ content }: any) {
    return <div data-testid="content-renderer">{content}</div>
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

describe('Thread Page - Comprehensive Tests', () => {
  const mockUseSession = useSession as jest.Mock
  const mockUseRouter = useRouter as jest.Mock

  const mockPost = {
    id: 'post1',
    title: 'Best properties in Hyderabad',
    content: '<p>Looking for the best properties in Hyderabad area</p>',
    slug: 'best-properties-hyderabad',
    viewCount: 150,
    replyCount: 25,
    isSticky: true,
    isLocked: false,
    createdAt: '2024-01-15T10:00:00Z',
    author: {
      id: 'user1',
      username: 'johndoe',
      image: '/avatar.jpg',
      createdAt: '2024-01-01T00:00:00Z',
    },
    category: {
      id: 'cat1',
      name: 'Hyderabad Apartments',
      slug: 'hyderabad-apartments',
      city: 'hyderabad',
      parent: {
        id: 'cat2',
        name: 'Hyderabad',
        slug: 'hyderabad',
        parent: {
          id: 'cat3',
          name: 'General Discussions',
          slug: 'general-discussions',
        },
      },
    },
    replies: [
      {
        id: 'reply1',
        content: '<p>Great question! I recommend...</p>',
        createdAt: '2024-01-15T11:00:00Z',
        author: {
          id: 'user2',
          username: 'janedoe',
          image: null,
          createdAt: '2024-01-02T00:00:00Z',
        },
      },
    ],
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({
      push: jest.fn(),
    })
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'user1',
          email: 'test@example.com',
          name: 'Test User',
          isEmailVerified: true,
          isMobileVerified: false,
        },
      },
      status: 'authenticated',
    })
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Rendering and Initial State', () => {
    it('should render thread page with all components', () => {
      render(<ThreadPage post={mockPost} />)

      expect(screen.getByTestId('header')).toBeInTheDocument()
      expect(screen.getByTestId('footer')).toBeInTheDocument()
    })

    it('should render post title', () => {
      render(<ThreadPage post={mockPost} />)

      expect(screen.getByText('Best properties in Hyderabad')).toBeInTheDocument()
    })

    it('should render post content', () => {
      render(<ThreadPage post={mockPost} />)

      const contentRenderers = screen.getAllByTestId('content-renderer')
      expect(contentRenderers.length).toBeGreaterThan(0)
    })

    it('should render post author', () => {
      render(<ThreadPage post={mockPost} />)

      expect(screen.getAllByText('johndoe').length).toBeGreaterThan(0)
    })

    it('should render post stats', () => {
      render(<ThreadPage post={mockPost} />)

      expect(screen.getByText('150 views')).toBeInTheDocument()
      expect(screen.getByText('25 replies')).toBeInTheDocument()
    })

    it('should render sticky flag when post is sticky', () => {
      render(<ThreadPage post={mockPost} />)

      expect(screen.getByText('📌 Sticky')).toBeInTheDocument()
    })

    it('should render locked flag when post is locked', () => {
      const lockedPost = {
        ...mockPost,
        isLocked: true,
      }

      render(<ThreadPage post={lockedPost} />)

      expect(screen.getByText('🔒 Locked')).toBeInTheDocument()
    })

    it('should not render flags when post is not sticky or locked', () => {
      const normalPost = {
        ...mockPost,
        isSticky: false,
        isLocked: false,
      }

      render(<ThreadPage post={normalPost} />)

      expect(screen.queryByText('📌 Sticky')).not.toBeInTheDocument()
      expect(screen.queryByText('🔒 Locked')).not.toBeInTheDocument()
    })
  })

  describe('Breadcrumb Navigation', () => {
    it('should render forum breadcrumb link', () => {
      const { container } = render(<ThreadPage post={mockPost} />)

      const forumLink = container.querySelector('a[href="/forum"]')
      expect(forumLink).toBeInTheDocument()
    })

    it('should render grandparent category in breadcrumb', () => {
      render(<ThreadPage post={mockPost} />)

      expect(screen.getByText('General Discussions')).toBeInTheDocument()
    })

    it('should render parent category in breadcrumb', () => {
      render(<ThreadPage post={mockPost} />)

      expect(screen.getByText('Hyderabad')).toBeInTheDocument()
    })

    it('should render current category in breadcrumb', () => {
      const { container } = render(<ThreadPage post={mockPost} />)

      const categoryLink = container.querySelector('a[href*="hyderabad-apartments"]')
      expect(categoryLink).toBeInTheDocument()
    })

    it('should render post title in breadcrumb', () => {
      const { container } = render(<ThreadPage post={mockPost} />)

      const current = container.querySelector('.forum-breadcrumb-current')
      expect(current).toHaveTextContent('Best properties in Hyderabad')
    })

    it('should render breadcrumb separators', () => {
      render(<ThreadPage post={mockPost} />)

      const separators = screen.getAllByText('›')
      expect(separators.length).toBeGreaterThan(0)
    })
  })

  describe('Reply Section', () => {
    it('should render replies title', () => {
      render(<ThreadPage post={mockPost} />)

      expect(screen.getByText('1 Reply')).toBeInTheDocument()
    })

    it('should render plural replies title', () => {
      const postWithReplies = {
        ...mockPost,
        replies: [mockPost.replies[0], { ...mockPost.replies[0], id: 'reply2' }],
      }

      render(<ThreadPage post={postWithReplies} />)

      expect(screen.getByText('2 Replies')).toBeInTheDocument()
    })

    it('should render all replies', () => {
      render(<ThreadPage post={mockPost} />)

      expect(screen.getAllByText('janedoe').length).toBeGreaterThan(0)
    })

    it('should render reply button for verified users', () => {
      render(<ThreadPage post={mockPost} />)

      const replyButtons = screen.getAllByText('Reply')
      expect(replyButtons.length).toBeGreaterThan(0)
    })

    it('should not render reply button when post is locked', () => {
      const lockedPost = {
        ...mockPost,
        isLocked: true,
      }

      render(<ThreadPage post={lockedPost} />)

      expect(screen.queryByText('Reply')).not.toBeInTheDocument()
    })

    it('should not render reply button for unverified users', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            isEmailVerified: false,
            isMobileVerified: false,
          },
        },
        status: 'authenticated',
      })

      render(<ThreadPage post={mockPost} />)

      expect(screen.queryByText('Reply')).not.toBeInTheDocument()
    })
  })

  describe('Reply Form', () => {
    it('should render reply form for verified users', () => {
      render(<ThreadPage post={mockPost} />)

      const textarea = screen.getByPlaceholderText('Write your reply...')
      expect(textarea).toBeInTheDocument()
    })

    it('should not render reply form when not authenticated', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      render(<ThreadPage post={mockPost} />)

      expect(screen.queryByPlaceholderText('Write your reply...')).not.toBeInTheDocument()
    })

    it('should render login prompt when not authenticated', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      render(<ThreadPage post={mockPost} />)

      expect(screen.getByText(/Login/)).toBeInTheDocument()
      expect(screen.getByText(/Sign up/)).toBeInTheDocument()
    })

    it('should render verification prompt when not verified', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            isEmailVerified: false,
            isMobileVerified: false,
          },
        },
        status: 'authenticated',
      })

      render(<ThreadPage post={mockPost} />)

      expect(screen.getByText('Verification Required')).toBeInTheDocument()
    })

    it('should update reply content on input', () => {
      render(<ThreadPage post={mockPost} />)

      const textarea = screen.getByPlaceholderText('Write your reply...')
      fireEvent.change(textarea, { target: { value: 'Test reply' } })

      expect(textarea).toHaveValue('Test reply')
    })

    it('should disable submit button when reply is empty', () => {
      render(<ThreadPage post={mockPost} />)

      const submitButton = screen.getByText('Submit')
      expect(submitButton).toBeDisabled()
    })

    it('should enable submit button when reply has content', () => {
      render(<ThreadPage post={mockPost} />)

      const textarea = screen.getByPlaceholderText('Write your reply...')
      fireEvent.change(textarea, { target: { value: 'Test reply' } })

      const submitButton = screen.getByText('Submit')
      expect(submitButton).not.toBeDisabled()
    })
  })

  describe('Reply Submission', () => {
    it('should submit reply successfully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'reply2',
          content: 'Test reply',
          createdAt: '2024-01-15T12:00:00Z',
          author: {
            createdAt: '2024-01-01T00:00:00Z',
          },
        }),
      })

      render(<ThreadPage post={mockPost} />)

      const textarea = screen.getByPlaceholderText('Write your reply...')
      fireEvent.change(textarea, { target: { value: 'Test reply' } })

      const submitButton = screen.getByText('Submit')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/forum/replies', expect.any(Object))
      })
    })

    it('should show loading state during submission', async () => {
      ;(global.fetch as jest.Mock).mockImplementationOnce(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({
                    id: 'reply2',
                    content: 'Test',
                    createdAt: new Date().toISOString(),
                    author: { createdAt: new Date().toISOString() },
                  }),
                }),
              100
            )
          )
      )

      render(<ThreadPage post={mockPost} />)

      const textarea = screen.getByPlaceholderText('Write your reply...')
      fireEvent.change(textarea, { target: { value: 'Test reply' } })

      const submitButton = screen.getByText('Submit')
      fireEvent.click(submitButton)

      expect(screen.getByText('Posting...')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.queryByText('Posting...')).not.toBeInTheDocument()
      })
    })

    it('should clear form after successful submission', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'reply2',
          content: 'Test reply',
          createdAt: '2024-01-15T12:00:00Z',
          author: {
            createdAt: '2024-01-01T00:00:00Z',
          },
        }),
      })

      render(<ThreadPage post={mockPost} />)

      const textarea = screen.getByPlaceholderText('Write your reply...')
      fireEvent.change(textarea, { target: { value: 'Test reply' } })

      const submitButton = screen.getByText('Submit')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(textarea).toHaveValue('')
      })
    })

    it('should handle submission error', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to post reply' }),
      })

      global.alert = jest.fn()

      render(<ThreadPage post={mockPost} />)

      const textarea = screen.getByPlaceholderText('Write your reply...')
      fireEvent.change(textarea, { target: { value: 'Test reply' } })

      const submitButton = screen.getByText('Submit')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Failed to post reply')
      })
    })

    it('should handle network error', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      global.alert = jest.fn()

      render(<ThreadPage post={mockPost} />)

      const textarea = screen.getByPlaceholderText('Write your reply...')
      fireEvent.change(textarea, { target: { value: 'Test reply' } })

      const submitButton = screen.getByText('Submit')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Failed to post reply')
      })
    })
  })

  describe('Quote Reply', () => {
    it('should populate reply form when clicking Reply button', () => {
      render(<ThreadPage post={mockPost} />)

      const replyButtons = screen.getAllByText('Reply')
      fireEvent.click(replyButtons[0])

      const textarea = screen.getByPlaceholderText('Write your reply...')
      expect(textarea.value).toContain('johndoe wrote:')
    })

    it('should quote post content when clicking reply on main post', () => {
      render(<ThreadPage post={mockPost} />)

      const replyButtons = screen.getAllByText('Reply')
      fireEvent.click(replyButtons[0])

      const textarea = screen.getByPlaceholderText('Write your reply...')
      expect(textarea.value).toContain('>')
    })
  })

  describe('Load More Replies', () => {
    it('should show Load More button when more than 20 replies', () => {
      const manyReplies = Array.from({ length: 25 }, (_, i) => ({
        id: `reply${i}`,
        content: `Reply ${i}`,
        createdAt: '2024-01-15T12:00:00Z',
        author: {
          id: `user${i}`,
          username: `user${i}`,
          image: null,
          createdAt: '2024-01-01T00:00:00Z',
        },
      }))

      const postWithManyReplies = {
        ...mockPost,
        replies: manyReplies,
      }

      render(<ThreadPage post={postWithManyReplies} />)

      expect(screen.getByText(/Load More Replies/)).toBeInTheDocument()
      expect(screen.getByText(/5 remaining/)).toBeInTheDocument()
    })

    it('should load more replies when clicking Load More button', () => {
      const manyReplies = Array.from({ length: 25 }, (_, i) => ({
        id: `reply${i}`,
        content: `Reply ${i}`,
        createdAt: '2024-01-15T12:00:00Z',
        author: {
          id: `user${i}`,
          username: `user${i}`,
          image: null,
          createdAt: '2024-01-01T00:00:00Z',
        },
      }))

      const postWithManyReplies = {
        ...mockPost,
        replies: manyReplies,
      }

      render(<ThreadPage post={postWithManyReplies} />)

      const loadMoreButton = screen.getByText(/Load More Replies/)
      fireEvent.click(loadMoreButton)

      expect(screen.queryByText(/Load More Replies/)).not.toBeInTheDocument()
    })

    it('should not show Load More button when 20 or fewer replies', () => {
      render(<ThreadPage post={mockPost} />)

      expect(screen.queryByText(/Load More Replies/)).not.toBeInTheDocument()
    })
  })

  describe('SEO', () => {
    it('should render NextSeo with correct title', () => {
      render(<ThreadPage post={mockPost} />)

      const seo = screen.getByTestId('next-seo')
      expect(seo).toHaveAttribute('data-title', 'Best properties in Hyderabad - Forum - Grihome')
    })

    it('should render NextSeo with correct canonical URL', () => {
      render(<ThreadPage post={mockPost} />)

      const seo = screen.getByTestId('next-seo')
      expect(seo).toHaveAttribute(
        'data-canonical',
        'https://grihome.vercel.app/forum/thread/best-properties-hyderabad'
      )
    })
  })

  describe('CSS Classes', () => {
    it('should have correct container classes', () => {
      const { container } = render(<ThreadPage post={mockPost} />)

      expect(container.querySelector('.forum-container')).toBeInTheDocument()
      expect(container.querySelector('.forum-main')).toBeInTheDocument()
      expect(container.querySelector('.forum-thread')).toBeInTheDocument()
    })

    it('should have correct post header classes', () => {
      const { container } = render(<ThreadPage post={mockPost} />)

      expect(container.querySelector('.forum-post-header')).toBeInTheDocument()
      expect(container.querySelector('.forum-post-title')).toBeInTheDocument()
      expect(container.querySelector('.forum-post-stats')).toBeInTheDocument()
    })

    it('should have correct reply classes', () => {
      const { container } = render(<ThreadPage post={mockPost} />)

      expect(container.querySelector('.forum-replies')).toBeInTheDocument()
      expect(container.querySelector('.forum-reply')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<ThreadPage post={mockPost} />)

      const h1 = screen.getByRole('heading', { level: 1 })
      expect(h1).toHaveTextContent('Best properties in Hyderabad')
    })

    it('should have accessible form elements', () => {
      render(<ThreadPage post={mockPost} />)

      const textarea = screen.getByPlaceholderText('Write your reply...')
      expect(textarea).toBeInTheDocument()
    })

    it('should have main landmark', () => {
      const { container } = render(<ThreadPage post={mockPost} />)

      const main = container.querySelector('main')
      expect(main).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty replies array', () => {
      const postWithoutReplies = {
        ...mockPost,
        replies: [],
      }

      const { container } = render(<ThreadPage post={postWithoutReplies} />)

      expect(container.querySelector('.forum-replies')).not.toBeInTheDocument()
    })

    it('should handle very long post content', () => {
      const longPost = {
        ...mockPost,
        content: '<p>' + 'A'.repeat(10000) + '</p>',
      }

      render(<ThreadPage post={longPost} />)

      expect(screen.getByTestId('content-renderer')).toBeInTheDocument()
    })
  })
})
