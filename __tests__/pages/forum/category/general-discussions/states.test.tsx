import React from 'react'
import { render, screen } from '@testing-library/react'
import StatesPage from '@/pages/forum/category/general-discussions/states'

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
    <div data-testid="next-seo" data-title={title} data-description={description} data-canonical={canonical} />
  ),
}))

describe('States Page - Comprehensive Tests', () => {
  const mockStates = [
    {
      id: 'state1',
      name: 'Andhra Pradesh',
      slug: 'andhra-pradesh',
      description: 'Andhra Pradesh Real Estate Discussions',
      _count: { posts: 20 },
      totalPosts: 80,
      children: [
        { id: 'cat1', name: 'Apartments', slug: 'andhra-pradesh-apartments', _count: { posts: 40 } },
        { id: 'cat2', name: 'Villas', slug: 'andhra-pradesh-villas', _count: { posts: 40 } },
      ],
    },
    {
      id: 'state2',
      name: 'Karnataka',
      slug: 'karnataka',
      description: null,
      _count: { posts: 30 },
      totalPosts: 100,
      children: [
        { id: 'cat3', name: 'Apartments', slug: 'karnataka-apartments', _count: { posts: 60 } },
        { id: 'cat4', name: 'Villas', slug: 'karnataka-villas', _count: { posts: 40 } },
      ],
    },
    {
      id: 'state3',
      name: 'Tamil Nadu',
      slug: 'tamil-nadu',
      description: 'Tamil Nadu Real Estate Discussions',
      _count: { posts: 15 },
      totalPosts: 60,
      children: [],
    },
  ]

  describe('Rendering and Initial State', () => {
    it('should render states page with all components', () => {
      render(<StatesPage states={mockStates} totalPosts={240} />)

      expect(screen.getByTestId('header')).toBeInTheDocument()
      expect(screen.getByTestId('footer')).toBeInTheDocument()
      expect(screen.getByTestId('forum-search')).toBeInTheDocument()
    })

    it('should render page title', () => {
      render(<StatesPage states={mockStates} totalPosts={240} />)

      expect(screen.getByText(/States & Union/)).toBeInTheDocument()
      expect(screen.getByText(/Territories/)).toBeInTheDocument()
    })

    it('should render page subtitle', () => {
      render(<StatesPage states={mockStates} totalPosts={240} />)

      expect(screen.getByText(/Explore real estate discussions across all Indian states/)).toBeInTheDocument()
    })

    it('should render total thread count', () => {
      render(<StatesPage states={mockStates} totalPosts={240} />)

      expect(screen.getByText('240 threads')).toBeInTheDocument()
    })

    it('should render singular thread for count of 1', () => {
      render(<StatesPage states={mockStates} totalPosts={1} />)

      expect(screen.getByText('1 thread')).toBeInTheDocument()
    })

    it('should render India flag icon', () => {
      render(<StatesPage states={mockStates} totalPosts={240} />)

      const icon = screen.getByText('🇮🇳')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('State List Rendering', () => {
    it('should render all states', () => {
      render(<StatesPage states={mockStates} totalPosts={240} />)

      expect(screen.getByText('Andhra Pradesh')).toBeInTheDocument()
      expect(screen.getByText('Karnataka')).toBeInTheDocument()
      expect(screen.getByText('Tamil Nadu')).toBeInTheDocument()
    })

    it('should render state descriptions', () => {
      render(<StatesPage states={mockStates} totalPosts={240} />)

      expect(screen.getByText('Andhra Pradesh Real Estate Discussions')).toBeInTheDocument()
      expect(screen.getByText('Tamil Nadu Real Estate Discussions')).toBeInTheDocument()
    })

    it('should render default description when null', () => {
      render(<StatesPage states={mockStates} totalPosts={240} />)

      expect(screen.getByText('Karnataka Real Estate Discussions')).toBeInTheDocument()
    })

    it('should render state total posts', () => {
      render(<StatesPage states={mockStates} totalPosts={240} />)

      expect(screen.getByText('80')).toBeInTheDocument()
      expect(screen.getByText('100')).toBeInTheDocument()
      expect(screen.getByText('60')).toBeInTheDocument()
    })

    it('should render category count for each state', () => {
      render(<StatesPage states={mockStates} totalPosts={240} />)

      const categoryLabels = screen.getAllByText('categories')
      expect(categoryLabels.length).toBeGreaterThan(0)
    })

    it('should link to state pages correctly', () => {
      const { container } = render(<StatesPage states={mockStates} totalPosts={240} />)

      const apLink = container.querySelector('a[href="/forum/category/general-discussions/andhra-pradesh"]')
      expect(apLink).toBeInTheDocument()

      const karLink = container.querySelector('a[href="/forum/category/general-discussions/karnataka"]')
      expect(karLink).toBeInTheDocument()
    })
  })

  describe('State Icons', () => {
    it('should render icon for Andhra Pradesh', () => {
      const { container } = render(<StatesPage states={mockStates} totalPosts={240} />)

      const icons = container.querySelectorAll('.forum-city-icon')
      expect(icons.length).toBe(mockStates.length)
    })

    it('should render icon for Karnataka', () => {
      render(<StatesPage states={mockStates} totalPosts={240} />)

      const icons = screen.getAllByText('🌳')
      expect(icons.length).toBeGreaterThan(0)
    })

    it('should render icon for Tamil Nadu', () => {
      render(<StatesPage states={mockStates} totalPosts={240} />)

      const icons = screen.getAllByText('🏛️')
      expect(icons.length).toBeGreaterThan(0)
    })

    it('should render default icon for unknown state', () => {
      const unknownState = [{
        ...mockStates[0],
        slug: 'unknown-state',
      }]

      const { container } = render(<StatesPage states={unknownState} totalPosts={80} />)

      expect(container.querySelector('.forum-city-icon')).toBeInTheDocument()
    })
  })

  describe('Breadcrumb Navigation', () => {
    it('should render forum breadcrumb link', () => {
      const { container } = render(<StatesPage states={mockStates} totalPosts={240} />)

      const forumLink = container.querySelector('a[href="/forum"]')
      expect(forumLink).toBeInTheDocument()
    })

    it('should render general discussions breadcrumb link', () => {
      const { container } = render(<StatesPage states={mockStates} totalPosts={240} />)

      const gdLink = container.querySelector('a[href="/forum/category/general-discussions"]')
      expect(gdLink).toBeInTheDocument()
    })

    it('should render current page in breadcrumb', () => {
      const { container } = render(<StatesPage states={mockStates} totalPosts={240} />)

      const current = container.querySelector('.forum-breadcrumb-current')
      expect(current).toHaveTextContent('States & Union Territories')
    })

    it('should render breadcrumb separators', () => {
      render(<StatesPage states={mockStates} totalPosts={240} />)

      const separators = screen.getAllByText('›')
      expect(separators.length).toBeGreaterThan(0)
    })
  })

  describe('SEO', () => {
    it('should render NextSeo with correct title', () => {
      render(<StatesPage states={mockStates} totalPosts={240} />)

      const seo = screen.getByTestId('next-seo')
      expect(seo).toHaveAttribute('data-title', 'States and Union Territories - Forum - Grihome')
    })

    it('should render NextSeo with correct description', () => {
      render(<StatesPage states={mockStates} totalPosts={240} />)

      const seo = screen.getByTestId('next-seo')
      expect(seo).toHaveAttribute('data-description', 'Browse real estate discussions across Indian states and union territories on Grihome community forum')
    })

    it('should render NextSeo with correct canonical URL', () => {
      render(<StatesPage states={mockStates} totalPosts={240} />)

      const seo = screen.getByTestId('next-seo')
      expect(seo).toHaveAttribute('data-canonical', 'https://grihome.vercel.app/forum/category/general-discussions/states')
    })
  })

  describe('CSS Classes', () => {
    it('should have correct container classes', () => {
      const { container } = render(<StatesPage states={mockStates} totalPosts={240} />)

      expect(container.querySelector('.forum-container')).toBeInTheDocument()
      expect(container.querySelector('.forum-main')).toBeInTheDocument()
      expect(container.querySelector('.forum-content')).toBeInTheDocument()
    })

    it('should have correct state list classes', () => {
      const { container } = render(<StatesPage states={mockStates} totalPosts={240} />)

      expect(container.querySelector('.forum-cities-list')).toBeInTheDocument()
      expect(container.querySelector('.forum-city-list-item')).toBeInTheDocument()
      expect(container.querySelector('.forum-city-list-content')).toBeInTheDocument()
    })

    it('should have correct header classes', () => {
      const { container } = render(<StatesPage states={mockStates} totalPosts={240} />)

      expect(container.querySelector('.forum-header')).toBeInTheDocument()
      expect(container.querySelector('.forum-header-content')).toBeInTheDocument()
      expect(container.querySelector('.forum-title')).toBeInTheDocument()
    })

    it('should have correct stats classes', () => {
      const { container } = render(<StatesPage states={mockStates} totalPosts={240} />)

      expect(container.querySelector('.forum-city-list-stats')).toBeInTheDocument()
      expect(container.querySelector('.forum-city-stat')).toBeInTheDocument()
    })
  })

  describe('Title Formatting', () => {
    it('should apply gradient to Territories word', () => {
      const { container } = render(<StatesPage states={mockStates} totalPosts={240} />)

      const gradientSpans = container.querySelectorAll('.forum-title-gradient')
      expect(gradientSpans.length).toBeGreaterThan(0)
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<StatesPage states={mockStates} totalPosts={240} />)

      const h1 = screen.getByRole('heading', { level: 1 })
      expect(h1).toBeInTheDocument()
    })

    it('should have accessible links', () => {
      const { container } = render(<StatesPage states={mockStates} totalPosts={240} />)

      const links = container.querySelectorAll('a')
      links.forEach(link => {
        expect(link).toHaveAttribute('href')
      })
    })

    it('should have main landmark', () => {
      const { container } = render(<StatesPage states={mockStates} totalPosts={240} />)

      const main = container.querySelector('main')
      expect(main).toBeInTheDocument()
    })
  })

  describe('Stats Display', () => {
    it('should display thread counts for each state', () => {
      render(<StatesPage states={mockStates} totalPosts={240} />)

      const threadLabels = screen.getAllByText('threads')
      expect(threadLabels.length).toBeGreaterThan(0)
    })

    it('should display category counts for each state', () => {
      render(<StatesPage states={mockStates} totalPosts={240} />)

      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('should display arrow icons', () => {
      render(<StatesPage states={mockStates} totalPosts={240} />)

      const arrows = screen.getAllByText('→')
      expect(arrows.length).toBeGreaterThan(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty states array', () => {
      const { container } = render(<StatesPage states={[]} totalPosts={0} />)

      expect(container.querySelector('.forum-cities-list')).toBeInTheDocument()
    })

    it('should handle states with zero posts', () => {
      const zeroPostState = [{
        ...mockStates[0],
        totalPosts: 0,
      }]

      render(<StatesPage states={zeroPostState} totalPosts={0} />)

      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('should handle states with no children', () => {
      const noChildrenState = [{
        ...mockStates[2],
      }]

      render(<StatesPage states={noChildrenState} totalPosts={60} />)

      expect(screen.getByText('Tamil Nadu')).toBeInTheDocument()
      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('should handle zero total posts', () => {
      render(<StatesPage states={mockStates} totalPosts={0} />)

      expect(screen.getByText('0 threads')).toBeInTheDocument()
    })

    it('should handle very large thread counts', () => {
      render(<StatesPage states={mockStates} totalPosts={999999} />)

      expect(screen.getByText('999999 threads')).toBeInTheDocument()
    })
  })

  describe('Layout Structure', () => {
    it('should have breadcrumb container', () => {
      const { container } = render(<StatesPage states={mockStates} totalPosts={240} />)

      expect(container.querySelector('.forum-breadcrumb-container')).toBeInTheDocument()
    })

    it('should have search in breadcrumb area', () => {
      const { container } = render(<StatesPage states={mockStates} totalPosts={240} />)

      expect(container.querySelector('.forum-breadcrumb-search')).toBeInTheDocument()
    })

    it('should render header stats section', () => {
      const { container } = render(<StatesPage states={mockStates} totalPosts={240} />)

      expect(container.querySelector('.forum-header-stats')).toBeInTheDocument()
      expect(container.querySelector('.forum-thread-count')).toBeInTheDocument()
    })
  })

  describe('State Details', () => {
    it('should render state info section', () => {
      const { container } = render(<StatesPage states={mockStates} totalPosts={240} />)

      expect(container.querySelector('.forum-city-list-info')).toBeInTheDocument()
      expect(container.querySelector('.forum-city-details')).toBeInTheDocument()
    })

    it('should render state names', () => {
      const { container } = render(<StatesPage states={mockStates} totalPosts={240} />)

      const stateNames = container.querySelectorAll('.forum-city-name')
      expect(stateNames.length).toBe(mockStates.length)
    })

    it('should render state descriptions', () => {
      const { container } = render(<StatesPage states={mockStates} totalPosts={240} />)

      const descriptions = container.querySelectorAll('.forum-city-description')
      expect(descriptions.length).toBeGreaterThan(0)
    })
  })

  describe('All States Display', () => {
    it('should render Maharashtra icon', () => {
      const statesWithMaharashtra = [
        ...mockStates,
        {
          id: 'state4',
          name: 'Maharashtra',
          slug: 'maharashtra',
          description: null,
          _count: { posts: 10 },
          totalPosts: 20,
          children: [],
        },
      ]

      render(<StatesPage states={statesWithMaharashtra} totalPosts={260} />)

      const icons = screen.getAllByText('🏙️')
      expect(icons.length).toBeGreaterThan(0)
    })

    it('should render Kerala icon', () => {
      const statesWithKerala = [
        ...mockStates,
        {
          id: 'state5',
          name: 'Kerala',
          slug: 'kerala',
          description: null,
          _count: { posts: 10 },
          totalPosts: 20,
          children: [],
        },
      ]

      render(<StatesPage states={statesWithKerala} totalPosts={260} />)

      const icons = screen.getAllByText('🌴')
      expect(icons.length).toBeGreaterThan(0)
    })

    it('should render West Bengal icon', () => {
      const statesWithWB = [
        ...mockStates,
        {
          id: 'state6',
          name: 'West Bengal',
          slug: 'west-bengal',
          description: null,
          _count: { posts: 10 },
          totalPosts: 20,
          children: [],
        },
      ]

      render(<StatesPage states={statesWithWB} totalPosts={260} />)

      const icons = screen.getAllByText('🎭')
      expect(icons.length).toBeGreaterThan(0)
    })
  })

  describe('Union Territories', () => {
    it('should render Chandigarh icon', () => {
      const utsWithChandigarh = [
        ...mockStates,
        {
          id: 'ut1',
          name: 'Chandigarh',
          slug: 'chandigarh',
          description: null,
          _count: { posts: 5 },
          totalPosts: 10,
          children: [],
        },
      ]

      render(<StatesPage states={utsWithChandigarh} totalPosts={250} />)

      const icons = screen.getAllByText('🏙️')
      expect(icons.length).toBeGreaterThan(0)
    })

    it('should render Puducherry icon', () => {
      const utsWithPuducherry = [
        ...mockStates,
        {
          id: 'ut2',
          name: 'Puducherry',
          slug: 'puducherry',
          description: null,
          _count: { posts: 5 },
          totalPosts: 10,
          children: [],
        },
      ]

      render(<StatesPage states={utsWithPuducherry} totalPosts={250} />)

      const icons = screen.getAllByText('🌊')
      expect(icons.length).toBeGreaterThan(0)
    })

    it('should render Lakshadweep icon', () => {
      const utsWithLakshadweep = [
        ...mockStates,
        {
          id: 'ut3',
          name: 'Lakshadweep',
          slug: 'lakshadweep',
          description: null,
          _count: { posts: 5 },
          totalPosts: 10,
          children: [],
        },
      ]

      render(<StatesPage states={utsWithLakshadweep} totalPosts={250} />)

      const icons = screen.getAllByText('🏝️')
      expect(icons.length).toBeGreaterThan(0)
    })
  })
})
