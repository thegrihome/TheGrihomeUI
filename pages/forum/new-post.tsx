import { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { prisma } from '@/lib/cockroachDB/prisma'
import 'react-quill/dist/quill.snow.css'

interface ForumCategory {
  id: string
  name: string
  slug: string
  children: ForumCategory[]
}

interface NewPostPageProps {
  categories: ForumCategory[]
  selectedCategoryId?: string
  selectedCategory?: {
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
  } | null
}

// Dynamic import to avoid SSR issues with ReactQuill
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })

export default function NewPostPage({
  categories,
  selectedCategoryId,
  selectedCategory,
}: NewPostPageProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [categoryId, setCategoryId] = useState(selectedCategoryId || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Custom dropdown state
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false)
  const [categorySearch, setCategorySearch] = useState('')
  const categoryDropdownRef = useRef<HTMLDivElement>(null)

  // Configure rich text editor modules
  const modules = useMemo(
    () => ({
      toolbar: [
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link'],
        ['clean'],
      ],
    }),
    []
  )

  const formats = ['header', 'bold', 'italic', 'underline', 'strike', 'list', 'bullet', 'link']

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login?callbackUrl=' + encodeURIComponent('/forum/new-post'))
      return
    }
  }, [session, status, router])

  // Close category dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target as Node)
      ) {
        setCategoryDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim() || !categoryId || isSubmitting) return

    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/forum/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          categoryId,
        }),
      })

      if (response.ok) {
        const post = await response.json()
        router.push(`/forum/thread/${post.slug}`)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create post')
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error creating post:', error)
      setError('Failed to create post')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderCategoryOptions = (categories: ForumCategory[], level = 0) => {
    return categories.map(category => (
      <optgroup key={category.id} label={'  '.repeat(level) + category.name}>
        {category.children.length === 0 && (
          <option value={category.id}>{'  '.repeat(level + 1) + category.name}</option>
        )}
        {category.children.length > 0 && renderCategoryOptions(category.children, level + 1)}
      </optgroup>
    ))
  }

  const getSelectableCategories = (categories: ForumCategory[]): ForumCategory[] => {
    let selectableCategories: ForumCategory[] = []

    categories.forEach(category => {
      if (!category.children || category.children.length === 0) {
        selectableCategories.push(category)
      } else {
        selectableCategories = [
          ...selectableCategories,
          ...getSelectableCategories(category.children),
        ]
      }
    })

    return selectableCategories
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-gray-600">Loading...</div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!session) {
    return null
  }

  const isUserVerified = session?.user?.isEmailVerified || session?.user?.isMobileVerified
  const selectableCategories = getSelectableCategories(categories)

  // Filter categories based on search
  const filteredCategories = selectableCategories.filter(category =>
    category.name.toLowerCase().includes(categorySearch.toLowerCase())
  )

  // Get selected category name
  const selectedCategoryName = selectableCategories.find(cat => cat.id === categoryId)?.name || ''

  return (
    <div className="forum-container">
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>
      <NextSeo
        title="New Thread - Forum - Zillfin"
        description="Start a new discussion in the Zillfin community forum"
        canonical="https://grihome.vercel.app/forum/new-post"
      />

      <Header />

      <main id="main-content" className="forum-main">
        <div className="forum-breadcrumb">
          <Link href="/forum" className="forum-breadcrumb-link">
            Forum
          </Link>
          <span className="forum-breadcrumb-separator">›</span>
          {selectedCategory?.parent?.parent && (
            <>
              <Link
                href={`/forum/category/${selectedCategory.parent.parent.slug}`}
                className="forum-breadcrumb-link"
              >
                {selectedCategory.parent.parent.name}
              </Link>
              <span className="forum-breadcrumb-separator">›</span>
            </>
          )}
          {selectedCategory?.parent && (
            <>
              <Link
                href={`/forum/category/general-discussions/${selectedCategory.city}`}
                className="forum-breadcrumb-link"
              >
                {selectedCategory.parent.name}
              </Link>
              <span className="forum-breadcrumb-separator">›</span>
            </>
          )}
          {selectedCategory && (
            <>
              <Link
                href={
                  selectedCategory.parent?.parent
                    ? `/forum/category/general-discussions/${selectedCategory.city}/${selectedCategory.slug.replace(`${selectedCategory.city}-`, '')}`
                    : `/forum/category/${selectedCategory.slug}`
                }
                className="forum-breadcrumb-link"
              >
                {selectedCategory.name}
              </Link>
              <span className="forum-breadcrumb-separator">›</span>
            </>
          )}
          <span className="forum-breadcrumb-current">New Thread</span>
        </div>

        <div className="forum-new-post">
          <div className="forum-new-post-header">
            <h1>Start a New Thread</h1>
            <p>Share your thoughts, ask questions, or start a discussion with the community.</p>
          </div>

          {error && <div className="forum-error-message">{error}</div>}

          {!isUserVerified ? (
            <div className="forum-verification-prompt">
              <h3>Verification Required</h3>
              <p>
                You need to verify your email or mobile number to create threads. Please verify your
                account to participate in discussions.
              </p>
              <Link href="/auth/userinfo" className="forum-verify-btn">
                Verify Account
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="forum-new-post-form">
              <div className="forum-form-group">
                <label htmlFor="category" className="forum-label">
                  Category
                </label>
                {selectedCategory ? (
                  <input
                    type="text"
                    value={selectedCategory.name}
                    className="forum-input"
                    disabled
                    style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                  />
                ) : (
                  <div className="forum-dropdown-container" ref={categoryDropdownRef}>
                    <button
                      type="button"
                      id="category"
                      onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                      className="forum-dropdown-trigger"
                      aria-expanded={categoryDropdownOpen}
                      aria-haspopup="listbox"
                      aria-label="Select a category"
                    >
                      <span className={categoryId ? '' : 'forum-dropdown-placeholder'}>
                        {selectedCategoryName || 'Select a category'}
                      </span>
                      <svg
                        className={`forum-dropdown-arrow ${categoryDropdownOpen ? 'forum-dropdown-arrow--open' : ''}`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    {categoryDropdownOpen && (
                      <div className="forum-dropdown-menu">
                        <div className="forum-dropdown-search-container">
                          <input
                            type="text"
                            value={categorySearch}
                            onChange={e => setCategorySearch(e.target.value)}
                            placeholder="Search categories..."
                            className="forum-dropdown-search"
                            aria-label="Search categories"
                          />
                        </div>
                        <ul
                          role="listbox"
                          className="forum-dropdown-list"
                          aria-label="Category options"
                        >
                          {filteredCategories.length === 0 ? (
                            <li className="forum-dropdown-no-results">No categories found</li>
                          ) : (
                            filteredCategories.map(category => (
                              <li
                                key={category.id}
                                role="option"
                                aria-selected={categoryId === category.id}
                                className={`forum-dropdown-item ${categoryId === category.id ? 'forum-dropdown-item--selected' : ''}`}
                                onClick={() => {
                                  setCategoryId(category.id)
                                  setCategoryDropdownOpen(false)
                                  setCategorySearch('')
                                }}
                                onKeyDown={e => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault()
                                    setCategoryId(category.id)
                                    setCategoryDropdownOpen(false)
                                    setCategorySearch('')
                                  }
                                }}
                                tabIndex={0}
                              >
                                {category.name}
                                {categoryId === category.id && (
                                  <svg
                                    className="forum-dropdown-check"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    aria-hidden="true"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                              </li>
                            ))
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="forum-form-group">
                <label htmlFor="title" className="forum-label">
                  Thread Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Enter a descriptive title for your thread"
                  className="forum-input"
                  maxLength={200}
                  required
                />
                <div className="forum-form-help">{title.length}/200 characters</div>
              </div>

              <div className="forum-form-group" style={{ marginBottom: '2rem' }}>
                <label htmlFor="content" className="forum-label">
                  Content *
                </label>
                <div style={{ marginBottom: '5rem' }}>
                  <ReactQuill
                    theme="snow"
                    value={content}
                    onChange={setContent}
                    modules={modules}
                    formats={formats}
                    placeholder="Write your post content here... Paste YouTube/Instagram/X links or images - they'll auto-embed on publish!"
                    className="bg-white"
                    style={{ height: '400px' }}
                  />
                </div>
              </div>

              <div className="forum-form-actions">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="forum-cancel-btn"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="forum-submit-btn"
                  disabled={!title.trim() || !content.trim() || !categoryId || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="forum-button-spinner"></span>
                      Creating...
                    </>
                  ) : (
                    'Create Thread'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const selectedCategoryId = (query.category as string) || ''

  const categories = await prisma.forumCategory.findMany({
    where: {
      isActive: true,
      parentId: null,
    },
    include: {
      children: {
        where: { isActive: true },
        include: {
          children: {
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' },
          },
        },
        orderBy: { displayOrder: 'asc' },
      },
    },
    orderBy: { displayOrder: 'asc' },
  })

  let selectedCategory = null
  if (selectedCategoryId) {
    selectedCategory = await prisma.forumCategory.findUnique({
      where: { id: selectedCategoryId },
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
    })
  }

  return {
    props: {
      categories: JSON.parse(JSON.stringify(categories)),
      selectedCategoryId,
      selectedCategory: selectedCategory ? JSON.parse(JSON.stringify(selectedCategory)) : null,
    },
  }
}
