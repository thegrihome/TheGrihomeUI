import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface UserStatsProps {
  userId: string
  username: string
  userImage?: string | null
  createdAt: string
  showFullStats?: boolean
}

interface UserStatsData {
  postCount: number
  replyCount: number
  totalPosts: number
  totalReactionsReceived: number
  reactionsReceived: {
    THANKS: number
    LAUGH: number
    CONFUSED: number
    SAD: number
    ANGRY: number
    LOVE: number
  }
}

export default function UserStats({
  userId,
  username,
  userImage,
  createdAt,
  showFullStats = false,
}: UserStatsProps) {
  const [stats, setStats] = useState<UserStatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Immediately set loading to false to prevent blocking render
    setLoading(false)

    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/forum/user/${userId}/stats`)
        if (response.ok) {
          const data = await response.json()
          setStats({
            postCount: data.postCount,
            replyCount: data.replyCount,
            totalPosts: data.totalPosts,
            totalReactionsReceived: data.totalReactionsReceived,
            reactionsReceived: data.reactionsReceived,
          })
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching user stats:', error)
      }
    }

    fetchStats()
  }, [userId])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
    })
  }

  const getTotalLikes = () => {
    if (!stats) return 0
    return stats.reactionsReceived.THANKS + stats.reactionsReceived.LOVE
  }

  return (
    <div className="user-stats-card">
      <div className="user-stats-header">
        <div className="user-stats-avatar">
          {userImage ? (
            <Image
              src={userImage}
              alt={username}
              width={64}
              height={64}
              className="user-stats-avatar-img"
            />
          ) : (
            <div className="user-stats-avatar-placeholder">{username.charAt(0).toUpperCase()}</div>
          )}
        </div>

        <div className="user-stats-info">
          <Link href={`/forum/user/${userId}`} className="user-stats-username">
            {username}
          </Link>
          <div className="user-stats-joined">Joined {formatDate(createdAt)}</div>
        </div>
      </div>

      <div className="user-stats-metrics">
        {stats ? (
          <>
            <div className="user-stats-row">
              <span className="user-stats-label">Posts:</span>
              <span className="user-stats-value">{stats.totalPosts}</span>
            </div>

            {showFullStats && (
              <>
                <div className="user-stats-separator"></div>
                <div className="user-stats-row">
                  <span className="user-stats-label">Threads:</span>
                  <span className="user-stats-value">{stats.postCount}</span>
                </div>
                <div className="user-stats-row">
                  <span className="user-stats-label">Replies:</span>
                  <span className="user-stats-value">{stats.replyCount}</span>
                </div>
                <div className="user-stats-row">
                  <span className="user-stats-label">Reactions:</span>
                  <span className="user-stats-value">{stats.totalReactionsReceived}</span>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="user-stats-row">
            <span className="user-stats-label">Posts:</span>
            <span className="user-stats-value">-</span>
          </div>
        )}
      </div>
    </div>
  )
}
