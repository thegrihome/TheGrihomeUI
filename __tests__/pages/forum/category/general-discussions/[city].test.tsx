import React from 'react'
import { render, screen } from '@testing-library/react'
import CityPage from '@/pages/forum/category/general-discussions/[city]'

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

describe('City Page - Comprehensive Tests', () => {
  const mockCity = {
    id: 'city1',
    name: 'Hyderabad',
    slug: 'hyderabad',
    description: 'Hyderabad Real Estate Discussions',
    city: 'hyderabad',
    isState: false,
  }

  const mockPropertyTypes = [
    {
      id: 'pt1',
      name: 'Apartments in Hyderabad',
      slug: 'hyderabad-apartments',
      description: null,
      propertyType: 'APARTMENTS',
      _count: { posts: 80 },
    },
    {
      id: 'pt2',
      name: 'Villas in Hyderabad',
      slug: 'hyderabad-villas',
      description: null,
      propertyType: 'VILLAS',
      _count: { posts: 50 },
    },
    {
      id: 'pt3',
      name: 'Residential Lands in Hyderabad',
      slug: 'hyderabad-residential-lands',
      description: null,
      propertyType: 'RESIDENTIAL_LANDS',
      _count: { posts: 30 },
    },
    {
      id: 'pt4',
      name: 'Commercial Properties in Hyderabad',
      slug: 'hyderabad-commercial-properties',
      description: null,
      propertyType: 'COMMERCIAL_PROPERTIES',
      _count: { posts: 20 },
    },
  ]

  describe('Rendering and Initial State', () => {
    it('should render city page with all components', () => {
      render(<CityPage city={mockCity} propertyTypes={mockPropertyTypes} totalPosts={180} />)

      expect(screen.getByTestId('header')).toBeInTheDocument()
      expect(screen.getByTestId('footer')).toBeInTheDocument()
      expect(screen.getByTestId('forum-search')).toBeInTheDocument()
    })

    it('should render city name', () => {
      render(<CityPage city={mockCity} propertyTypes={mockPropertyTypes} totalPosts={180} />)

      expect(screen.getByText(/Hyderabad Real Estate Discussions/)).toBeInTheDocument()
    })

    it('should render total discussions count', () => {
      render(<CityPage city={mockCity} propertyTypes={mockPropertyTypes} totalPosts={180} />)

      expect(screen.getByText('180 discussions')).toBeInTheDocument()
    })

    it('should render property categories count', () => {
      render(<CityPage city={mockCity} propertyTypes={mockPropertyTypes} totalPosts={180} />)

      expect(screen.getByText('4 property categories')).toBeInTheDocument()
    })

    it('should render city icon', () => {
      render(<CityPage city={mockCity} propertyTypes={mockPropertyTypes} totalPosts={180} />)

      const icon = screen.getByText('🏛️')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('Property Types List', () => {
    it('should render all property types', () => {
      render(<CityPage city={mockCity} propertyTypes={mockPropertyTypes} totalPosts={180} />)

      expect(screen.getByText('Apartments')).toBeInTheDocument()
      expect(screen.getByText('Villas')).toBeInTheDocument()
      expect(screen.getByText('Residential Lands')).toBeInTheDocument()
      expect(screen.getByText('Commercial Properties')).toBeInTheDocument()
    })

    it('should render discussion counts for each property type', () => {
      render(<CityPage city={mockCity} propertyTypes={mockPropertyTypes} totalPosts={180} />)

      expect(screen.getByText('80 discussions')).toBeInTheDocument()
      expect(screen.getByText('50 discussions')).toBeInTheDocument()
      expect(screen.getByText('30 discussions')).toBeInTheDocument()
      expect(screen.getByText('20 discussions')).toBeInTheDocument()
    })

    it('should link to property type pages correctly', () => {
      const { container } = render(<CityPage city={mockCity} propertyTypes={mockPropertyTypes} totalPosts={180} />)

      const aptLink = container.querySelector('a[href="/forum/category/general-discussions/hyderabad/apartments"]')
      expect(aptLink).toBeInTheDocument()

      const villasLink = container.querySelector('a[href="/forum/category/general-discussions/hyderabad/villas"]')
      expect(villasLink).toBeInTheDocument()
    })

    it('should render property type icons', () => {
      render(<CityPage city={mockCity} propertyTypes={mockPropertyTypes} totalPosts={180} />)

      expect(screen.getAllByText('🏢').length).toBeGreaterThan(0) // Apartments
      expect(screen.getAllByText('🏡').length).toBeGreaterThan(0) // Villas
      expect(screen.getAllByText('🏞️').length).toBeGreaterThan(0) // Residential Lands
      expect(screen.getAllByText('🏬').length).toBeGreaterThan(0) // Commercial
    })

    it('should render arrow icons', () => {
      render(<CityPage city={mockCity} propertyTypes={mockPropertyTypes} totalPosts={180} />)

      const arrows = screen.getAllByText('→')
      expect(arrows.length).toBeGreaterThan(0)
    })

    it('should strip "in CityName" from property type names', () => {
      render(<CityPage city={mockCity} propertyTypes={mockPropertyTypes} totalPosts={180} />)

      // Should show "Apartments" not "Apartments in Hyderabad"
      expect(screen.getByText('Apartments')).toBeInTheDocument()
      expect(screen.queryByText('Apartments in Hyderabad')).not.toBeInTheDocument()
    })
  })

  describe('Breadcrumb Navigation', () => {
    it('should render forum breadcrumb link', () => {
      const { container } = render(<CityPage city={mockCity} propertyTypes={mockPropertyTypes} totalPosts={180} />)

      const forumLink = container.querySelector('a[href="/forum"]')
      expect(forumLink).toBeInTheDocument()
    })

    it('should render general discussions breadcrumb link', () => {
      const { container } = render(<CityPage city={mockCity} propertyTypes={mockPropertyTypes} totalPosts={180} />)

      const gdLink = container.querySelector('a[href="/forum/category/general-discussions"]')
      expect(gdLink).toBeInTheDocument()
    })

    it('should render current city in breadcrumb', () => {
      const { container } = render(<CityPage city={mockCity} propertyTypes={mockPropertyTypes} totalPosts={180} />)

      const current = container.querySelector('.forum-breadcrumb-current')
      expect(current).toHaveTextContent('Hyderabad')
    })

    it('should render states link for state locations', () => {
      const stateLocation = {
        ...mockCity,
        city: null,
        isState: true,
        slug: 'karnataka',
        name: 'Karnataka',
      }

      render(<CityPage city={stateLocation} propertyTypes={mockPropertyTypes} totalPosts={180} />)

      expect(screen.getByText('States & Union Territories')).toBeInTheDocument()
    })

    it('should not render states link for city locations', () => {
      render(<CityPage city={mockCity} propertyTypes={mockPropertyTypes} totalPosts={180} />)

      expect(screen.queryByText('States & Union Territories')).not.toBeInTheDocument()
    })

    it('should render breadcrumb separators', () => {
      render(<CityPage city={mockCity} propertyTypes={mockPropertyTypes} totalPosts={180} />)

      const separators = screen.getAllByText('›')
      expect(separators.length).toBeGreaterThan(0)
    })
  })

  describe('SEO', () => {
    it('should render NextSeo with correct title', () => {
      render(<CityPage city={mockCity} propertyTypes={mockPropertyTypes} totalPosts={180} />)

      const seo = screen.getByTestId('next-seo')
      expect(seo).toHaveAttribute('data-title', 'Hyderabad - General Discussions - Forum - Grihome')
    })

    it('should render NextSeo with correct description', () => {
      render(<CityPage city={mockCity} propertyTypes={mockPropertyTypes} totalPosts={180} />)

      const seo = screen.getByTestId('next-seo')
      expect(seo).toHaveAttribute('data-description', 'Real estate discussions and property insights for Hyderabad on Grihome community forum')
    })

    it('should render NextSeo with correct canonical URL for city', () => {
      render(<CityPage city={mockCity} propertyTypes={mockPropertyTypes} totalPosts={180} />)

      const seo = screen.getByTestId('next-seo')
      expect(seo).toHaveAttribute('data-canonical', 'https://grihome.vercel.app/forum/category/general-discussions/hyderabad')
    })

    it('should render NextSeo with correct canonical URL for state', () => {
      const stateLocation = {
        ...mockCity,
        city: null,
        isState: true,
        slug: 'karnataka',
        name: 'Karnataka',
      }

      render(<CityPage city={stateLocation} propertyTypes={mockPropertyTypes} totalPosts={180} />)

      const seo = screen.getByTestId('next-seo')
      expect(seo).toHaveAttribute('data-canonical', 'https://grihome.vercel.app/forum/category/general-discussions/karnataka')
    })
  })

  describe('CSS Classes', () => {
    it('should have correct container classes', () => {
      const { container } = render(<CityPage city={mockCity} propertyTypes={mockPropertyTypes} totalPosts={180} />)

      expect(container.querySelector('.forum-container')).toBeInTheDocument()
      expect(container.querySelector('.forum-main')).toBeInTheDocument()
      expect(container.querySelector('.forum-content')).toBeInTheDocument()
    })

    it('should have correct property type list classes', () => {
      const { container } = render(<CityPage city={mockCity} propertyTypes={mockPropertyTypes} totalPosts={180} />)

      expect(container.querySelector('.forum-property-types-list')).toBeInTheDocument()
      expect(container.querySelector('.forum-property-type-list-item')).toBeInTheDocument()
    })

    it('should have correct header classes', () => {
      const { container } = render(<CityPage city={mockCity} propertyTypes={mockPropertyTypes} totalPosts={180} />)

      expect(container.querySelector('.forum-header')).toBeInTheDocument()
      expect(container.querySelector('.forum-header-content')).toBeInTheDocument()
      expect(container.querySelector('.forum-title')).toBeInTheDocument()
    })

    it('should have correct stats classes', () => {
      const { container } = render(<CityPage city={mockCity} propertyTypes={mockPropertyTypes} totalPosts={180} />)

      expect(container.querySelector('.forum-stats-summary')).toBeInTheDocument()
      expect(container.querySelector('.forum-stat')).toBeInTheDocument()
    })
  })

  describe('Title Formatting', () => {
    it('should apply gradient to city name', () => {
      const { container } = render(<CityPage city={mockCity} propertyTypes={mockPropertyTypes} totalPosts={180} />)

      const gradientSpans = container.querySelectorAll('.forum-title-gradient')
      expect(gradientSpans.length).toBeGreaterThan(0)
    })

    it('should format state names with gradient', () => {
      const stateLocation = {
        ...mockCity,
        city: null,
        isState: true,
        slug: 'karnataka',
        name: 'Karnataka',
      }

      const { container } = render(<CityPage city={stateLocation} propertyTypes={mockPropertyTypes} totalPosts={180} />)

      const gradientSpans = container.querySelectorAll('.forum-title-gradient')
      expect(gradientSpans.length).toBeGreaterThan(0)
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<CityPage city={mockCity} propertyTypes={mockPropertyTypes} totalPosts={180} />)

      const h1 = screen.getByRole('heading', { level: 1 })
      expect(h1).toBeInTheDocument()
    })

    it('should have accessible links', () => {
      const { container } = render(<CityPage city={mockCity} propertyTypes={mockPropertyTypes} totalPosts={180} />)

      const links = container.querySelectorAll('a')
      links.forEach(link => {
        expect(link).toHaveAttribute('href')
      })
    })

    it('should have main landmark', () => {
      const { container } = render(<CityPage city={mockCity} propertyTypes={mockPropertyTypes} totalPosts={180} />)

      const main = container.querySelector('main')
      expect(main).toBeInTheDocument()
    })

    it('should have title attributes on links', () => {
      const { container } = render(<CityPage city={mockCity} propertyTypes={mockPropertyTypes} totalPosts={180} />)

      const links = container.querySelectorAll('.forum-property-type-list-item')
      links.forEach(link => {
        expect(link).toHaveAttribute('title')
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty property types array', () => {
      const { container } = render(<CityPage city={mockCity} propertyTypes={[]} totalPosts={0} />)

      expect(container.querySelector('.forum-property-types-list')).toBeInTheDocument()
    })

    it('should handle zero total posts', () => {
      render(<CityPage city={mockCity} propertyTypes={mockPropertyTypes} totalPosts={0} />)

      expect(screen.getByText('0 discussions')).toBeInTheDocument()
    })

    it('should handle very large post counts', () => {
      render(<CityPage city={mockCity} propertyTypes={mockPropertyTypes} totalPosts={999999} />)

      expect(screen.getByText('999999 discussions')).toBeInTheDocument()
    })

    it('should handle property types with zero posts', () => {
      const zeroPostPropType = [{
        ...mockPropertyTypes[0],
        _count: { posts: 0 },
      }]

      render(<CityPage city={mockCity} propertyTypes={zeroPostPropType} totalPosts={0} />)

      expect(screen.getByText('0 discussions')).toBeInTheDocument()
    })

    it('should handle null description for city', () => {
      const cityWithoutDesc = {
        ...mockCity,
        description: null,
      }

      render(<CityPage city={cityWithoutDesc} propertyTypes={mockPropertyTypes} totalPosts={180} />)

      expect(screen.getByText(/Hyderabad Real Estate Discussions/)).toBeInTheDocument()
    })
  })

  describe('All Cities Support', () => {
    it('should render Chennai icon', () => {
      const chennaiCity = {
        ...mockCity,
        city: 'chennai',
        name: 'Chennai',
      }

      render(<CityPage city={chennaiCity} propertyTypes={mockPropertyTypes} totalPosts={180} />)

      const icon = screen.getByText('🏖️')
      expect(icon).toBeInTheDocument()
    })

    it('should render Bengaluru icon', () => {
      const bengaluruCity = {
        ...mockCity,
        city: 'bengaluru',
        name: 'Bengaluru',
      }

      render(<CityPage city={bengaluruCity} propertyTypes={mockPropertyTypes} totalPosts={180} />)

      const icon = screen.getByText('🌆')
      expect(icon).toBeInTheDocument()
    })

    it('should render Mumbai icon', () => {
      const mumbaiCity = {
        ...mockCity,
        city: 'mumbai',
        name: 'Mumbai',
      }

      render(<CityPage city={mumbaiCity} propertyTypes={mockPropertyTypes} totalPosts={180} />)

      const icon = screen.getByText('🏙️')
      expect(icon).toBeInTheDocument()
    })

    it('should render default icon for unknown city', () => {
      const unknownCity = {
        ...mockCity,
        city: 'unknown-city',
      }

      const { container } = render(<CityPage city={unknownCity} propertyTypes={mockPropertyTypes} totalPosts={180} />)

      expect(container.querySelector('.forum-city-icon-large')).toBeInTheDocument()
    })
  })

  describe('State Support', () => {
    it('should render state page correctly', () => {
      const stateLocation = {
        id: 'state1',
        name: 'Karnataka',
        slug: 'karnataka',
        description: 'Karnataka Real Estate Discussions',
        city: null,
        isState: true,
      }

      render(<CityPage city={stateLocation} propertyTypes={mockPropertyTypes} totalPosts={180} />)

      expect(screen.getByText(/Karnataka Real Estate Discussions/)).toBeInTheDocument()
    })

    it('should render state icon', () => {
      const stateLocation = {
        id: 'state1',
        name: 'Karnataka',
        slug: 'karnataka',
        description: null,
        city: null,
        isState: true,
      }

      render(<CityPage city={stateLocation} propertyTypes={mockPropertyTypes} totalPosts={180} />)

      const icon = screen.getByText('🌳')
      expect(icon).toBeInTheDocument()
    })

    it('should link back to states page in breadcrumb', () => {
      const stateLocation = {
        ...mockCity,
        city: null,
        isState: true,
        slug: 'karnataka',
        name: 'Karnataka',
      }

      const { container } = render(<CityPage city={stateLocation} propertyTypes={mockPropertyTypes} totalPosts={180} />)

      const statesLink = container.querySelector('a[href="/forum/category/general-discussions/states"]')
      expect(statesLink).toBeInTheDocument()
    })
  })

  describe('Layout Structure', () => {
    it('should have city header section', () => {
      const { container } = render(<CityPage city={mockCity} propertyTypes={mockPropertyTypes} totalPosts={180} />)

      expect(container.querySelector('.forum-city-header-section')).toBeInTheDocument()
    })

    it('should have property type name section', () => {
      const { container } = render(<CityPage city={mockCity} propertyTypes={mockPropertyTypes} totalPosts={180} />)

      expect(container.querySelector('.forum-property-type-name')).toBeInTheDocument()
    })

    it('should have simple stats section', () => {
      const { container } = render(<CityPage city={mockCity} propertyTypes={mockPropertyTypes} totalPosts={180} />)

      expect(container.querySelector('.forum-simple-stats')).toBeInTheDocument()
    })
  })

  describe('Property Type Icons', () => {
    it('should render agriculture lands icon', () => {
      const withAgriculture = [
        ...mockPropertyTypes,
        {
          id: 'pt5',
          name: 'Agriculture Lands in Hyderabad',
          slug: 'hyderabad-agriculture-lands',
          description: null,
          propertyType: 'AGRICULTURE_LANDS',
          _count: { posts: 15 },
        },
      ]

      render(<CityPage city={mockCity} propertyTypes={withAgriculture} totalPosts={195} />)

      const icon = screen.getByText('🌾')
      expect(icon).toBeInTheDocument()
    })

    it('should render default property icon for unknown type', () => {
      const unknownType = [{
        ...mockPropertyTypes[0],
        propertyType: null,
      }]

      const { container } = render(<CityPage city={mockCity} propertyTypes={unknownType} totalPosts={80} />)

      expect(container.querySelector('.forum-property-type-icon')).toBeInTheDocument()
    })
  })
})
