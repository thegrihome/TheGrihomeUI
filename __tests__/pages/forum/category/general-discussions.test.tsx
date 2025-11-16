import React from 'react'
import { render, screen } from '@testing-library/react'
import GeneralDiscussionsPage from '@/pages/forum/category/general-discussions'

jest.mock('@/components/Header', () => {
  return function Header() {
    return <div data-testid="header">Header</div>
  }
})

jest.mock('@/components/Footer', () => {
  return function Footer() {
    return <div data-testid="footer">Footer</div>
  }
})

jest.mock('@/components/forum/ForumSearch', () => {
  return function ForumSearch() {
    return <div data-testid="forum-search">Forum Search</div>
  }
})

jest.mock('next-seo', () => ({
  NextSeo: ({ title, description, canonical }: any) => (
    <div
      data-testid="next-seo"
      data-title={title}
      data-description={description}
      data-canonical={canonical}
    />
  ),
}))

describe('General Discussions Page - Comprehensive Tests', () => {
  const mockCities = [
    {
      id: 'city1',
      name: 'Hyderabad',
      slug: 'hyderabad',
      description: 'Hyderabad Real Estate Discussions',
      city: 'hyderabad',
      _count: { posts: 50 },
      totalPosts: 150,
      children: [
        { id: 'cat1', name: 'Apartments', slug: 'hyderabad-apartments', _count: { posts: 80 } },
        { id: 'cat2', name: 'Villas', slug: 'hyderabad-villas', _count: { posts: 70 } },
      ],
    },
    {
      id: 'city2',
      name: 'Chennai',
      slug: 'chennai',
      description: 'Chennai Real Estate Discussions',
      city: 'chennai',
      _count: { posts: 30 },
      totalPosts: 100,
      children: [
        { id: 'cat3', name: 'Apartments', slug: 'chennai-apartments', _count: { posts: 60 } },
        { id: 'cat4', name: 'Villas', slug: 'chennai-villas', _count: { posts: 40 } },
      ],
    },
    {
      id: 'city3',
      name: 'Bengaluru',
      slug: 'bengaluru',
      description: null,
      city: 'bengaluru',
      _count: { posts: 20 },
      totalPosts: 80,
      children: [],
    },
  ]

  describe('Rendering and Initial State', () => {
    it('should render general discussions page with all components', () => {
      render(
        <GeneralDiscussionsPage
          cities={mockCities}
          totalPosts={330}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      expect(screen.getByTestId('header')).toBeInTheDocument()
      expect(screen.getByTestId('footer')).toBeInTheDocument()
      expect(screen.getByTestId('forum-search')).toBeInTheDocument()
    })

    it('should render page title', () => {
      render(
        <GeneralDiscussionsPage
          cities={mockCities}
          totalPosts={330}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      expect(screen.getByText(/General Discussions/)).toBeInTheDocument()
    })

    it('should render page subtitle', () => {
      render(
        <GeneralDiscussionsPage
          cities={mockCities}
          totalPosts={330}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      expect(
        screen.getByText(/Explore real estate discussions across major Indian cities/)
      ).toBeInTheDocument()
    })

    it('should render total thread count', () => {
      render(
        <GeneralDiscussionsPage
          cities={mockCities}
          totalPosts={330}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      expect(screen.getByText('330 threads')).toBeInTheDocument()
    })

    it('should render singular thread for count of 1', () => {
      render(
        <GeneralDiscussionsPage
          cities={mockCities}
          totalPosts={1}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      expect(screen.getByText('1 thread')).toBeInTheDocument()
    })

    it('should render category icon', () => {
      render(
        <GeneralDiscussionsPage
          cities={mockCities}
          totalPosts={330}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      const icon = screen.getByText('💬')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('City List Rendering', () => {
    it('should render all cities except other-cities', () => {
      render(
        <GeneralDiscussionsPage
          cities={mockCities}
          totalPosts={330}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      expect(screen.getByText('Hyderabad')).toBeInTheDocument()
      expect(screen.getByText('Chennai')).toBeInTheDocument()
      expect(screen.getByText('Bengaluru')).toBeInTheDocument()
    })

    it('should render city descriptions', () => {
      render(
        <GeneralDiscussionsPage
          cities={mockCities}
          totalPosts={330}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      expect(screen.getByText('Hyderabad Real Estate Discussions')).toBeInTheDocument()
      expect(screen.getByText('Chennai Real Estate Discussions')).toBeInTheDocument()
    })

    it('should render default description when null', () => {
      render(
        <GeneralDiscussionsPage
          cities={mockCities}
          totalPosts={330}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      expect(screen.getByText('Bengaluru Real Estate Discussions')).toBeInTheDocument()
    })

    it('should render city stats', () => {
      render(
        <GeneralDiscussionsPage
          cities={mockCities}
          totalPosts={330}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      expect(screen.getByText('150')).toBeInTheDocument()
      expect(screen.getByText('100')).toBeInTheDocument()
      expect(screen.getByText('80')).toBeInTheDocument()
    })

    it('should render category count for each city', () => {
      render(
        <GeneralDiscussionsPage
          cities={mockCities}
          totalPosts={330}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      const categoryLabels = screen.getAllByText('categories')
      expect(categoryLabels.length).toBeGreaterThan(0)
    })

    it('should link to city pages correctly', () => {
      const { container } = render(
        <GeneralDiscussionsPage
          cities={mockCities}
          totalPosts={330}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      const hydLink = container.querySelector(
        'a[href="/forum/category/general-discussions/hyderabad"]'
      )
      expect(hydLink).toBeInTheDocument()

      const chenLink = container.querySelector(
        'a[href="/forum/category/general-discussions/chennai"]'
      )
      expect(chenLink).toBeInTheDocument()
    })

    it('should filter out other-cities from display', () => {
      const citiesWithOther = [
        ...mockCities,
        {
          id: 'city4',
          name: 'Other Cities',
          slug: 'other-cities',
          description: null,
          city: 'other-cities',
          _count: { posts: 10 },
          totalPosts: 10,
          children: [],
        },
      ]

      render(
        <GeneralDiscussionsPage
          cities={citiesWithOther}
          totalPosts={340}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      expect(screen.queryByText('Other Cities')).not.toBeInTheDocument()
    })
  })

  describe('City Icons', () => {
    it('should render icon for Hyderabad', () => {
      render(
        <GeneralDiscussionsPage
          cities={mockCities}
          totalPosts={330}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      const icons = screen.getAllByText('🏛️')
      expect(icons.length).toBeGreaterThan(0)
    })

    it('should render icon for Chennai', () => {
      render(
        <GeneralDiscussionsPage
          cities={mockCities}
          totalPosts={330}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      const icons = screen.getAllByText('🏖️')
      expect(icons.length).toBeGreaterThan(0)
    })

    it('should render icon for Bengaluru', () => {
      render(
        <GeneralDiscussionsPage
          cities={mockCities}
          totalPosts={330}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      const icons = screen.getAllByText('🌆')
      expect(icons.length).toBeGreaterThan(0)
    })

    it('should render default icon for unknown city', () => {
      const unknownCity = [
        {
          ...mockCities[0],
          city: 'unknown-city',
        },
      ]

      const { container } = render(
        <GeneralDiscussionsPage
          cities={unknownCity}
          totalPosts={150}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      expect(container.querySelector('.forum-city-icon')).toBeInTheDocument()
    })
  })

  describe('States and Union Territories Link', () => {
    it('should render States & UTs link when states exist', () => {
      render(
        <GeneralDiscussionsPage
          cities={mockCities}
          totalPosts={330}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      expect(screen.getByText('States & Union Territories')).toBeInTheDocument()
    })

    it('should not render States & UTs link when no states', () => {
      render(
        <GeneralDiscussionsPage
          cities={mockCities}
          totalPosts={330}
          statesCount={0}
          statesTotalPosts={0}
        />
      )

      expect(screen.queryByText('States & Union Territories')).not.toBeInTheDocument()
    })

    it('should render states description', () => {
      render(
        <GeneralDiscussionsPage
          cities={mockCities}
          totalPosts={330}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      expect(
        screen.getByText(/Real estate discussions across all Indian states/)
      ).toBeInTheDocument()
    })

    it('should render states thread count', () => {
      render(
        <GeneralDiscussionsPage
          cities={mockCities}
          totalPosts={330}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      expect(screen.getByText('100')).toBeInTheDocument()
    })

    it('should render states count', () => {
      render(
        <GeneralDiscussionsPage
          cities={mockCities}
          totalPosts={330}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('states/UTs')).toBeInTheDocument()
    })

    it('should link to states page', () => {
      const { container } = render(
        <GeneralDiscussionsPage
          cities={mockCities}
          totalPosts={330}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      const statesLink = container.querySelector(
        'a[href="/forum/category/general-discussions/states"]'
      )
      expect(statesLink).toBeInTheDocument()
    })

    it('should render India flag icon for states', () => {
      render(
        <GeneralDiscussionsPage
          cities={mockCities}
          totalPosts={330}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      const icon = screen.getByText('🇮🇳')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('Breadcrumb Navigation', () => {
    it('should render forum breadcrumb link', () => {
      const { container } = render(
        <GeneralDiscussionsPage
          cities={mockCities}
          totalPosts={330}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      const forumLink = container.querySelector('a[href="/forum"]')
      expect(forumLink).toBeInTheDocument()
    })

    it('should render current page in breadcrumb', () => {
      const { container } = render(
        <GeneralDiscussionsPage
          cities={mockCities}
          totalPosts={330}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      const current = container.querySelector('.forum-breadcrumb-current')
      expect(current).toHaveTextContent('General Discussions')
    })

    it('should render breadcrumb separators', () => {
      render(
        <GeneralDiscussionsPage
          cities={mockCities}
          totalPosts={330}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      const separators = screen.getAllByText('›')
      expect(separators.length).toBeGreaterThan(0)
    })
  })

  describe('SEO', () => {
    it('should render NextSeo with correct title', () => {
      render(
        <GeneralDiscussionsPage
          cities={mockCities}
          totalPosts={330}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      const seo = screen.getByTestId('next-seo')
      expect(seo).toHaveAttribute('data-title', 'General Discussions - Forum - Grihome')
    })

    it('should render NextSeo with correct description', () => {
      render(
        <GeneralDiscussionsPage
          cities={mockCities}
          totalPosts={330}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      const seo = screen.getByTestId('next-seo')
      expect(seo).toHaveAttribute(
        'data-description',
        'Browse real estate discussions by city across India on Grihome community forum'
      )
    })

    it('should render NextSeo with correct canonical URL', () => {
      render(
        <GeneralDiscussionsPage
          cities={mockCities}
          totalPosts={330}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      const seo = screen.getByTestId('next-seo')
      expect(seo).toHaveAttribute(
        'data-canonical',
        'https://grihome.vercel.app/forum/category/general-discussions'
      )
    })
  })

  describe('CSS Classes', () => {
    it('should have correct container classes', () => {
      const { container } = render(
        <GeneralDiscussionsPage
          cities={mockCities}
          totalPosts={330}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      expect(container.querySelector('.forum-container')).toBeInTheDocument()
      expect(container.querySelector('.forum-main')).toBeInTheDocument()
      expect(container.querySelector('.forum-content')).toBeInTheDocument()
    })

    it('should have correct city list classes', () => {
      const { container } = render(
        <GeneralDiscussionsPage
          cities={mockCities}
          totalPosts={330}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      expect(container.querySelector('.forum-cities-list')).toBeInTheDocument()
      expect(container.querySelector('.forum-city-list-item')).toBeInTheDocument()
      expect(container.querySelector('.forum-city-list-content')).toBeInTheDocument()
    })

    it('should have correct header classes', () => {
      const { container } = render(
        <GeneralDiscussionsPage
          cities={mockCities}
          totalPosts={330}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      expect(container.querySelector('.forum-header')).toBeInTheDocument()
      expect(container.querySelector('.forum-header-content')).toBeInTheDocument()
      expect(container.querySelector('.forum-title')).toBeInTheDocument()
    })

    it('should have correct stats classes', () => {
      const { container } = render(
        <GeneralDiscussionsPage
          cities={mockCities}
          totalPosts={330}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      expect(container.querySelector('.forum-city-list-stats')).toBeInTheDocument()
      expect(container.querySelector('.forum-city-stat')).toBeInTheDocument()
    })
  })

  describe('Title Formatting', () => {
    it('should apply gradient to Discussions word', () => {
      const { container } = render(
        <GeneralDiscussionsPage
          cities={mockCities}
          totalPosts={330}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      const gradientSpans = container.querySelectorAll('.forum-title-gradient')
      expect(gradientSpans.length).toBeGreaterThan(0)
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(
        <GeneralDiscussionsPage
          cities={mockCities}
          totalPosts={330}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      const h1 = screen.getByRole('heading', { level: 1 })
      expect(h1).toBeInTheDocument()
    })

    it('should have accessible links', () => {
      const { container } = render(
        <GeneralDiscussionsPage
          cities={mockCities}
          totalPosts={330}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      const links = container.querySelectorAll('a')
      links.forEach(link => {
        expect(link).toHaveAttribute('href')
      })
    })

    it('should have main landmark', () => {
      const { container } = render(
        <GeneralDiscussionsPage
          cities={mockCities}
          totalPosts={330}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      const main = container.querySelector('main')
      expect(main).toBeInTheDocument()
    })
  })

  describe('Stats Display', () => {
    it('should display thread counts for each city', () => {
      render(
        <GeneralDiscussionsPage
          cities={mockCities}
          totalPosts={330}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      const threadLabels = screen.getAllByText('threads')
      expect(threadLabels.length).toBeGreaterThan(0)
    })

    it('should display category counts for each city', () => {
      render(
        <GeneralDiscussionsPage
          cities={mockCities}
          totalPosts={330}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('should display arrow icons', () => {
      render(
        <GeneralDiscussionsPage
          cities={mockCities}
          totalPosts={330}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      const arrows = screen.getAllByText('→')
      expect(arrows.length).toBeGreaterThan(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty cities array', () => {
      const { container } = render(
        <GeneralDiscussionsPage cities={[]} totalPosts={0} statesCount={5} statesTotalPosts={100} />
      )

      expect(container.querySelector('.forum-cities-list')).toBeInTheDocument()
    })

    it('should handle cities with zero posts', () => {
      const zeroPostCity = [
        {
          ...mockCities[0],
          totalPosts: 0,
        },
      ]

      render(
        <GeneralDiscussionsPage
          cities={zeroPostCity}
          totalPosts={0}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('should handle cities with no children', () => {
      const noChildrenCity = [
        {
          ...mockCities[2],
        },
      ]

      render(
        <GeneralDiscussionsPage
          cities={noChildrenCity}
          totalPosts={80}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      expect(screen.getByText('Bengaluru')).toBeInTheDocument()
      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('should handle zero states count', () => {
      render(
        <GeneralDiscussionsPage
          cities={mockCities}
          totalPosts={330}
          statesCount={0}
          statesTotalPosts={0}
        />
      )

      expect(screen.queryByText('States & Union Territories')).not.toBeInTheDocument()
    })

    it('should handle very large thread counts', () => {
      render(
        <GeneralDiscussionsPage
          cities={mockCities}
          totalPosts={999999}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      expect(screen.getByText('999999 threads')).toBeInTheDocument()
    })
  })

  describe('Layout Structure', () => {
    it('should have breadcrumb container', () => {
      const { container } = render(
        <GeneralDiscussionsPage
          cities={mockCities}
          totalPosts={330}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      expect(container.querySelector('.forum-breadcrumb-container')).toBeInTheDocument()
    })

    it('should have search in breadcrumb area', () => {
      const { container } = render(
        <GeneralDiscussionsPage
          cities={mockCities}
          totalPosts={330}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      expect(container.querySelector('.forum-breadcrumb-search')).toBeInTheDocument()
    })

    it('should render header stats section', () => {
      const { container } = render(
        <GeneralDiscussionsPage
          cities={mockCities}
          totalPosts={330}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      expect(container.querySelector('.forum-header-stats')).toBeInTheDocument()
      expect(container.querySelector('.forum-thread-count')).toBeInTheDocument()
    })
  })

  describe('City Details', () => {
    it('should render city info section', () => {
      const { container } = render(
        <GeneralDiscussionsPage
          cities={mockCities}
          totalPosts={330}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      expect(container.querySelector('.forum-city-list-info')).toBeInTheDocument()
      expect(container.querySelector('.forum-city-details')).toBeInTheDocument()
    })

    it('should render city names', () => {
      const { container } = render(
        <GeneralDiscussionsPage
          cities={mockCities}
          totalPosts={330}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      const cityNames = container.querySelectorAll('.forum-city-name')
      expect(cityNames.length).toBe(mockCities.length + 1) // +1 for states entry
    })

    it('should render city descriptions', () => {
      const { container } = render(
        <GeneralDiscussionsPage
          cities={mockCities}
          totalPosts={330}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      const descriptions = container.querySelectorAll('.forum-city-description')
      expect(descriptions.length).toBeGreaterThan(0)
    })
  })

  describe('All Cities Display', () => {
    it('should render Mumbai icon', () => {
      const citiesWithMumbai = [
        ...mockCities,
        {
          id: 'city4',
          name: 'Mumbai',
          slug: 'mumbai',
          description: null,
          city: 'mumbai',
          _count: { posts: 10 },
          totalPosts: 20,
          children: [],
        },
      ]

      render(
        <GeneralDiscussionsPage
          cities={citiesWithMumbai}
          totalPosts={350}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      const icons = screen.getAllByText('🏙️')
      expect(icons.length).toBeGreaterThan(0)
    })

    it('should render Delhi icon', () => {
      const citiesWithDelhi = [
        ...mockCities,
        {
          id: 'city5',
          name: 'Delhi',
          slug: 'delhi',
          description: null,
          city: 'delhi',
          _count: { posts: 10 },
          totalPosts: 20,
          children: [],
        },
      ]

      render(
        <GeneralDiscussionsPage
          cities={citiesWithDelhi}
          totalPosts={350}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      const icons = screen.getAllByText('🏛️')
      expect(icons.length).toBeGreaterThan(0)
    })

    it('should render Kolkata icon', () => {
      const citiesWithKolkata = [
        ...mockCities,
        {
          id: 'city6',
          name: 'Kolkata',
          slug: 'kolkata',
          description: null,
          city: 'kolkata',
          _count: { posts: 10 },
          totalPosts: 20,
          children: [],
        },
      ]

      render(
        <GeneralDiscussionsPage
          cities={citiesWithKolkata}
          totalPosts={350}
          statesCount={5}
          statesTotalPosts={100}
        />
      )

      const icons = screen.getAllByText('🌉')
      expect(icons.length).toBeGreaterThan(0)
    })
  })
})
