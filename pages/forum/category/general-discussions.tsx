import { GetStaticProps } from 'next'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ForumSearch from '@/components/forum/ForumSearch'
import { prisma } from '@/lib/cockroachDB/prisma'

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
  // Smart title formatter - determines which words should be gradient
  const formatTitle = (title: string) => {
    const gradientWords = ['Forum', 'Introductions', 'News', 'Deals', 'Discussions'] // Added 'Discussions' back
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

  return (
    <div className="forum-container">
      <NextSeo
        title="General Discussions - Forum - Grihome"
        description="Browse real estate discussions by city across India on Grihome community forum"
        canonical="https://grihome.vercel.app/forum/category/general-discussions"
      />

      <Header />

      <main className="forum-main">
        <div className="forum-breadcrumb-container">
          <div className="forum-breadcrumb">
            <Link href="/forum" className="forum-breadcrumb-link">
              Forum
            </Link>
            <span className="forum-breadcrumb-separator">›</span>
            <span className="forum-breadcrumb-current">General Discussions</span>
          </div>
          <div className="forum-breadcrumb-search">
            <ForumSearch />
          </div>
        </div>

        <div className="forum-header">
          <div className="forum-header-content">
            <div className="forum-header-main">
              <div className="forum-category-icon-large">💬</div>
              <div className="forum-header-text">
                <h1 className="forum-title">{formatTitle('General Discussions')}</h1>
                <p className="forum-subtitle">
                  Explore real estate discussions across major Indian cities.
                </p>
              </div>
              <div className="forum-header-stats">
                <div className="forum-thread-count">
                  {totalPosts} {totalPosts === 1 ? 'thread' : 'threads'}
                </div>
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
                      <span className="forum-stat-label">threads</span>
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
