import { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/router'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { prisma } from '@/lib/cockroachDB/prisma'

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
    parent: {
      slug: string
    } | null
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

export default function UserProfilePage({
  userStats,
  posts,
  replies,
  postsCount,
  repliesCount,
  currentPage,
  totalPages,
}: UserProfilePageProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'posts' | 'replies'>('overview')
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

  const truncateContent = (content: string, maxLength: number = 150) => {
    const stripped = content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ')
    if (stripped.length <= maxLength) return stripped
    return stripped.substring(0, maxLength).trim() + '...'
  }

  const getCategoryUrl = (category: any) => {
    // For property type categories (e.g., "Villas in Chhattisgarh")
    if (category.propertyType && category.parent) {
      const locationSlug = category.city || category.parent.slug
      return `/forum/category/general-discussions/${locationSlug}/${category.slug.replace(`${locationSlug}-`, '')}`
    }
    // For city categories (city field is populated)
    if (category.city) {
      return `/forum/category/general-discussions/${category.city}`
    }
    // For state categories or top-level categories (use slug)
    if (category.parent?.slug === 'general-discussions') {
      return `/forum/category/general-discussions/${category.slug}`
    }
    return `/forum/category/${category.slug}`
  }

  return (
    <div className="forum-container">
      <NextSeo
        title={`${userStats.user.username} - User Profile - Forum - Zillfin`}
        description={`View ${userStats.user.username}'s forum profile and activity on Zillfin community forum`}
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
              className={`forum-tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
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
                                <h3 className="forum-search-result-title">
                                  Re: {reply.post.title}
                                </h3>
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
  const { userId } = params as { userId: string }
  const page = parseInt((query.page as string) || '1')
  const limit = 20
  const skip = (page - 1) * limit

  try {
    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        image: true,
        createdAt: true,
      },
    })

    if (!user) {
      return {
        notFound: true,
      }
    }

    // Get post count
    const postCount = await prisma.forumPost.count({
      where: { authorId: userId },
    })

    // Get reply count
    const replyCount = await prisma.forumReply.count({
      where: { authorId: userId },
    })

    // Get reactions received count by type
    const postReactionsReceived = await prisma.postReaction.groupBy({
      by: ['type'],
      where: {
        post: {
          authorId: userId,
        },
      },
      _count: {
        type: true,
      },
    })

    const replyReactionsReceived = await prisma.replyReaction.groupBy({
      by: ['type'],
      where: {
        reply: {
          authorId: userId,
        },
      },
      _count: {
        type: true,
      },
    })

    // Get reactions given count by type
    const postReactionsGiven = await prisma.postReaction.groupBy({
      by: ['type'],
      where: { userId },
      _count: {
        type: true,
      },
    })

    const replyReactionsGiven = await prisma.replyReaction.groupBy({
      by: ['type'],
      where: { userId },
      _count: {
        type: true,
      },
    })

    // Format reaction counts
    const formatReactionCounts = (reactions: any[]) => {
      const counts = {
        THANKS: 0,
        LAUGH: 0,
        CONFUSED: 0,
        SAD: 0,
        ANGRY: 0,
        LOVE: 0,
      }
      reactions.forEach(reaction => {
        counts[reaction.type as keyof typeof counts] = reaction._count.type
      })
      return counts
    }

    const reactionsReceived = {
      ...formatReactionCounts(postReactionsReceived),
    }

    // Add reply reactions to received counts
    replyReactionsReceived.forEach(reaction => {
      reactionsReceived[reaction.type as keyof typeof reactionsReceived] += reaction._count.type
    })

    const reactionsGiven = {
      ...formatReactionCounts(postReactionsGiven),
    }

    // Add reply reactions to given counts
    replyReactionsGiven.forEach(reaction => {
      reactionsGiven[reaction.type as keyof typeof reactionsGiven] += reaction._count.type
    })

    const totalReactionsReceived = Object.values(reactionsReceived).reduce((a, b) => a + b, 0)
    const totalReactionsGiven = Object.values(reactionsGiven).reduce((a, b) => a + b, 0)

    const userStats = {
      user,
      postCount,
      replyCount,
      totalPosts: postCount + replyCount,
      reactionsReceived,
      reactionsGiven,
      totalReactionsReceived,
      totalReactionsGiven,
    }

    // Get user's posts and replies
    const [posts, postsCount, replies, repliesCount] = await Promise.all([
      prisma.forumPost.findMany({
        where: { authorId: userId },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              city: true,
              propertyType: true,
              parent: {
                select: {
                  slug: true,
                },
              },
            },
          },
          _count: {
            select: {
              replies: true,
              reactions: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.forumPost.count({
        where: { authorId: userId },
      }),
      prisma.forumReply.findMany({
        where: { authorId: userId },
        include: {
          post: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.forumReply.count({
        where: { authorId: userId },
      }),
    ])

    const totalPages = Math.ceil(postsCount / limit)

    return {
      props: {
        userStats: JSON.parse(JSON.stringify(userStats)),
        posts: JSON.parse(JSON.stringify(posts)),
        replies: JSON.parse(JSON.stringify(replies)),
        postsCount,
        repliesCount,
        currentPage: page,
        totalPages,
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
