import { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/router'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { prisma } from '@/lib/prisma'

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
  children: ForumReply[]
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

export default function ThreadPage({ post }: ThreadPageProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [replyContent, setReplyContent] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const canReply = session?.user && !post.isLocked

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
        router.reload()
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
        setReplyContent('')
        setReplyingTo(null)
        router.reload()
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

  const renderReply = (reply: ForumReply, level = 0) => {
    const userReactions = getUserReactions(reply.reactions)
    const reactionCounts = getReactionCounts(reply.reactions)

    return (
      <div key={reply.id} className={`forum-reply level-${Math.min(level, 3)}`}>
        <div className="forum-reply-content">
          <div className="forum-reply-header">
            <div className="forum-reply-author">
              <div className="forum-avatar">
                {reply.author.image ? (
                  <Image
                    src={reply.author.image}
                    alt={reply.author.username}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="forum-avatar-placeholder">
                    {reply.author.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="forum-author-info">
                <Link href={`/forum/user/${reply.author.id}`} className="forum-username">
                  {reply.author.username}
                </Link>
                <span className="forum-reply-date">{formatDate(reply.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="forum-reply-body">
            <p>{reply.content}</p>
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

            {canReply && level < 3 && (
              <button className="forum-reply-btn" onClick={() => setReplyingTo(reply.id)}>
                Reply
              </button>
            )}
          </div>
        </div>

        {reply.children.length > 0 && (
          <div className="forum-nested-replies">
            {reply.children.map(childReply => renderReply(childReply, level + 1))}
          </div>
        )}
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
          <Link href={`/forum/category/${post.category.slug}`} className="forum-breadcrumb-link">
            {post.category.name}
          </Link>
          <span className="forum-breadcrumb-separator">›</span>
          <span className="forum-breadcrumb-current">{post.title}</span>
        </div>

        <div className="forum-thread">
          <div className="forum-post-main">
            <div className="forum-post-header">
              <div className="forum-post-flags">
                {post.isSticky && <span className="forum-flag sticky">📌 Sticky</span>}
                {post.isLocked && <span className="forum-flag locked">🔒 Locked</span>}
              </div>

              <h1 className="forum-post-title">{post.title}</h1>

              <div className="forum-post-meta">
                <div className="forum-post-author">
                  <div className="forum-avatar">
                    {post.author.image ? (
                      <Image
                        src={post.author.image}
                        alt={post.author.username}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="forum-avatar-placeholder">
                        {post.author.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="forum-author-info">
                    <Link href={`/forum/user/${post.author.id}`} className="forum-username">
                      {post.author.username}
                    </Link>
                    <span className="forum-post-date">{formatDate(post.createdAt)}</span>
                  </div>
                </div>
                <div className="forum-post-stats">
                  <span className="forum-stat">{post.viewCount} views</span>
                  <span className="forum-stat">{post.replyCount} replies</span>
                </div>
              </div>
            </div>

            <div className="forum-post-content">
              <p>{post.content}</p>
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
            </div>
          </div>

          {post.replies.length > 0 && (
            <div className="forum-replies">
              <h3 className="forum-replies-title">
                {post.replies.length} {post.replies.length === 1 ? 'Reply' : 'Replies'}
              </h3>
              {post.replies.map(reply => renderReply(reply))}
            </div>
          )}

          {canReply && (
            <div className="forum-reply-form">
              <h3>Post a Reply</h3>
              {replyingTo && (
                <div className="forum-replying-to">
                  <span>Replying to a comment</span>
                  <button onClick={() => setReplyingTo(null)}>Cancel</button>
                </div>
              )}
              <form onSubmit={handleSubmitReply}>
                <textarea
                  value={replyContent}
                  onChange={e => setReplyContent(e.target.value)}
                  placeholder="Write your reply..."
                  rows={6}
                  className="forum-reply-textarea"
                  disabled={isSubmitting}
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
        },
      },
      replies: {
        where: { parentId: null },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              image: true,
              createdAt: true,
            },
          },
          children: {
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
