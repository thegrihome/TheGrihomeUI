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
}

const cityIcons: { [key: string]: string } = {
  hyderabad: '🏛️',
  chennai: '🏖️',
  bengaluru: '🌆',
  mumbai: '🏙️',
  delhi: '🏛️',
  kolkata: '🌉',
  gurgaon: '🏢',
  noida: '🌇',
  pune: '🎓',
  'other-cities': '🗺️',
}

// States and Union Territories
const statesAndUTs = [
  { name: 'Andhra Pradesh', slug: 'andhra-pradesh', icon: '🌾' },
  { name: 'Arunachal Pradesh', slug: 'arunachal-pradesh', icon: '🏔️' },
  { name: 'Assam', slug: 'assam', icon: '🍵' },
  { name: 'Bihar', slug: 'bihar', icon: '📚' },
  { name: 'Chhattisgarh', slug: 'chhattisgarh', icon: '🌲' },
  { name: 'Goa', slug: 'goa', icon: '🏖️' },
  { name: 'Gujarat', slug: 'gujarat', icon: '🦁' },
  { name: 'Haryana', slug: 'haryana', icon: '🌾' },
  { name: 'Himachal Pradesh', slug: 'himachal-pradesh', icon: '⛰️' },
  { name: 'Jammu and Kashmir', slug: 'jammu-and-kashmir', icon: '🏔️' },
  { name: 'Jharkhand', slug: 'jharkhand', icon: '⛰️' },
  { name: 'Karnataka', slug: 'karnataka', icon: '🌳' },
  { name: 'Kerala', slug: 'kerala', icon: '🌴' },
  { name: 'Madhya Pradesh', slug: 'madhya-pradesh', icon: '🐅' },
  { name: 'Maharashtra', slug: 'maharashtra', icon: '🏙️' },
  { name: 'Manipur', slug: 'manipur', icon: '🏔️' },
  { name: 'Meghalaya', slug: 'meghalaya', icon: '☁️' },
  { name: 'Mizoram', slug: 'mizoram', icon: '🌄' },
  { name: 'Nagaland', slug: 'nagaland', icon: '⛰️' },
  { name: 'Odisha', slug: 'odisha', icon: '🏛️' },
  { name: 'Punjab', slug: 'punjab', icon: '🌾' },
  { name: 'Rajasthan', slug: 'rajasthan', icon: '🏜️' },
  { name: 'Sikkim', slug: 'sikkim', icon: '🏔️' },
  { name: 'Tamil Nadu', slug: 'tamil-nadu', icon: '🏛️' },
  { name: 'Telangana', slug: 'telangana', icon: '💎' },
  { name: 'Tripura', slug: 'tripura', icon: '🌳' },
  { name: 'Uttarakhand', slug: 'uttarakhand', icon: '⛰️' },
  { name: 'Uttar Pradesh', slug: 'uttar-pradesh', icon: '🕌' },
  { name: 'West Bengal', slug: 'west-bengal', icon: '🎭' },
  { name: 'Andaman and Nicobar Islands', slug: 'andaman-and-nicobar-islands', icon: '🏝️' },
  { name: 'Chandigarh', slug: 'chandigarh', icon: '🏙️' },
  { name: 'Dadra and Nagar Haveli', slug: 'dadra-and-nagar-haveli', icon: '🌳' },
  { name: 'Daman and Diu', slug: 'daman-and-diu', icon: '🏖️' },
  { name: 'Lakshadweep', slug: 'lakshadweep', icon: '🏝️' },
  { name: 'Puducherry', slug: 'puducherry', icon: '🌊' },
]

export default function GeneralDiscussionsPage({
  cities,
  totalPosts,
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
                        {city.description ||
                          (city.name === 'Other Cities'
                            ? 'Real Estate Discussions in cities, towns and villages across India ❤️'
                            : `${city.name} Real Estate Discussions`)}
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
          </div>

          {/* States and Union Territories Section */}
          <div style={{ marginTop: '3rem' }}>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: '1.5rem',
                color: '#1f2937',
              }}
            >
              States and Union Territories
            </h2>
            <div className="forum-cities-list">
              {statesAndUTs.map(state => (
                <Link
                  key={state.slug}
                  href={`/forum/category/general-discussions/${state.slug}`}
                  className="forum-city-list-item"
                >
                  <div className="forum-city-list-content">
                    <div className="forum-city-list-info">
                      <div className="forum-city-icon">{state.icon}</div>
                      <div className="forum-city-details">
                        <h3 className="forum-city-name">{state.name}</h3>
                        <p className="forum-city-description">
                          {state.name} Real Estate Discussions
                        </p>
                      </div>
                    </div>

                    <div className="forum-city-list-stats">
                      <div className="forum-city-arrow">→</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
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

  // Calculate total posts for each city by summing posts from all property type children
  const citiesWithTotals = cities.map(city => ({
    ...city,
    totalPosts: city.children.reduce((sum, child) => sum + child._count.posts, 0),
  }))

  // Calculate total posts across all cities
  const totalPosts = citiesWithTotals.reduce((sum, city) => sum + city.totalPosts, 0)

  return {
    props: {
      cities: JSON.parse(JSON.stringify(citiesWithTotals)),
      totalPosts,
    },
    revalidate: 300, // Revalidate every 5 minutes
  }
}
