import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import UserProfilePage from '@/pages/forum/user/[userId]'

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

jest.mock('next-seo', () => ({
  NextSeo: ({ title, description, canonical }: any) => (
    <div data-testid="next-seo" data-title={title} data-description={description} data-canonical={canonical} />
  ),
}))

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, width, height }: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} width={width} height={height} />
  ),
}))

describe('User Profile Page - Comprehensive Tests', () => {
  const mockUserStats = {
    user: {
      id: 'user1',
      username: 'johndoe',
      image: '/avatar.jpg',
      createdAt: '2024-01-01T00:00:00Z',
    },
    postCount: 15,
    replyCount: 50,
    totalPosts: 65,
    reactionsReceived: {
      THANKS: 10,
      LAUGH: 5,
      CONFUSED: 2,
      SAD: 1,
      ANGRY: 0,
      LOVE: 8,
    },
    reactionsGiven: {
      THANKS: 20,
      LAUGH: 10,
      CONFUSED: 3,
      SAD: 2,
      ANGRY: 1,
      LOVE: 15,
    },
    totalReactionsReceived: 26,
    totalReactionsGiven: 51,
  }

  const mockPosts = [
    {
      id: 'post1',
      title: 'Best properties in Hyderabad',
      slug: 'best-properties-hyderabad',
      content: '<p>Looking for the best properties...</p>',
      viewCount: 150,
      createdAt: '2024-01-15T10:00:00Z',
      category: {
        id: 'cat1',
        name: 'Hyderabad Apartments',
        slug: 'hyderabad-apartments',
        city: 'hyderabad',
        propertyType: 'APARTMENTS',
      },
      _count: {
        replies: 10,
        reactions: 5,
      },
    },
  ]

  const mockReplies = [
    {
      id: 'reply1',
      content: '<p>Great question!</p>',
      createdAt: '2024-01-16T12:00:00Z',
      post: {
        id: 'post2',
        title: 'Property investment tips',
        slug: 'property-investment-tips',
      },
    },
  ]

  describe('Rendering and Initial State', () => {
    it('should render user profile page with all components', () => {
      render(<UserProfilePage userStats={mockUserStats} posts={mockPosts} replies={mockReplies} postsCount={15} repliesCount={50} />)

      expect(screen.getByTestId('header')).toBeInTheDocument()
      expect(screen.getByTestId('footer')).toBeInTheDocument()
    })

    it('should render username', () => {
      render(<UserProfilePage userStats={mockUserStats} posts={mockPosts} replies={mockReplies} postsCount={15} repliesCount={50} />)

      expect(screen.getByText('johndoe')).toBeInTheDocument()
    })

    it('should render user avatar when available', () => {
      render(<UserProfilePage userStats={mockUserStats} posts={mockPosts} replies={mockReplies} postsCount={15} repliesCount={50} />)

      const avatar = screen.getByAlt('johndoe')
      expect(avatar).toBeInTheDocument()
      expect(avatar).toHaveAttribute('src', '/avatar.jpg')
    })

    it('should render avatar placeholder when image is null', () => {
      const statsWithoutImage = {
        ...mockUserStats,
        user: { ...mockUserStats.user, image: null },
      }

      const { container } = render(<UserProfilePage userStats={statsWithoutImage} posts={mockPosts} replies={mockReplies} postsCount={15} repliesCount={50} />)

      const placeholder = container.querySelector('.forum-user-avatar-placeholder-large')
      expect(placeholder).toBeInTheDocument()
      expect(placeholder).toHaveTextContent('J')
    })

    it('should render member since date', () => {
      render(<UserProfilePage userStats={mockUserStats} posts={mockPosts} replies={mockReplies} postsCount={15} repliesCount={50} />)

      expect(screen.getByText(/Member since:/)).toBeInTheDocument()
      expect(screen.getByText(/1 January 2024/)).toBeInTheDocument()
    })

    it('should render activity level badge', () => {
      render(<UserProfilePage userStats={mockUserStats} posts={mockPosts} replies={mockReplies} postsCount={15} repliesCount={50} />)

      expect(screen.getByText('Active')).toBeInTheDocument()
    })
  })

  describe('Activity Level Badges', () => {
    it('should show "Very Active" badge for 100+ total posts', () => {
      const veryActiveStats = {
        ...mockUserStats,
        totalPosts: 150,
      }

      render(<UserProfilePage userStats={veryActiveStats} posts={mockPosts} replies={mockReplies} postsCount={15} repliesCount={50} />)

      expect(screen.getByText('Very Active')).toBeInTheDocument()
    })

    it('should show "Active" badge for 50-99 total posts', () => {
      const activeStats = {
        ...mockUserStats,
        totalPosts: 65,
      }

      render(<UserProfilePage userStats={activeStats} posts={mockPosts} replies={mockReplies} postsCount={15} repliesCount={50} />)

      expect(screen.getByText('Active')).toBeInTheDocument()
    })

    it('should show "Regular" badge for 20-49 total posts', () => {
      const regularStats = {
        ...mockUserStats,
        totalPosts: 30,
      }

      render(<UserProfilePage userStats={regularStats} posts={mockPosts} replies={mockReplies} postsCount={15} repliesCount={50} />)

      expect(screen.getByText('Regular')).toBeInTheDocument()
    })

    it('should show "Occasional" badge for 5-19 total posts', () => {
      const occasionalStats = {
        ...mockUserStats,
        totalPosts: 10,
      }

      render(<UserProfilePage userStats={occasionalStats} posts={mockPosts} replies={mockReplies} postsCount={15} repliesCount={50} />)

      expect(screen.getByText('Occasional')).toBeInTheDocument()
    })

    it('should show "New Member" badge for <5 total posts', () => {
      const newStats = {
        ...mockUserStats,
        totalPosts: 3,
      }

      render(<UserProfilePage userStats={newStats} posts={mockPosts} replies={mockReplies} postsCount={15} repliesCount={50} />)

      expect(screen.getByText('New Member')).toBeInTheDocument()
    })
  })

  describe('Tabs Navigation', () => {
    it('should render all tabs', () => {
      render(<UserProfilePage userStats={mockUserStats} posts={mockPosts} replies={mockReplies} postsCount={15} repliesCount={50} />)

      expect(screen.getByText(/Posts \(15\)/)).toBeInTheDocument()
      expect(screen.getByText(/Replies \(50\)/)).toBeInTheDocument()
      expect(screen.getByText('Overview')).toBeInTheDocument()
      expect(screen.getByText('Reactions')).toBeInTheDocument()
    })

    it('should have Posts tab active by default', () => {
      const { container } = render(<UserProfilePage userStats={mockUserStats} posts={mockPosts} replies={mockReplies} postsCount={15} repliesCount={50} />)

      const postsTab = screen.getByText(/Posts \(15\)/).closest('button')
      expect(postsTab).toHaveClass('active')
    })

    it('should switch to Replies tab when clicked', () => {
      render(<UserProfilePage userStats={mockUserStats} posts={mockPosts} replies={mockReplies} postsCount={15} repliesCount={50} />)

      const repliesTab = screen.getByText(/Replies \(50\)/)
      fireEvent.click(repliesTab)

      expect(repliesTab.closest('button')).toHaveClass('active')
    })

    it('should switch to Overview tab when clicked', () => {
      render(<UserProfilePage userStats={mockUserStats} posts={mockPosts} replies={mockReplies} postsCount={15} repliesCount={50} />)

      const overviewTab = screen.getByText('Overview')
      fireEvent.click(overviewTab)

      expect(overviewTab.closest('button')).toHaveClass('active')
    })

    it('should switch to Reactions tab when clicked', () => {
      render(<UserProfilePage userStats={mockUserStats} posts={mockPosts} replies={mockReplies} postsCount={15} repliesCount={50} />)

      const reactionsTab = screen.getByText('Reactions')
      fireEvent.click(reactionsTab)

      expect(reactionsTab.closest('button')).toHaveClass('active')
    })
  })

  describe('Posts Tab Content', () => {
    it('should render user posts', () => {
      render(<UserProfilePage userStats={mockUserStats} posts={mockPosts} replies={mockReplies} postsCount={15} repliesCount={50} />)

      expect(screen.getByText('Best properties in Hyderabad')).toBeInTheDocument()
    })

    it('should render post category', () => {
      render(<UserProfilePage userStats={mockUserStats} posts={mockPosts} replies={mockReplies} postsCount={15} repliesCount={50} />)

      expect(screen.getByText(/in Hyderabad Apartments/)).toBeInTheDocument()
    })

    it('should render post stats', () => {
      render(<UserProfilePage userStats={mockUserStats} posts={mockPosts} replies={mockReplies} postsCount={15} repliesCount={50} />)

      expect(screen.getByText('10 replies')).toBeInTheDocument()
      expect(screen.getByText('150 views')).toBeInTheDocument()
      expect(screen.getByText('5 reactions')).toBeInTheDocument()
    })

    it('should link to post thread', () => {
      const { container } = render(<UserProfilePage userStats={mockUserStats} posts={mockPosts} replies={mockReplies} postsCount={15} repliesCount={50} />)

      const postLink = container.querySelector('a[href="/forum/thread/best-properties-hyderabad"]')
      expect(postLink).toBeInTheDocument()
    })

    it('should render empty state when no posts', () => {
      render(<UserProfilePage userStats={mockUserStats} posts={[]} replies={mockReplies} postsCount={0} repliesCount={50} />)

      expect(screen.getByText('No posts yet')).toBeInTheDocument()
    })
  })

  describe('Replies Tab Content', () => {
    it('should render user replies when tab is clicked', () => {
      render(<UserProfilePage userStats={mockUserStats} posts={mockPosts} replies={mockReplies} postsCount={15} repliesCount={50} />)

      const repliesTab = screen.getByText(/Replies \(50\)/)
      fireEvent.click(repliesTab)

      expect(screen.getByText(/Re: Property investment tips/)).toBeInTheDocument()
    })

    it('should link to reply thread', () => {
      const { container } = render(<UserProfilePage userStats={mockUserStats} posts={mockPosts} replies={mockReplies} postsCount={15} repliesCount={50} />)

      const repliesTab = screen.getByText(/Replies \(50\)/)
      fireEvent.click(repliesTab)

      const replyLink = container.querySelector('a[href="/forum/thread/property-investment-tips"]')
      expect(replyLink).toBeInTheDocument()
    })

    it('should render empty state when no replies', () => {
      render(<UserProfilePage userStats={mockUserStats} posts={mockPosts} replies={[]} postsCount={15} repliesCount={0} />)

      const repliesTab = screen.getByText(/Replies \(0\)/)
      fireEvent.click(repliesTab)

      expect(screen.getByText('No replies yet')).toBeInTheDocument()
    })
  })

  describe('Overview Tab Content', () => {
    it('should render overview stats when tab is clicked', () => {
      render(<UserProfilePage userStats={mockUserStats} posts={mockPosts} replies={mockReplies} postsCount={15} repliesCount={50} />)

      const overviewTab = screen.getByText('Overview')
      fireEvent.click(overviewTab)

      expect(screen.getByText('Posts')).toBeInTheDocument()
      expect(screen.getByText('Replies')).toBeInTheDocument()
      expect(screen.getByText('Total Activity')).toBeInTheDocument()
      expect(screen.getByText('Reactions Received')).toBeInTheDocument()
    })

    it('should render correct post count', () => {
      render(<UserProfilePage userStats={mockUserStats} posts={mockPosts} replies={mockReplies} postsCount={15} repliesCount={50} />)

      const overviewTab = screen.getByText('Overview')
      fireEvent.click(overviewTab)

      expect(screen.getByText('15')).toBeInTheDocument()
    })

    it('should render correct reply count', () => {
      render(<UserProfilePage userStats={mockUserStats} posts={mockPosts} replies={mockReplies} postsCount={15} repliesCount={50} />)

      const overviewTab = screen.getByText('Overview')
      fireEvent.click(overviewTab)

      expect(screen.getByText('50')).toBeInTheDocument()
    })

    it('should render correct total activity', () => {
      render(<UserProfilePage userStats={mockUserStats} posts={mockPosts} replies={mockReplies} postsCount={15} repliesCount={50} />)

      const overviewTab = screen.getByText('Overview')
      fireEvent.click(overviewTab)

      expect(screen.getByText('65')).toBeInTheDocument()
    })

    it('should render correct total reactions received', () => {
      render(<UserProfilePage userStats={mockUserStats} posts={mockPosts} replies={mockReplies} postsCount={15} repliesCount={50} />)

      const overviewTab = screen.getByText('Overview')
      fireEvent.click(overviewTab)

      expect(screen.getByText('26')).toBeInTheDocument()
    })
  })

  describe('Reactions Tab Content', () => {
    it('should render reactions received when tab is clicked', () => {
      render(<UserProfilePage userStats={mockUserStats} posts={mockPosts} replies={mockReplies} postsCount={15} repliesCount={50} />)

      const reactionsTab = screen.getByText('Reactions')
      fireEvent.click(reactionsTab)

      expect(screen.getByText('Reactions Received')).toBeInTheDocument()
    })

    it('should render all reaction types received', () => {
      render(<UserProfilePage userStats={mockUserStats} posts={mockPosts} replies={mockReplies} postsCount={15} repliesCount={50} />)

      const reactionsTab = screen.getByText('Reactions')
      fireEvent.click(reactionsTab)

      expect(screen.getAllByText('🙏').length).toBeGreaterThan(0)
      expect(screen.getAllByText('😂').length).toBeGreaterThan(0)
      expect(screen.getAllByText('😕').length).toBeGreaterThan(0)
      expect(screen.getAllByText('😢').length).toBeGreaterThan(0)
      expect(screen.getAllByText('😠').length).toBeGreaterThan(0)
      expect(screen.getAllByText('❤️').length).toBeGreaterThan(0)
    })

    it('should render reaction counts received', () => {
      render(<UserProfilePage userStats={mockUserStats} posts={mockPosts} replies={mockReplies} postsCount={15} repliesCount={50} />)

      const reactionsTab = screen.getByText('Reactions')
      fireEvent.click(reactionsTab)

      expect(screen.getAllByText('10').length).toBeGreaterThan(0)
      expect(screen.getAllByText('5').length).toBeGreaterThan(0)
      expect(screen.getAllByText('8').length).toBeGreaterThan(0)
    })

    it('should render reactions given section', () => {
      render(<UserProfilePage userStats={mockUserStats} posts={mockPosts} replies={mockReplies} postsCount={15} repliesCount={50} />)

      const reactionsTab = screen.getByText('Reactions')
      fireEvent.click(reactionsTab)

      expect(screen.getByText('Reactions Given')).toBeInTheDocument()
    })

    it('should render total reactions given', () => {
      render(<UserProfilePage userStats={mockUserStats} posts={mockPosts} replies={mockReplies} postsCount={15} repliesCount={50} />)

      const reactionsTab = screen.getByText('Reactions')
      fireEvent.click(reactionsTab)

      expect(screen.getByText(/Total: 51 reactions given/)).toBeInTheDocument()
    })

    it('should render total reactions received', () => {
      render(<UserProfilePage userStats={mockUserStats} posts={mockPosts} replies={mockReplies} postsCount=15} repliesCount={50} />)

      const reactionsTab = screen.getByText('Reactions')
      fireEvent.click(reactionsTab)

      expect(screen.getByText(/Total: 26 reactions received/)).toBeInTheDocument()
    })
  })

  describe('Breadcrumb Navigation', () => {
    it('should render forum breadcrumb link', () => {
      const { container } = render(<UserProfilePage userStats={mockUserStats} posts={mockPosts} replies={mockReplies} postsCount={15} repliesCount={50} />)

      const forumLink = container.querySelector('a[href="/forum"]')
      expect(forumLink).toBeInTheDocument()
    })

    it('should render current page in breadcrumb', () => {
      const { container } = render(<UserProfilePage userStats={mockUserStats} posts={mockPosts} replies={mockReplies} postsCount={15} repliesCount={50} />)

      const current = container.querySelector('.forum-breadcrumb-current')
      expect(current).toHaveTextContent('User Profile')
    })

    it('should render breadcrumb separator', () => {
      render(<UserProfilePage userStats={mockUserStats} posts={mockPosts} replies={mockReplies} postsCount={15} repliesCount={50} />)

      const separator = screen.getByText('›')
      expect(separator).toBeInTheDocument()
    })
  })

  describe('SEO', () => {
    it('should render NextSeo with correct title', () => {
      render(<UserProfilePage userStats={mockUserStats} posts={mockPosts} replies={mockReplies} postsCount={15} repliesCount={50} />)

      const seo = screen.getByTestId('next-seo')
      expect(seo).toHaveAttribute('data-title', 'johndoe - User Profile - Forum - Grihome')
    })

    it('should render NextSeo with correct description', () => {
      render(<UserProfilePage userStats={mockUserStats} posts={mockPosts} replies={mockReplies} postsCount={15} repliesCount={50} />)

      const seo = screen.getByTestId('next-seo')
      expect(seo).toHaveAttribute('data-description', "View johndoe's forum profile and activity on Grihome community forum")
    })

    it('should render NextSeo with correct canonical URL', () => {
      render(<UserProfilePage userStats={mockUserStats} posts={mockPosts} replies={mockReplies} postsCount={15} repliesCount={50} />)

      const seo = screen.getByTestId('next-seo')
      expect(seo).toHaveAttribute('data-canonical', 'https://grihome.vercel.app/forum/user/user1')
    })
  })

  describe('CSS Classes', () => {
    it('should have correct container classes', () => {
      const { container } = render(<UserProfilePage userStats={mockUserStats} posts={mockPosts} replies={mockReplies} postsCount={15} repliesCount={50} />)

      expect(container.querySelector('.forum-container')).toBeInTheDocument()
      expect(container.querySelector('.forum-main')).toBeInTheDocument()
      expect(container.querySelector('.forum-user-profile')).toBeInTheDocument()
    })

    it('should have correct user header classes', () => {
      const { container } = render(<UserProfilePage userStats={mockUserStats} posts={mockPosts} replies={mockReplies} postsCount={15} repliesCount={50} />)

      expect(container.querySelector('.forum-user-header')).toBeInTheDocument()
      expect(container.querySelector('.forum-user-info')).toBeInTheDocument()
      expect(container.querySelector('.forum-user-username')).toBeInTheDocument()
    })

    it('should have correct tabs classes', () => {
      const { container } = render(<UserProfilePage userStats={mockUserStats} posts={mockPosts} replies={mockReplies} postsCount={15} repliesCount={50} />)

      expect(container.querySelector('.forum-user-tabs')).toBeInTheDocument()
      expect(container.querySelector('.forum-tab')).toBeInTheDocument()
      expect(container.querySelector('.forum-tab.active')).toBeInTheDocument()
    })

    it('should have correct stats classes', () => {
      render(<UserProfilePage userStats={mockUserStats} posts={mockPosts} replies={mockReplies} postsCount={15} repliesCount={50} />)

      const overviewTab = screen.getByText('Overview')
      fireEvent.click(overviewTab)

      const { container } = render(<UserProfilePage userStats={mockUserStats} posts={mockPosts} replies={mockReplies} postsCount={15} repliesCount={50} />)

      expect(container.querySelector('.forum-stats-grid')).toBeTruthy()
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<UserProfilePage userStats={mockUserStats} posts={mockPosts} replies={mockReplies} postsCount={15} repliesCount={50} />)

      const h1 = screen.getByRole('heading', { level: 1 })
      expect(h1).toHaveTextContent('johndoe')
    })

    it('should have accessible tab buttons', () => {
      const { container } = render(<UserProfilePage userStats={mockUserStats} posts={mockPosts} replies={mockReplies} postsCount={15} repliesCount={50} />)

      const tabs = container.querySelectorAll('.forum-tab')
      tabs.forEach(tab => {
        expect(tab.tagName).toBe('BUTTON')
      })
    })

    it('should have main landmark', () => {
      const { container } = render(<UserProfilePage userStats={mockUserStats} posts={mockPosts} replies={mockReplies} postsCount={15} repliesCount={50} />)

      const main = container.querySelector('main')
      expect(main).toBeInTheDocument()
    })

    it('should have alt text for avatar image', () => {
      render(<UserProfilePage userStats={mockUserStats} posts={mockPosts} replies={mockReplies} postsCount={15} repliesCount={50} />)

      const img = screen.getByAlt('johndoe')
      expect(img).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero posts and replies', () => {
      const zeroStats = {
        ...mockUserStats,
        postCount: 0,
        replyCount: 0,
        totalPosts: 0,
      }

      render(<UserProfilePage userStats={zeroStats} posts={[]} replies={[]} postsCount={0} repliesCount={0} />)

      expect(screen.getByText(/Posts \(0\)/)).toBeInTheDocument()
      expect(screen.getByText(/Replies \(0\)/)).toBeInTheDocument()
    })

    it('should handle zero reactions', () => {
      const noReactionsStats = {
        ...mockUserStats,
        totalReactionsReceived: 0,
        totalReactionsGiven: 0,
        reactionsReceived: {
          THANKS: 0,
          LAUGH: 0,
          CONFUSED: 0,
          SAD: 0,
          ANGRY: 0,
          LOVE: 0,
        },
        reactionsGiven: {
          THANKS: 0,
          LAUGH: 0,
          CONFUSED: 0,
          SAD: 0,
          ANGRY: 0,
          LOVE: 0,
        },
      }

      render(<UserProfilePage userStats={noReactionsStats} posts={mockPosts} replies={mockReplies} postsCount={15} repliesCount={50} />)

      const reactionsTab = screen.getByText('Reactions')
      fireEvent.click(reactionsTab)

      expect(screen.getByText(/Total: 0 reactions received/)).toBeInTheDocument()
      expect(screen.getByText(/Total: 0 reactions given/)).toBeInTheDocument()
    })

    it('should handle very long username', () => {
      const longUsernameStats = {
        ...mockUserStats,
        user: { ...mockUserStats.user, username: 'a'.repeat(50) },
      }

      render(<UserProfilePage userStats={longUsernameStats} posts={mockPosts} replies={mockReplies} postsCount={15} repliesCount={50} />)

      expect(screen.getByText('a'.repeat(50))).toBeInTheDocument()
    })
  })
})
