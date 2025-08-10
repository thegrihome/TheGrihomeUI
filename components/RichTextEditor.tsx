import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })
import 'react-quill/dist/quill.snow.css'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write your message...',
  className = '',
}: RichTextEditorProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ indent: '-1' }, { indent: '+1' }],
      ['link', 'image', 'video'],
      [{ align: [] }],
      [{ color: [] }, { background: [] }],
      ['blockquote', 'code-block'],
      ['clean'],
    ],
    clipboard: {
      matchVisual: false,
    },
  }

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
    'bullet',
    'indent',
    'link',
    'image',
    'video',
    'align',
    'color',
    'background',
    'blockquote',
    'code-block',
  ]

  if (!isClient) {
    return (
      <div className={`rich-text-editor-loading ${className}`}>
        <div className="loading-placeholder">Loading editor...</div>
      </div>
    )
  }

  return (
    <div className={`rich-text-editor ${className}`}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        modules={modules}
        formats={formats}
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
        }}
      />
    </div>
  )
}
