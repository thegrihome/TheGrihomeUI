import React from 'react'
import { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
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

interface PropertyTypeCategory {
  id: string
  name: string
  slug: string
  description: string | null
  propertyType: string | null
}

interface StateInfo {
  name: string
  slug: string
}

interface PropertyTypePageProps {
  category: PropertyTypeCategory
  state: StateInfo
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

const stateIcons: { [key: string]: string } = {
  'andhra-pradesh': '🏛️',
  'arunachal-pradesh': '⛰️',
  assam: '🌿',
  bihar: '🏛️',
  chhattisgarh: '🌲',
  goa: '🏖️',
  gujarat: '🦁',
  haryana: '🌾',
  'himachal-pradesh': '🏔️',
  'jammu-and-kashmir': '🏔️',
  jharkhand: '⛰️',
  karnataka: '🌆',
  kerala: '🥥',
  'madhya-pradesh': '🐅',
  maharashtra: '🏙️',
  manipur: '🦌',
  meghalaya: '☔',
  mizoram: '🌺',
  nagaland: '🎭',
  odisha: '🏛️',
  punjab: '🌾',
  rajasthan: '🐪',
  sikkim: '🏔️',
  'tamil-nadu': '🏛️',
  telangana: '🏛️',
  tripura: '🌺',
  uttarakhand: '⛰️',
  'uttar-pradesh': '🕌',
  'west-bengal': '🌉',
  'andaman-and-nicobar-islands': '🏝️',
  chandigarh: '🏛️',
  'dadra-and-nagar-haveli': '🌳',
  'daman-and-diu': '🏖️',
  lakshadweep: '🏝️',
  puducherry: '🏖️',
}

export default function PropertyTypePage({
  category,
  state,
  posts,
  totalCount,
  currentPage,
  totalPages,
}: PropertyTypePageProps) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const user = session?.user
  const isAuthenticated = status === 'authenticated'

  const formatTitle = (title: string) => {
    const gradientWords = ['Forum', 'Introductions', 'News', 'Deals']
    const words = title.split(' ')

    return words
      .map((word, index) => {
        const isGradientWord = gradientWords.some(gw => word.includes(gw))
        const isStateName = state.name.split(' ').some(statePart => word.includes(statePart))

        if (isStateName) {
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
        title={`${category.name} in ${state.name} - General Discussions - Forum - Grihome`}
        description={`Browse ${category.name.toLowerCase()} discussions and listings in ${state.name} on Grihome community forum`}
        canonical={`https://grihome.vercel.app/forum/category/general-discussions/${state.slug}/${router.query.propertyType}`}
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
              href={`/forum/category/general-discussions/${state.slug}`}
              className="forum-breadcrumb-link"
            >
              {state.name}
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
                    category.name.includes(state.name)
                      ? category.name
                      : `${category.name} in ${state.name}`
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
                Be the first to start a discussion about {category.name}! Use the &ldquo;New
                Thread&rdquo; button above to get started.
              </p>
            </div>
          ) : (
            <>
              {posts.map(post => {
                const totalPages = Math.ceil(post.replyCount / 20)
                const pageNumbers = []

                if (totalPages > 1) {
                  if (totalPages <= 5) {
                    for (let i = 1; i <= totalPages; i++) {
                      pageNumbers.push(i)
                    }
                  } else {
                    pageNumbers.push(1, 2, 3, '...', totalPages)
                  }
                }

                return (
                  <div key={post.id} className={`forum-post-item ${post.isSticky ? 'sticky' : ''}`}>
                    <div className="forum-post-row-1">
                      <h3 className="forum-post-title">
                        {post.isSticky && <span className="forum-flag sticky">📌</span>}
                        {post.isLocked && <span className="forum-flag locked">🔒</span>}
                        <Link href={`/forum/thread/${post.slug}`}>{post.title}</Link>
                        {pageNumbers.length > 0 && (
                          <span className="forum-thread-pages">
                            {pageNumbers.map((page, idx) =>
                              page === '...' ? (
                                <span key={idx} className="forum-thread-page-ellipsis">
                                  ...
                                </span>
                              ) : (
                                <Link
                                  key={idx}
                                  href={`/forum/thread/${post.slug}#reply-${((page as number) - 1) * 20}`}
                                  className="forum-thread-page-link"
                                >
                                  {page}
                                </Link>
                              )
                            )}
                          </span>
                        )}
                      </h3>
                      <div className="forum-post-stats">
                        <span className="forum-stat">
                          <span className="forum-stat-number">{post.replyCount}</span> replies
                        </span>
                        <span className="forum-stat">
                          <span className="forum-stat-number">{post._count.reactions}</span>{' '}
                          reactions
                        </span>
                      </div>
                    </div>
                    <div className="forum-post-row-2">
                      <span className="forum-post-meta">
                        Posted by{' '}
                        <Link href={`/forum/user/${post.author.id}`} className="forum-username">
                          {post.author.username}
                        </Link>{' '}
                        on {formatDate(post.createdAt)}
                      </span>
                      {post.lastReplyAt && (
                        <span className="forum-last-reply">
                          Last reply: {formatDate(post.lastReplyAt)}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}

              {totalPages > 1 && (
                <div className="forum-pagination">
                  {currentPage > 1 && (
                    <Link
                      href={`/forum/category/general-discussions/${state.slug}/${router.query.propertyType}?page=${currentPage - 1}`}
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
                      href={`/forum/category/general-discussions/${state.slug}/${router.query.propertyType}?page=${currentPage + 1}`}
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
  const { state: stateSlug, propertyType: propertyTypeSlug } = params!
  const page = parseInt((query.page as string) || '1')
  const limit = 20

  // Check if it's a city first
  const cityCheck = await prisma.forumCategory.findFirst({
    where: {
      city: stateSlug as string,
      parent: {
        slug: 'general-discussions',
      },
    },
  })

  // If it's a city, redirect to city property type page
  if (cityCheck) {
    return {
      redirect: {
        destination: `/forum/category/general-discussions/${stateSlug}/${propertyTypeSlug}`,
        permanent: false,
      },
    }
  }

  // Find the property type category under the state
  const category = await prisma.forumCategory.findFirst({
    where: {
      slug: `${stateSlug}-${propertyTypeSlug}`,
      city: null,
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

  // Get state info
  const stateCategory = await prisma.forumCategory.findFirst({
    where: {
      slug: stateSlug as string,
      city: null,
      parent: {
        slug: 'general-discussions',
      },
    },
    select: {
      name: true,
      slug: true,
    },
  })

  if (!stateCategory) {
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
      state: JSON.parse(JSON.stringify(stateCategory)),
      posts: JSON.parse(JSON.stringify(posts)),
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
    },
  }
}
