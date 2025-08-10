import { GetStaticProps } from 'next'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ForumSearch from '@/components/ForumSearch'
import { prisma } from '@/lib/prisma'

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
            <div className="forum-header-main">
              <div className="forum-header-text">
                <h1 className="forum-title">Grihome Community Forum</h1>
                <p className="forum-subtitle">
                  Connect with fellow property enthusiasts, share experiences, and get insights
                  about real estate across India.
                </p>
              </div>
              <div className="forum-header-search">
                <ForumSearch />
              </div>
            </div>
          </div>
        </div>

        <div className="forum-content">
          <div className="forum-categories">
            {categories.map(category => (
              <div key={category.id} className="forum-category-card">
                <div className="forum-category-header">
                  <div className="forum-category-info">
                    <div className="forum-category-icon">
                      {category.city ? cityIcons[category.city.toLowerCase()] || '🏛️' : '💬'}
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
                    <span className="forum-post-count">{category._count.posts} posts</span>
                    {category.slug === 'general-discussions' && (
                      <div className="forum-expand-icon">→</div>
                    )}
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
  const categories = await prisma.forumCategory.findMany({
    where: {
      isActive: true,
      parentId: null,
    },
    include: {
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
