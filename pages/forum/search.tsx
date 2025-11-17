import { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ForumSearch from '@/components/forum/ForumSearch'

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

const cityIcons: { [key: string]: string } = {
  hyderabad: '🏛️',
  chennai: '🏖️',
  bengaluru: '🌆',
  mumbai: '🏙️',
  delhi: '🏛️',
  kolkata: '🌉',
}

const propertyTypeIcons: { [key: string]: string } = {
  VILLAS: '🏡',
  APARTMENTS: '🏢',
  RESIDENTIAL_LANDS: '🏞️',
  AGRICULTURE_LANDS: '🌾',
  COMMERCIAL_PROPERTIES: '🏬',
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

  const highlightSearchTerm = (text: string, searchQuery: string) => {
    if (!searchQuery) return text
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
                                  className="w-full h-full object-cover"
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
                                  by {post.author.username}
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
                          <p className="forum-search-result-description">
                            {highlightSearchTerm(truncateContent(post.content, 200), results.query)}
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

  if (searchQuery.trim().length < 2) {
    return {
      props: {
        results: null,
        error: 'Search query must be at least 2 characters',
      },
    }
  }

  try {
    const params = new URLSearchParams({ q: searchQuery })
    if (page && typeof page === 'string') params.append('page', page)
    if (categoryId && typeof categoryId === 'string') params.append('categoryId', categoryId)
    if (city && typeof city === 'string') params.append('city', city)
    if (propertyType && typeof propertyType === 'string')
      params.append('propertyType', propertyType)

    const response = await fetch(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/forum/search?${params.toString()}`,
      {
        method: 'GET',
      }
    )

    if (!response.ok) {
      throw new Error('Search failed')
    }

    const results = await response.json()

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
