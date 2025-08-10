import React from 'react'
import { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ForumSearch from '@/components/ForumSearch'
import { prisma } from '@/lib/prisma'

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

interface PropertyTypeCategory {
  id: string
  name: string
  slug: string
  description: string | null
  propertyType: string | null
}

interface CityInfo {
  name: string
  city: string
}

interface PropertyTypePageProps {
  category: PropertyTypeCategory
  city: CityInfo
  posts: ForumPost[]
  totalCount: number
  currentPage: number
  totalPages: number
}

const propertyTypeIcons: { [key: string]: string } = {
  VILLAS: '🏡',
  APARTMENTS: '🏢',
  RESIDENTIAL_LANDS: '🏞️',
  AGRICULTURE_LANDS: '🌾',
  COMMERCIAL_PROPERTIES: '🏬',
}

const cityIcons: { [key: string]: string } = {
  hyderabad: '🏛️',
  chennai: '🏖️',
  bengaluru: '🌆',
  mumbai: '🏙️',
  delhi: '🏛️',
  kolkata: '🌉',
}

export default function PropertyTypePage({
  category,
  city,
  posts,
  totalCount,
  currentPage,
  totalPages,
}: PropertyTypePageProps) {
  const router = useRouter()
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth)

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

  // Debug logging
  // eslint-disable-next-line no-console
  console.log('Auth state:', { isAuthenticated, user, canPost })

  return (
    <div className="forum-container">
      <NextSeo
        title={`${category.name} in ${city.name} - General Discussions - Forum - Grihome`}
        description={`Browse ${category.name.toLowerCase()} discussions and listings in ${city.name} on Grihome community forum`}
        canonical={`https://grihome.vercel.app/forum/category/general-discussions/${city.city}/${router.query.propertyType}`}
      />

      <Header />

      <main className="forum-main">
        <div className="forum-breadcrumb-container">
          <div className="forum-breadcrumb">
            <Link href="/forum" className="forum-breadcrumb-link">
              Forum
            </Link>
            <span className="forum-breadcrumb-separator">›</span>
            <Link href="/forum/category/general-discussions" className="forum-breadcrumb-link">
              General Discussions
            </Link>
            <span className="forum-breadcrumb-separator">›</span>
            <Link
              href={`/forum/category/general-discussions/${city.city}`}
              className="forum-breadcrumb-link"
            >
              {city.name}
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
            <div className="forum-property-header-section">
              <div className="forum-property-icons">
                <div className="forum-property-type-icon">
                  {propertyTypeIcons[category.propertyType || ''] || '🏠'}
                </div>
              </div>
              <div className="forum-header-text">
                <h1 className="forum-title">
                  {formatTitle(
                    category.name.includes(city.name)
                      ? category.name
                      : `${category.name} in ${city.name}`
                  )}
                </h1>
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
                Be the first to start a discussion about {category.name.toLowerCase()} in{' '}
                {city.name}! Use the &ldquo;New Thread&rdquo; button above to get started.
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
                      href={`/forum/category/general-discussions/${city.city}/${router.query.propertyType}?page=${currentPage - 1}`}
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
                      href={`/forum/category/general-discussions/${city.city}/${router.query.propertyType}?page=${currentPage + 1}`}
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
  const { city: citySlug, propertyType: propertyTypeSlug } = params!
  const page = parseInt((query.page as string) || '1')
  const limit = 20

  // Find the property type category
  const category = await prisma.forumCategory.findFirst({
    where: {
      slug: `${citySlug}-${propertyTypeSlug}`,
      city: citySlug as string,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      propertyType: true,
    },
  })

  if (!category) {
    return {
      notFound: true,
    }
  }

  // Get city info
  const cityCategory = await prisma.forumCategory.findFirst({
    where: {
      city: citySlug as string,
      parent: {
        slug: 'general-discussions',
      },
    },
    select: {
      name: true,
      city: true,
    },
  })

  if (!cityCategory) {
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
      city: JSON.parse(JSON.stringify(cityCategory)),
      posts: JSON.parse(JSON.stringify(posts)),
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
    },
  }
}
