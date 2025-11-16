import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock Prisma client before importing page component
jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    project: {
      findUnique: jest.fn(),
    },
    property: {
      findMany: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
    interest: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}))

import ProjectPage, { getServerSideProps } from '@/pages/projects/[id]'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'

// Mock dependencies
jest.mock('next-auth/react')
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))
jest.mock('@/components/Header', () => ({
  __esModule: true,
  default: () => <div data-testid="header">Header</div>,
}))
jest.mock('@/components/Footer', () => ({
  __esModule: true,
  default: () => <div data-testid="footer">Footer</div>,
}))
jest.mock('@/components/properties/PropertyMap', () => ({
  __esModule: true,
  default: ({ latitude, longitude, address }: any) => (
    <div data-testid="property-map">
      Map: {latitude},{longitude} - {address}
    </div>
  ),
}))
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />
  },
}))
jest.mock('next-seo', () => ({
  NextSeo: ({ title, description }: any) => (
    <div data-testid="next-seo">
      <div>{title}</div>
      <div>{description}</div>
    </div>
  ),
}))

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>

const mockProject = {
  id: 'project1',
  name: 'Test Project',
  description: 'Test Description',
  type: 'APARTMENT',
  numberOfUnits: 100,
  size: 5000,
  googlePin: 'https://maps.google.com/pin',
  thumbnailUrl: '/test-thumbnail.jpg',
  imageUrls: ['/test1.jpg', '/test2.jpg'],
  bannerImageUrl: '/banner.jpg',
  floorplanImageUrls: ['/floor1.jpg'],
  clubhouseImageUrls: ['/club1.jpg'],
  galleryImageUrls: ['/gallery1.jpg', '/gallery2.jpg'],
  walkthroughVideoUrl: 'https://youtube.com/watch?v=test',
  highlights: ['Modern Design', 'Prime Location'],
  amenities: ['Swimming Pool', 'Gym', 'Park'],
  projectDetails: { reraNumber: 'RERA123' },
  builderPageUrl: null,
  builderProspectusUrl: null,
  builderWebsiteLink: 'https://builder.com',
  brochureUrl: 'https://builder.com/brochure.pdf',
  contactPersonFirstName: 'John',
  contactPersonLastName: 'Doe',
  contactPersonEmail: 'john@example.com',
  contactPersonPhone: '+911234567890',
  isArchived: false,
  postedByUserId: 'user1',
  builder: {
    id: 'builder1',
    name: 'Test Builder',
    description: 'Builder Description',
    logoUrl: '/logo.jpg',
    website: 'https://builder.com',
    contactInfo: {},
  },
  location: {
    id: 'loc1',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    locality: 'Andheri',
    zipcode: '400001',
    neighborhood: 'West',
    latitude: 19.076,
    longitude: 72.8777,
    formattedAddress: 'Andheri West, Mumbai, Maharashtra 400001',
  },
  postedBy: {
    id: 'user1',
    name: 'Test User',
    email: 'test@example.com',
    phone: '+911234567890',
  },
}

describe('ProjectPage Component', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
    mockUseRouter.mockReturnValue({
      push: mockPush,
      pathname: '/projects/[id]',
      query: { id: 'project1' },
      asPath: '/projects/project1',
    } as any)
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    })
  })

  describe('Rendering - Null Project', () => {
    it('renders not found message when project is null', () => {
      render(<ProjectPage project={null} />)
      expect(screen.getByText('Project Not Found')).toBeInTheDocument()
    })

    it('shows header and footer when project is null', () => {
      render(<ProjectPage project={null} />)
      expect(screen.getByTestId('header')).toBeInTheDocument()
      expect(screen.getByTestId('footer')).toBeInTheDocument()
    })

    it('shows link to browse all projects', () => {
      render(<ProjectPage project={null} />)
      const link = screen.getByText('Browse All Projects')
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/projects')
    })
  })

  describe('Rendering - Valid Project', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          featuredProperties: [],
          regularProperties: [],
          featuredAgents: [],
          regularAgents: [],
        }),
      })
    })

    it('renders project name', async () => {
      render(<ProjectPage project={mockProject} />)
      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument()
      })
    })

    it('renders builder name', async () => {
      render(<ProjectPage project={mockProject} />)
      await waitFor(() => {
        expect(screen.getByText('Test Builder')).toBeInTheDocument()
      })
    })

    it('renders location', async () => {
      render(<ProjectPage project={mockProject} />)
      await waitFor(() => {
        expect(screen.getByText(/Andheri/)).toBeInTheDocument()
        expect(screen.getByText(/Mumbai/)).toBeInTheDocument()
        expect(screen.getByText(/Maharashtra/)).toBeInTheDocument()
      })
    })

    it('renders description', async () => {
      render(<ProjectPage project={mockProject} />)
      await waitFor(() => {
        expect(screen.getByText('Test Description')).toBeInTheDocument()
      })
    })

    it('renders RERA number', async () => {
      render(<ProjectPage project={mockProject} />)
      await waitFor(() => {
        expect(screen.getByText(/RERA123/)).toBeInTheDocument()
      })
    })

    it('renders highlights section', async () => {
      render(<ProjectPage project={mockProject} />)
      await waitFor(() => {
        expect(screen.getByText('Modern Design')).toBeInTheDocument()
        expect(screen.getByText('Prime Location')).toBeInTheDocument()
      })
    })

    it('renders amenities section', async () => {
      render(<ProjectPage project={mockProject} />)
      await waitFor(() => {
        expect(screen.getByText('Swimming Pool')).toBeInTheDocument()
        expect(screen.getByText('Gym')).toBeInTheDocument()
        expect(screen.getByText('Park')).toBeInTheDocument()
      })
    })

    it('renders SEO metadata', async () => {
      render(<ProjectPage project={mockProject} />)
      await waitFor(() => {
        expect(screen.getByTestId('next-seo')).toBeInTheDocument()
      })
    })

    it('renders header and footer', async () => {
      render(<ProjectPage project={mockProject} />)
      expect(screen.getByTestId('header')).toBeInTheDocument()
      expect(screen.getByTestId('footer')).toBeInTheDocument()
    })
  })

  describe('Express Interest', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          featuredProperties: [],
          regularProperties: [],
          featuredAgents: [],
          regularAgents: [],
        }),
      })
    })

    it('shows express interest button', async () => {
      render(<ProjectPage project={mockProject} />)
      await waitFor(() => {
        expect(screen.getByText('Express Interest')).toBeInTheDocument()
      })
    })

    it('redirects to login when unauthenticated', async () => {
      render(<ProjectPage project={mockProject} />)

      const button = await screen.findByText('Express Interest')
      fireEvent.click(button)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login')
      })
    })

    it('calls API when authenticated', async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { email: 'test@example.com', name: 'Test User' },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: jest.fn(),
      })
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            featuredProperties: [],
            regularProperties: [],
            featuredAgents: [],
            regularAgents: [],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'Success' }),
        })

      render(<ProjectPage project={mockProject} />)

      const button = await screen.findByText('Express Interest')
      fireEvent.click(button)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/projects/${mockProject.id}/express-interest`,
          expect.objectContaining({
            method: 'POST',
          })
        )
      })
    })

    it('shows success toast on success', async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { email: 'test@example.com', name: 'Test User' },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: jest.fn(),
      })
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            featuredProperties: [],
            regularProperties: [],
            featuredAgents: [],
            regularAgents: [],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'Success' }),
        })

      render(<ProjectPage project={mockProject} />)

      const button = await screen.findByText('Express Interest')
      fireEvent.click(button)

      await waitFor(() => {
        expect(button).toHaveTextContent('Express Interest')
      })
    })

    it('handles API error', async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { email: 'test@example.com', name: 'Test User' },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: jest.fn(),
      })
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            featuredProperties: [],
            regularProperties: [],
            featuredAgents: [],
            regularAgents: [],
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ message: 'Error' }),
        })

      render(<ProjectPage project={mockProject} />)

      const button = await screen.findByText('Express Interest')
      fireEvent.click(button)

      await waitFor(() => {
        expect(button).toHaveTextContent('Express Interest')
      })
    })
  })

  describe('External Links', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          featuredProperties: [],
          regularProperties: [],
          featuredAgents: [],
          regularAgents: [],
        }),
      })
    })

    it('shows builder website link', async () => {
      render(<ProjectPage project={mockProject} />)
      await waitFor(() => {
        const link = screen.getByText('Visit Builder Website')
        expect(link).toHaveAttribute('href', mockProject.builderWebsiteLink)
        expect(link).toHaveAttribute('target', '_blank')
      })
    })

    it('shows brochure download link', async () => {
      render(<ProjectPage project={mockProject} />)
      await waitFor(() => {
        const link = screen.getByText('Download Brochure')
        expect(link).toHaveAttribute('href', mockProject.brochureUrl)
        expect(link).toHaveAttribute('download')
      })
    })

    it('uses builderProspectusUrl if brochureUrl is null', async () => {
      const projectWithProspectus = {
        ...mockProject,
        brochureUrl: null,
        builderProspectusUrl: 'https://builder.com/prospectus.pdf',
      }
      render(<ProjectPage project={projectWithProspectus} />)
      await waitFor(() => {
        const link = screen.getByText('Download Brochure')
        expect(link).toHaveAttribute('href', 'https://builder.com/prospectus.pdf')
      })
    })
  })

  describe('Properties Section', () => {
    it('fetches properties on mount', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          featuredProperties: [],
          regularProperties: [],
          featuredAgents: [],
          regularAgents: [],
        }),
      })

      render(<ProjectPage project={mockProject} />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(`/api/projects/${mockProject.id}/properties`)
      })
    })

    it('displays properties count', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          featuredProperties: [{ id: '1' }],
          regularProperties: [{ id: '2' }],
          featuredAgents: [],
          regularAgents: [],
        }),
      })

      render(<ProjectPage project={mockProject} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Properties.*2/ })).toBeInTheDocument()
      })
    })

    it('shows no properties message when empty', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          featuredProperties: [],
          regularProperties: [],
          featuredAgents: [],
          regularAgents: [],
        }),
      })

      render(<ProjectPage project={mockProject} />)

      await waitFor(() => {
        expect(
          screen.getByText('No properties are tagged for this project yet.')
        ).toBeInTheDocument()
      })
    })
  })

  describe('Agents Section', () => {
    it('fetches agents on mount', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          featuredProperties: [],
          regularProperties: [],
          featuredAgents: [],
          regularAgents: [],
        }),
      })

      render(<ProjectPage project={mockProject} />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(`/api/projects/${mockProject.id}/agents`)
      })
    })

    it('displays agents count', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          featuredProperties: [],
          regularProperties: [],
          featuredAgents: [{ id: '1', agent: {} }],
          regularAgents: [{ id: '2', agent: {} }],
        }),
      })

      render(<ProjectPage project={mockProject} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Agents.*2/ })).toBeInTheDocument()
      })
    })

    it('shows no agents message when empty', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          featuredProperties: [],
          regularProperties: [],
          featuredAgents: [],
          regularAgents: [],
        }),
      })

      render(<ProjectPage project={mockProject} />)

      await waitFor(() => {
        expect(screen.getByText('No agents registered for this project yet.')).toBeInTheDocument()
      })
    })
  })

  describe('Location Map', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          featuredProperties: [],
          regularProperties: [],
          featuredAgents: [],
          regularAgents: [],
        }),
      })
    })

    it('renders map when coordinates are available', async () => {
      render(<ProjectPage project={mockProject} />)
      await waitFor(() => {
        expect(screen.getByTestId('property-map')).toBeInTheDocument()
      })
    })

    it('does not render map when coordinates are missing', async () => {
      const projectWithoutCoords = {
        ...mockProject,
        location: {
          ...mockProject.location,
          latitude: null,
          longitude: null,
        },
      }
      render(<ProjectPage project={projectWithoutCoords} />)
      await waitFor(() => {
        expect(screen.queryByTestId('property-map')).not.toBeInTheDocument()
      })
    })
  })

  describe('Image Galleries', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          featuredProperties: [],
          regularProperties: [],
          featuredAgents: [],
          regularAgents: [],
        }),
      })
    })

    it('renders banner image', async () => {
      render(<ProjectPage project={mockProject} />)
      await waitFor(() => {
        const img = screen.getByAltText('Test Project')
        expect(img).toHaveAttribute('src', mockProject.bannerImageUrl)
      })
    })

    it('renders floor plan images', async () => {
      render(<ProjectPage project={mockProject} />)
      await waitFor(() => {
        expect(screen.getByText('Floor Plans')).toBeInTheDocument()
        expect(screen.getByAltText('Floor Plan 1')).toBeInTheDocument()
      })
    })

    it('renders clubhouse images', async () => {
      render(<ProjectPage project={mockProject} />)
      await waitFor(() => {
        expect(screen.getByText('Clubhouse')).toBeInTheDocument()
        expect(screen.getByAltText('Clubhouse 1')).toBeInTheDocument()
      })
    })

    it('renders gallery images', async () => {
      render(<ProjectPage project={mockProject} />)
      await waitFor(() => {
        expect(screen.getByText('Gallery')).toBeInTheDocument()
        expect(screen.getByAltText('Gallery Image 1')).toBeInTheDocument()
        expect(screen.getByAltText('Gallery Image 2')).toBeInTheDocument()
      })
    })
  })

  describe('Video Walkthrough', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          featuredProperties: [],
          regularProperties: [],
          featuredAgents: [],
          regularAgents: [],
        }),
      })
    })

    it('renders walkthrough video iframe', async () => {
      render(<ProjectPage project={mockProject} />)
      await waitFor(() => {
        expect(screen.getByText('Virtual Walkthrough')).toBeInTheDocument()
        const iframe = screen.getByTitle('Project Walkthrough')
        expect(iframe).toBeInTheDocument()
        expect(iframe).toHaveAttribute('src', 'https://youtube.com/embed/test')
      })
    })

    it('does not render video section when URL is missing', async () => {
      const projectWithoutVideo = {
        ...mockProject,
        walkthroughVideoUrl: null,
      }
      render(<ProjectPage project={projectWithoutVideo} />)
      await waitFor(() => {
        expect(screen.queryByText('Virtual Walkthrough')).not.toBeInTheDocument()
      })
    })
  })

  describe('Posted By Section', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          featuredProperties: [],
          regularProperties: [],
          featuredAgents: [],
          regularAgents: [],
        }),
      })
    })

    it('shows posted by section when authenticated', async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { email: 'test@example.com', name: 'Test User' },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: jest.fn(),
      })

      render(<ProjectPage project={mockProject} />)
      await waitFor(() => {
        expect(screen.getByText('Posted By')).toBeInTheDocument()
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('john@example.com')).toBeInTheDocument()
        expect(screen.getByText('+911234567890')).toBeInTheDocument()
      })
    })

    it('does not show posted by section when unauthenticated', async () => {
      render(<ProjectPage project={mockProject} />)
      await waitFor(() => {
        expect(screen.queryByText('Posted By')).not.toBeInTheDocument()
      })
    })
  })

  describe('Registered Agent Banner', () => {
    it('shows banner when user is registered agent', async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { email: 'agent@example.com', name: 'Agent' },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: jest.fn(),
      })
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          featuredProperties: [],
          regularProperties: [],
          featuredAgents: [
            {
              id: '1',
              agent: { email: 'agent@example.com', name: 'Agent' },
            },
          ],
          regularAgents: [],
        }),
      })

      render(<ProjectPage project={mockProject} />)

      await waitFor(() => {
        expect(
          screen.getByText('You are registered as an agent for this project')
        ).toBeInTheDocument()
      })
    })

    it('can close banner', async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { email: 'agent@example.com', name: 'Agent' },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: jest.fn(),
      })
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          featuredProperties: [],
          regularProperties: [],
          featuredAgents: [
            {
              id: '1',
              agent: { email: 'agent@example.com', name: 'Agent' },
            },
          ],
          regularAgents: [],
        }),
      })

      render(<ProjectPage project={mockProject} />)

      await waitFor(() => {
        const closeButton = screen.getByText('×')
        fireEvent.click(closeButton)
      })

      await waitFor(() => {
        expect(
          screen.queryByText('You are registered as an agent for this project')
        ).not.toBeInTheDocument()
      })
    })
  })
})

describe('getServerSideProps', () => {
  const mockPrisma = {
    project: {
      findUnique: jest.fn(),
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.mock('@/lib/cockroachDB/prisma', () => ({
      prisma: mockPrisma,
    }))
  })

  it('fetches project by ID', async () => {
    const { prisma } = require('@/lib/cockroachDB/prisma')
    prisma.project.findUnique = jest.fn().mockResolvedValue(mockProject)

    const result = await getServerSideProps({
      params: { id: 'project1' },
    } as any)

    expect(prisma.project.findUnique).toHaveBeenCalledWith({
      where: { id: 'project1' },
      include: expect.any(Object),
    })
  })

  it('returns null when project not found', async () => {
    const { prisma } = require('@/lib/cockroachDB/prisma')
    prisma.project.findUnique = jest.fn().mockResolvedValue(null)

    const result = await getServerSideProps({
      params: { id: 'nonexistent' },
    } as any)

    expect(result).toEqual({
      props: {
        project: null,
      },
    })
  })

  it('handles errors gracefully', async () => {
    const { prisma } = require('@/lib/cockroachDB/prisma')
    prisma.project.findUnique = jest.fn().mockRejectedValue(new Error('DB Error'))

    const result = await getServerSideProps({
      params: { id: 'project1' },
    } as any)

    expect(result).toEqual({
      props: {
        project: null,
      },
    })
  })
})
