import { GetStaticProps } from 'next'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { prisma } from '@/lib/prisma'

interface ForumCategory {
  id: string
  name: string
  slug: string
  description: string | null
  city: string | null
  propertyType: string | null
  children: ForumCategory[]
  _count: {
    posts: number
  }
}

interface ForumProps {
  categories: ForumCategory[]
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

export default function Forum({ categories }: ForumProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  // Auto-expand categories with subcategories
  useEffect(() => {
    const categoriesWithChildren = categories
      .filter(cat => cat.children.length > 0)
      .map(cat => cat.id)
    setExpandedCategories(new Set(categoriesWithChildren))
  }, [categories])

  return (
    <div className="forum-container">
      <NextSeo
        title="Forum - Grihome"
        description="Join the Grihome community forum to discuss real estate, share experiences, and connect with fellow property enthusiasts."
        canonical="https://grihome.vercel.app/forum"
      />

      <Header />

      <main className="forum-main">
        <div className="forum-header">
          <div className="forum-header-content">
            <h1 className="forum-title">Grihome Community Forum</h1>
            <p className="forum-subtitle">
              Connect with fellow property enthusiasts, share experiences, and get insights about
              real estate across India.
            </p>
          </div>
        </div>

        <div className="forum-content">
          <div className="forum-categories">
            {categories.map(category => (
              <div key={category.id} className="forum-category-card">
                <div
                  className="forum-category-header"
                  onClick={() => category.children.length > 0 && toggleCategory(category.id)}
                  style={{ cursor: category.children.length > 0 ? 'pointer' : 'default' }}
                >
                  <div className="forum-category-info">
                    <div className="forum-category-icon">
                      {category.city ? cityIcons[category.city.toLowerCase()] || '🏛️' : '💬'}
                    </div>
                    <div className="forum-category-details">
                      <h3 className="forum-category-name">
                        <Link href={`/forum/category/${category.slug}`}>{category.name}</Link>
                      </h3>
                      {category.description && (
                        <p className="forum-category-description">{category.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="forum-category-stats">
                    <span className="forum-post-count">{category._count.posts} posts</span>
                    {category.children.length > 0 && (
                      <div className="forum-expand-icon">
                        {expandedCategories.has(category.id) ? '▼' : '▶'}
                      </div>
                    )}
                  </div>
                </div>

                {category.children.length > 0 && expandedCategories.has(category.id) && (
                  <div className="forum-subcategories">
                    {category.children.map(subcategory => (
                      <div key={subcategory.id} className="forum-subcategory">
                        <div
                          className="forum-subcategory-header"
                          onClick={() =>
                            subcategory.children.length > 0 && toggleCategory(subcategory.id)
                          }
                          style={{
                            cursor: subcategory.children.length > 0 ? 'pointer' : 'default',
                          }}
                        >
                          <div className="forum-subcategory-info">
                            <div className="forum-subcategory-icon">
                              {subcategory.city
                                ? cityIcons[subcategory.city.toLowerCase()] || '🏛️'
                                : '📁'}
                            </div>
                            <div className="forum-subcategory-details">
                              <h4 className="forum-subcategory-name">
                                <Link href={`/forum/category/${subcategory.slug}`}>
                                  {subcategory.name}
                                </Link>
                              </h4>
                            </div>
                          </div>
                          <div className="forum-subcategory-stats">
                            <span className="forum-post-count">
                              {subcategory._count.posts} posts
                            </span>
                            {subcategory.children.length > 0 && (
                              <div className="forum-expand-icon">
                                {expandedCategories.has(subcategory.id) ? '▼' : '▶'}
                              </div>
                            )}
                          </div>
                        </div>

                        {subcategory.children.length > 0 &&
                          expandedCategories.has(subcategory.id) && (
                            <div className="forum-property-types">
                              {subcategory.children.map(propertyCategory => (
                                <Link
                                  key={propertyCategory.id}
                                  href={`/forum/category/${propertyCategory.slug}`}
                                  className="forum-property-type-card"
                                >
                                  <div className="forum-property-type-icon">
                                    {propertyTypeIcons[propertyCategory.propertyType || ''] || '🏠'}
                                  </div>
                                  <div className="forum-property-type-info">
                                    <h5 className="forum-property-type-name">
                                      {propertyCategory.name}
                                    </h5>
                                    <span className="forum-post-count">
                                      {propertyCategory._count.posts} posts
                                    </span>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                )}
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
            include: {
              _count: {
                select: { posts: true },
              },
            },
            orderBy: { displayOrder: 'asc' },
          },
          _count: {
            select: { posts: true },
          },
        },
        orderBy: { displayOrder: 'asc' },
      },
      _count: {
        select: { posts: true },
      },
    },
    orderBy: { displayOrder: 'asc' },
  })

  return {
    props: {
      categories: JSON.parse(JSON.stringify(categories)),
    },
    revalidate: 300, // Revalidate every 5 minutes
  }
}
