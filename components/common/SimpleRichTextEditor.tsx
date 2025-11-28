import { useRef } from 'react'

interface SimpleRichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  required?: boolean
  className?: string
}

export default function SimpleRichTextEditor({
  value,
  onChange,
  placeholder = '',
  rows = 4,
  required = false,
  className = '',
}: SimpleRichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const wrapSelection = (tag: 'b' | 'i') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)

    if (selectedText) {
      const before = value.substring(0, start)
      const after = value.substring(end)
      const wrapped = `<${tag}>${selectedText}</${tag}>`
      const newValue = before + wrapped + after
      onChange(newValue)

      // Restore cursor position after the wrapped text
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + wrapped.length, start + wrapped.length)
      }, 0)
    }
  }

  return (
    <div className={`simple-rich-editor ${className}`}>
      <div className="flex gap-1 mb-2">
        <button
          type="button"
          onClick={() => wrapSelection('b')}
          className="px-3 py-1 text-sm font-bold border border-gray-300 rounded hover:bg-gray-100 transition-colors"
          title="Bold (select text first)"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => wrapSelection('i')}
          className="px-3 py-1 text-sm italic border border-gray-300 rounded hover:bg-gray-100 transition-colors"
          title="Italic (select text first)"
        >
          I
        </button>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        required={required}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}
