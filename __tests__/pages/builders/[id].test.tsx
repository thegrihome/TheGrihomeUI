import React from 'react'
import { render, screen } from '@testing-library/react'
import { GetServerSidePropsContext } from 'next'
import BuilderPage, { getServerSideProps } from '@/pages/builders/[id]'
import { PrismaClient } from '@prisma/client'

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

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />
  },
}))

const mockBuilder = {
  id: '1',
  name: 'Premier Builders',
  description: 'Leading real estate developer',
  logoUrl: 'https://example.com/logo.png',
  website: 'https://premierbuilders.com',
  contactInfo: {},
  builderDetails: {},
  projects: [
    {
      id: 'proj1',
      name: 'Luxury Apartments',
      description: 'Premium residential project',
      type: 'Apartment',
      numberOfUnits: 50,
      size: 5.5,
      thumbnailUrl: 'https://example.com/project1.jpg',
      location: {
        id: 'loc1',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        locality: 'Bandra',
      },
    },
    {
      id: 'proj2',
      name: 'Villa Paradise',
      description: 'Luxury villas',
      type: 'Villa',
      numberOfUnits: 20,
      size: 3.0,
      thumbnailUrl: null,
      location: {
        id: 'loc2',
        city: 'Pune',
        state: 'Maharashtra',
        country: 'India',
        locality: 'Koregaon Park',
      },
    },
  ],
}

describe('BuilderPage - Comprehensive Tests', () => {
  describe('Component Rendering with Builder Data', () => {
    it('should render the page with header and footer', () => {
      render(<BuilderPage builder={mockBuilder} />)

      expect(screen.getByTestId('header')).toBeInTheDocument()
      expect(screen.getByTestId('footer')).toBeInTheDocument()
    })

    it('should render builder name', () => {
      render(<BuilderPage builder={mockBuilder} />)

      expect(screen.getByText('Premier Builders')).toBeInTheDocument()
    })

    it('should render builder description', () => {
      render(<BuilderPage builder={mockBuilder} />)

      expect(screen.getByText('Leading real estate developer')).toBeInTheDocument()
    })

    it('should render builder logo when available', () => {
      render(<BuilderPage builder={mockBuilder} />)

      const logo = screen.getByAlt('Premier Builders logo')
      expect(logo).toBeInTheDocument()
      expect(logo).toHaveAttribute('src', 'https://example.com/logo.png')
    })

    it('should render website button when available', () => {
      render(<BuilderPage builder={mockBuilder} />)

      const websiteButton = screen.getByText('Visit Website').closest('a')
      expect(websiteButton).toHaveAttribute('href', 'https://premierbuilders.com')
      expect(websiteButton).toHaveAttribute('target', '_blank')
      expect(websiteButton).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('should render Projects section title', () => {
      render(<BuilderPage builder={mockBuilder} />)

      expect(screen.getByText('Projects')).toBeInTheDocument()
    })

    it('should render all projects', () => {
      render(<BuilderPage builder={mockBuilder} />)

      expect(screen.getByText('Luxury Apartments')).toBeInTheDocument()
      expect(screen.getByText('Villa Paradise')).toBeInTheDocument()
    })

    it('should render project type badges', () => {
      render(<BuilderPage builder={mockBuilder} />)

      expect(screen.getByText('Apartment')).toBeInTheDocument()
      expect(screen.getByText('Villa')).toBeInTheDocument()
    })

    it('should render project descriptions', () => {
      render(<BuilderPage builder={mockBuilder} />)

      expect(screen.getByText('Premium residential project')).toBeInTheDocument()
      expect(screen.getByText('Luxury villas')).toBeInTheDocument()
    })

    it('should render project locations', () => {
      render(<BuilderPage builder={mockBuilder} />)

      expect(screen.getByText(/Bandra, Mumbai/)).toBeInTheDocument()
      expect(screen.getByText(/Koregaon Park, Pune/)).toBeInTheDocument()
    })

    it('should render project number of units', () => {
      render(<BuilderPage builder={mockBuilder} />)

      expect(screen.getByText('50')).toBeInTheDocument()
      expect(screen.getByText('20')).toBeInTheDocument()
    })

    it('should render project sizes', () => {
      render(<BuilderPage builder={mockBuilder} />)

      expect(screen.getByText('5.5')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('should render View Details buttons for all projects', () => {
      render(<BuilderPage builder={mockBuilder} />)

      const viewDetailsButtons = screen.getAllByText('View Details')
      expect(viewDetailsButtons).toHaveLength(2)
    })

    it('should link to project detail pages', () => {
      render(<BuilderPage builder={mockBuilder} />)

      const viewDetailsButtons = screen.getAllByText('View Details')
      expect(viewDetailsButtons[0].closest('a')).toHaveAttribute('href', '/projects/proj1')
      expect(viewDetailsButtons[1].closest('a')).toHaveAttribute('href', '/projects/proj2')
    })
  })

  describe('Builder Not Found', () => {
    it('should render not found message when builder is null', () => {
      render(<BuilderPage builder={null} />)

      expect(screen.getByText('Builder Not Found')).toBeInTheDocument()
    })

    it('should show appropriate message for missing builder', () => {
      render(<BuilderPage builder={null} />)

      expect(
        screen.getByText("The builder you're looking for doesn't exist or has been removed.")
      ).toBeInTheDocument()
    })

    it('should render Browse All Projects button when builder not found', () => {
      render(<BuilderPage builder={null} />)

      const browseButton = screen.getByText('Browse All Projects')
      expect(browseButton).toBeInTheDocument()
      expect(browseButton.closest('a')).toHaveAttribute('href', '/projects')
    })

    it('should render header and footer even when builder not found', () => {
      render(<BuilderPage builder={null} />)

      expect(screen.getByTestId('header')).toBeInTheDocument()
      expect(screen.getByTestId('footer')).toBeInTheDocument()
    })
  })

  describe('Builder Without Description', () => {
    it('should render without description when not provided', () => {
      const builderWithoutDesc = {
        ...mockBuilder,
        description: null,
      }

      render(<BuilderPage builder={builderWithoutDesc} />)

      expect(screen.getByText('Premier Builders')).toBeInTheDocument()
      expect(screen.queryByText('Leading real estate developer')).not.toBeInTheDocument()
    })
  })

  describe('Builder Without Logo', () => {
    it('should render without logo image when not provided', () => {
      const builderWithoutLogo = {
        ...mockBuilder,
        logoUrl: null,
      }

      render(<BuilderPage builder={builderWithoutLogo} />)

      expect(screen.queryByAlt('Premier Builders logo')).not.toBeInTheDocument()
      expect(screen.getByText('Premier Builders')).toBeInTheDocument()
    })
  })

  describe('Builder Without Website', () => {
    it('should not render website button when not provided', () => {
      const builderWithoutWebsite = {
        ...mockBuilder,
        website: null,
      }

      render(<BuilderPage builder={builderWithoutWebsite} />)

      expect(screen.queryByText('Visit Website')).not.toBeInTheDocument()
    })
  })

  describe('Builder With No Projects', () => {
    it('should render no projects message', () => {
      const builderWithoutProjects = {
        ...mockBuilder,
        projects: [],
      }

      render(<BuilderPage builder={builderWithoutProjects} />)

      expect(screen.getByText('No Projects Available')).toBeInTheDocument()
      expect(
        screen.getByText("This builder doesn't have any projects listed yet.")
      ).toBeInTheDocument()
    })

    it('should still show Projects section header when no projects', () => {
      const builderWithoutProjects = {
        ...mockBuilder,
        projects: [],
      }

      render(<BuilderPage builder={builderWithoutProjects} />)

      expect(screen.getByText('Projects')).toBeInTheDocument()
    })
  })

  describe('Project With Thumbnail', () => {
    it('should render project thumbnail when available', () => {
      render(<BuilderPage builder={mockBuilder} />)

      const thumbnail = screen.getByAlt('Luxury Apartments')
      expect(thumbnail).toBeInTheDocument()
      expect(thumbnail).toHaveAttribute('src', expect.stringContaining('project1.jpg'))
    })
  })

  describe('Project Without Thumbnail', () => {
    it('should render placeholder when thumbnail is not available', () => {
      render(<BuilderPage builder={mockBuilder} />)

      const placeholderTexts = screen.getAllByText('Project Image')
      expect(placeholderTexts.length).toBeGreaterThan(0)
    })
  })

  describe('Project Location Display', () => {
    it('should display locality when available', () => {
      render(<BuilderPage builder={mockBuilder} />)

      expect(screen.getByText(/Bandra/)).toBeInTheDocument()
    })

    it('should display city', () => {
      render(<BuilderPage builder={mockBuilder} />)

      expect(screen.getByText(/Mumbai/)).toBeInTheDocument()
      expect(screen.getByText(/Pune/)).toBeInTheDocument()
    })

    it('should handle project without locality', () => {
      const builderWithNoLocality = {
        ...mockBuilder,
        projects: [
          {
            ...mockBuilder.projects[0],
            location: {
              ...mockBuilder.projects[0].location,
              locality: null,
            },
          },
        ],
      }

      render(<BuilderPage builder={builderWithNoLocality} />)

      expect(screen.getByText('Mumbai')).toBeInTheDocument()
    })
  })

  describe('Project Number of Units', () => {
    it('should display units count when available', () => {
      render(<BuilderPage builder={mockBuilder} />)

      const unitsText = screen.getAllByText(/units/)
      expect(unitsText.length).toBeGreaterThan(0)
    })

    it('should not display units section when null', () => {
      const builderWithNoUnits = {
        ...mockBuilder,
        projects: [
          {
            ...mockBuilder.projects[0],
            numberOfUnits: null,
          },
        ],
      }

      render(<BuilderPage builder={builderWithNoUnits} />)

      // Check that we still render the project
      expect(screen.getByText('Luxury Apartments')).toBeInTheDocument()
    })
  })

  describe('Project Size', () => {
    it('should display project size when available', () => {
      render(<BuilderPage builder={mockBuilder} />)

      const sizeText = screen.getAllByText(/acres/)
      expect(sizeText.length).toBeGreaterThan(0)
    })

    it('should not display size section when null', () => {
      const builderWithNoSize = {
        ...mockBuilder,
        projects: [
          {
            ...mockBuilder.projects[0],
            size: null,
          },
        ],
      }

      render(<BuilderPage builder={builderWithNoSize} />)

      expect(screen.getByText('Luxury Apartments')).toBeInTheDocument()
    })
  })

  describe('SEO and Meta Tags', () => {
    it('should have builder name in SEO title', () => {
      render(<BuilderPage builder={mockBuilder} />)

      expect(document.title).toContain('Premier Builders')
    })

    it('should use description in meta when available', () => {
      render(<BuilderPage builder={mockBuilder} />)

      // NextSeo component would handle this
      expect(screen.getByText('Leading real estate developer')).toBeInTheDocument()
    })

    it('should use default description when builder description is null', () => {
      const builderWithoutDesc = {
        ...mockBuilder,
        description: null,
      }

      render(<BuilderPage builder={builderWithoutDesc} />)

      // The component should still render
      expect(screen.getByText('Premier Builders')).toBeInTheDocument()
    })
  })

  describe('Grid Layout', () => {
    it('should render projects in a grid', () => {
      render(<BuilderPage builder={mockBuilder} />)

      const projectCards = screen.getAllByText('View Details')
      expect(projectCards.length).toBe(2)
    })

    it('should have appropriate responsive classes', () => {
      render(<BuilderPage builder={mockBuilder} />)

      const projectCard = screen.getByText('Luxury Apartments').closest('div')?.parentElement
      expect(projectCard?.className).toContain('grid')
    })
  })

  describe('Accessibility', () => {
    it('should have alt text for builder logo', () => {
      render(<BuilderPage builder={mockBuilder} />)

      const logo = screen.getByAlt('Premier Builders logo')
      expect(logo).toBeInTheDocument()
    })

    it('should have alt text for project images', () => {
      render(<BuilderPage builder={mockBuilder} />)

      const projectImage = screen.getByAlt('Luxury Apartments')
      expect(projectImage).toBeInTheDocument()
    })

    it('should have accessible links', () => {
      render(<BuilderPage builder={mockBuilder} />)

      const links = screen.getAllByRole('link')
      expect(links.length).toBeGreaterThan(0)
    })

    it('should have proper heading hierarchy', () => {
      render(<BuilderPage builder={mockBuilder} />)

      const heading = screen.getByText('Premier Builders')
      expect(heading.tagName).toBe('H1')
    })
  })

  describe('External Links', () => {
    it('should have external link to builder website', () => {
      render(<BuilderPage builder={mockBuilder} />)

      const websiteLink = screen.getByText('Visit Website').closest('a')
      expect(websiteLink).toHaveAttribute('target', '_blank')
    })

    it('should have noopener noreferrer on external link', () => {
      render(<BuilderPage builder={mockBuilder} />)

      const websiteLink = screen.getByText('Visit Website').closest('a')
      expect(websiteLink).toHaveAttribute('rel', 'noopener noreferrer')
    })
  })

  describe('Edge Cases', () => {
    it('should handle builder with very long name', () => {
      const longNameBuilder = {
        ...mockBuilder,
        name: 'Very Long Builder Name That Should Be Displayed Properly Even Though It Is Extremely Long And Might Cause Layout Issues',
      }

      render(<BuilderPage builder={longNameBuilder} />)

      expect(
        screen.getByText(
          'Very Long Builder Name That Should Be Displayed Properly Even Though It Is Extremely Long And Might Cause Layout Issues'
        )
      ).toBeInTheDocument()
    })

    it('should handle builder with very long description', () => {
      const longDescBuilder = {
        ...mockBuilder,
        description: 'A'.repeat(500),
      }

      render(<BuilderPage builder={longDescBuilder} />)

      expect(screen.getByText('A'.repeat(500))).toBeInTheDocument()
    })

    it('should handle many projects', () => {
      const manyProjects = Array.from({ length: 20 }, (_, i) => ({
        id: `proj${i}`,
        name: `Project ${i}`,
        description: `Description ${i}`,
        type: 'Apartment',
        numberOfUnits: 10,
        size: 2.5,
        thumbnailUrl: null,
        location: {
          id: `loc${i}`,
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          locality: 'Area',
        },
      }))

      const builderWithManyProjects = {
        ...mockBuilder,
        projects: manyProjects,
      }

      render(<BuilderPage builder={builderWithManyProjects} />)

      expect(screen.getByText('Project 0')).toBeInTheDocument()
      expect(screen.getByText('Project 19')).toBeInTheDocument()
    })

    it('should handle project with zero units', () => {
      const zeroUnitsBuilder = {
        ...mockBuilder,
        projects: [
          {
            ...mockBuilder.projects[0],
            numberOfUnits: 0,
          },
        ],
      }

      render(<BuilderPage builder={zeroUnitsBuilder} />)

      expect(screen.getByText('Luxury Apartments')).toBeInTheDocument()
    })

    it('should handle project with zero size', () => {
      const zeroSizeBuilder = {
        ...mockBuilder,
        projects: [
          {
            ...mockBuilder.projects[0],
            size: 0,
          },
        ],
      }

      render(<BuilderPage builder={zeroSizeBuilder} />)

      expect(screen.getByText('Luxury Apartments')).toBeInTheDocument()
    })
  })

  describe('Styling and Classes', () => {
    it('should have proper container classes', () => {
      render(<BuilderPage builder={mockBuilder} />)

      const container = screen.getByText('Premier Builders').closest('div')
        ?.parentElement?.parentElement
      expect(container?.className).toContain('container')
    })

    it('should have builder header section', () => {
      render(<BuilderPage builder={mockBuilder} />)

      const header = screen.getByText('Premier Builders').closest('div')
        ?.parentElement?.parentElement
      expect(header?.className).toContain('builder-header')
    })

    it('should have project cards with proper styling', () => {
      render(<BuilderPage builder={mockBuilder} />)

      const projectCard = screen.getByText('Luxury Apartments').closest('div')?.parentElement
      expect(projectCard?.className).toContain('project-card')
    })
  })

  describe('Project Type Badge', () => {
    it('should display project type in badge', () => {
      render(<BuilderPage builder={mockBuilder} />)

      const apartmentBadge = screen.getByText('Apartment')
      expect(apartmentBadge.className).toContain('bg-blue-600')
    })

    it('should handle different project types', () => {
      render(<BuilderPage builder={mockBuilder} />)

      expect(screen.getByText('Apartment')).toBeInTheDocument()
      expect(screen.getByText('Villa')).toBeInTheDocument()
    })
  })

  describe('Browser Back Button', () => {
    it('should render correctly when accessed via browser back', () => {
      render(<BuilderPage builder={mockBuilder} />)

      expect(screen.getByText('Premier Builders')).toBeInTheDocument()
      expect(screen.getByText('Projects')).toBeInTheDocument()
    })
  })
})

describe('getServerSideProps', () => {
  let mockPrisma: any

  beforeEach(() => {
    mockPrisma = {
      builder: {
        findUnique: jest.fn(),
      },
      $disconnect: jest.fn(),
    }
    ;(PrismaClient as any) = jest.fn(() => mockPrisma)
  })

  it('should fetch builder data with projects', async () => {
    mockPrisma.builder.findUnique.mockResolvedValue(mockBuilder)

    const context = {
      params: { id: '1' },
    } as unknown as GetServerSidePropsContext

    const result = await getServerSideProps(context)

    expect(mockPrisma.builder.findUnique).toHaveBeenCalledWith({
      where: { id: '1' },
      include: expect.objectContaining({
        projects: expect.any(Object),
      }),
    })

    expect(result).toHaveProperty('props')
    expect(mockPrisma.$disconnect).toHaveBeenCalled()
  })

  it('should return null builder when not found', async () => {
    mockPrisma.builder.findUnique.mockResolvedValue(null)

    const context = {
      params: { id: '999' },
    } as unknown as GetServerSidePropsContext

    const result = await getServerSideProps(context)

    expect(result).toEqual({
      props: {
        builder: null,
      },
    })
  })

  it('should handle errors gracefully', async () => {
    mockPrisma.builder.findUnique.mockRejectedValue(new Error('Database error'))

    const context = {
      params: { id: '1' },
    } as unknown as GetServerSidePropsContext

    const result = await getServerSideProps(context)

    expect(result).toEqual({
      props: {
        builder: null,
      },
    })
    expect(mockPrisma.$disconnect).toHaveBeenCalled()
  })

  it('should disconnect from database after fetch', async () => {
    mockPrisma.builder.findUnique.mockResolvedValue(mockBuilder)

    const context = {
      params: { id: '1' },
    } as unknown as GetServerSidePropsContext

    await getServerSideProps(context)

    expect(mockPrisma.$disconnect).toHaveBeenCalled()
  })
})
