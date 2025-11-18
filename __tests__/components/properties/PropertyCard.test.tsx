import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { useRouter } from 'next/router'
import PropertyCard from '@/components/properties/PropertyCard'
import { mockRouter } from '@/__tests__/utils/test-utils'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

describe('PropertyCard Component', () => {
  const mockProperty = {
    id: 'prop123',
    streetAddress: '123 Main St',
    location: {
      city: 'Hyderabad',
      state: 'Telangana',
      zipcode: '500081',
      locality: 'Madhapur',
    },
    project: 'Test Project',
    propertyType: 'CONDO',
    listingType: 'SALE',
    sqFt: 1200,
    imageUrls: ['https://example.com/image1.jpg'],
    listingStatus: 'ACTIVE',
    createdAt: '2024-01-15T10:30:00Z',
    userId: 'user123',
    bedrooms: 3,
    bathrooms: 2,
    price: 5000000,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
  })

  describe('Rendering', () => {
    it('should render property card', () => {
      render(<PropertyCard property={mockProperty} />)

      expect(screen.getByText('Test Project')).toBeInTheDocument()
    })

    it('should display property image', () => {
      const { container } = render(<PropertyCard property={mockProperty} />)

      const img = container.querySelector('img')
      expect(img).toBeInTheDocument()
    })

    it('should use thumbnailUrl if available', () => {
      const propertyWithThumbnail = {
        ...mockProperty,
        thumbnailUrl: 'https://example.com/thumbnail.jpg',
      }

      const { container } = render(<PropertyCard property={propertyWithThumbnail} />)

      const img = container.querySelector('img')
      expect(img?.src).toContain('thumbnail.jpg')
    })

    it('should use first imageUrl if no thumbnail', () => {
      const { container } = render(<PropertyCard property={mockProperty} />)

      const img = container.querySelector('img')
      expect(img?.src).toContain('image1.jpg')
    })

    it('should use placeholder if no images', () => {
      const propertyNoImages = {
        ...mockProperty,
        imageUrls: [],
        thumbnailUrl: null,
      }

      const { container } = render(<PropertyCard property={propertyNoImages} />)

      const img = container.querySelector('img')
      expect(img?.src).toContain('placeholder')
    })

    it('should display property type icon and label', () => {
      render(<PropertyCard property={mockProperty} />)

      expect(screen.getByText(/🏢/)).toBeInTheDocument()
      expect(screen.getByText(/Apartments/)).toBeInTheDocument()
    })

    it('should display city', () => {
      render(<PropertyCard property={mockProperty} />)

      expect(screen.getByText('Hyderabad')).toBeInTheDocument()
    })

    it('should display bedrooms count', () => {
      render(<PropertyCard property={mockProperty} />)

      expect(screen.getByText(/3 BHK/)).toBeInTheDocument()
    })

    it('should display bathrooms count', () => {
      render(<PropertyCard property={mockProperty} />)

      expect(screen.getByText(/2 Bath/)).toBeInTheDocument()
    })

    it('should display square footage', () => {
      render(<PropertyCard property={mockProperty} />)

      expect(screen.getByText(/1200 sq ft/)).toBeInTheDocument()
    })

    it('should display formatted price', () => {
      render(<PropertyCard property={mockProperty} />)

      expect(screen.getByText(/₹50,00,000/)).toBeInTheDocument()
    })

    it('should display created date', () => {
      render(<PropertyCard property={mockProperty} />)

      expect(screen.getByText(/Posted:/)).toBeInTheDocument()
      expect(screen.getByText(/Jan/)).toBeInTheDocument()
    })

    it('should display View Details button', () => {
      render(<PropertyCard property={mockProperty} />)

      expect(screen.getByText('View Details')).toBeInTheDocument()
    })
  })

  describe('Property Types', () => {
    it('should display Villa icon for SINGLE_FAMILY', () => {
      const villaProperty = { ...mockProperty, propertyType: 'SINGLE_FAMILY' }
      render(<PropertyCard property={villaProperty} />)

      expect(screen.getByText(/🏡/)).toBeInTheDocument()
      expect(screen.getByText(/Villas/)).toBeInTheDocument()
    })

    it('should display Apartment icon for CONDO', () => {
      const condoProperty = { ...mockProperty, propertyType: 'CONDO' }
      render(<PropertyCard property={condoProperty} />)

      expect(screen.getByText(/🏢/)).toBeInTheDocument()
      expect(screen.getByText(/Apartments/)).toBeInTheDocument()
    })

    it('should display Land icon for LAND_RESIDENTIAL', () => {
      const landProperty = { ...mockProperty, propertyType: 'LAND_RESIDENTIAL' }
      render(<PropertyCard property={landProperty} />)

      expect(screen.getByText(/🏞️/)).toBeInTheDocument()
      expect(screen.getByText(/Residential Lands/)).toBeInTheDocument()
    })

    it('should display Agriculture icon for LAND_AGRICULTURE', () => {
      const agriProperty = { ...mockProperty, propertyType: 'LAND_AGRICULTURE' }
      render(<PropertyCard property={agriProperty} />)

      expect(screen.getByText(/🌾/)).toBeInTheDocument()
      expect(screen.getByText(/Agriculture Lands/)).toBeInTheDocument()
    })

    it('should display Commercial icon for COMMERCIAL', () => {
      const commercialProperty = { ...mockProperty, propertyType: 'COMMERCIAL' }
      render(<PropertyCard property={commercialProperty} />)

      expect(screen.getByText(/🏬/)).toBeInTheDocument()
      expect(screen.getByText(/Commercial/)).toBeInTheDocument()
    })
  })

  describe('Listing Status', () => {
    it('should show SOLD badge for sold properties', () => {
      const soldProperty = { ...mockProperty, listingStatus: 'SOLD' }
      render(<PropertyCard property={soldProperty} />)

      expect(screen.getByText('SOLD')).toBeInTheDocument()
    })

    it('should show Rent badge for rental properties', () => {
      const rentProperty = { ...mockProperty, listingType: 'RENT', listingStatus: 'ACTIVE' }
      render(<PropertyCard property={rentProperty} />)

      expect(screen.getByText('Rent')).toBeInTheDocument()
    })

    it('should not show Rent badge if property is sold', () => {
      const soldRentProperty = { ...mockProperty, listingType: 'RENT', listingStatus: 'SOLD' }
      render(<PropertyCard property={soldRentProperty} />)

      expect(screen.queryByText('Rent')).not.toBeInTheDocument()
      expect(screen.getByText('SOLD')).toBeInTheDocument()
    })

    it('should not show Rent badge for sale properties', () => {
      const saleProperty = { ...mockProperty, listingType: 'SALE' }
      render(<PropertyCard property={saleProperty} />)

      expect(screen.queryByText('Rent')).not.toBeInTheDocument()
    })
  })

  describe('Project Name', () => {
    it('should display project name when project is string', () => {
      const propertyWithStringProject = { ...mockProperty, project: 'My Project Name' }
      render(<PropertyCard property={propertyWithStringProject} />)

      expect(screen.getByText('My Project Name')).toBeInTheDocument()
    })

    it('should display project name when project is object', () => {
      const propertyWithObjectProject = {
        ...mockProperty,
        project: { id: 'proj123', name: 'Object Project Name' },
      }
      render(<PropertyCard property={propertyWithObjectProject} />)

      expect(screen.getByText('Object Project Name')).toBeInTheDocument()
    })

    it('should use default Property if project has no name', () => {
      const propertyWithEmptyProject = {
        ...mockProperty,
        project: { id: 'proj123', name: '' },
      }
      render(<PropertyCard property={propertyWithEmptyProject} />)

      expect(screen.getByText('Property')).toBeInTheDocument()
    })
  })

  describe('Price Formatting', () => {
    it('should format price in Indian currency format', () => {
      const propertyWithPrice = { ...mockProperty, price: 7500000 }
      render(<PropertyCard property={propertyWithPrice} />)

      expect(screen.getByText(/₹75,00,000/)).toBeInTheDocument()
    })

    it('should handle string price', () => {
      const propertyWithStringPrice = { ...mockProperty, price: '3500000' }
      render(<PropertyCard property={propertyWithStringPrice} />)

      expect(screen.getByText(/₹35,00,000/)).toBeInTheDocument()
    })

    it('should not display price if null', () => {
      const propertyNoPrice = { ...mockProperty, price: null }
      render(<PropertyCard property={propertyNoPrice} />)

      expect(screen.queryByText(/₹/)).not.toBeInTheDocument()
    })

    it('should not display price if undefined', () => {
      const propertyNoPrice = { ...mockProperty, price: undefined }
      render(<PropertyCard property={propertyNoPrice} />)

      expect(screen.queryByText(/₹/)).not.toBeInTheDocument()
    })

    it('should handle invalid price string', () => {
      const propertyInvalidPrice = { ...mockProperty, price: 'invalid' }
      render(<PropertyCard property={propertyInvalidPrice} />)

      expect(screen.queryByText(/₹/)).not.toBeInTheDocument()
    })

    it('should format large prices correctly', () => {
      const expensiveProperty = { ...mockProperty, price: 50000000 }
      render(<PropertyCard property={expensiveProperty} />)

      expect(screen.getByText(/₹5,00,00,000/)).toBeInTheDocument()
    })
  })

  describe('Property Details', () => {
    it('should not display bedrooms if not provided', () => {
      const propertyNoBedrooms = { ...mockProperty, bedrooms: null }
      render(<PropertyCard property={propertyNoBedrooms} />)

      expect(screen.queryByText(/BHK/)).not.toBeInTheDocument()
    })

    it('should not display bathrooms if not provided', () => {
      const propertyNoBathrooms = { ...mockProperty, bathrooms: null }
      render(<PropertyCard property={propertyNoBathrooms} />)

      expect(screen.queryByText(/Bath/)).not.toBeInTheDocument()
    })

    it('should not display sqFt if not provided', () => {
      const propertyNoSqFt = { ...mockProperty, sqFt: null }
      render(<PropertyCard property={propertyNoSqFt} />)

      expect(screen.queryByText(/sq ft/)).not.toBeInTheDocument()
    })

    it('should handle string bedrooms', () => {
      const propertyStringBedrooms = { ...mockProperty, bedrooms: '4' }
      render(<PropertyCard property={propertyStringBedrooms} />)

      expect(screen.getByText(/4 BHK/)).toBeInTheDocument()
    })

    it('should handle string bathrooms', () => {
      const propertyStringBathrooms = { ...mockProperty, bathrooms: '3' }
      render(<PropertyCard property={propertyStringBathrooms} />)

      expect(screen.getByText(/3 Bath/)).toBeInTheDocument()
    })
  })

  describe('Date Formatting', () => {
    it('should format date with month, day, year', () => {
      render(<PropertyCard property={mockProperty} />)

      expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument()
    })

    it('should format time with hours and minutes', () => {
      render(<PropertyCard property={mockProperty} />)

      expect(screen.getByText(/AM|PM/i)).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('should navigate to property details on View Details click', () => {
      render(<PropertyCard property={mockProperty} />)

      const viewButton = screen.getByText('View Details')
      fireEvent.click(viewButton)

      expect(mockRouter.push).toHaveBeenCalledWith('/properties/prop123')
    })
  })

  describe('Owner Actions', () => {
    const mockOnMarkAsSold = jest.fn()

    it('should not show Sold button for non-owners', () => {
      render(<PropertyCard property={mockProperty} isOwner={false} />)

      expect(screen.queryByText('Sold')).not.toBeInTheDocument()
    })

    it('should show Sold button for owners with active listings', () => {
      render(
        <PropertyCard property={mockProperty} isOwner={true} onMarkAsSold={mockOnMarkAsSold} />
      )

      expect(screen.getByText('Sold')).toBeInTheDocument()
    })

    it('should not show Sold button if property is already sold', () => {
      const soldProperty = { ...mockProperty, listingStatus: 'SOLD' }
      render(
        <PropertyCard property={soldProperty} isOwner={true} onMarkAsSold={mockOnMarkAsSold} />
      )

      expect(screen.queryByText('Sold')).not.toBeInTheDocument()
    })

    it('should not show Sold button if onMarkAsSold is not provided', () => {
      render(<PropertyCard property={mockProperty} isOwner={true} />)

      expect(screen.queryByText('Sold')).not.toBeInTheDocument()
    })

    it('should call onMarkAsSold when Sold button is clicked', () => {
      render(
        <PropertyCard property={mockProperty} isOwner={true} onMarkAsSold={mockOnMarkAsSold} />
      )

      const soldButton = screen.getByText('Sold')
      fireEvent.click(soldButton)

      expect(mockOnMarkAsSold).toHaveBeenCalledWith('prop123')
    })

    it('should disable Sold button when processing', () => {
      render(
        <PropertyCard
          property={mockProperty}
          isOwner={true}
          onMarkAsSold={mockOnMarkAsSold}
          processing={true}
        />
      )

      const soldButton = screen.getByText('Sold')
      expect(soldButton).toBeDisabled()
    })

    it('should not disable Sold button when not processing', () => {
      render(
        <PropertyCard
          property={mockProperty}
          isOwner={true}
          onMarkAsSold={mockOnMarkAsSold}
          processing={false}
        />
      )

      const soldButton = screen.getByText('Sold')
      expect(soldButton).not.toBeDisabled()
    })
  })

  describe('CSS Classes and Styling', () => {
    it('should apply hover effect classes', () => {
      const { container } = render(<PropertyCard property={mockProperty} />)

      const card = container.querySelector('.hover\\:shadow-md')
      expect(card).toBeInTheDocument()
    })

    it('should apply border and shadow classes', () => {
      const { container } = render(<PropertyCard property={mockProperty} />)

      const card = container.querySelector('.border-gray-200.shadow-sm')
      expect(card).toBeInTheDocument()
    })

    it('should apply correct button styling', () => {
      render(<PropertyCard property={mockProperty} />)

      const button = screen.getByText('View Details')
      expect(button.className).toContain('bg-blue-600')
      expect(button.className).toContain('text-white')
    })

    it('should apply correct Sold button styling', () => {
      render(<PropertyCard property={mockProperty} isOwner={true} onMarkAsSold={jest.fn()} />)

      const soldButton = screen.getByText('Sold')
      expect(soldButton.className).toContain('bg-red-600')
      expect(soldButton.className).toContain('text-white')
    })
  })

  describe('Image Alt Text', () => {
    it('should have descriptive alt text for image', () => {
      const { container } = render(<PropertyCard property={mockProperty} />)

      const img = container.querySelector('img')
      expect(img?.alt).toContain('Test Project')
      expect(img?.alt).toContain('CONDO')
    })
  })

  describe('Favorites Functionality', () => {
    const mockOnToggleFavorite = jest.fn()

    beforeEach(() => {
      mockOnToggleFavorite.mockClear()
    })

    it('should not show favorite button when user is not logged in', () => {
      const { container } = render(
        <PropertyCard property={mockProperty} currentUserId={null} isFavorited={false} />
      )

      const favoriteButton = container.querySelector('svg')
      expect(favoriteButton).not.toBeInTheDocument()
    })

    it('should not show favorite button when user is the owner', () => {
      const { container } = render(
        <PropertyCard
          property={mockProperty}
          isOwner={true}
          currentUserId="user123"
          isFavorited={false}
        />
      )

      // Only view details button should exist
      const buttons = container.querySelectorAll('button')
      expect(buttons).toHaveLength(0) // No favorite button for owners
    })

    it('should show favorite button for logged-in non-owners', () => {
      const { container } = render(
        <PropertyCard
          property={mockProperty}
          isOwner={false}
          currentUserId="other-user"
          isFavorited={false}
          onToggleFavorite={mockOnToggleFavorite}
        />
      )

      const favoriteButton = container.querySelector('button[title*="favorite"]')
      expect(favoriteButton).toBeInTheDocument()
    })

    it('should display unfilled heart icon when not favorited', () => {
      const { container } = render(
        <PropertyCard
          property={mockProperty}
          isOwner={false}
          currentUserId="other-user"
          isFavorited={false}
          onToggleFavorite={mockOnToggleFavorite}
        />
      )

      const heartIcon = container.querySelector('svg')
      expect(heartIcon).toBeInTheDocument()
      expect(heartIcon?.getAttribute('fill')).toBe('none')
      expect(heartIcon?.getAttribute('stroke')).toBe('#6b7280')
    })

    it('should display filled red heart icon when favorited', () => {
      const { container } = render(
        <PropertyCard
          property={mockProperty}
          isOwner={false}
          currentUserId="other-user"
          isFavorited={true}
          onToggleFavorite={mockOnToggleFavorite}
        />
      )

      const heartIcon = container.querySelector('svg')
      expect(heartIcon).toBeInTheDocument()
      expect(heartIcon?.getAttribute('fill')).toBe('#ef4444')
      expect(heartIcon?.getAttribute('stroke')).toBe('#ef4444')
    })

    it('should call onToggleFavorite when favorite button is clicked', () => {
      const { container } = render(
        <PropertyCard
          property={mockProperty}
          isOwner={false}
          currentUserId="other-user"
          isFavorited={false}
          onToggleFavorite={mockOnToggleFavorite}
        />
      )

      const favoriteButton = container.querySelector('button[title*="favorite"]')
      if (favoriteButton) {
        fireEvent.click(favoriteButton)
      }

      expect(mockOnToggleFavorite).toHaveBeenCalledWith('prop123', false)
    })

    it('should call onToggleFavorite with correct state when favorited', () => {
      const { container } = render(
        <PropertyCard
          property={mockProperty}
          isOwner={false}
          currentUserId="other-user"
          isFavorited={true}
          onToggleFavorite={mockOnToggleFavorite}
        />
      )

      const favoriteButton = container.querySelector('button[title*="favorite"]')
      if (favoriteButton) {
        fireEvent.click(favoriteButton)
      }

      expect(mockOnToggleFavorite).toHaveBeenCalledWith('prop123', true)
    })

    it('should stop event propagation when favorite button is clicked', () => {
      const { container } = render(
        <PropertyCard
          property={mockProperty}
          isOwner={false}
          currentUserId="other-user"
          isFavorited={false}
          onToggleFavorite={mockOnToggleFavorite}
        />
      )

      const favoriteButton = container.querySelector('button[title*="favorite"]')
      if (favoriteButton) {
        const clickEvent = new MouseEvent('click', { bubbles: true })
        const stopPropagationSpy = jest.spyOn(clickEvent, 'stopPropagation')
        fireEvent(favoriteButton, clickEvent)

        expect(stopPropagationSpy).toHaveBeenCalled()
      }
    })

    it('should have correct tooltip for unfavorited property', () => {
      const { container } = render(
        <PropertyCard
          property={mockProperty}
          isOwner={false}
          currentUserId="other-user"
          isFavorited={false}
          onToggleFavorite={mockOnToggleFavorite}
        />
      )

      const favoriteButton = container.querySelector('button[title*="favorite"]')
      expect(favoriteButton?.getAttribute('title')).toBe('Add to favorites')
    })

    it('should have correct tooltip for favorited property', () => {
      const { container } = render(
        <PropertyCard
          property={mockProperty}
          isOwner={false}
          currentUserId="other-user"
          isFavorited={true}
          onToggleFavorite={mockOnToggleFavorite}
        />
      )

      const favoriteButton = container.querySelector('button[title*="favorite"]')
      expect(favoriteButton?.getAttribute('title')).toBe('Remove from favorites')
    })

    it('should not call onToggleFavorite if callback is not provided', () => {
      const { container } = render(
        <PropertyCard
          property={mockProperty}
          isOwner={false}
          currentUserId="other-user"
          isFavorited={false}
        />
      )

      const favoriteButton = container.querySelector('button[title*="favorite"]')
      if (favoriteButton) {
        fireEvent.click(favoriteButton)
      }

      expect(mockOnToggleFavorite).not.toHaveBeenCalled()
    })

    it('should apply correct styling to favorite button', () => {
      const { container } = render(
        <PropertyCard
          property={mockProperty}
          isOwner={false}
          currentUserId="other-user"
          isFavorited={false}
          onToggleFavorite={mockOnToggleFavorite}
        />
      )

      const favoriteButton = container.querySelector('button[title*="favorite"]')
      expect(favoriteButton?.className).toContain('bg-white')
      expect(favoriteButton?.className).toContain('rounded-full')
      expect(favoriteButton?.className).toContain('hover:bg-white')
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing location data', () => {
      const propertyNoLocation = {
        ...mockProperty,
        location: {
          city: '',
          state: '',
          zipcode: null,
          locality: null,
        },
      }

      render(<PropertyCard property={propertyNoLocation} />)
      expect(screen.getByText('View Details')).toBeInTheDocument()
    })

    it('should handle zero price', () => {
      const propertyZeroPrice = { ...mockProperty, price: 0 }
      render(<PropertyCard property={propertyZeroPrice} />)

      expect(screen.queryByText(/₹/)).not.toBeInTheDocument()
    })

    it('should handle zero bedrooms', () => {
      const propertyZeroBedrooms = { ...mockProperty, bedrooms: 0 }
      render(<PropertyCard property={propertyZeroBedrooms} />)

      expect(screen.queryByText(/BHK/)).not.toBeInTheDocument()
    })

    it('should handle all optional fields missing', () => {
      const minimalProperty = {
        ...mockProperty,
        bedrooms: null,
        bathrooms: null,
        sqFt: null,
        price: null,
      }

      render(<PropertyCard property={minimalProperty} />)
      expect(screen.getByText('Test Project')).toBeInTheDocument()
    })
  })
})
