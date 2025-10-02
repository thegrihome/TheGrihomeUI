import React from 'react'
import { GetStaticProps } from 'next'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ForumSearch from '@/components/forum/ForumSearch'
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

const cityIcons: { [key: string]: string } = {
  hyderabad: '🏛️',
  chennai: '🏖️',
  bengaluru: '🌆',
  mumbai: '🏙️',
  delhi: '🏛️',
  kolkata: '🌉',
}

const categoryIcons: { [key: string]: string } = {
  'member-introductions': '👋',
  'latest-news': '📰',
  'grihome-latest-deals': '💰',
  'general-discussions': '💬',
}

const propertyTypeIcons: { [key: string]: string } = {
  VILLAS: '🏡',
  APARTMENTS: '🏢',
  RESIDENTIAL_LANDS: '🏞️',
  AGRICULTURE_LANDS: '🌾',
  COMMERCIAL_PROPERTIES: '🏬',
}

export default function Forum({ categories }: ForumProps) {
  // Smart title formatter - determines which words should be gradient
  const formatTitle = (title: string) => {
    const gradientWords = ['Forum', 'Introductions', 'News', 'Deals'] // Removed 'Discussions'
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
        title="Forum - Grihome"
        description="Join the Grihome community forum to discuss real estate, share experiences, and connect with fellow property enthusiasts."
        canonical="https://grihome.vercel.app/forum"
      />

      <Header />

      <main className="forum-main">
        <div className="forum-breadcrumb-container">
          <div></div>
          <div className="forum-breadcrumb-search">
            <ForumSearch />
          </div>
        </div>

        <div className="forum-header">
          <div className="forum-header-content">
            <div className="forum-header-main">
              <div className="forum-header-text">
                <h1 className="forum-title">{formatTitle('Grihome Community Forum')}</h1>
                <p className="forum-subtitle">
                  Connect with fellow property enthusiasts, share experiences, and get insights
                  about real estate across India.
                </p>
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
                      {category.city
                        ? cityIcons[category.city.toLowerCase()] || '🏛️'
                        : categoryIcons[category.slug] || '📂'}
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
