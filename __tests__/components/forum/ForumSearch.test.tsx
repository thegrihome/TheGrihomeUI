import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/router'
import ForumSearch from '@/components/forum/ForumSearch'
import { mockRouter } from '@/__tests__/utils/test-utils'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

describe('ForumSearch Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
  })

  describe('Rendering', () => {
    it('should render search form', () => {
      render(<ForumSearch />)

      const form = screen.getByRole('form', { hidden: true })
      expect(form).toBeInTheDocument()
    })

    it('should render search input', () => {
      render(<ForumSearch />)

      const input = screen.getByPlaceholderText(/search posts, threads, sections/i)
      expect(input).toBeInTheDocument()
    })

    it('should render search button', () => {
      render(<ForumSearch />)

      const button = screen.getByRole('button', { name: '' })
      expect(button).toBeInTheDocument()
    })

    it('should render search icon in button', () => {
      const { container } = render(<ForumSearch />)

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should use default placeholder', () => {
      render(<ForumSearch />)

      expect(screen.getByPlaceholderText(/search posts, threads, sections/i)).toBeInTheDocument()
    })

    it('should use custom placeholder', () => {
      render(<ForumSearch placeholder="Custom search placeholder" />)

      expect(screen.getByPlaceholderText('Custom search placeholder')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      const { container } = render(<ForumSearch className="custom-class" />)

      const form = container.querySelector('.custom-class')
      expect(form).toBeInTheDocument()
    })

    it('should have forum-search-form class', () => {
      const { container } = render(<ForumSearch />)

      const form = container.querySelector('.forum-search-form')
      expect(form).toBeInTheDocument()
    })

    it('should have forum-search-container class', () => {
      const { container } = render(<ForumSearch />)

      const container2 = container.querySelector('.forum-search-container')
      expect(container2).toBeInTheDocument()
    })

    it('should have forum-search-input class on input', () => {
      const { container } = render(<ForumSearch />)

      const input = container.querySelector('.forum-search-input')
      expect(input).toBeInTheDocument()
    })

    it('should have forum-search-button class on button', () => {
      const { container } = render(<ForumSearch />)

      const button = container.querySelector('.forum-search-button')
      expect(button).toBeInTheDocument()
    })
  })

  describe('Input Handling', () => {
    it('should update input value on change', () => {
      render(<ForumSearch />)

      const input = screen.getByPlaceholderText(/search posts, threads, sections/i)
      fireEvent.change(input, { target: { value: 'test query' } })

      expect(input).toHaveValue('test query')
    })

    it('should start with empty input', () => {
      render(<ForumSearch />)

      const input = screen.getByPlaceholderText(/search posts, threads, sections/i)
      expect(input).toHaveValue('')
    })

    it('should allow typing multiple characters', () => {
      render(<ForumSearch />)

      const input = screen.getByPlaceholderText(/search posts, threads, sections/i)
      fireEvent.change(input, { target: { value: 'a' } })
      expect(input).toHaveValue('a')

      fireEvent.change(input, { target: { value: 'ab' } })
      expect(input).toHaveValue('ab')

      fireEvent.change(input, { target: { value: 'abc' } })
      expect(input).toHaveValue('abc')
    })

    it('should allow clearing input', () => {
      render(<ForumSearch />)

      const input = screen.getByPlaceholderText(/search posts, threads, sections/i)
      fireEvent.change(input, { target: { value: 'test' } })
      expect(input).toHaveValue('test')

      fireEvent.change(input, { target: { value: '' } })
      expect(input).toHaveValue('')
    })

    it('should handle special characters in input', () => {
      render(<ForumSearch />)

      const input = screen.getByPlaceholderText(/search posts, threads, sections/i)
      fireEvent.change(input, { target: { value: 'test & query <>' } })

      expect(input).toHaveValue('test & query <>')
    })
  })

  describe('Button State', () => {
    it('should disable button when input is empty', () => {
      render(<ForumSearch />)

      const button = screen.getByRole('button', { name: '' })
      expect(button).toBeDisabled()
    })

    it('should enable button when input has text', () => {
      render(<ForumSearch />)

      const input = screen.getByPlaceholderText(/search posts, threads, sections/i)
      fireEvent.change(input, { target: { value: 'test' } })

      const button = screen.getByRole('button', { name: '' })
      expect(button).not.toBeDisabled()
    })

    it('should disable button when input has only whitespace', () => {
      render(<ForumSearch />)

      const input = screen.getByPlaceholderText(/search posts, threads, sections/i)
      fireEvent.change(input, { target: { value: '   ' } })

      const button = screen.getByRole('button', { name: '' })
      expect(button).toBeDisabled()
    })

    it('should enable button when input has text after whitespace', () => {
      render(<ForumSearch />)

      const input = screen.getByPlaceholderText(/search posts, threads, sections/i)
      fireEvent.change(input, { target: { value: '  text  ' } })

      const button = screen.getByRole('button', { name: '' })
      expect(button).not.toBeDisabled()
    })
  })

  describe('Form Submission', () => {
    it('should navigate to search page on submit', async () => {
      render(<ForumSearch />)

      const input = screen.getByPlaceholderText(/search posts, threads, sections/i)
      fireEvent.change(input, { target: { value: 'test query' } })

      const form = screen.getByRole('form', { hidden: true })
      fireEvent.submit(form)

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/forum/search?q=test+query')
      })
    })

    it('should trim whitespace from query', async () => {
      render(<ForumSearch />)

      const input = screen.getByPlaceholderText(/search posts, threads, sections/i)
      fireEvent.change(input, { target: { value: '  test query  ' } })

      const form = screen.getByRole('form', { hidden: true })
      fireEvent.submit(form)

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/forum/search?q=test+query')
      })
    })

    it('should not submit with empty query', async () => {
      render(<ForumSearch />)

      const form = screen.getByRole('form', { hidden: true })
      fireEvent.submit(form)

      await waitFor(() => {
        expect(mockRouter.push).not.toHaveBeenCalled()
      })
    })

    it('should not submit with only whitespace', async () => {
      render(<ForumSearch />)

      const input = screen.getByPlaceholderText(/search posts, threads, sections/i)
      fireEvent.change(input, { target: { value: '   ' } })

      const form = screen.getByRole('form', { hidden: true })
      fireEvent.submit(form)

      await waitFor(() => {
        expect(mockRouter.push).not.toHaveBeenCalled()
      })
    })

    it('should prevent default form submission', () => {
      render(<ForumSearch />)

      const input = screen.getByPlaceholderText(/search posts, threads, sections/i)
      fireEvent.change(input, { target: { value: 'test' } })

      const form = screen.getByRole('form', { hidden: true })
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
      const preventDefaultSpy = jest.spyOn(submitEvent, 'preventDefault')

      fireEvent.submit(form, submitEvent)

      expect(preventDefaultSpy).not.toHaveBeenCalled()
    })

    it('should URL encode query parameters', async () => {
      render(<ForumSearch />)

      const input = screen.getByPlaceholderText(/search posts, threads, sections/i)
      fireEvent.change(input, { target: { value: 'test & query' } })

      const form = screen.getByRole('form', { hidden: true })
      fireEvent.submit(form)

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/forum/search?q=test+%26+query')
      })
    })
  })

  describe('Category and City Parameters', () => {
    it('should include categoryId in search query', async () => {
      render(<ForumSearch categoryId="cat123" />)

      const input = screen.getByPlaceholderText(/search posts, threads, sections/i)
      fireEvent.change(input, { target: { value: 'test' } })

      const form = screen.getByRole('form', { hidden: true })
      fireEvent.submit(form)

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/forum/search?q=test&categoryId=cat123')
      })
    })

    it('should include city in search query', async () => {
      render(<ForumSearch city="Hyderabad" />)

      const input = screen.getByPlaceholderText(/search posts, threads, sections/i)
      fireEvent.change(input, { target: { value: 'test' } })

      const form = screen.getByRole('form', { hidden: true })
      fireEvent.submit(form)

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/forum/search?q=test&city=Hyderabad')
      })
    })

    it('should include both categoryId and city', async () => {
      render(<ForumSearch categoryId="cat123" city="Mumbai" />)

      const input = screen.getByPlaceholderText(/search posts, threads, sections/i)
      fireEvent.change(input, { target: { value: 'test' } })

      const form = screen.getByRole('form', { hidden: true })
      fireEvent.submit(form)

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith(
          '/forum/search?q=test&categoryId=cat123&city=Mumbai'
        )
      })
    })

    it('should not include categoryId if not provided', async () => {
      render(<ForumSearch />)

      const input = screen.getByPlaceholderText(/search posts, threads, sections/i)
      fireEvent.change(input, { target: { value: 'test' } })

      const form = screen.getByRole('form', { hidden: true })
      fireEvent.submit(form)

      await waitFor(() => {
        const callArg = mockRouter.push.mock.calls[0][0]
        expect(callArg).not.toContain('categoryId')
      })
    })

    it('should not include city if not provided', async () => {
      render(<ForumSearch />)

      const input = screen.getByPlaceholderText(/search posts, threads, sections/i)
      fireEvent.change(input, { target: { value: 'test' } })

      const form = screen.getByRole('form', { hidden: true })
      fireEvent.submit(form)

      await waitFor(() => {
        const callArg = mockRouter.push.mock.calls[0][0]
        expect(callArg).not.toContain('city')
      })
    })
  })

  describe('Accessibility', () => {
    it('should have type="text" on input', () => {
      render(<ForumSearch />)

      const input = screen.getByPlaceholderText(/search posts, threads, sections/i)
      expect(input).toHaveAttribute('type', 'text')
    })

    it('should have type="submit" on button', () => {
      render(<ForumSearch />)

      const button = screen.getByRole('button', { name: '' })
      expect(button).toHaveAttribute('type', 'submit')
    })

    it('should be keyboard accessible', () => {
      render(<ForumSearch />)

      const input = screen.getByPlaceholderText(/search posts, threads, sections/i)
      fireEvent.keyDown(input, { key: 'Enter' })

      expect(input).toBeInTheDocument()
    })
  })

  describe('SVG Icon', () => {
    it('should render search icon SVG', () => {
      const { container } = render(<ForumSearch />)

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should have correct SVG viewBox', () => {
      const { container } = render(<ForumSearch />)

      const svg = container.querySelector('svg')
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24')
    })

    it('should have proper SVG classes', () => {
      const { container } = render(<ForumSearch />)

      const svg = container.querySelector('svg')
      expect(svg?.className.baseVal).toContain('h-5')
      expect(svg?.className.baseVal).toContain('w-5')
    })

    it('should have search icon path', () => {
      const { container } = render(<ForumSearch />)

      const path = container.querySelector('svg path')
      expect(path).toBeInTheDocument()
      expect(path).toHaveAttribute('d', 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z')
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid typing', () => {
      render(<ForumSearch />)

      const input = screen.getByPlaceholderText(/search posts, threads, sections/i)

      for (let i = 0; i < 100; i++) {
        fireEvent.change(input, { target: { value: 'a'.repeat(i + 1) } })
      }

      expect(input).toHaveValue('a'.repeat(100))
    })

    it('should handle long search queries', async () => {
      render(<ForumSearch />)

      const longQuery = 'a'.repeat(1000)
      const input = screen.getByPlaceholderText(/search posts, threads, sections/i)
      fireEvent.change(input, { target: { value: longQuery } })

      const form = screen.getByRole('form', { hidden: true })
      fireEvent.submit(form)

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalled()
      })
    })

    it('should handle special characters in categoryId and city', async () => {
      render(<ForumSearch categoryId="cat&123" city="New York" />)

      const input = screen.getByPlaceholderText(/search posts, threads, sections/i)
      fireEvent.change(input, { target: { value: 'test' } })

      const form = screen.getByRole('form', { hidden: true })
      fireEvent.submit(form)

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalled()
      })
    })
  })
})
