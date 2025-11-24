import { GetStaticProps } from 'next'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ForumSearch from '@/components/forum/ForumSearch'
import { prisma } from '@/lib/cockroachDB/prisma'

interface State {
  id: string
  name: string
  slug: string
  description: string | null
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

interface StatesPageProps {
  states: State[]
  totalPosts: number
}


export default function StatesPage({ states, totalPosts }: StatesPageProps) {
  return (
    <div className="forum-container">
      <NextSeo
        title="States and Union Territories - Forum - Grihome"
        description="Browse real estate discussions across Indian states and union territories on Grihome community forum"
        canonical="https://grihome.vercel.app/forum/category/general-discussions/states"
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
            <span className="forum-breadcrumb-current">States & Union Territories</span>
          </div>
          <div className="forum-breadcrumb-search">
            <ForumSearch />
          </div>
        </div>

        <div className="forum-header">
          <div className="forum-header-content">
            <div className="forum-header-main">
              <div className="forum-header-text">
                <h1 className="forum-title">
                  <span>States & Union </span>
                  <span className="forum-title-gradient">Territories</span>
                </h1>
                <p className="forum-subtitle">
                  Explore real estate discussions across all Indian states and union territories.
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
            {states.map(state => (
              <Link
                key={state.id}
                href={`/forum/category/general-discussions/${state.slug}`}
                className="forum-city-list-item"
              >
                <div className="forum-city-list-content">
                  <div className="forum-city-list-info">
                    <div className="forum-city-details">
                      <h3 className="forum-city-name">{state.name}</h3>
                      <p className="forum-city-description">
                        {state.description || `${state.name} Real Estate Discussions`}
                      </p>
                    </div>
                  </div>

                  <div className="forum-city-list-stats">
                    <div className="forum-city-stat">
                      <span className="forum-stat-number">{state.totalPosts}</span>
                      <span className="forum-stat-label">threads</span>
                    </div>
                    <div className="forum-city-stat">
                      <span className="forum-stat-number">{state.children.length}</span>
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

    // Get all states (categories with city field = null)
    const states = await prisma.forumCategory.findMany({
      where: {
        isActive: true,
        parentId: generalDiscussions.id,
        city: null, // Only get states (city field is null for states)
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

    // Calculate total posts for each state by summing posts from all property type children
    const statesWithTotals = states.map(state => ({
      ...state,
      totalPosts: state.children.reduce((sum, child) => sum + child._count.posts, 0),
    }))

    // Calculate total posts across all states
    const totalPosts = statesWithTotals.reduce((sum, state) => sum + state.totalPosts, 0)

    return {
      props: {
        states: JSON.parse(JSON.stringify(statesWithTotals)),
        totalPosts,
      },
      revalidate: 300, // Revalidate every 5 minutes
    }
  } catch (error) {
    // Return empty data if database is not available
    return {
      props: {
        states: [],
        totalPosts: 0,
      },
      revalidate: 60, // Retry more frequently when database is unavailable
    }
  }
}
