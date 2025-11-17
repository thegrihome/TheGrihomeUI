import { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/router'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface ForumPost {
  id: string
  title: string
  slug: string
  content: string
  viewCount: number
  createdAt: string
  category: {
    id: string
    name: string
    slug: string
    city: string | null
    propertyType: string | null
  }
  _count: {
    replies: number
    reactions: number
  }
}

interface ForumReply {
  id: string
  content: string
  createdAt: string
  post: {
    id: string
    title: string
    slug: string
  }
}

interface UserStats {
  user: {
    id: string
    username: string
    image: string | null
    createdAt: string
  }
  postCount: number
  replyCount: number
  totalPosts: number
  reactionsReceived: {
    THANKS: number
    LAUGH: number
    CONFUSED: number
    SAD: number
    ANGRY: number
    LOVE: number
  }
  reactionsGiven: {
    THANKS: number
    LAUGH: number
    CONFUSED: number
    SAD: number
    ANGRY: number
    LOVE: number
  }
  totalReactionsReceived: number
  totalReactionsGiven: number
}

interface UserProfilePageProps {
  userStats: UserStats
  posts: ForumPost[]
  replies: ForumReply[]
  postsCount: number
  repliesCount: number
  currentPage: number
  totalPages: number
}

const reactionEmojis = {
  THANKS: '🙏',
  LAUGH: '😂',
  CONFUSED: '😕',
  SAD: '😢',
  ANGRY: '😠',
  LOVE: '❤️',
}

const reactionLabels = {
  THANKS: 'Thanks',
  LAUGH: 'Laugh',
  CONFUSED: 'Confused',
  SAD: 'Sad',
  ANGRY: 'Angry',
  LOVE: 'Love',
}

export default function UserProfilePage({
  userStats,
  posts,
  replies,
  postsCount,
  repliesCount,
  currentPage,
  totalPages,
}: UserProfilePageProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'posts' | 'replies' | 'reactions'>(
    'posts'
  )
  const router = useRouter()
  const { userId } = router.query

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatJoinedDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 30) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30)
      return `${months} month${months === 1 ? '' : 's'} ago`
    } else {
      const years = Math.floor(diffDays / 365)
      return `${years} year${years === 1 ? '' : 's'} ago`
    }
  }

  const getActivityLevel = (totalPosts: number) => {
    if (totalPosts >= 100) return { label: 'Very Active', color: '#10b981' }
    if (totalPosts >= 50) return { label: 'Active', color: '#3b82f6' }
    if (totalPosts >= 20) return { label: 'Regular', color: '#8b5cf6' }
    if (totalPosts >= 5) return { label: 'Occasional', color: '#f59e0b' }
    return { label: 'New Member', color: '#6b7280' }
  }

  const activityLevel = getActivityLevel(userStats.totalPosts)

  const truncateContent = (content: string, maxLength: number = 150) => {
    const stripped = content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ')
    if (stripped.length <= maxLength) return stripped
    return stripped.substring(0, maxLength).trim() + '...'
  }

  const getCategoryUrl = (category: any) => {
    if (category.city && category.propertyType) {
      return `/forum/category/general-discussions/${category.city}/${category.slug.replace(`${category.city}-`, '')}`
    } else if (category.city) {
      return `/forum/category/general-discussions/${category.city}`
    } else {
      return `/forum/category/${category.slug}`
    }
  }

  return (
    <div className="forum-container">
      <NextSeo
        title={`${userStats.user.username} - User Profile - Forum - Grihome`}
        description={`View ${userStats.user.username}'s forum profile and activity on Grihome community forum`}
        canonical={`https://grihome.vercel.app/forum/user/${userStats.user.id}`}
      />

      <Header />

      <main className="forum-main">
        <div className="forum-breadcrumb">
          <Link href="/forum" className="forum-breadcrumb-link">
            Forum
          </Link>
          <span className="forum-breadcrumb-separator">›</span>
          <span className="forum-breadcrumb-current">User Profile</span>
        </div>

        <div className="forum-user-profile">
          <div className="forum-user-header">
            <div className="forum-user-avatar-section">
              <div className="forum-user-avatar-large">
                {userStats.user.image ? (
                  <Image
                    src={userStats.user.image}
                    alt={userStats.user.username}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="forum-user-avatar-placeholder-large">
                    {userStats.user.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            <div className="forum-user-info">
              <h1 className="forum-user-username">{userStats.user.username}</h1>

              <div className="forum-user-badges">
                <span
                  className="forum-activity-badge"
                  style={{ backgroundColor: activityLevel.color }}
                >
                  {activityLevel.label}
                </span>
              </div>

              <div className="forum-user-meta">
                <div className="forum-user-meta-item">
                  <span className="forum-user-meta-label">Member since:</span>
                  <span className="forum-user-meta-value">
                    {formatDate(userStats.user.createdAt)} (
                    {formatJoinedDate(userStats.user.createdAt)})
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="forum-user-tabs">
            <button
              className={`forum-tab ${activeTab === 'posts' ? 'active' : ''}`}
              onClick={() => setActiveTab('posts')}
            >
              Posts ({postsCount})
            </button>
            <button
              className={`forum-tab ${activeTab === 'replies' ? 'active' : ''}`}
              onClick={() => setActiveTab('replies')}
            >
              Replies ({repliesCount})
            </button>
            <button
              className={`forum-tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`forum-tab ${activeTab === 'reactions' ? 'active' : ''}`}
              onClick={() => setActiveTab('reactions')}
            >
              Reactions
            </button>
          </div>

          <div className="forum-user-content">
            {activeTab === 'posts' && (
              <div className="forum-user-posts">
                {posts.length === 0 ? (
                  <div className="forum-empty-state">
                    <p>No posts yet</p>
                  </div>
                ) : (
                  <>
                    <div className="forum-search-results">
                      {posts.map(post => (
                        <Link
                          key={post.id}
                          href={`/forum/thread/${post.slug}`}
                          className="forum-search-result-item"
                        >
                          <div className="forum-search-result-content">
                            <div className="forum-search-result-header">
                              <div>
                                <h3 className="forum-search-result-title">{post.title}</h3>
                                <div className="forum-search-result-meta">
                                  <span className="forum-search-result-date">
                                    {formatDate(post.createdAt)}
                                  </span>
                                  <span className="forum-search-result-category">
                                    in {post.category.name}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <p className="forum-search-result-description">
                              {truncateContent(post.content, 200)}
                            </p>
                            <div className="forum-search-result-stats">
                              <span className="forum-stat">{post._count.replies} replies</span>
                              <span className="forum-stat">{post.viewCount} views</span>
                              <span className="forum-stat">{post._count.reactions} reactions</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="forum-pagination">
                        {currentPage > 1 && (
                          <Link
                            href={`/forum/user/${userId}?page=${currentPage - 1}`}
                            className="forum-pagination-btn"
                          >
                            ← Previous
                          </Link>
                        )}

                        <span className="forum-pagination-info">
                          Page {currentPage} of {totalPages}
                        </span>

                        {currentPage < totalPages && (
                          <Link
                            href={`/forum/user/${userId}?page=${currentPage + 1}`}
                            className="forum-pagination-btn"
                          >
                            Next →
                          </Link>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === 'replies' && (
              <div className="forum-user-replies">
                {replies.length === 0 ? (
                  <div className="forum-empty-state">
                    <p>No replies yet</p>
                  </div>
                ) : (
                  <>
                    <div className="forum-search-results">
                      {replies.map(reply => (
                        <Link
                          key={reply.id}
                          href={`/forum/thread/${reply.post.slug}`}
                          className="forum-search-result-item"
                        >
                          <div className="forum-search-result-content">
                            <div className="forum-search-result-header">
                              <div>
                                <h3 className="forum-search-result-title">Re: {reply.post.title}</h3>
                                <div className="forum-search-result-meta">
                                  <span className="forum-search-result-date">
                                    {formatDate(reply.createdAt)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <p className="forum-search-result-description">
                              {truncateContent(reply.content, 200)}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="forum-pagination">
                        {currentPage > 1 && (
                          <Link
                            href={`/forum/user/${userId}?page=${currentPage - 1}`}
                            className="forum-pagination-btn"
                          >
                            ← Previous
                          </Link>
                        )}

                        <span className="forum-pagination-info">
                          Page {currentPage} of {totalPages}
                        </span>

                        {currentPage < totalPages && (
                          <Link
                            href={`/forum/user/${userId}?page=${currentPage + 1}`}
                            className="forum-pagination-btn"
                          >
                            Next →
                          </Link>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === 'overview' && (
              <div className="forum-user-overview">
                <div className="forum-stats-grid">
                  <div className="forum-stat-card">
                    <h3 className="forum-stat-title">Posts</h3>
                    <div className="forum-stat-number">{userStats.postCount}</div>
                    <div className="forum-stat-description">Threads started</div>
                  </div>

                  <div className="forum-stat-card">
                    <h3 className="forum-stat-title">Replies</h3>
                    <div className="forum-stat-number">{userStats.replyCount}</div>
                    <div className="forum-stat-description">Replies posted</div>
                  </div>

                  <div className="forum-stat-card">
                    <h3 className="forum-stat-title">Total Activity</h3>
                    <div className="forum-stat-number">{userStats.totalPosts}</div>
                    <div className="forum-stat-description">Posts + Replies</div>
                  </div>

                  <div className="forum-stat-card">
                    <h3 className="forum-stat-title">Reactions Received</h3>
                    <div className="forum-stat-number">{userStats.totalReactionsReceived}</div>
                    <div className="forum-stat-description">Total reactions on posts</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reactions' && (
              <div className="forum-user-reactions">
                <div className="forum-reactions-section">
                  <h3 className="forum-reactions-title">Reactions Received</h3>
                  <div className="forum-reactions-grid">
                    {Object.entries(userStats.reactionsReceived).map(([type, count]) => (
                      <div key={type} className="forum-reaction-stat">
                        <div className="forum-reaction-emoji">
                          {reactionEmojis[type as keyof typeof reactionEmojis]}
                        </div>
                        <div className="forum-reaction-info">
                          <div className="forum-reaction-count">{count}</div>
                          <div className="forum-reaction-label">
                            {reactionLabels[type as keyof typeof reactionLabels]}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="forum-reactions-total">
                    Total: {userStats.totalReactionsReceived} reactions received
                  </div>
                </div>

                <div className="forum-reactions-section">
                  <h3 className="forum-reactions-title">Reactions Given</h3>
                  <div className="forum-reactions-grid">
                    {Object.entries(userStats.reactionsGiven).map(([type, count]) => (
                      <div key={type} className="forum-reaction-stat">
                        <div className="forum-reaction-emoji">
                          {reactionEmojis[type as keyof typeof reactionEmojis]}
                        </div>
                        <div className="forum-reaction-info">
                          <div className="forum-reaction-count">{count}</div>
                          <div className="forum-reaction-label">
                            {reactionLabels[type as keyof typeof reactionLabels]}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="forum-reactions-total">
                    Total: {userStats.totalReactionsGiven} reactions given
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ params, query }) => {
  const { userId } = params!
  const page = parseInt((query.page as string) || '1')
  const limit = 20
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  try {
    const [statsResponse, postsResponse] = await Promise.all([
      fetch(`${baseUrl}/api/forum/user/${userId}/stats`),
      fetch(`${baseUrl}/api/forum/user/${userId}/posts?page=${page}&limit=${limit}`),
    ])

    if (!statsResponse.ok || !postsResponse.ok) {
      return {
        notFound: true,
      }
    }

    const userStats = await statsResponse.json()
    const postsData = await postsResponse.json()

    return {
      props: {
        userStats,
        posts: postsData.posts || [],
        replies: postsData.replies || [],
        postsCount: postsData.postsCount || 0,
        repliesCount: postsData.repliesCount || 0,
        currentPage: postsData.currentPage || 1,
        totalPages: postsData.totalPages || 1,
      },
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching user data:', error)
    return {
      notFound: true,
    }
  }
}
