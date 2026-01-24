import React, { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import { useRouter } from 'next/router'
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
    city: string | null
    isState: boolean
  }
  propertyTypes: PropertyType[]
  totalPosts: number
}

export default function CityPage({ city, propertyTypes, totalPosts }: CityPageProps) {
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)

  useEffect(() => {
    const handleStart = () => setIsNavigating(true)
    const handleComplete = () => setIsNavigating(false)

    router.events.on('routeChangeStart', handleStart)
    router.events.on('routeChangeComplete', handleComplete)
    router.events.on('routeChangeError', handleComplete)

    return () => {
      router.events.off('routeChangeStart', handleStart)
      router.events.off('routeChangeComplete', handleComplete)
      router.events.off('routeChangeError', handleComplete)
    }
  }, [router])

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
    const stateNames = [
      'Andhra',
      'Pradesh',
      'Arunachal',
      'Assam',
      'Bihar',
      'Chhattisgarh',
      'Goa',
      'Gujarat',
      'Haryana',
      'Himachal',
      'Jammu',
      'Kashmir',
      'Jharkhand',
      'Karnataka',
      'Kerala',
      'Madhya',
      'Maharashtra',
      'Manipur',
      'Meghalaya',
      'Mizoram',
      'Nagaland',
      'Odisha',
      'Punjab',
      'Rajasthan',
      'Sikkim',
      'Tamil',
      'Nadu',
      'Telangana',
      'Tripura',
      'Uttarakhand',
      'Uttar',
      'Bengal',
      'Andaman',
      'Nicobar',
      'Islands',
      'Chandigarh',
      'Dadra',
      'Nagar',
      'Haveli',
      'Daman',
      'Diu',
      'Lakshadweep',
      'Puducherry',
      'West',
    ]

    const words = title.split(' ')

    return words
      .map((word, index) => {
        const isGradientWord = gradientWords.some(gw => word.includes(gw))
        const isCityName = cityNames.some(city => word.includes(city))
        const isStateName = stateNames.some(state => word.includes(state))

        // For city/state pages: city names and state names should be gradient
        if (isCityName || isStateName) {
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
      {isNavigating && (
        <div className="forum-loading-overlay">
          <div className="forum-loading-spinner"></div>
        </div>
      )}
      <NextSeo
        title={`${city.name} - General Discussions - Forum - Zillfin`}
        description={`Real estate discussions and property insights for ${city.name} on Zillfin community forum`}
        canonical={`https://grihome.vercel.app/forum/category/general-discussions/${city.city || city.slug}`}
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
            {city.isState && (
              <>
                <Link
                  href="/forum/category/general-discussions/states"
                  className="forum-breadcrumb-link"
                >
                  States & Union Territories
                </Link>
                <span className="forum-breadcrumb-separator">›</span>
              </>
            )}
            <span className="forum-breadcrumb-current">{city.name}</span>
          </div>
          <div className="forum-breadcrumb-search">
            <ForumSearch city={city.city || undefined} />
          </div>
        </div>

        <div className="forum-header">
          <div className="forum-header-content">
            <div className="forum-city-header-section">
              <div>
                <h1 className="forum-title">
                  {formatTitle(`${city.name} Real Estate Discussions`)}
                </h1>
                <div className="forum-stats-summary">
                  <span className="forum-stat">{totalPosts} discussions</span>
                  <span className="forum-stat-separator">•</span>
                  <span className="forum-stat">{propertyTypes.length} property categories</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="forum-content">
          <div className="forum-property-types-list">
            {propertyTypes.map(propertyType => {
              const locationSlug = city.city || city.slug
              const propertyTypeSlug = propertyType.slug.replace(`${locationSlug}-`, '')
              return (
                <Link
                  key={propertyType.id}
                  href={`/forum/category/general-discussions/${locationSlug}/${propertyTypeSlug}`}
                  className="forum-property-type-list-item"
                  title={`${propertyType.name} discussions in ${city.name}`}
                >
                  <div className="forum-simple-row">
                    <div className="forum-simple-left">
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
              )
            })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const { city: citySlug } = params!

  // Try to find as a city first (has city field populated)
  let location = await prisma.forumCategory.findFirst({
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

  // If not found as city, try as state (has city field as null, matches by slug)
  if (!location) {
    location = await prisma.forumCategory.findFirst({
      where: {
        slug: citySlug as string,
        city: null,
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
  }

  if (!location) {
    return {
      notFound: true,
    }
  }

  // Get property type subcategories
  const propertyTypes = await prisma.forumCategory.findMany({
    where: {
      isActive: true,
      parentId: location.id,
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

  // Determine if this is a state (city field is null)
  const isState = location.city === null

  return {
    props: {
      city: { ...JSON.parse(JSON.stringify(location)), isState },
      propertyTypes: JSON.parse(JSON.stringify(propertyTypes)),
      totalPosts,
    },
  }
}
