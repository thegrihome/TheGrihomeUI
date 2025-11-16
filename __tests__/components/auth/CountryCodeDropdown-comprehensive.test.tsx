import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CountryCodeDropdown from '@/components/auth/CountryCodeDropdown'
import { countryCodes } from '@/lib/countryCodes'

describe('CountryCodeDropdown - Comprehensive Tests', () => {
  const mockOnChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render dropdown button', () => {
      render(<CountryCodeDropdown value="+91" onChange={mockOnChange} />)

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should display selected country flag', () => {
      render(<CountryCodeDropdown value="+91" onChange={mockOnChange} />)

      const button = screen.getByRole('button')
      expect(button.textContent).toContain('🇮🇳')
    })

    it('should display selected country dial code', () => {
      render(<CountryCodeDropdown value="+91" onChange={mockOnChange} />)

      expect(screen.getByText('+91')).toBeInTheDocument()
    })

    it('should display selected country code', () => {
      render(<CountryCodeDropdown value="+91" onChange={mockOnChange} />)

      expect(screen.getByText('IND')).toBeInTheDocument()
    })

    it('should display India country name in tooltip', () => {
      render(<CountryCodeDropdown value="+91" onChange={mockOnChange} />)

      expect(screen.getByText('India')).toBeInTheDocument()
    })

    it('should default to first country code if value not found', () => {
      render(<CountryCodeDropdown value="+999" onChange={mockOnChange} />)

      const firstCountry = countryCodes[0]
      expect(screen.getByText(firstCountry.dialCode)).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      const { container } = render(
        <CountryCodeDropdown value="+91" onChange={mockOnChange} className="custom-class" />
      )

      const dropdown = container.firstChild as HTMLElement
      expect(dropdown.className).toContain('custom-class')
    })
  })

  describe('Dropdown Toggle', () => {
    it('should open dropdown on button click', () => {
      render(<CountryCodeDropdown value="+91" onChange={mockOnChange} />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      expect(screen.getByPlaceholderText(/search countries/i)).toBeInTheDocument()
    })

    it('should close dropdown on second button click', () => {
      render(<CountryCodeDropdown value="+91" onChange={mockOnChange} />)

      const button = screen.getByRole('button')
      fireEvent.click(button)
      expect(screen.getByPlaceholderText(/search countries/i)).toBeInTheDocument()

      fireEvent.click(button)
      expect(screen.queryByPlaceholderText(/search countries/i)).not.toBeInTheDocument()
    })

    it('should close dropdown on outside click', async () => {
      render(<CountryCodeDropdown value="+91" onChange={mockOnChange} />)

      const button = screen.getByRole('button')
      fireEvent.click(button)
      expect(screen.getByPlaceholderText(/search countries/i)).toBeInTheDocument()

      fireEvent.mouseDown(document.body)

      await waitFor(() => {
        expect(screen.queryByPlaceholderText(/search countries/i)).not.toBeInTheDocument()
      })
    })

    it('should focus search input when dropdown opens', async () => {
      render(<CountryCodeDropdown value="+91" onChange={mockOnChange} />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/search countries/i)
        expect(document.activeElement).toBe(searchInput)
      })
    })

    it('should rotate chevron icon when dropdown is open', () => {
      render(<CountryCodeDropdown value="+91" onChange={mockOnChange} />)

      const button = screen.getByRole('button')
      const chevron = button.querySelector('svg')

      expect(chevron?.className).not.toContain('rotate-180')

      fireEvent.click(button)

      expect(chevron?.className).toContain('rotate-180')
    })
  })

  describe('Disabled State', () => {
    it('should render as disabled when disabled prop is true', () => {
      render(<CountryCodeDropdown value="+91" onChange={mockOnChange} disabled={true} />)

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('should have disabled styling when disabled', () => {
      render(<CountryCodeDropdown value="+91" onChange={mockOnChange} disabled={true} />)

      const button = screen.getByRole('button')
      expect(button.className).toContain('bg-gray-50')
      expect(button.className).toContain('cursor-not-allowed')
    })

    it('should not open dropdown when disabled', () => {
      render(<CountryCodeDropdown value="+91" onChange={mockOnChange} disabled={true} />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      expect(screen.queryByPlaceholderText(/search countries/i)).not.toBeInTheDocument()
    })

    it('should not show dropdown even if opened before disabling', () => {
      const { rerender } = render(<CountryCodeDropdown value="+91" onChange={mockOnChange} />)

      const button = screen.getByRole('button')
      fireEvent.click(button)
      expect(screen.getByPlaceholderText(/search countries/i)).toBeInTheDocument()

      rerender(<CountryCodeDropdown value="+91" onChange={mockOnChange} disabled={true} />)

      expect(screen.queryByPlaceholderText(/search countries/i)).not.toBeInTheDocument()
    })
  })

  describe('Country Search', () => {
    it('should filter countries by name', () => {
      render(<CountryCodeDropdown value="+91" onChange={mockOnChange} />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      const searchInput = screen.getByPlaceholderText(/search countries/i)
      fireEvent.change(searchInput, { target: { value: 'United States' } })

      expect(screen.getByText('+1')).toBeInTheDocument()
      expect(screen.queryByText('+91')).not.toBeInTheDocument()
    })

    it('should filter countries by dial code', () => {
      render(<CountryCodeDropdown value="+91" onChange={mockOnChange} />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      const searchInput = screen.getByPlaceholderText(/search countries/i)
      fireEvent.change(searchInput, { target: { value: '+44' } })

      expect(screen.getByText('GBR')).toBeInTheDocument()
    })

    it('should filter countries by 2-letter code', () => {
      render(<CountryCodeDropdown value="+91" onChange={mockOnChange} />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      const searchInput = screen.getByPlaceholderText(/search countries/i)
      fireEvent.change(searchInput, { target: { value: 'US' } })

      expect(screen.getByText('+1')).toBeInTheDocument()
    })

    it('should filter countries by 3-letter code', () => {
      render(<CountryCodeDropdown value="+91" onChange={mockOnChange} />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      const searchInput = screen.getByPlaceholderText(/search countries/i)
      fireEvent.change(searchInput, { target: { value: 'GBR' } })

      expect(screen.getByText('+44')).toBeInTheDocument()
    })

    it('should be case-insensitive', () => {
      render(<CountryCodeDropdown value="+91" onChange={mockOnChange} />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      const searchInput = screen.getByPlaceholderText(/search countries/i)
      fireEvent.change(searchInput, { target: { value: 'INDIA' } })

      expect(screen.getByText('IND')).toBeInTheDocument()
    })

    it('should show no countries message when no match found', () => {
      render(<CountryCodeDropdown value="+91" onChange={mockOnChange} />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      const searchInput = screen.getByPlaceholderText(/search countries/i)
      fireEvent.change(searchInput, { target: { value: 'zzzzz' } })

      expect(screen.getByText(/no countries found/i)).toBeInTheDocument()
    })

    it('should clear search term when dropdown closes', async () => {
      render(<CountryCodeDropdown value="+91" onChange={mockOnChange} />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      const searchInput = screen.getByPlaceholderText(/search countries/i)
      fireEvent.change(searchInput, { target: { value: 'India' } })

      fireEvent.mouseDown(document.body)

      await waitFor(() => {
        expect(screen.queryByPlaceholderText(/search countries/i)).not.toBeInTheDocument()
      })

      fireEvent.click(button)
      const newSearchInput = screen.getByPlaceholderText(/search countries/i)
      expect(newSearchInput).toHaveValue('')
    })

    it('should show all countries initially', () => {
      render(<CountryCodeDropdown value="+91" onChange={mockOnChange} />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      const countryButtons = screen.getAllByRole('button')
      // -1 for the main toggle button and -1 for search input area
      expect(countryButtons.length).toBeGreaterThan(100)
    })
  })

  describe('Country Selection', () => {
    it('should call onChange with selected dial code', () => {
      render(<CountryCodeDropdown value="+91" onChange={mockOnChange} />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      const searchInput = screen.getByPlaceholderText(/search countries/i)
      fireEvent.change(searchInput, { target: { value: 'United States' } })

      const usButton = screen.getByText('USA').closest('button')
      fireEvent.click(usButton!)

      expect(mockOnChange).toHaveBeenCalledWith('+1')
    })

    it('should close dropdown after selection', () => {
      render(<CountryCodeDropdown value="+91" onChange={mockOnChange} />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      const searchInput = screen.getByPlaceholderText(/search countries/i)
      fireEvent.change(searchInput, { target: { value: 'Japan' } })

      const jpButton = screen.getByText('JPN').closest('button')
      fireEvent.click(jpButton!)

      expect(screen.queryByPlaceholderText(/search countries/i)).not.toBeInTheDocument()
    })

    it('should clear search term after selection', async () => {
      render(<CountryCodeDropdown value="+91" onChange={mockOnChange} />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      const searchInput = screen.getByPlaceholderText(/search countries/i)
      fireEvent.change(searchInput, { target: { value: 'Canada' } })

      const caButton = screen.getByText('CAN').closest('button')
      fireEvent.click(caButton!)

      fireEvent.click(button)
      const newSearchInput = screen.getByPlaceholderText(/search countries/i)
      expect(newSearchInput).toHaveValue('')
    })

    it('should highlight selected country in dropdown', () => {
      render(<CountryCodeDropdown value="+91" onChange={mockOnChange} />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      const searchInput = screen.getByPlaceholderText(/search countries/i)
      fireEvent.change(searchInput, { target: { value: 'India' } })

      const indiaButton = screen.getByText('IND').closest('button')
      expect(indiaButton?.className).toContain('bg-blue-50')
    })

    it('should show country name in title attribute', () => {
      render(<CountryCodeDropdown value="+91" onChange={mockOnChange} />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      const searchInput = screen.getByPlaceholderText(/search countries/i)
      fireEvent.change(searchInput, { target: { value: 'India' } })

      const indiaButton = screen.getByText('IND').closest('button')
      expect(indiaButton).toHaveAttribute('title', 'India')
    })

    it('should allow selecting different countries multiple times', () => {
      render(<CountryCodeDropdown value="+91" onChange={mockOnChange} />)

      // First selection
      let button = screen.getByRole('button')
      fireEvent.click(button)
      let searchInput = screen.getByPlaceholderText(/search countries/i)
      fireEvent.change(searchInput, { target: { value: 'USA' } })
      const usButton = screen.getByText('USA').closest('button')
      fireEvent.click(usButton!)

      expect(mockOnChange).toHaveBeenCalledWith('+1')

      // Second selection
      button = screen.getByRole('button')
      fireEvent.click(button)
      searchInput = screen.getByPlaceholderText(/search countries/i)
      fireEvent.change(searchInput, { target: { value: 'Japan' } })
      const jpButton = screen.getByText('JPN').closest('button')
      fireEvent.click(jpButton!)

      expect(mockOnChange).toHaveBeenCalledWith('+81')
      expect(mockOnChange).toHaveBeenCalledTimes(2)
    })
  })

  describe('Accessibility', () => {
    it('should have proper button type', () => {
      render(<CountryCodeDropdown value="+91" onChange={mockOnChange} />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'button')
    })

    it('should have proper button types for country options', () => {
      render(<CountryCodeDropdown value="+91" onChange={mockOnChange} />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      const countryButtons = screen.getAllByRole('button')
      countryButtons.forEach(btn => {
        expect(btn).toHaveAttribute('type', 'button')
      })
    })

    it('should be keyboard accessible for search', () => {
      render(<CountryCodeDropdown value="+91" onChange={mockOnChange} />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      const searchInput = screen.getByPlaceholderText(/search countries/i)
      fireEvent.keyDown(searchInput, { key: 'I' })
      fireEvent.change(searchInput, { target: { value: 'I' } })

      expect(searchInput).toHaveValue('I')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty onChange gracefully', () => {
      const emptyOnChange = jest.fn()
      render(<CountryCodeDropdown value="+91" onChange={emptyOnChange} />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      const usButton = screen.getByText('USA').closest('button')
      fireEvent.click(usButton!)

      expect(emptyOnChange).toHaveBeenCalled()
    })

    it('should handle rapid toggle clicks', () => {
      render(<CountryCodeDropdown value="+91" onChange={mockOnChange} />)

      const button = screen.getByRole('button')
      fireEvent.click(button)
      fireEvent.click(button)
      fireEvent.click(button)

      expect(screen.getByPlaceholderText(/search countries/i)).toBeInTheDocument()
    })

    it('should maintain state across rerenders', () => {
      const { rerender } = render(<CountryCodeDropdown value="+91" onChange={mockOnChange} />)

      rerender(<CountryCodeDropdown value="+91" onChange={mockOnChange} />)

      expect(screen.getByText('IND')).toBeInTheDocument()
    })

    it('should update when value prop changes', () => {
      const { rerender } = render(<CountryCodeDropdown value="+91" onChange={mockOnChange} />)

      expect(screen.getByText('IND')).toBeInTheDocument()

      rerender(<CountryCodeDropdown value="+1" onChange={mockOnChange} />)

      expect(screen.getByText('USA')).toBeInTheDocument()
    })
  })
})
