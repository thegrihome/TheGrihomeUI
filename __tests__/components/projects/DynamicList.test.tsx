import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import DynamicList from '@/components/projects/DynamicList'

describe('DynamicList Component', () => {
  const mockOnChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render label', () => {
      render(<DynamicList items={[]} onChange={mockOnChange} label="Test Label" />)

      expect(screen.getByText('Test Label')).toBeInTheDocument()
    })

    it('should render input field', () => {
      render(<DynamicList items={[]} onChange={mockOnChange} label="Test Label" />)

      const input = screen.getByPlaceholderText('Enter item...')
      expect(input).toBeInTheDocument()
    })

    it('should render Add button', () => {
      render(<DynamicList items={[]} onChange={mockOnChange} label="Test Label" />)

      expect(screen.getByText('Add')).toBeInTheDocument()
    })

    it('should use custom placeholder', () => {
      render(
        <DynamicList
          items={[]}
          onChange={mockOnChange}
          label="Test Label"
          placeholder="Custom placeholder"
        />
      )

      expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      const { container } = render(
        <DynamicList
          items={[]}
          onChange={mockOnChange}
          label="Test Label"
          className="custom-class"
        />
      )

      const div = container.querySelector('.custom-class')
      expect(div).toBeInTheDocument()
    })
  })

  describe('Displaying Items', () => {
    it('should display existing items', () => {
      const items = ['Item 1', 'Item 2', 'Item 3']
      render(<DynamicList items={items} onChange={mockOnChange} label="Test Label" />)

      expect(screen.getByText('Item 1')).toBeInTheDocument()
      expect(screen.getByText('Item 2')).toBeInTheDocument()
      expect(screen.getByText('Item 3')).toBeInTheDocument()
    })

    it('should not display items section when list is empty', () => {
      render(<DynamicList items={[]} onChange={mockOnChange} label="Test Label" />)

      expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument()
    })

    it('should display remove button for each item', () => {
      const items = ['Item 1', 'Item 2']
      render(<DynamicList items={items} onChange={mockOnChange} label="Test Label" />)

      const removeButtons = screen.getAllByTitle('Remove item')
      expect(removeButtons).toHaveLength(2)
    })

    it('should display remove icon SVG', () => {
      const items = ['Item 1']
      const { container } = render(
        <DynamicList items={items} onChange={mockOnChange} label="Test Label" />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('Adding Items', () => {
    it('should add item when Add button is clicked', () => {
      render(<DynamicList items={[]} onChange={mockOnChange} label="Test Label" />)

      const input = screen.getByPlaceholderText('Enter item...')
      fireEvent.change(input, { target: { value: 'New Item' } })

      const addButton = screen.getByRole('button', { name: 'Add' })
      fireEvent.click(addButton)

      expect(mockOnChange).toHaveBeenCalledWith(['New Item'])
    })

    it('should clear input after adding item', () => {
      render(<DynamicList items={[]} onChange={mockOnChange} label="Test Label" />)

      const input = screen.getByPlaceholderText('Enter item...') as HTMLInputElement
      fireEvent.change(input, { target: { value: 'New Item' } })
      fireEvent.click(screen.getByRole('button', { name: 'Add' }))

      expect(input.value).toBe('')
    })

    it('should trim whitespace when adding item', () => {
      render(<DynamicList items={[]} onChange={mockOnChange} label="Test Label" />)

      const input = screen.getByPlaceholderText('Enter item...')
      fireEvent.change(input, { target: { value: '  Trimmed Item  ' } })
      fireEvent.click(screen.getByRole('button', { name: 'Add' }))

      expect(mockOnChange).toHaveBeenCalledWith(['Trimmed Item'])
    })

    it('should not add empty item', () => {
      render(<DynamicList items={[]} onChange={mockOnChange} label="Test Label" />)

      const input = screen.getByPlaceholderText('Enter item...')
      fireEvent.change(input, { target: { value: '' } })
      fireEvent.click(screen.getByRole('button', { name: 'Add' }))

      expect(mockOnChange).not.toHaveBeenCalled()
    })

    it('should not add whitespace-only item', () => {
      render(<DynamicList items={[]} onChange={mockOnChange} label="Test Label" />)

      const input = screen.getByPlaceholderText('Enter item...')
      fireEvent.change(input, { target: { value: '   ' } })
      fireEvent.click(screen.getByRole('button', { name: 'Add' }))

      expect(mockOnChange).not.toHaveBeenCalled()
    })

    it('should add item on Enter key press', () => {
      render(<DynamicList items={[]} onChange={mockOnChange} label="Test Label" />)

      const input = screen.getByPlaceholderText('Enter item...')
      fireEvent.change(input, { target: { value: 'Enter Item' } })
      fireEvent.keyDown(input, { key: 'Enter' })

      expect(mockOnChange).toHaveBeenCalledWith(['Enter Item'])
    })

    it('should prevent default on Enter key press', () => {
      render(<DynamicList items={[]} onChange={mockOnChange} label="Test Label" />)

      const input = screen.getByPlaceholderText('Enter item...')
      fireEvent.change(input, { target: { value: 'Test' } })

      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault')
      input.dispatchEvent(event)

      expect(preventDefaultSpy).toHaveBeenCalled()
    })

    it('should not add item on other key press', () => {
      render(<DynamicList items={[]} onChange={mockOnChange} label="Test Label" />)

      const input = screen.getByPlaceholderText('Enter item...')
      fireEvent.change(input, { target: { value: 'Test' } })
      fireEvent.keyDown(input, { key: 'a' })

      expect(mockOnChange).not.toHaveBeenCalled()
    })

    it('should append to existing items', () => {
      const existingItems = ['Item 1', 'Item 2']
      render(<DynamicList items={existingItems} onChange={mockOnChange} label="Test Label" />)

      const input = screen.getByPlaceholderText('Enter item...')
      fireEvent.change(input, { target: { value: 'Item 3' } })
      fireEvent.click(screen.getByRole('button', { name: 'Add' }))

      expect(mockOnChange).toHaveBeenCalledWith(['Item 1', 'Item 2', 'Item 3'])
    })
  })

  describe('Removing Items', () => {
    it('should remove item when remove button is clicked', () => {
      const items = ['Item 1', 'Item 2', 'Item 3']
      render(<DynamicList items={items} onChange={mockOnChange} label="Test Label" />)

      const removeButtons = screen.getAllByTitle('Remove item')
      fireEvent.click(removeButtons[1]) // Remove "Item 2"

      expect(mockOnChange).toHaveBeenCalledWith(['Item 1', 'Item 3'])
    })

    it('should remove first item', () => {
      const items = ['First', 'Second', 'Third']
      render(<DynamicList items={items} onChange={mockOnChange} label="Test Label" />)

      const removeButtons = screen.getAllByTitle('Remove item')
      fireEvent.click(removeButtons[0])

      expect(mockOnChange).toHaveBeenCalledWith(['Second', 'Third'])
    })

    it('should remove last item', () => {
      const items = ['First', 'Second', 'Third']
      render(<DynamicList items={items} onChange={mockOnChange} label="Test Label" />)

      const removeButtons = screen.getAllByTitle('Remove item')
      fireEvent.click(removeButtons[2])

      expect(mockOnChange).toHaveBeenCalledWith(['First', 'Second'])
    })

    it('should remove only item', () => {
      const items = ['Only Item']
      render(<DynamicList items={items} onChange={mockOnChange} label="Test Label" />)

      const removeButton = screen.getByTitle('Remove item')
      fireEvent.click(removeButton)

      expect(mockOnChange).toHaveBeenCalledWith([])
    })
  })

  describe('Max Items Limit', () => {
    it('should show item count when maxItems is set', () => {
      render(
        <DynamicList items={['Item 1']} onChange={mockOnChange} label="Test Label" maxItems={5} />
      )

      expect(screen.getByText('1 / 5 items')).toBeInTheDocument()
    })

    it('should not show item count when maxItems is not set', () => {
      render(<DynamicList items={['Item 1']} onChange={mockOnChange} label="Test Label" />)

      expect(screen.queryByText(/items/)).not.toBeInTheDocument()
    })

    it('should not allow adding items beyond max limit', () => {
      const items = ['Item 1', 'Item 2']
      render(<DynamicList items={items} onChange={mockOnChange} label="Test Label" maxItems={2} />)

      const input = screen.getByPlaceholderText('Enter item...')
      fireEvent.change(input, { target: { value: 'Item 3' } })
      fireEvent.click(screen.getByRole('button', { name: 'Add' }))

      expect(mockOnChange).not.toHaveBeenCalled()
    })

    it('should hide input when max limit is reached', () => {
      const items = ['Item 1', 'Item 2']
      render(<DynamicList items={items} onChange={mockOnChange} label="Test Label" maxItems={2} />)

      expect(screen.queryByPlaceholderText('Enter item...')).not.toBeInTheDocument()
      expect(screen.queryByText('Add')).not.toBeInTheDocument()
    })

    it('should show input when below max limit', () => {
      const items = ['Item 1']
      render(<DynamicList items={items} onChange={mockOnChange} label="Test Label" maxItems={3} />)

      expect(screen.getByPlaceholderText('Enter item...')).toBeInTheDocument()
      expect(screen.getByText('Add')).toBeInTheDocument()
    })

    it('should update count display correctly', () => {
      const items = ['Item 1', 'Item 2', 'Item 3']
      render(<DynamicList items={items} onChange={mockOnChange} label="Test Label" maxItems={5} />)

      expect(screen.getByText('3 / 5 items')).toBeInTheDocument()
    })
  })

  describe('Button States', () => {
    it('should disable Add button when input is empty', () => {
      render(<DynamicList items={[]} onChange={mockOnChange} label="Test Label" />)

      const addButton = screen.getByRole('button', { name: 'Add' })
      expect(addButton).toBeDisabled()
    })

    it('should enable Add button when input has value', () => {
      render(<DynamicList items={[]} onChange={mockOnChange} label="Test Label" />)

      const input = screen.getByPlaceholderText('Enter item...')
      fireEvent.change(input, { target: { value: 'Test' } })

      const addButton = screen.getByRole('button', { name: 'Add' })
      expect(addButton).not.toBeDisabled()
    })

    it('should disable Add button when input has only whitespace', () => {
      render(<DynamicList items={[]} onChange={mockOnChange} label="Test Label" />)

      const input = screen.getByPlaceholderText('Enter item...')
      fireEvent.change(input, { target: { value: '   ' } })

      const addButton = screen.getByRole('button', { name: 'Add' })
      expect(addButton).toBeDisabled()
    })
  })

  describe('Input Behavior', () => {
    it('should update input value on change', () => {
      render(<DynamicList items={[]} onChange={mockOnChange} label="Test Label" />)

      const input = screen.getByPlaceholderText('Enter item...') as HTMLInputElement
      fireEvent.change(input, { target: { value: 'Typing...' } })

      expect(input.value).toBe('Typing...')
    })

    it('should start with empty input', () => {
      render(<DynamicList items={[]} onChange={mockOnChange} label="Test Label" />)

      const input = screen.getByPlaceholderText('Enter item...') as HTMLInputElement
      expect(input.value).toBe('')
    })
  })

  describe('CSS Classes', () => {
    it('should apply correct styling to items', () => {
      const { container } = render(
        <DynamicList items={['Test']} onChange={mockOnChange} label="Test Label" />
      )

      const itemDiv = container.querySelector('.bg-gray-50.rounded-lg')
      expect(itemDiv).toBeInTheDocument()
    })

    it('should apply focus styles to input', () => {
      const { container } = render(
        <DynamicList items={[]} onChange={mockOnChange} label="Test Label" />
      )

      const input = container.querySelector('input')
      expect(input?.className).toContain('focus:ring-2')
      expect(input?.className).toContain('focus:ring-blue-500')
    })

    it('should apply disabled styles to button', () => {
      render(<DynamicList items={[]} onChange={mockOnChange} label="Test Label" />)

      const addButton = screen.getByRole('button', { name: 'Add' })
      expect(addButton.className).toContain('disabled:bg-gray-300')
      expect(addButton.className).toContain('disabled:cursor-not-allowed')
    })

    it('should apply hover styles to remove button', () => {
      const { container } = render(
        <DynamicList items={['Test']} onChange={mockOnChange} label="Test Label" />
      )

      const removeButton = screen.getByTitle('Remove item')
      expect(removeButton.className).toContain('hover:text-red-800')
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long item text', () => {
      const longItem = 'A'.repeat(200)
      render(<DynamicList items={[longItem]} onChange={mockOnChange} label="Test Label" />)

      expect(screen.getByText(longItem)).toBeInTheDocument()
    })

    it('should handle special characters in items', () => {
      const items = ['Item with "quotes"', 'Item with <html>', "Item with 'apostrophes'"]
      render(<DynamicList items={items} onChange={mockOnChange} label="Test Label" />)

      expect(screen.getByText('Item with "quotes"')).toBeInTheDocument()
      expect(screen.getByText('Item with <html>')).toBeInTheDocument()
      expect(screen.getByText("Item with 'apostrophes'")).toBeInTheDocument()
    })

    it('should handle maxItems of 0', () => {
      render(<DynamicList items={[]} onChange={mockOnChange} label="Test Label" maxItems={0} />)

      expect(screen.queryByPlaceholderText('Enter item...')).not.toBeInTheDocument()
      expect(screen.getByText('0 / 0 items')).toBeInTheDocument()
    })

    it('should handle maxItems of 1', () => {
      render(<DynamicList items={[]} onChange={mockOnChange} label="Test Label" maxItems={1} />)

      const input = screen.getByPlaceholderText('Enter item...')
      fireEvent.change(input, { target: { value: 'Item 1' } })
      fireEvent.click(screen.getByRole('button', { name: 'Add' }))

      expect(mockOnChange).toHaveBeenCalledWith(['Item 1'])
    })

    it('should handle removing and adding items repeatedly', () => {
      const { rerender } = render(
        <DynamicList items={[]} onChange={mockOnChange} label="Test Label" />
      )

      // Add item
      const input = screen.getByPlaceholderText('Enter item...')
      fireEvent.change(input, { target: { value: 'Item 1' } })
      fireEvent.click(screen.getByRole('button', { name: 'Add' }))

      // Rerender with new items
      rerender(<DynamicList items={['Item 1']} onChange={mockOnChange} label="Test Label" />)

      // Remove item
      const removeButton = screen.getByTitle('Remove item')
      fireEvent.click(removeButton)

      expect(mockOnChange).toHaveBeenCalledTimes(2)
    })
  })

  describe('Accessibility', () => {
    it('should have type="button" on buttons', () => {
      const items = ['Item 1']
      render(<DynamicList items={items} onChange={mockOnChange} label="Test Label" />)

      const removeButton = screen.getByTitle('Remove item')
      expect(removeButton).toHaveAttribute('type', 'button')

      const addButton = screen.getByRole('button', { name: 'Add' })
      expect(addButton).toHaveAttribute('type', 'button')
    })

    it('should have title attribute on remove button', () => {
      const items = ['Item 1']
      render(<DynamicList items={items} onChange={mockOnChange} label="Test Label" />)

      const removeButton = screen.getByTitle('Remove item')
      expect(removeButton).toHaveAttribute('title', 'Remove item')
    })

    it('should have label for input', () => {
      render(<DynamicList items={[]} onChange={mockOnChange} label="Test Label" />)

      const label = screen.getByText('Test Label')
      expect(label.tagName).toBe('LABEL')
    })
  })
})
