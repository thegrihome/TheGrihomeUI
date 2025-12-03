import { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ForumSearch from '@/components/forum/ForumSearch'
import { prisma } from '@/lib/cockroachDB/prisma'

interface SearchResult {
  posts: Array<{
    id: string
    title: string
    slug: string
    content: string
    viewCount: number
    replyCount: number
    createdAt: string
    author: {
      id: string
      username: string
      image: string | null
    }
    category: {
      name: string
      slug: string
      city: string | null
      propertyType: string | null
    }
    _count: {
      replies: number
      reactions: number
    }
  }>
  categories: Array<{
    id: string
    name: string
    slug: string
    description: string | null
    city: string | null
    propertyType: string | null
    _count: {
      posts: number
    }
    parent: {
      name: string
      slug: string
    } | null
  }>
  query: string
  totalResults: number
  currentPage: number
  totalPages: number
}

interface SearchPageProps {
  results: SearchResult | null
  error?: string
}

export default function SearchPage({ results, error }: SearchPageProps) {
  const router = useRouter()
  const { q: query } = router.query

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const truncateContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength).trim() + '...'
  }

  const getContentExcerpt = (content: string, searchQuery: string, maxLength: number = 200) => {
    // Strip HTML tags and entities from content
    const strippedContent = content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ')

    if (!searchQuery) return truncateContent(strippedContent, maxLength)

    // Find the position of the search term (case insensitive)
    const lowerContent = strippedContent.toLowerCase()
    const lowerQuery = searchQuery.toLowerCase()
    const matchIndex = lowerContent.indexOf(lowerQuery)

    // If search term not found in content, return null (don't show content)
    if (matchIndex === -1) return null

    // Extract content around the match
    const start = Math.max(0, matchIndex - 50)
    const end = Math.min(strippedContent.length, matchIndex + searchQuery.length + 150)

    let excerpt = strippedContent.substring(start, end)
    if (start > 0) excerpt = '...' + excerpt
    if (end < strippedContent.length) excerpt = excerpt + '...'

    return excerpt
  }

  const highlightSearchTerm = (text: string | null, searchQuery: string) => {
    if (!text || !searchQuery) return text
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'))
    return parts.map((part, index) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <mark key={index} className="forum-search-highlight">
          {part}
        </mark>
      ) : (
        part
      )
    )
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
        title={`Search Results for "${query}" - Forum - Grihome`}
        description={`Search results for "${query}" in Grihome community forum`}
        canonical={`https://grihome.vercel.app/forum/search?q=${query}`}
      />

      <Header />

      <main className="forum-main">
        <div className="forum-breadcrumb">
          <Link href="/forum" className="forum-breadcrumb-link">
            Forum
          </Link>
          <span className="forum-breadcrumb-separator">›</span>
          <span className="forum-breadcrumb-current">Search Results</span>
        </div>

        <div className="forum-header">
          <div className="forum-header-content">
            <div className="forum-header-main">
              <div className="forum-header-text">
                <h1 className="forum-title">Search Results</h1>
                {results && (
                  <p className="forum-subtitle forum-search-results-count">
                    Found {results.totalResults} results for &ldquo;{results.query}&rdquo;
                  </p>
                )}
              </div>
              <div className="forum-header-search">
                <ForumSearch />
              </div>
            </div>
          </div>
        </div>

        <div className="forum-content">
          {error && (
            <div className="forum-error-message">
              <p>{error}</p>
            </div>
          )}

          {results && results.totalResults === 0 && (
            <div className="forum-empty-state">
              <h3>No results found</h3>
              <p>
                No posts or sections match your search for &ldquo;{results.query}&rdquo;. Try
                different keywords or browse our categories.
              </p>
              <Link href="/forum" className="forum-new-post-btn">
                Browse Forum
              </Link>
            </div>
          )}

          {results && results.totalResults > 0 && (
            <>
              {/* Posts Results */}
              {results.posts.length > 0 && (
                <div className="forum-search-section">
                  <h2 className="forum-search-section-title">Posts</h2>
                  <div className="forum-search-results">
                    {results.posts.map(post => (
                      <Link
                        key={post.id}
                        href={`/forum/thread/${post.slug}`}
                        className="forum-search-result-item"
                      >
                        <div className="forum-search-result-content">
                          <div className="forum-search-result-header">
                            <div className="forum-avatar">
                              {post.author.image ? (
                                <Image
                                  src={post.author.image}
                                  alt={post.author.username}
                                  width={32}
                                  height={32}
                                />
                              ) : (
                                <div className="forum-avatar-placeholder">
                                  {post.author.username.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div>
                              <h3 className="forum-search-result-title">
                                {highlightSearchTerm(post.title, results.query)}
                              </h3>
                              <div className="forum-search-result-meta">
                                <span className="forum-search-result-author">
                                  by {highlightSearchTerm(post.author.username, results.query)}
                                </span>
                                <span className="forum-search-result-date">
                                  {formatDate(post.createdAt)}
                                </span>
                                <span className="forum-search-result-category">
                                  in {post.category.name}
                                </span>
                              </div>
                            </div>
                          </div>
                          {(() => {
                            const excerpt = getContentExcerpt(post.content, results.query, 200)
                            return excerpt ? (
                              <p className="forum-search-result-description">
                                {highlightSearchTerm(excerpt, results.query)}
                              </p>
                            ) : null
                          })()}
                          <div className="forum-search-result-stats">
                            <span className="forum-stat">{post._count.replies} replies</span>
                            <span className="forum-stat">{post.viewCount} views</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* Pagination */}
                  {results.totalPages > 1 && (
                    <div className="forum-pagination">
                      {results.currentPage > 1 && (
                        <Link
                          href={`/forum/search?${new URLSearchParams({
                            q: results.query,
                            page: String(results.currentPage - 1),
                            ...(router.query.categoryId && {
                              categoryId: router.query.categoryId as string,
                            }),
                            ...(router.query.city && { city: router.query.city as string }),
                            ...(router.query.propertyType && {
                              propertyType: router.query.propertyType as string,
                            }),
                          }).toString()}`}
                          className="forum-pagination-btn"
                        >
                          ← Previous
                        </Link>
                      )}

                      <span className="forum-pagination-info">
                        Page {results.currentPage} of {results.totalPages}
                      </span>

                      {results.currentPage < results.totalPages && (
                        <Link
                          href={`/forum/search?${new URLSearchParams({
                            q: results.query,
                            page: String(results.currentPage + 1),
                            ...(router.query.categoryId && {
                              categoryId: router.query.categoryId as string,
                            }),
                            ...(router.query.city && { city: router.query.city as string }),
                            ...(router.query.propertyType && {
                              propertyType: router.query.propertyType as string,
                            }),
                          }).toString()}`}
                          className="forum-pagination-btn"
                        >
                          Next →
                        </Link>
                      )}
                    </div>
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

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const { q: searchQuery, page, categoryId, city, propertyType } = query

  if (!searchQuery || typeof searchQuery !== 'string') {
    return {
      props: {
        results: null,
        error: 'Please enter a search query',
      },
    }
  }

  const trimmedQuery = searchQuery.trim()
  if (trimmedQuery.length < 2) {
    return {
      props: {
        results: null,
        error: 'Search query must be at least 2 characters',
      },
    }
  }

  try {
    const pageNum = parseInt((page as string) || '1') || 1
    const limitNum = 20
    const skip = (pageNum - 1) * limitNum

    const results: any = {
      query: trimmedQuery,
      posts: [],
      categories: [],
      totalResults: 0,
      currentPage: pageNum,
      totalPages: 0,
    }

    // Build category filter for posts
    const categoryFilter: any = {}
    if (categoryId && typeof categoryId === 'string') {
      categoryFilter.categoryId = categoryId
    } else if (city && typeof city === 'string') {
      const cityFilter: any = { city: city as string }
      if (propertyType && typeof propertyType === 'string') {
        cityFilter.propertyType = propertyType
      }
      categoryFilter.category = cityFilter
    }

    // Search in forum posts (title, content, or author username)
    const postWhereClause: any = {
      ...categoryFilter,
      OR: [
        { title: { contains: trimmedQuery, mode: 'insensitive' } },
        { content: { contains: trimmedQuery, mode: 'insensitive' } },
        { author: { username: { contains: trimmedQuery, mode: 'insensitive' } } },
      ],
    }

    const [posts, postsCount] = await Promise.all([
      prisma.forumPost.findMany({
        where: postWhereClause,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              image: true,
            },
          },
          category: {
            select: {
              name: true,
              slug: true,
              city: true,
              propertyType: true,
            },
          },
          _count: {
            select: {
              replies: true,
              reactions: true,
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: limitNum,
      }),
      prisma.forumPost.count({
        where: postWhereClause,
      }),
    ])

    results.posts = posts
    results.totalResults = postsCount
    results.totalPages = Math.ceil(postsCount / limitNum)

    return {
      props: {
        results: JSON.parse(JSON.stringify(results)),
      },
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Search error:', error)
    return {
      props: {
        results: null,
        error: 'An error occurred while searching. Please try again.',
      },
    }
  }
}
