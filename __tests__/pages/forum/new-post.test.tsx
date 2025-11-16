import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import NewPostPage from '@/pages/forum/new-post'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}))

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

jest.mock('react-quill', () => {
  return function ReactQuill({ value, onChange, placeholder }: any) {
    return (
      <textarea
        data-testid="react-quill"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    )
  }
})

jest.mock('react-quill/dist/quill.snow.css', () => ({}))

describe('New Post Page - Comprehensive Tests', () => {
  const mockPush = jest.fn()
  const mockBack = jest.fn()
  const mockUseSession = useSession as jest.Mock
  const mockUseRouter = useRouter as jest.Mock

  const mockCategories = [
    {
      id: 'cat1',
      name: 'General Discussions',
      slug: 'general-discussions',
      children: [
        {
          id: 'cat2',
          name: 'Hyderabad',
          slug: 'hyderabad',
          children: [
            {
              id: 'cat3',
              name: 'Apartments in Hyderabad',
              slug: 'hyderabad-apartments',
              children: [],
            },
          ],
        },
      ],
    },
    {
      id: 'cat4',
      name: 'Member Introductions',
      slug: 'member-introductions',
      children: [],
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: mockBack,
    })
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'user1',
          email: 'test@example.com',
          name: 'Test User',
          isEmailVerified: true,
          isMobileVerified: false,
        },
      },
      status: 'authenticated',
    })
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Rendering and Initial State', () => {
    it('should render new post page with all components', () => {
      render(<NewPostPage categories={mockCategories} />)

      expect(screen.getByTestId('header')).toBeInTheDocument()
      expect(screen.getByTestId('footer')).toBeInTheDocument()
    })

    it('should render page title', () => {
      render(<NewPostPage categories={mockCategories} />)

      expect(screen.getByText('Start a New Thread')).toBeInTheDocument()
    })

    it('should render page description', () => {
      render(<NewPostPage categories={mockCategories} />)

      expect(screen.getByText(/Share your thoughts, ask questions/)).toBeInTheDocument()
    })

    it('should render form when user is authenticated and verified', () => {
      render(<NewPostPage categories={mockCategories} />)

      expect(screen.getByText('Category')).toBeInTheDocument()
      expect(screen.getByText('Thread Title *')).toBeInTheDocument()
      expect(screen.getByText('Content *')).toBeInTheDocument()
    })

    it('should show loading state when status is loading', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
      })

      render(<NewPostPage categories={mockCategories} />)

      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('should redirect to login when not authenticated', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      render(<NewPostPage categories={mockCategories} />)

      expect(mockPush).toHaveBeenCalledWith('/login?callbackUrl=%2Fforum%2Fnew-post')
    })

    it('should show verification prompt when user is not verified', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'user1',
            email: 'test@example.com',
            isEmailVerified: false,
            isMobileVerified: false,
          },
        },
        status: 'authenticated',
      })

      render(<NewPostPage categories={mockCategories} />)

      expect(screen.getByText('Verification Required')).toBeInTheDocument()
      expect(screen.getByText(/You need to verify your email or mobile number/)).toBeInTheDocument()
    })

    it('should render verify account link when not verified', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            isEmailVerified: false,
            isMobileVerified: false,
          },
        },
        status: 'authenticated',
      })

      const { container } = render(<NewPostPage categories={mockCategories} />)

      const verifyLink = container.querySelector('a[href="/auth/userinfo"]')
      expect(verifyLink).toBeInTheDocument()
      expect(verifyLink).toHaveTextContent('Verify Account')
    })
  })

  describe('Form Fields', () => {
    it('should render category dropdown', () => {
      render(<NewPostPage categories={mockCategories} />)

      expect(screen.getByText('Category')).toBeInTheDocument()
      const select = screen.getByRole('combobox')
      expect(select).toBeInTheDocument()
    })

    it('should render title input field', () => {
      render(<NewPostPage categories={mockCategories} />)

      const titleInput = screen.getByPlaceholderText('Enter a descriptive title for your thread')
      expect(titleInput).toBeInTheDocument()
      expect(titleInput).toHaveAttribute('maxLength', '200')
    })

    it('should render content editor', () => {
      render(<NewPostPage categories={mockCategories} />)

      const editor = screen.getByTestId('react-quill')
      expect(editor).toBeInTheDocument()
    })

    it('should render character counter for title', () => {
      render(<NewPostPage categories={mockCategories} />)

      expect(screen.getByText('0/200 characters')).toBeInTheDocument()
    })

    it('should update character counter when typing', () => {
      render(<NewPostPage categories={mockCategories} />)

      const titleInput = screen.getByPlaceholderText('Enter a descriptive title for your thread')
      fireEvent.change(titleInput, { target: { value: 'Test Title' } })

      expect(screen.getByText('10/200 characters')).toBeInTheDocument()
    })

    it('should render submit and cancel buttons', () => {
      render(<NewPostPage categories={mockCategories} />)

      expect(screen.getByText('Create Thread')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })
  })

  describe('Category Selection', () => {
    it('should populate category dropdown with selectable categories', () => {
      render(<NewPostPage categories={mockCategories} />)

      const select = screen.getByRole('combobox')
      expect(select).toBeInTheDocument()

      // Should include leaf categories
      expect(screen.getByText('Member Introductions')).toBeInTheDocument()
      expect(screen.getByText('Apartments in Hyderabad')).toBeInTheDocument()
    })

    it('should change selected category', () => {
      render(<NewPostPage categories={mockCategories} />)

      const select = screen.getByRole('combobox')
      fireEvent.change(select, { target: { value: 'cat4' } })

      expect(select).toHaveValue('cat4')
    })

    it('should show default "Select a category" option', () => {
      render(<NewPostPage categories={mockCategories} />)

      expect(screen.getByText('Select a category')).toBeInTheDocument()
    })

    it('should pre-select category when selectedCategoryId is provided', () => {
      render(<NewPostPage categories={mockCategories} selectedCategoryId="cat4" />)

      const select = screen.getByRole('combobox')
      expect(select).toHaveValue('cat4')
    })

    it('should disable category field when category is pre-selected', () => {
      const selectedCategory = {
        id: 'cat4',
        name: 'Member Introductions',
        slug: 'member-introductions',
        city: null,
        parent: null,
      }

      render(
        <NewPostPage
          categories={mockCategories}
          selectedCategoryId="cat4"
          selectedCategory={selectedCategory}
        />
      )

      const disabledInput = screen.getByDisplayValue('Member Introductions')
      expect(disabledInput).toBeDisabled()
    })
  })

  describe('Form Validation', () => {
    it('should disable submit button when title is empty', () => {
      render(<NewPostPage categories={mockCategories} />)

      const submitButton = screen.getByText('Create Thread')
      expect(submitButton).toBeDisabled()
    })

    it('should disable submit button when content is empty', () => {
      render(<NewPostPage categories={mockCategories} />)

      const titleInput = screen.getByPlaceholderText('Enter a descriptive title for your thread')
      fireEvent.change(titleInput, { target: { value: 'Test Title' } })

      const submitButton = screen.getByText('Create Thread')
      expect(submitButton).toBeDisabled()
    })

    it('should disable submit button when category is not selected', () => {
      render(<NewPostPage categories={mockCategories} />)

      const titleInput = screen.getByPlaceholderText('Enter a descriptive title for your thread')
      const contentEditor = screen.getByTestId('react-quill')

      fireEvent.change(titleInput, { target: { value: 'Test Title' } })
      fireEvent.change(contentEditor, { target: { value: 'Test Content' } })

      const submitButton = screen.getByText('Create Thread')
      expect(submitButton).toBeDisabled()
    })

    it('should enable submit button when all fields are filled', () => {
      render(<NewPostPage categories={mockCategories} />)

      const select = screen.getByRole('combobox')
      const titleInput = screen.getByPlaceholderText('Enter a descriptive title for your thread')
      const contentEditor = screen.getByTestId('react-quill')

      fireEvent.change(select, { target: { value: 'cat4' } })
      fireEvent.change(titleInput, { target: { value: 'Test Title' } })
      fireEvent.change(contentEditor, { target: { value: 'Test Content' } })

      const submitButton = screen.getByText('Create Thread')
      expect(submitButton).not.toBeDisabled()
    })

    it('should trim whitespace from title and content', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ slug: 'test-post' }),
      })

      render(<NewPostPage categories={mockCategories} />)

      const select = screen.getByRole('combobox')
      const titleInput = screen.getByPlaceholderText('Enter a descriptive title for your thread')
      const contentEditor = screen.getByTestId('react-quill')

      fireEvent.change(select, { target: { value: 'cat4' } })
      fireEvent.change(titleInput, { target: { value: '  Test Title  ' } })
      fireEvent.change(contentEditor, { target: { value: '  Test Content  ' } })

      const submitButton = screen.getByText('Create Thread')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/forum/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Test Title',
            content: 'Test Content',
            categoryId: 'cat4',
          }),
        })
      })
    })
  })

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ slug: 'test-post' }),
      })

      render(<NewPostPage categories={mockCategories} />)

      const select = screen.getByRole('combobox')
      const titleInput = screen.getByPlaceholderText('Enter a descriptive title for your thread')
      const contentEditor = screen.getByTestId('react-quill')

      fireEvent.change(select, { target: { value: 'cat4' } })
      fireEvent.change(titleInput, { target: { value: 'Test Title' } })
      fireEvent.change(contentEditor, { target: { value: 'Test Content' } })

      const submitButton = screen.getByText('Create Thread')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/forum/posts', expect.any(Object))
      })
    })

    it('should redirect to thread page on successful submission', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ slug: 'test-post' }),
      })

      render(<NewPostPage categories={mockCategories} />)

      const select = screen.getByRole('combobox')
      const titleInput = screen.getByPlaceholderText('Enter a descriptive title for your thread')
      const contentEditor = screen.getByTestId('react-quill')

      fireEvent.change(select, { target: { value: 'cat4' } })
      fireEvent.change(titleInput, { target: { value: 'Test Title' } })
      fireEvent.change(contentEditor, { target: { value: 'Test Content' } })

      const submitButton = screen.getByText('Create Thread')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/forum/thread/test-post')
      })
    })

    it('should show loading state during submission', async () => {
      ;(global.fetch as jest.Mock).mockImplementationOnce(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ slug: 'test-post' }),
                }),
              100
            )
          )
      )

      render(<NewPostPage categories={mockCategories} />)

      const select = screen.getByRole('combobox')
      const titleInput = screen.getByPlaceholderText('Enter a descriptive title for your thread')
      const contentEditor = screen.getByTestId('react-quill')

      fireEvent.change(select, { target: { value: 'cat4' } })
      fireEvent.change(titleInput, { target: { value: 'Test Title' } })
      fireEvent.change(contentEditor, { target: { value: 'Test Content' } })

      const submitButton = screen.getByText('Create Thread')
      fireEvent.click(submitButton)

      expect(screen.getByText('Creating...')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.queryByText('Creating...')).not.toBeInTheDocument()
      })
    })

    it('should disable button during submission', async () => {
      ;(global.fetch as jest.Mock).mockImplementationOnce(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ slug: 'test-post' }),
                }),
              100
            )
          )
      )

      render(<NewPostPage categories={mockCategories} />)

      const select = screen.getByRole('combobox')
      const titleInput = screen.getByPlaceholderText('Enter a descriptive title for your thread')
      const contentEditor = screen.getByTestId('react-quill')

      fireEvent.change(select, { target: { value: 'cat4' } })
      fireEvent.change(titleInput, { target: { value: 'Test Title' } })
      fireEvent.change(contentEditor, { target: { value: 'Test Content' } })

      const submitButton = screen.getByText('Create Thread')
      fireEvent.click(submitButton)

      expect(submitButton).toBeDisabled()

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled()
      })
    })

    it('should show error message on submission failure', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to create post' }),
      })

      render(<NewPostPage categories={mockCategories} />)

      const select = screen.getByRole('combobox')
      const titleInput = screen.getByPlaceholderText('Enter a descriptive title for your thread')
      const contentEditor = screen.getByTestId('react-quill')

      fireEvent.change(select, { target: { value: 'cat4' } })
      fireEvent.change(titleInput, { target: { value: 'Test Title' } })
      fireEvent.change(contentEditor, { target: { value: 'Test Content' } })

      const submitButton = screen.getByText('Create Thread')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Failed to create post')).toBeInTheDocument()
      })
    })

    it('should handle network errors gracefully', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      render(<NewPostPage categories={mockCategories} />)

      const select = screen.getByRole('combobox')
      const titleInput = screen.getByPlaceholderText('Enter a descriptive title for your thread')
      const contentEditor = screen.getByTestId('react-quill')

      fireEvent.change(select, { target: { value: 'cat4' } })
      fireEvent.change(titleInput, { target: { value: 'Test Title' } })
      fireEvent.change(contentEditor, { target: { value: 'Test Content' } })

      const submitButton = screen.getByText('Create Thread')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Failed to create post')).toBeInTheDocument()
      })
    })
  })

  describe('Cancel Button', () => {
    it('should call router.back() when cancel is clicked', () => {
      render(<NewPostPage categories={mockCategories} />)

      const cancelButton = screen.getByText('Cancel')
      fireEvent.click(cancelButton)

      expect(mockBack).toHaveBeenCalled()
    })

    it('should disable cancel button during submission', async () => {
      ;(global.fetch as jest.Mock).mockImplementationOnce(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ slug: 'test-post' }),
                }),
              100
            )
          )
      )

      render(<NewPostPage categories={mockCategories} />)

      const select = screen.getByRole('combobox')
      const titleInput = screen.getByPlaceholderText('Enter a descriptive title for your thread')
      const contentEditor = screen.getByTestId('react-quill')

      fireEvent.change(select, { target: { value: 'cat4' } })
      fireEvent.change(titleInput, { target: { value: 'Test Title' } })
      fireEvent.change(contentEditor, { target: { value: 'Test Content' } })

      const submitButton = screen.getByText('Create Thread')
      fireEvent.click(submitButton)

      const cancelButton = screen.getByText('Cancel')
      expect(cancelButton).toBeDisabled()

      await waitFor(() => {
        expect(cancelButton).not.toBeDisabled()
      })
    })
  })

  describe('Breadcrumb Navigation', () => {
    it('should render breadcrumb with forum link', () => {
      const { container } = render(<NewPostPage categories={mockCategories} />)

      const forumLink = container.querySelector('a[href="/forum"]')
      expect(forumLink).toBeInTheDocument()
    })

    it('should render breadcrumb with current page', () => {
      const { container } = render(<NewPostPage categories={mockCategories} />)

      const current = container.querySelector('.forum-breadcrumb-current')
      expect(current).toHaveTextContent('New Thread')
    })

    it('should render breadcrumb with selected category parent', () => {
      const selectedCategory = {
        id: 'cat3',
        name: 'Apartments in Hyderabad',
        slug: 'hyderabad-apartments',
        city: 'hyderabad',
        parent: {
          id: 'cat2',
          name: 'Hyderabad',
          slug: 'hyderabad',
          parent: {
            id: 'cat1',
            name: 'General Discussions',
            slug: 'general-discussions',
          },
        },
      }

      render(<NewPostPage categories={mockCategories} selectedCategory={selectedCategory} />)

      expect(screen.getByText('General Discussions')).toBeInTheDocument()
      expect(screen.getByText('Hyderabad')).toBeInTheDocument()
    })
  })

  describe('SEO', () => {
    it('should render NextSeo with correct title', () => {
      render(<NewPostPage categories={mockCategories} />)

      const seo = screen.getByTestId('next-seo')
      expect(seo).toHaveAttribute('data-title', 'New Thread - Forum - Grihome')
    })

    it('should render NextSeo with correct description', () => {
      render(<NewPostPage categories={mockCategories} />)

      const seo = screen.getByTestId('next-seo')
      expect(seo).toHaveAttribute(
        'data-description',
        'Start a new discussion in the Grihome community forum'
      )
    })

    it('should render NextSeo with correct canonical URL', () => {
      render(<NewPostPage categories={mockCategories} />)

      const seo = screen.getByTestId('next-seo')
      expect(seo).toHaveAttribute('data-canonical', 'https://grihome.vercel.app/forum/new-post')
    })
  })

  describe('CSS Classes', () => {
    it('should have correct container classes', () => {
      const { container } = render(<NewPostPage categories={mockCategories} />)

      expect(container.querySelector('.forum-container')).toBeInTheDocument()
      expect(container.querySelector('.forum-main')).toBeInTheDocument()
      expect(container.querySelector('.forum-new-post')).toBeInTheDocument()
    })

    it('should have correct form classes', () => {
      const { container } = render(<NewPostPage categories={mockCategories} />)

      expect(container.querySelector('.forum-new-post-form')).toBeInTheDocument()
      expect(container.querySelector('.forum-form-group')).toBeInTheDocument()
      expect(container.querySelector('.forum-form-actions')).toBeInTheDocument()
    })

    it('should have verification prompt classes when not verified', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            isEmailVerified: false,
            isMobileVerified: false,
          },
        },
        status: 'authenticated',
      })

      const { container } = render(<NewPostPage categories={mockCategories} />)

      expect(container.querySelector('.forum-verification-prompt')).toBeInTheDocument()
    })

    it('should have error message class when error is shown', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to create post' }),
      })

      render(<NewPostPage categories={mockCategories} />)

      const select = screen.getByRole('combobox')
      const titleInput = screen.getByPlaceholderText('Enter a descriptive title for your thread')
      const contentEditor = screen.getByTestId('react-quill')

      fireEvent.change(select, { target: { value: 'cat4' } })
      fireEvent.change(titleInput, { target: { value: 'Test Title' } })
      fireEvent.change(contentEditor, { target: { value: 'Test Content' } })

      const submitButton = screen.getByText('Create Thread')
      fireEvent.click(submitButton)

      await waitFor(() => {
        const { container } = render(<NewPostPage categories={mockCategories} />)
        expect(container.querySelector('.forum-error-message')).toBeTruthy()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      render(<NewPostPage categories={mockCategories} />)

      expect(screen.getByLabelText('Category')).toBeInTheDocument()
      expect(screen.getByLabelText('Thread Title *')).toBeInTheDocument()
      expect(screen.getByLabelText('Content *')).toBeInTheDocument()
    })

    it('should have required attribute on inputs', () => {
      render(<NewPostPage categories={mockCategories} />)

      const titleInput = screen.getByPlaceholderText('Enter a descriptive title for your thread')
      expect(titleInput).toHaveAttribute('required')

      const select = screen.getByRole('combobox')
      expect(select).toHaveAttribute('required')
    })

    it('should have proper heading hierarchy', () => {
      render(<NewPostPage categories={mockCategories} />)

      const h1 = screen.getByRole('heading', { level: 1 })
      expect(h1).toHaveTextContent('Start a New Thread')
    })

    it('should have main landmark', () => {
      const { container } = render(<NewPostPage categories={mockCategories} />)

      const main = container.querySelector('main')
      expect(main).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty categories array', () => {
      render(<NewPostPage categories={[]} />)

      const select = screen.getByRole('combobox')
      expect(select).toBeInTheDocument()
    })

    it('should handle very long title', () => {
      render(<NewPostPage categories={mockCategories} />)

      const titleInput = screen.getByPlaceholderText('Enter a descriptive title for your thread')
      const longTitle = 'A'.repeat(250)

      fireEvent.change(titleInput, { target: { value: longTitle } })

      // Should be limited to 200 characters by maxLength attribute
      expect(titleInput).toHaveValue(longTitle.substring(0, 200))
    })

    it('should handle mobile verification', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            isEmailVerified: false,
            isMobileVerified: true,
          },
        },
        status: 'authenticated',
      })

      render(<NewPostPage categories={mockCategories} />)

      expect(screen.getByText('Category')).toBeInTheDocument()
      expect(screen.queryByText('Verification Required')).not.toBeInTheDocument()
    })
  })
})
