import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import UserStats from '@/components/forum/UserStats'
import { mockFetchSuccess, mockFetchError } from '@/__tests__/utils/test-utils'

describe('UserStats Component', () => {
  const mockStats = {
    postCount: 10,
    replyCount: 25,
    totalPosts: 35,
    totalReactionsReceived: 50,
    reactionsReceived: {
      THANKS: 20,
      LAUGH: 10,
      CONFUSED: 5,
      SAD: 3,
      ANGRY: 2,
      LOVE: 10,
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  describe('Rendering', () => {
    it('should render user stats card', async () => {
      mockFetchSuccess(mockStats)

      const { container } = render(
        <UserStats userId="user123" username="testuser" createdAt="2023-01-15T00:00:00Z" />
      )

      await waitFor(() => {
        const card = container.querySelector('.user-stats-card')
        expect(card).toBeInTheDocument()
      })
    })

    it('should display username', async () => {
      mockFetchSuccess(mockStats)

      render(<UserStats userId="user123" username="johndoe" createdAt="2023-01-15T00:00:00Z" />)

      await waitFor(() => {
        expect(screen.getByText('johndoe')).toBeInTheDocument()
      })
    })

    it('should display user avatar with image', async () => {
      mockFetchSuccess(mockStats)

      const { container } = render(
        <UserStats
          userId="user123"
          username="testuser"
          userImage="https://example.com/avatar.jpg"
          createdAt="2023-01-15T00:00:00Z"
        />
      )

      await waitFor(() => {
        const avatar = container.querySelector('.user-stats-avatar-img')
        expect(avatar).toBeInTheDocument()
      })
    })

    it('should display placeholder avatar without image', async () => {
      mockFetchSuccess(mockStats)

      const { container } = render(
        <UserStats userId="user123" username="testuser" createdAt="2023-01-15T00:00:00Z" />
      )

      await waitFor(() => {
        const placeholder = container.querySelector('.user-stats-avatar-placeholder')
        expect(placeholder).toBeInTheDocument()
        expect(placeholder?.textContent).toBe('T')
      })
    })

    it('should display first letter of username in placeholder', async () => {
      mockFetchSuccess(mockStats)

      render(<UserStats userId="user123" username="alice" createdAt="2023-01-15T00:00:00Z" />)

      await waitFor(() => {
        expect(screen.getByText('A')).toBeInTheDocument()
      })
    })

    it('should uppercase first letter in placeholder', async () => {
      mockFetchSuccess(mockStats)

      render(<UserStats userId="user123" username="bob" createdAt="2023-01-15T00:00:00Z" />)

      await waitFor(() => {
        expect(screen.getByText('B')).toBeInTheDocument()
      })
    })

    it('should display formatted join date', async () => {
      mockFetchSuccess(mockStats)

      render(<UserStats userId="user123" username="testuser" createdAt="2023-01-15T00:00:00Z" />)

      await waitFor(() => {
        expect(screen.getByText(/joined/i)).toBeInTheDocument()
        expect(screen.getByText(/jan/i)).toBeInTheDocument()
        expect(screen.getByText(/2023/i)).toBeInTheDocument()
      })
    })

    it('should link to user profile', async () => {
      mockFetchSuccess(mockStats)

      render(<UserStats userId="user123" username="testuser" createdAt="2023-01-15T00:00:00Z" />)

      await waitFor(() => {
        const link = screen.getByText('testuser').closest('a')
        expect(link).toHaveAttribute('href', '/forum/user/user123')
      })
    })
  })

  describe('Stats Display', () => {
    it('should display total posts after loading', async () => {
      mockFetchSuccess(mockStats)

      render(<UserStats userId="user123" username="testuser" createdAt="2023-01-15T00:00:00Z" />)

      await waitFor(() => {
        expect(screen.getByText('35')).toBeInTheDocument()
      })
    })

    it('should show placeholder before stats load', async () => {
      mockFetchSuccess(mockStats)

      render(<UserStats userId="user123" username="testuser" createdAt="2023-01-15T00:00:00Z" />)

      expect(screen.getByText('-')).toBeInTheDocument()
    })

    it('should show basic stats by default', async () => {
      mockFetchSuccess(mockStats)

      render(<UserStats userId="user123" username="testuser" createdAt="2023-01-15T00:00:00Z" />)

      await waitFor(() => {
        expect(screen.getByText('Posts:')).toBeInTheDocument()
        expect(screen.getByText('35')).toBeInTheDocument()
      })
    })

    it('should not show detailed stats by default', async () => {
      mockFetchSuccess(mockStats)

      render(<UserStats userId="user123" username="testuser" createdAt="2023-01-15T00:00:00Z" />)

      await waitFor(() => {
        expect(screen.queryByText('Threads:')).not.toBeInTheDocument()
        expect(screen.queryByText('Replies:')).not.toBeInTheDocument()
      })
    })

    it('should show detailed stats when showFullStats is true', async () => {
      mockFetchSuccess(mockStats)

      render(
        <UserStats
          userId="user123"
          username="testuser"
          createdAt="2023-01-15T00:00:00Z"
          showFullStats={true}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Threads:')).toBeInTheDocument()
        expect(screen.getByText('10')).toBeInTheDocument()
      })
    })

    it('should show reply count in full stats', async () => {
      mockFetchSuccess(mockStats)

      render(
        <UserStats
          userId="user123"
          username="testuser"
          createdAt="2023-01-15T00:00:00Z"
          showFullStats={true}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Replies:')).toBeInTheDocument()
        expect(screen.getByText('25')).toBeInTheDocument()
      })
    })

    it('should show reactions count in full stats', async () => {
      mockFetchSuccess(mockStats)

      render(
        <UserStats
          userId="user123"
          username="testuser"
          createdAt="2023-01-15T00:00:00Z"
          showFullStats={true}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Reactions:')).toBeInTheDocument()
        expect(screen.getByText('50')).toBeInTheDocument()
      })
    })

    it('should show separator in full stats mode', async () => {
      mockFetchSuccess(mockStats)

      const { container } = render(
        <UserStats
          userId="user123"
          username="testuser"
          createdAt="2023-01-15T00:00:00Z"
          showFullStats={true}
        />
      )

      await waitFor(() => {
        const separator = container.querySelector('.user-stats-separator')
        expect(separator).toBeInTheDocument()
      })
    })
  })

  describe('API Integration', () => {
    it('should fetch stats from API', async () => {
      mockFetchSuccess(mockStats)

      render(<UserStats userId="user123" username="testuser" createdAt="2023-01-15T00:00:00Z" />)

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/forum/user/user123/stats')
      })
    })

    it('should handle API error gracefully', async () => {
      mockFetchError('Failed to fetch')
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      render(<UserStats userId="user123" username="testuser" createdAt="2023-01-15T00:00:00Z" />)

      await waitFor(() => {
        expect(screen.getByText('-')).toBeInTheDocument()
      })

      consoleErrorSpy.mockRestore()
    })

    it('should handle network error', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      render(<UserStats userId="user123" username="testuser" createdAt="2023-01-15T00:00:00Z" />)

      await waitFor(() => {
        expect(screen.getByText('-')).toBeInTheDocument()
      })

      consoleErrorSpy.mockRestore()
    })

    it('should refetch stats when userId changes', async () => {
      mockFetchSuccess(mockStats)

      const { rerender } = render(
        <UserStats userId="user123" username="testuser" createdAt="2023-01-15T00:00:00Z" />
      )

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/forum/user/user123/stats')
      })

      const newMockStats = { ...mockStats, totalPosts: 50 }
      mockFetchSuccess(newMockStats)

      rerender(<UserStats userId="user456" username="testuser" createdAt="2023-01-15T00:00:00Z" />)

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/forum/user/user456/stats')
      })
    })

    it('should not show loading state (loads in background)', () => {
      mockFetchSuccess(mockStats)

      render(<UserStats userId="user123" username="testuser" createdAt="2023-01-15T00:00:00Z" />)

      expect(screen.getByText('testuser')).toBeInTheDocument()
    })
  })

  describe('Date Formatting', () => {
    it('should format date in en-IN locale', async () => {
      mockFetchSuccess(mockStats)

      render(<UserStats userId="user123" username="testuser" createdAt="2024-03-15T00:00:00Z" />)

      await waitFor(() => {
        expect(screen.getByText(/mar/i)).toBeInTheDocument()
        expect(screen.getByText(/2024/i)).toBeInTheDocument()
      })
    })

    it('should show year and short month', async () => {
      mockFetchSuccess(mockStats)

      render(<UserStats userId="user123" username="testuser" createdAt="2023-12-25T00:00:00Z" />)

      await waitFor(() => {
        expect(screen.getByText(/dec/i)).toBeInTheDocument()
        expect(screen.getByText(/2023/i)).toBeInTheDocument()
      })
    })

    it('should handle different date formats', async () => {
      mockFetchSuccess(mockStats)

      render(<UserStats userId="user123" username="testuser" createdAt="2023-06-01" />)

      await waitFor(() => {
        expect(screen.getByText(/jun/i)).toBeInTheDocument()
      })
    })
  })

  describe('CSS Classes', () => {
    it('should have user-stats-card class', async () => {
      mockFetchSuccess(mockStats)

      const { container } = render(
        <UserStats userId="user123" username="testuser" createdAt="2023-01-15T00:00:00Z" />
      )

      await waitFor(() => {
        expect(container.querySelector('.user-stats-card')).toBeInTheDocument()
      })
    })

    it('should have user-stats-header class', async () => {
      mockFetchSuccess(mockStats)

      const { container } = render(
        <UserStats userId="user123" username="testuser" createdAt="2023-01-15T00:00:00Z" />
      )

      await waitFor(() => {
        expect(container.querySelector('.user-stats-header')).toBeInTheDocument()
      })
    })

    it('should have user-stats-avatar class', async () => {
      mockFetchSuccess(mockStats)

      const { container } = render(
        <UserStats userId="user123" username="testuser" createdAt="2023-01-15T00:00:00Z" />
      )

      await waitFor(() => {
        expect(container.querySelector('.user-stats-avatar')).toBeInTheDocument()
      })
    })

    it('should have user-stats-username class', async () => {
      mockFetchSuccess(mockStats)

      const { container } = render(
        <UserStats userId="user123" username="testuser" createdAt="2023-01-15T00:00:00Z" />
      )

      await waitFor(() => {
        expect(container.querySelector('.user-stats-username')).toBeInTheDocument()
      })
    })

    it('should have user-stats-metrics class', async () => {
      mockFetchSuccess(mockStats)

      const { container } = render(
        <UserStats userId="user123" username="testuser" createdAt="2023-01-15T00:00:00Z" />
      )

      await waitFor(() => {
        expect(container.querySelector('.user-stats-metrics')).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle null userImage', async () => {
      mockFetchSuccess(mockStats)

      render(
        <UserStats
          userId="user123"
          username="testuser"
          userImage={null}
          createdAt="2023-01-15T00:00:00Z"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('T')).toBeInTheDocument()
      })
    })

    it('should handle undefined userImage', async () => {
      mockFetchSuccess(mockStats)

      render(<UserStats userId="user123" username="testuser" createdAt="2023-01-15T00:00:00Z" />)

      await waitFor(() => {
        expect(screen.getByText('T')).toBeInTheDocument()
      })
    })

    it('should handle empty username', async () => {
      mockFetchSuccess(mockStats)

      render(<UserStats userId="user123" username="" createdAt="2023-01-15T00:00:00Z" />)

      await waitFor(() => {
        expect(screen.getByText('-')).toBeInTheDocument()
      })
    })

    it('should handle zero stats', async () => {
      const zeroStats = {
        ...mockStats,
        postCount: 0,
        replyCount: 0,
        totalPosts: 0,
        totalReactionsReceived: 0,
      }
      mockFetchSuccess(zeroStats)

      render(
        <UserStats
          userId="user123"
          username="testuser"
          createdAt="2023-01-15T00:00:00Z"
          showFullStats={true}
        />
      )

      await waitFor(() => {
        expect(screen.getAllByText('0').length).toBeGreaterThan(0)
      })
    })

    it('should handle very large stat numbers', async () => {
      const largeStats = {
        ...mockStats,
        totalPosts: 999999,
        totalReactionsReceived: 888888,
      }
      mockFetchSuccess(largeStats)

      render(
        <UserStats
          userId="user123"
          username="testuser"
          createdAt="2023-01-15T00:00:00Z"
          showFullStats={true}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('999999')).toBeInTheDocument()
        expect(screen.getByText('888888')).toBeInTheDocument()
      })
    })
  })

  describe('Image Component', () => {
    it('should render Image component with correct props', async () => {
      mockFetchSuccess(mockStats)

      const { container } = render(
        <UserStats
          userId="user123"
          username="testuser"
          userImage="https://example.com/avatar.jpg"
          createdAt="2023-01-15T00:00:00Z"
        />
      )

      await waitFor(() => {
        const img = container.querySelector('.user-stats-avatar-img')
        expect(img).toBeInTheDocument()
      })
    })

    it('should set alt text to username', async () => {
      mockFetchSuccess(mockStats)

      render(
        <UserStats
          userId="user123"
          username="johndoe"
          userImage="https://example.com/avatar.jpg"
          createdAt="2023-01-15T00:00:00Z"
        />
      )

      await waitFor(() => {
        const imgs = screen.getAllByAltText('johndoe')
        expect(imgs.length).toBeGreaterThan(0)
      })
    })
  })
})
