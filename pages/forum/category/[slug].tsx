import React from 'react'
import { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ForumSearch from '@/components/forum/ForumSearch'
import { prisma } from '@/lib/cockroachDB/prisma'

interface ForumPost {
  id: string
  title: string
  slug: string
  content: string
  viewCount: number
  replyCount: number
  isSticky: boolean
  isLocked: boolean
  createdAt: string
  lastReplyAt: string | null
  author: {
    id: string
    username: string
    image: string | null
    createdAt: string
  }
  _count: {
    replies: number
    reactions: number
  }
}

interface ForumCategory {
  id: string
  name: string
  slug: string
  description: string | null
}

interface CategoryPageProps {
  category: ForumCategory
  posts: ForumPost[]
  totalCount: number
  currentPage: number
  totalPages: number
}

export default function CategoryPage({
  category,
  posts,
  totalCount,
  currentPage,
  totalPages,
}: CategoryPageProps) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const user = session?.user
  const isAuthenticated = status === 'authenticated'
  const [showNewPostModal, setShowNewPostModal] = useState(false)

  // Category icons mapping
  const categoryIcons: { [key: string]: string } = {
    'member-introductions': '👋',
    'latest-news': '📰',
    'grihome-latest-deals': '💰',
    'general-discussions': '💬',
  }

  // Smart title formatter - determines which words should be gradient
  const formatTitle = (title: string) => {
    const gradientWords = ['Forum', 'Introductions', 'News', 'Deals'] // Removed 'Discussions'
    const cityNames = ['Hyderabad', 'Chennai', 'Bengaluru', 'Mumbai', 'Delhi', 'Kolkata']

    const words = title.split(' ')

    return words
      .map((word, index) => {
        const isGradientWord = gradientWords.some(gw => word.includes(gw))
        const isCityName = cityNames.some(city => word.includes(city))

        // Special cases
        if (isCityName) {
          return (
            <span key={index} className="forum-title-gradient">
              {word}
            </span>
          )
        } else if (isGradientWord) {
          return (
            <span key={index} className="forum-title-gradient">
              {word}
            </span>
          )
        } else {
          return word
        }
      })
      .reduce((prev, curr, index) => {
        return index === 0 ? [curr] : [...prev, ' ', curr]
      }, [] as React.ReactNode[])
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const canPost = isAuthenticated && user

  return (
    <div className="forum-container">
      <NextSeo
        title={`${category.name} - Forum - Grihome`}
        description={category.description || `Discussion forum for ${category.name} on Grihome`}
        canonical={`https://grihome.vercel.app/forum/category/${category.slug}`}
      />

      <Header />

      <main className="forum-main">
        <div className="forum-breadcrumb-container">
          <div className="forum-breadcrumb">
            <Link href="/forum" className="forum-breadcrumb-link">
              Forum
            </Link>
            <span className="forum-breadcrumb-separator">›</span>
            <span className="forum-breadcrumb-current">{category.name}</span>
          </div>
          <div className="forum-breadcrumb-search">
            <ForumSearch />
          </div>
        </div>

        <div className="forum-header">
          <div className="forum-header-content">
            <div className="forum-header-main">
              <div className="forum-category-icon-large">
                {categoryIcons[category.slug] || '📂'}
              </div>
              <div className="forum-header-text">
                <h1 className="forum-title">{formatTitle(category.name)}</h1>
                {category.description && <p className="forum-subtitle">{category.description}</p>}
              </div>
              <div className="forum-header-stats">
                <div className="forum-thread-count">
                  {totalCount} {totalCount === 1 ? 'thread' : 'threads'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="forum-category-actions-header">
          <div className="forum-category-spacer"></div>

          {canPost ? (
            <Link href={`/forum/new-post?category=${category.id}`} className="forum-new-post-btn">
              New Thread
            </Link>
          ) : (
            <Link href="/login" className="forum-login-btn">
              Login to Post
            </Link>
          )}
        </div>

        <div className="forum-posts-list">
          {posts.length === 0 ? (
            <div className="forum-empty-state">
              <h3>No threads yet</h3>
              <p>
                Be the first to start a discussion in this category! Use the &ldquo;New
                Thread&rdquo; button above to get started.
              </p>
            </div>
          ) : (
            <>
              {posts.map(post => (
                <div key={post.id} className={`forum-post-item ${post.isSticky ? 'sticky' : ''}`}>
                  <div className="forum-post-info">
                    <div className="forum-post-flags">
                      {post.isSticky && <span className="forum-flag sticky">📌 Sticky</span>}
                      {post.isLocked && <span className="forum-flag locked">🔒 Locked</span>}
                    </div>

                    <h3 className="forum-post-title">
                      <Link href={`/forum/thread/${post.slug}`}>{post.title}</Link>
                    </h3>

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
                    </div>
                  </div>

                  <div className="forum-post-stats">
                    <div className="forum-stat-item">
                      <span className="forum-stat-number">{post.replyCount}</span>
                      <span className="forum-stat-label">replies</span>
                    </div>
                    <div className="forum-stat-item">
                      <span className="forum-stat-number">{post.viewCount}</span>
                      <span className="forum-stat-label">views</span>
                    </div>
                    <div className="forum-stat-item">
                      <span className="forum-stat-number">{post._count.reactions}</span>
                      <span className="forum-stat-label">reactions</span>
                    </div>
                  </div>

                  {post.lastReplyAt && (
                    <div className="forum-last-reply">
                      <span className="forum-last-reply-date">
                        Last reply: {formatDate(post.lastReplyAt)}
                      </span>
                    </div>
                  )}
                </div>
              ))}

              {totalPages > 1 && (
                <div className="forum-pagination">
                  {currentPage > 1 && (
                    <Link
                      href={`/forum/category/${category.slug}?page=${currentPage - 1}`}
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
                      href={`/forum/category/${category.slug}?page=${currentPage + 1}`}
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
      </main>

      <Footer />
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ params, query }) => {
  const { slug } = params!
  const page = parseInt((query.page as string) || '1')
  const limit = 20

  const category = await prisma.forumCategory.findUnique({
    where: { slug: slug as string },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
    },
  })

  if (!category) {
    return {
      notFound: true,
    }
  }

  const skip = (page - 1) * limit

  const [posts, totalCount] = await Promise.all([
    prisma.forumPost.findMany({
      where: { categoryId: category.id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            image: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            replies: true,
            reactions: true,
          },
        },
      },
      orderBy: [{ isSticky: 'desc' }, { lastReplyAt: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.forumPost.count({
      where: { categoryId: category.id },
    }),
  ])

  return {
    props: {
      category: JSON.parse(JSON.stringify(category)),
      posts: JSON.parse(JSON.stringify(posts)),
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
    },
  }
}
