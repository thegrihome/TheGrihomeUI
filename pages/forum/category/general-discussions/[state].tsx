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

interface StatePageProps {
  state: {
    id: string
    name: string
    slug: string
    description: string | null
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

const stateIcons: { [key: string]: string } = {
  'andhra-pradesh': '🏛️',
  'arunachal-pradesh': '⛰️',
  assam: '🌿',
  bihar: '🏛️',
  chhattisgarh: '🌲',
  goa: '🏖️',
  gujarat: '🦁',
  haryana: '🌾',
  'himachal-pradesh': '🏔️',
  'jammu-and-kashmir': '🏔️',
  jharkhand: '⛰️',
  karnataka: '🌆',
  kerala: '🥥',
  'madhya-pradesh': '🐅',
  maharashtra: '🏙️',
  manipur: '🦌',
  meghalaya: '☔',
  mizoram: '🌺',
  nagaland: '🎭',
  odisha: '🏛️',
  punjab: '🌾',
  rajasthan: '🐪',
  sikkim: '🏔️',
  'tamil-nadu': '🏛️',
  telangana: '🏛️',
  tripura: '🌺',
  uttarakhand: '⛰️',
  'uttar-pradesh': '🕌',
  'west-bengal': '🌉',
  'andaman-and-nicobar-islands': '🏝️',
  chandigarh: '🏛️',
  'dadra-and-nagar-haveli': '🌳',
  'daman-and-diu': '🏖️',
  lakshadweep: '🏝️',
  puducherry: '🏖️',
}

export default function StatePage({ state, propertyTypes, totalPosts }: StatePageProps) {
  // Smart title formatter
  const formatTitle = (title: string) => {
    const gradientWords = ['Forum', 'Introductions', 'News', 'Deals']
    const words = title.split(' ')

    return words
      .map((word, index) => {
        const isGradientWord = gradientWords.some(gw => word.includes(gw))
        const isStateName = state.name.split(' ').some(statePart => word.includes(statePart))

        if (isStateName) {
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
        title={`${state.name} - General Discussions - Forum - Grihome`}
        description={`Real estate discussions and property insights for ${state.name} on Grihome community forum`}
        canonical={`https://grihome.vercel.app/forum/category/general-discussions/${state.slug}`}
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
            <span className="forum-breadcrumb-current">{state.name}</span>
          </div>
          <div className="forum-breadcrumb-search">
            <ForumSearch />
          </div>
        </div>

        <div className="forum-header">
          <div className="forum-header-content">
            <div className="forum-city-header-section">
              <div className="forum-city-icon-large">{stateIcons[state.slug] || '🏛️'}</div>
              <div>
                <h1 className="forum-title">
                  {formatTitle(`${state.name} Real Estate Discussions`)}
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
                href={`/forum/category/general-discussions/${state.slug}/${propertyType.slug.replace(`${state.slug}-`, '')}`}
                className="forum-property-type-list-item"
                title={`${propertyType.name} discussions in ${state.name}`}
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
  const { state: stateSlug } = params!

  // Check if it's a city (has city field populated)
  const cityCheck = await prisma.forumCategory.findFirst({
    where: {
      city: stateSlug as string,
      parent: {
        slug: 'general-discussions',
      },
    },
  })

  // If it's a city, redirect to the city page
  if (cityCheck) {
    return {
      redirect: {
        destination: `/forum/category/general-discussions/${stateSlug}`,
        permanent: false,
      },
    }
  }

  // Find the state category (has city field as null)
  const state = await prisma.forumCategory.findFirst({
    where: {
      slug: stateSlug as string,
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
    },
  })

  if (!state) {
    return {
      notFound: true,
    }
  }

  // Get property type subcategories
  const propertyTypes = await prisma.forumCategory.findMany({
    where: {
      isActive: true,
      parentId: state.id,
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
      state: JSON.parse(JSON.stringify(state)),
      propertyTypes: JSON.parse(JSON.stringify(propertyTypes)),
      totalPosts,
    },
  }
}
