import { GetStaticProps } from 'next'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import Image from 'next/image'
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
  totalPosts: number
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
  statesCount: number
  statesTotalPosts: number
}

const cityImages: { [key: string]: string } = {
  hyderabad: '/images/cities/Hyderabad.png',
  chennai: '/images/cities/Chennai.png',
  bengaluru: '/images/cities/Bengaluru.png',
  mumbai: '/images/cities/Mumbai.png',
  delhi: '/images/cities/Delhi.png',
  kolkata: '/images/cities/Kolkata.png',
  gurgaon: '/images/cities/Gurgaon.png',
  noida: '/images/cities/Noida.png',
  pune: '/images/cities/Pune.png',
}

export default function GeneralDiscussionsPage({
  cities,
  totalPosts,
  statesCount,
  statesTotalPosts,
}: GeneralDiscussionsPageProps) {
  // Smart title formatter - determines which words should be gradient
  const formatTitle = (title: string) => {
    const gradientWords = ['Forum', 'Introductions', 'News', 'Deals', 'Discussions'] // Added 'Discussions' back
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
            {cities
              .filter(city => city.city !== 'other-cities' && city.name !== 'Other Cities')
              .map(city => (
                <Link
                  key={city.id}
                  href={`/forum/category/general-discussions/${city.city}`}
                  className="forum-city-list-item"
                >
                  <div className="forum-city-list-content">
                    <div className="forum-city-list-info">
                      {cityImages[city.city || ''] && (
                        <div className="forum-city-icon">
                          <Image
                            src={cityImages[city.city || '']}
                            alt={city.name}
                            width={48}
                            height={48}
                            className="forum-city-image"
                          />
                        </div>
                      )}
                      <div className="forum-city-details">
                        <h3 className="forum-city-name">{city.name}</h3>
                        <p className="forum-city-description">
                          {city.description || `${city.name} Real Estate Discussions`}
                        </p>
                      </div>
                    </div>

                    <div className="forum-city-list-stats">
                      <div className="forum-city-stat">
                        <span className="forum-stat-number">{city.totalPosts}</span>
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

            {/* States and Union Territories Entry */}
            {statesCount > 0 && (
              <Link
                href="/forum/category/general-discussions/states"
                className="forum-city-list-item"
              >
                <div className="forum-city-list-content">
                  <div className="forum-city-list-info">
                    <div className="forum-city-icon forum-city-icon-emoji">🇮🇳</div>
                    <div className="forum-city-details">
                      <h3 className="forum-city-name">States & Union Territories</h3>
                      <p className="forum-city-description">
                        Real estate discussions across all Indian states and union territories
                      </p>
                    </div>
                  </div>

                  <div className="forum-city-list-stats">
                    <div className="forum-city-stat">
                      <span className="forum-stat-number">{statesTotalPosts}</span>
                      <span className="forum-stat-label">threads</span>
                    </div>
                    <div className="forum-city-stat">
                      <span className="forum-stat-number">{statesCount}</span>
                      <span className="forum-stat-label">states/UTs</span>
                    </div>
                    <div className="forum-city-arrow">→</div>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  try {
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

    // Get all subcategories (cities and states)
    const allCategories = await prisma.forumCategory.findMany({
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
          orderBy: { name: 'asc' },
        },
        _count: {
          select: { posts: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    // Separate cities and states based on the 'city' field
    // Cities have the city field populated, states don't
    const cities = allCategories.filter(cat => cat.city !== null)
    const states = allCategories.filter(cat => cat.city === null)

    // Calculate total posts for each category by summing posts from all property type children
    const citiesWithTotals = cities.map(city => ({
      ...city,
      totalPosts: city.children.reduce((sum, child) => sum + child._count.posts, 0),
    }))

    // Calculate total posts across all cities
    const totalPosts = citiesWithTotals.reduce((sum, city) => sum + city.totalPosts, 0)

    // Calculate total posts for all states by summing posts from all property type children
    const statesTotalPosts = states.reduce(
      (sum, state) =>
        sum + state.children.reduce((childSum, child) => childSum + child._count.posts, 0),
      0
    )

    // Get count of states for the States & UTs entry
    const statesCount = states.length

    return {
      props: {
        cities: JSON.parse(JSON.stringify(citiesWithTotals)),
        totalPosts,
        statesCount,
        statesTotalPosts,
      },
      revalidate: 300, // Revalidate every 5 minutes
    }
  } catch (error) {
    // Return empty data if database is not available
    return {
      props: {
        cities: [],
        totalPosts: 0,
        statesCount: 0,
        statesTotalPosts: 0,
      },
      revalidate: 60, // Retry more frequently when database is unavailable
    }
  }
}
