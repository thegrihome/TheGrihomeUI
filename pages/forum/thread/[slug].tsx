import { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import UserStats from '@/components/forum/UserStats'
import ContentRenderer from '@/components/forum/ContentRenderer'
import { prisma } from '@/lib/cockroachDB/prisma'

interface ForumReply {
  id: string
  content: string
  createdAt: string
  author: {
    id: string
    username: string
    image: string | null
    createdAt: string
  }
  reactions: Array<{
    id: string
    type: string
    user: {
      id: string
      username: string
    }
  }>
}

interface ForumPost {
  id: string
  title: string
  content: string
  slug: string
  viewCount: number
  replyCount: number
  isSticky: boolean
  isLocked: boolean
  createdAt: string
  author: {
    id: string
    username: string
    image: string | null
    createdAt: string
  }
  category: {
    id: string
    name: string
    slug: string
    city: string | null
    parent: {
      id: string
      name: string
      slug: string
      parent: {
        id: string
        name: string
        slug: string
      } | null
    } | null
  }
  replies: ForumReply[]
  reactions: Array<{
    id: string
    type: string
    user: {
      id: string
      username: string
    }
  }>
}

interface ThreadPageProps {
  post: ForumPost
}

const reactionEmojis = {
  THANKS: '🙏',
  LAUGH: '😂',
  CONFUSED: '😕',
  SAD: '😢',
  ANGRY: '😠',
  LOVE: '❤️',
}

export default function ThreadPage({ post: initialPost }: ThreadPageProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [post, setPost] = useState(initialPost)
  const [replyContent, setReplyContent] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [displayedReplies, setDisplayedReplies] = useState(20)
  const [userVerification, setUserVerification] = useState<{
    emailVerified?: boolean
    mobileVerified?: boolean
  } | null>(null)

  useEffect(() => {
    const fetchUserVerification = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch(`/api/user/verification-status`)
          if (response.ok) {
            const data = await response.json()
            setUserVerification(data)
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error fetching user verification:', error)
        }
      }
    }

    fetchUserVerification()
  }, [session?.user?.id])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isUserVerified = userVerification?.emailVerified || userVerification?.mobileVerified
  const canReply = session?.user && !post.isLocked && isUserVerified

  const handleReaction = async (type: string, targetType: 'post' | 'reply', targetId: string) => {
    if (!session?.user) {
      router.push('/login')
      return
    }

    try {
      const endpoint =
        targetType === 'post' ? '/api/forum/reactions/posts' : '/api/forum/reactions/replies'

      const bodyField = targetType === 'post' ? 'postId' : 'replyId'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [bodyField]: targetId,
          type,
        }),
      })

      if (response.ok) {
        const result = await response.json()

        // Update local state instead of full page reload
        if (targetType === 'post') {
          setPost(prev => ({
            ...prev,
            reactions:
              result.action === 'added'
                ? [
                    ...prev.reactions,
                    {
                      id: result.reaction.id,
                      type,
                      user: { id: session.user.id, username: session.user.name || '' },
                    },
                  ]
                : prev.reactions.filter(r => !(r.type === type && r.user.id === session.user.id)),
          }))
        } else {
          setPost(prev => ({
            ...prev,
            replies: prev.replies.map(reply =>
              reply.id === targetId
                ? {
                    ...reply,
                    reactions:
                      result.action === 'added'
                        ? [
                            ...reply.reactions,
                            {
                              id: result.reaction.id,
                              type,
                              user: { id: session.user.id, username: session.user.name || '' },
                            },
                          ]
                        : reply.reactions.filter(
                            r => !(r.type === type && r.user.id === session.user.id)
                          ),
                  }
                : reply
            ),
          }))
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error handling reaction:', error)
    }
  }

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyContent.trim() || isSubmitting) return

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/forum/replies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: replyContent.trim(),
          postId: post.id,
          parentId: replyingTo,
        }),
      })

      if (response.ok) {
        const newReply = await response.json()

        // Add new reply to local state
        setPost(prev => ({
          ...prev,
          replies: [
            ...prev.replies,
            {
              id: newReply.id,
              content: newReply.content,
              createdAt: newReply.createdAt,
              author: {
                id: session!.user.id,
                username: session!.user.name || '',
                image: session!.user.image || null,
                createdAt: newReply.author.createdAt,
              },
              reactions: [],
            },
          ],
          replyCount: prev.replyCount + 1,
        }))

        setReplyContent('')
        setReplyingTo(null)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to post reply')
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error posting reply:', error)
      alert('Failed to post reply')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getReactionCounts = (reactions: any[]) => {
    const counts: { [key: string]: number } = {}
    reactions.forEach(reaction => {
      counts[reaction.type] = (counts[reaction.type] || 0) + 1
    })
    return counts
  }

  const getUserReactions = (reactions: any[]) => {
    if (!session?.user) return new Set()
    return new Set(reactions.filter(r => r.user.id === session.user.id).map(r => r.type))
  }

  const renderReply = (reply: ForumReply) => {
    const userReactions = getUserReactions(reply.reactions)
    const reactionCounts = getReactionCounts(reply.reactions)

    return (
      <div key={reply.id} className="forum-reply">
        <div className="forum-reply-layout">
          <div className="forum-reply-sidebar">
            <UserStats
              userId={reply.author.id}
              username={reply.author.username}
              userImage={reply.author.image}
              createdAt={reply.author.createdAt}
              showFullStats={false}
            />
          </div>

          <div className="forum-reply-main">
            <div className="forum-reply-content">
              <div className="forum-reply-date">{formatDate(reply.createdAt)}</div>

              <div className="forum-reply-body">
                <ContentRenderer content={reply.content} />
              </div>

              <div className="forum-reply-actions">
                <div className="forum-reactions">
                  {Object.entries(reactionEmojis).map(([type, emoji]) => (
                    <button
                      key={type}
                      className={`forum-reaction-btn ${userReactions.has(type) ? 'active' : ''}`}
                      onClick={() => handleReaction(type, 'reply', reply.id)}
                      disabled={!session?.user}
                    >
                      {emoji} {reactionCounts[type] || 0}
                    </button>
                  ))}
                </div>

                {canReply && (
                  <button
                    className="forum-reply-btn"
                    onClick={() => {
                      setReplyingTo(reply.id)
                      setReplyContent(
                        `> ${reply.author.username} wrote:\n> ${reply.content
                          .replace(/<[^>]+>/g, '')
                          .replace(/&nbsp;/g, ' ')
                          .substring(0, 200)}...\n\n`
                      )
                      document
                        .querySelector('.forum-reply-form')
                        ?.scrollIntoView({ behavior: 'smooth' })
                    }}
                  >
                    Reply
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const postUserReactions = getUserReactions(post.reactions)
  const postReactionCounts = getReactionCounts(post.reactions)

  return (
    <div className="forum-container">
      <NextSeo
        title={`${post.title} - Forum - Grihome`}
        description={post.content.substring(0, 160)}
        canonical={`https://grihome.vercel.app/forum/thread/${post.slug}`}
      />

      <Header />

      <main className="forum-main">
        <div className="forum-breadcrumb">
          <Link href="/forum" className="forum-breadcrumb-link">
            Forum
          </Link>
          <span className="forum-breadcrumb-separator">›</span>
          {post.category.parent?.parent && (
            <>
              <Link
                href={`/forum/category/${post.category.parent.parent.slug}`}
                className="forum-breadcrumb-link"
              >
                {post.category.parent.parent.name}
              </Link>
              <span className="forum-breadcrumb-separator">›</span>
            </>
          )}
          {post.category.parent && (
            <>
              <Link
                href={`/forum/category/general-discussions/${post.category.city}`}
                className="forum-breadcrumb-link"
              >
                {post.category.parent.name}
              </Link>
              <span className="forum-breadcrumb-separator">›</span>
            </>
          )}
          <Link
            href={
              post.category.parent?.parent
                ? `/forum/category/general-discussions/${post.category.city}/${post.category.slug.replace(`${post.category.city}-`, '')}`
                : `/forum/category/${post.category.slug}`
            }
            className="forum-breadcrumb-link"
          >
            {post.category.name}
          </Link>
          <span className="forum-breadcrumb-separator">›</span>
          <span className="forum-breadcrumb-current">{post.title}</span>
        </div>

        <div className="forum-thread">
          <div className="forum-post-header">
            <div className="forum-post-flags">
              {post.isSticky && <span className="forum-flag sticky">📌 Sticky</span>}
              {post.isLocked && <span className="forum-flag locked">🔒 Locked</span>}
            </div>
            <h1 className="forum-post-title">{post.title}</h1>
            <div className="forum-post-stats">
              <span className="forum-stat">{post.viewCount} views</span>
              <span className="forum-stat">{post.replyCount} replies</span>
            </div>
          </div>

          <div className="forum-thread-layout">
            <div className="forum-thread-sidebar">
              <UserStats
                userId={post.author.id}
                username={post.author.username}
                userImage={post.author.image}
                createdAt={post.author.createdAt}
                showFullStats={false}
              />
            </div>

            <div className="forum-thread-content">
              <div className="forum-post-content">
                <ContentRenderer content={post.content} />
              </div>

              <div className="forum-post-actions">
                <div className="forum-reactions">
                  {Object.entries(reactionEmojis).map(([type, emoji]) => (
                    <button
                      key={type}
                      className={`forum-reaction-btn ${postUserReactions.has(type) ? 'active' : ''}`}
                      onClick={() => handleReaction(type, 'post', post.id)}
                      disabled={!session?.user}
                    >
                      {emoji} {postReactionCounts[type] || 0}
                    </button>
                  ))}
                </div>
                {canReply && (
                  <button
                    className="forum-reply-btn"
                    onClick={() => {
                      setReplyingTo(post.id)
                      setReplyContent(
                        `> ${post.author.username} wrote:\n> ${post.content
                          .replace(/<[^>]+>/g, '')
                          .replace(/&nbsp;/g, ' ')
                          .substring(0, 200)}...\n\n`
                      )
                      document
                        .querySelector('.forum-reply-form')
                        ?.scrollIntoView({ behavior: 'smooth' })
                    }}
                  >
                    Reply
                  </button>
                )}
              </div>
            </div>
          </div>

          {post.replies.length > 0 && (
            <div className="forum-replies">
              <h3 className="forum-replies-title">
                {post.replies.length} {post.replies.length === 1 ? 'Reply' : 'Replies'}
              </h3>
              {post.replies.slice(0, displayedReplies).map(reply => renderReply(reply))}

              {post.replies.length > displayedReplies && (
                <div className="forum-load-more">
                  <button
                    onClick={() => setDisplayedReplies(prev => prev + 20)}
                    className="forum-load-more-btn"
                  >
                    Load More Replies ({post.replies.length - displayedReplies} remaining)
                  </button>
                </div>
              )}
            </div>
          )}

          {canReply && (
            <div className="forum-reply-form">
              <h3>Post a Reply</h3>
              <form onSubmit={handleSubmitReply}>
                <textarea
                  value={replyContent}
                  onChange={e => setReplyContent(e.target.value)}
                  placeholder="Write your reply..."
                  className="forum-rich-text-editor w-full min-h-[200px] p-3 border rounded"
                  rows={8}
                />
                <div className="forum-reply-form-actions">
                  <button
                    type="submit"
                    className="forum-submit-btn"
                    disabled={!replyContent.trim() || isSubmitting}
                  >
                    {isSubmitting ? 'Posting...' : 'Post Reply'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {!session?.user && (
            <div className="forum-login-prompt">
              <p>
                <Link href="/login">Login</Link> or <Link href="/signup">Sign up</Link> to post
                replies and react to posts.
              </p>
            </div>
          )}

          {session?.user && !isUserVerified && (
            <div className="forum-verification-prompt">
              <h3>Verification Required</h3>
              <p>
                You need to verify your email or mobile number to participate in discussions. Please
                verify your account to post replies and reactions.
              </p>
              <Link href="/userinfo" className="forum-verify-btn">
                Verify Account
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const { slug } = params!

  const post = await prisma.forumPost.findUnique({
    where: { slug: slug as string },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          image: true,
          createdAt: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          city: true,
          parent: {
            select: {
              id: true,
              name: true,
              slug: true,
              parent: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
      },
      replies: {
        include: {
          author: {
            select: {
              id: true,
              username: true,
              image: true,
              createdAt: true,
            },
          },
          reactions: {
            include: {
              user: {
                select: { id: true, username: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
      reactions: {
        include: {
          user: {
            select: { id: true, username: true },
          },
        },
      },
    },
  })

  if (!post) {
    return {
      notFound: true,
    }
  }

  return {
    props: {
      post: JSON.parse(JSON.stringify(post)),
    },
  }
}
