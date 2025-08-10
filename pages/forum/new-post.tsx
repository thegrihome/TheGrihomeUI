import { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { prisma } from '@/lib/prisma'

interface ForumCategory {
  id: string
  name: string
  slug: string
  children: ForumCategory[]
}

interface NewPostPageProps {
  categories: ForumCategory[]
  selectedCategoryId?: string
}

export default function NewPostPage({ categories, selectedCategoryId }: NewPostPageProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [categoryId, setCategoryId] = useState(selectedCategoryId || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login?callbackUrl=' + encodeURIComponent('/forum/new-post'))
      return
    }
  }, [session, status, router])

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
      if (category.children.length === 0) {
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
    return <div>Loading...</div>
  }

  if (!session) {
    return null
  }

  const selectableCategories = getSelectableCategories(categories)

  return (
    <div className="forum-container">
      <NextSeo
        title="New Thread - Forum - Grihome"
        description="Start a new discussion in the Grihome community forum"
        canonical="https://grihome.vercel.app/forum/new-post"
      />

      <Header />

      <main className="forum-main">
        <div className="forum-breadcrumb">
          <Link href="/forum" className="forum-breadcrumb-link">
            Forum
          </Link>
          <span className="forum-breadcrumb-separator">›</span>
          <span className="forum-breadcrumb-current">New Thread</span>
        </div>

        <div className="forum-new-post">
          <div className="forum-new-post-header">
            <h1>Start a New Thread</h1>
            <p>Share your thoughts, ask questions, or start a discussion with the community.</p>
          </div>

          {error && <div className="forum-error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="forum-new-post-form">
            <div className="forum-form-group">
              <label htmlFor="category" className="forum-label">
                Category *
              </label>
              <select
                id="category"
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="forum-select"
                required
              >
                <option value="">Select a category</option>
                {selectableCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
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

            <div className="forum-form-group">
              <label htmlFor="content" className="forum-label">
                Content *
              </label>
              <textarea
                id="content"
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Write your post content here..."
                className="forum-textarea"
                rows={12}
                required
              />
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
                {isSubmitting ? 'Creating...' : 'Create Thread'}
              </button>
            </div>
          </form>

          <div className="forum-posting-guidelines">
            <h3>Posting Guidelines</h3>
            <ul>
              <li>Be respectful and courteous to other community members</li>
              <li>Stay on topic and choose the appropriate category</li>
              <li>Use clear, descriptive titles for your threads</li>
              <li>Provide detailed information to help others understand your question or point</li>
              <li>Search existing threads before posting to avoid duplicates</li>
            </ul>
          </div>
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

  return {
    props: {
      categories: JSON.parse(JSON.stringify(categories)),
      selectedCategoryId,
    },
  }
}
