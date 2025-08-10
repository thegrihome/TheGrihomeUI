import { GetStaticProps } from 'next'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ForumSearch from '@/components/ForumSearch'
import { prisma } from '@/lib/prisma'

interface City {
  id: string
  name: string
  slug: string
  description: string | null
  city: string | null
  _count: {
    posts: number
  }
  children: Array<{
    id: string
    name: string
    slug: string
    _count: {
      posts: number
    }
  }>
}

interface GeneralDiscussionsPageProps {
  cities: City[]
  totalPosts: number
}

const cityIcons: { [key: string]: string } = {
  hyderabad: '🏛️',
  chennai: '🏖️',
  bengaluru: '🌆',
  mumbai: '🏙️',
  delhi: '🏛️',
  kolkata: '🌉',
}

export default function GeneralDiscussionsPage({
  cities,
  totalPosts,
}: GeneralDiscussionsPageProps) {
  return (
    <div className="forum-container">
      <NextSeo
        title="General Discussions - Forum - Grihome"
        description="Browse real estate discussions by city across India on Grihome community forum"
        canonical="https://grihome.vercel.app/forum/category/general-discussions"
      />

      <Header />

      <main className="forum-main">
        <div className="forum-breadcrumb">
          <Link href="/forum" className="forum-breadcrumb-link">
            Forum
          </Link>
          <span className="forum-breadcrumb-separator">›</span>
          <span className="forum-breadcrumb-current">General Discussions</span>
        </div>

        <div className="forum-header">
          <div className="forum-header-content">
            <div className="forum-header-main">
              <div className="forum-header-text">
                <h1 className="forum-title">General Discussions</h1>
                <p className="forum-subtitle">
                  Explore real estate discussions across major Indian cities. Select your city to
                  browse specific property types and local insights.
                </p>
                <div className="forum-stats-summary">
                  <span className="forum-stat">{totalPosts} total discussions</span>
                </div>
              </div>
              <div className="forum-header-search">
                <ForumSearch />
              </div>
            </div>
          </div>
        </div>

        <div className="forum-content">
          <div className="forum-cities-list">
            {cities.map(city => (
              <Link
                key={city.id}
                href={`/forum/category/general-discussions/${city.city}`}
                className="forum-city-list-item"
              >
                <div className="forum-city-list-content">
                  <div className="forum-city-list-info">
                    <div className="forum-city-icon">{cityIcons[city.city || ''] || '🏛️'}</div>
                    <div className="forum-city-details">
                      <h3 className="forum-city-name">{city.name}</h3>
                      <p className="forum-city-description">
                        {`${city.name} Real Estate Discussions`}
                      </p>
                    </div>
                  </div>

                  <div className="forum-city-list-stats">
                    <div className="forum-city-stat">
                      <span className="forum-stat-number">{city._count.posts}</span>
                      <span className="forum-stat-label">discussions</span>
                    </div>
                    <div className="forum-city-stat">
                      <span className="forum-stat-number">{city.children.length}</span>
                      <span className="forum-stat-label">categories</span>
                    </div>
                    <div className="forum-city-arrow">→</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  // Get General Discussions category
  const generalDiscussions = await prisma.forumCategory.findUnique({
    where: { slug: 'general-discussions' },
    select: { id: true },
  })

  if (!generalDiscussions) {
    return {
      notFound: true,
    }
  }

  // Get city subcategories
  const cities = await prisma.forumCategory.findMany({
    where: {
      isActive: true,
      parentId: generalDiscussions.id,
    },
    include: {
      children: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
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

  // Calculate total posts across all cities
  const totalPosts = cities.reduce((sum, city) => sum + city._count.posts, 0)

  return {
    props: {
      cities: JSON.parse(JSON.stringify(cities)),
      totalPosts,
    },
    revalidate: 300, // Revalidate every 5 minutes
  }
}
