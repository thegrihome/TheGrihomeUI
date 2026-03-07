import React from 'react'
import { GetStaticProps } from 'next'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ForumSearch from '@/components/forum/ForumSearch'
import { FORUM_CATEGORY_ICONS } from '@/components/common/PropertyTypeIcon'
import { prisma } from '@/lib/cockroachDB/prisma'

interface ForumCategory {
  id: string
  name: string
  slug: string
  description: string | null
  city: string | null
  propertyType: string | null
  _count: {
    posts: number
  }
}

interface ForumProps {
  categories: ForumCategory[]
}

// Default folder icon SVG for categories without custom icons
const DefaultCategoryIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" aria-hidden="true">
    <path
      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export default function Forum({ categories }: ForumProps) {
  // Smart title formatter - determines which words should be gradient
  const formatTitle = (title: string) => {
    const gradientWords = ['Forum', 'Introductions', 'News', 'Deals'] // Removed 'Discussions'
    const cityNames = [
      'Hyderabad',
      'Chennai',
      'Bengaluru',
      'Mumbai',
      'Delhi',
      'Kolkata',
      'Gurgaon',
      'Noida',
      'Pune',
      'Other',
    ]

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

  return (
    <div className="forum-container">
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>
      <NextSeo
        title="Forum - Zillfin"
        description="Join the Zillfin community forum to discuss real estate, share experiences, and connect with fellow property enthusiasts."
        canonical="https://grihome.vercel.app/forum"
      />

      <Header />

      <main id="main-content" className="forum-main">
        <div className="forum-breadcrumb-container">
          <div></div>
          <div className="forum-breadcrumb-search">
            <ForumSearch />
          </div>
        </div>

        <div className="forum-header">
          <div className="forum-header-content">
            <div className="forum-city-header-section">
              <div>
                <h1 className="forum-title">{formatTitle('Zillfin Community Forum')}</h1>
                <div className="forum-stats-summary">
                  <span className="forum-stat">
                    {categories.reduce((sum, cat) => sum + cat._count.posts, 0)} discussions
                  </span>
                  <span className="forum-stat-separator">•</span>
                  <span className="forum-stat">{categories.length} categories</span>
                </div>
              </div>
              <Link href="/forum/category/general-discussions" className="forum-all-india-btn">
                All India Forums →
              </Link>
            </div>
          </div>
        </div>

        <div className="forum-content">
          <div className="forum-categories">
            {categories.map(category => (
              <div key={category.id} className="forum-category-card">
                <div className="forum-category-header">
                  <div className="forum-category-info">
                    <div className="forum-category-icon" aria-hidden="true">
                      {FORUM_CATEGORY_ICONS[category.slug] || <DefaultCategoryIcon />}
                    </div>
                    <div className="forum-category-details">
                      <h3 className="forum-category-name">
                        <Link
                          href={
                            category.slug === 'general-discussions'
                              ? `/forum/category/general-discussions`
                              : `/forum/category/${category.slug}`
                          }
                        >
                          {category.name}
                        </Link>
                      </h3>
                      {category.description && (
                        <p className="forum-category-description">{category.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="forum-category-stats">
                    <span className="forum-post-count">
                      {category._count.posts} {category._count.posts === 1 ? 'thread' : 'threads'}
                    </span>
                    <div className="forum-expand-icon">→</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  try {
    const categories = await prisma.forumCategory.findMany({
      where: {
        isActive: true,
        parentId: null,
      },
      include: {
        _count: {
          select: { posts: true },
        },
        children: {
          include: {
            _count: {
              select: { posts: true },
            },
            children: {
              include: {
                _count: {
                  select: { posts: true },
                },
              },
            },
          },
        },
      },
      orderBy: { displayOrder: 'asc' },
    })

    // Calculate cumulative post counts for parent categories
    const categoriesWithCumulativeCounts = categories.map(category => {
      let totalPosts = category._count.posts

      // Add posts from direct children
      if (category.children) {
        category.children.forEach(child => {
          totalPosts += child._count.posts
          // Add posts from grandchildren
          if (child.children) {
            child.children.forEach(grandchild => {
              totalPosts += grandchild._count.posts
            })
          }
        })
      }

      return {
        ...category,
        _count: {
          posts: totalPosts,
        },
      }
    })

    return {
      props: {
        categories: JSON.parse(JSON.stringify(categoriesWithCumulativeCounts)),
      },
      revalidate: 300, // Revalidate every 5 minutes
    }
  } catch (error) {
    // Return empty categories if database is not available
    return {
      props: {
        categories: [],
      },
      revalidate: 60, // Retry more frequently when database is unavailable
    }
  }
}
