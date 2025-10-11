import React from 'react'
import { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ForumSearch from '@/components/forum/ForumSearch'
import { prisma } from '@/lib/cockroachDB/prisma'

interface PropertyType {
  id: string
  name: string
  slug: string
  description: string | null
  propertyType: string | null
  _count: {
    posts: number
  }
}

interface CityPageProps {
  city: {
    id: string
    name: string
    slug: string
    description: string | null
    city: string
  }
  propertyTypes: PropertyType[]
  totalPosts: number
}

const propertyTypeIcons: { [key: string]: string } = {
  VILLAS: '🏡',
  APARTMENTS: '🏢',
  RESIDENTIAL_LANDS: '🏞️',
  AGRICULTURE_LANDS: '🌾',
  COMMERCIAL_PROPERTIES: '🏬',
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

export default function CityPage({ city, propertyTypes, totalPosts }: CityPageProps) {
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

        // For city pages: only city names should be gradient
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
        title={`${city.name} - General Discussions - Forum - Grihome`}
        description={`Real estate discussions and property insights for ${city.name} on Grihome community forum`}
        canonical={`https://grihome.vercel.app/forum/category/general-discussions/${city.city}`}
      />

      <Header />

      <main className="forum-main">
        <div className="forum-breadcrumb-container">
          <div className="forum-breadcrumb">
            <Link href="/forum" className="forum-breadcrumb-link">
              Forum
            </Link>
            <span className="forum-breadcrumb-separator">›</span>
            <Link href="/forum/category/general-discussions" className="forum-breadcrumb-link">
              General Discussions
            </Link>
            <span className="forum-breadcrumb-separator">›</span>
            <span className="forum-breadcrumb-current">{city.name}</span>
          </div>
          <div className="forum-breadcrumb-search">
            <ForumSearch />
          </div>
        </div>

        <div className="forum-header">
          <div className="forum-header-content">
            <div className="forum-city-header-section">
              <div className="forum-city-icon-large">{cityIcons[city.city] || '🏛️'}</div>
              <div>
                <h1 className="forum-title">
                  {formatTitle(`${city.name} Real Estate Discussions`)}
                </h1>
                <div className="forum-stats-summary">
                  <span className="forum-stat">{totalPosts} discussions</span>
                  <span className="forum-stat">{propertyTypes.length} property categories</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="forum-content">
          <div className="forum-property-types-list">
            {propertyTypes.map(propertyType => (
              <Link
                key={propertyType.id}
                href={`/forum/category/general-discussions/${city.city}/${propertyType.slug.replace(`${city.city}-`, '')}`}
                className="forum-property-type-list-item"
                title={`${propertyType.name} discussions in ${city.name}`}
              >
                <div className="forum-simple-row">
                  <div className="forum-simple-left">
                    <div className="forum-property-type-icon">
                      {propertyTypeIcons[propertyType.propertyType || ''] || '🏠'}
                    </div>
                    <div>
                      <h3 className="forum-property-type-name">
                        {propertyType.name.split(' in ')[0]}
                      </h3>
                      <div className="forum-simple-stats">
                        {propertyType._count.posts} discussions
                      </div>
                    </div>
                  </div>
                  <div className="forum-simple-arrow">→</div>
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

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const { city: citySlug } = params!

  // Find the city category
  const city = await prisma.forumCategory.findFirst({
    where: {
      city: citySlug as string,
      parent: {
        slug: 'general-discussions',
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      city: true,
    },
  })

  if (!city) {
    return {
      notFound: true,
    }
  }

  // Get property type subcategories
  const propertyTypes = await prisma.forumCategory.findMany({
    where: {
      isActive: true,
      parentId: city.id,
    },
    include: {
      _count: {
        select: { posts: true },
      },
    },
    orderBy: { displayOrder: 'asc' },
  })

  // Calculate total posts across all property types
  const totalPosts = propertyTypes.reduce((sum, type) => sum + type._count.posts, 0)

  return {
    props: {
      city: JSON.parse(JSON.stringify(city)),
      propertyTypes: JSON.parse(JSON.stringify(propertyTypes)),
      totalPosts,
    },
  }
}
