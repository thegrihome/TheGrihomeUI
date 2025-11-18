import { useState } from 'react'
import { useRouter } from 'next/router'

interface ForumSearchProps {
  placeholder?: string
  className?: string
  categoryId?: string
  city?: string
  propertyType?: string
}

export default function ForumSearch({
  placeholder = 'Search posts, threads, sections...',
  className = '',
  categoryId,
  city,
  propertyType,
}: ForumSearchProps) {
  const [query, setQuery] = useState('')
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      const params = new URLSearchParams({ q: query.trim() })
      if (categoryId) params.append('categoryId', categoryId)
      if (city) params.append('city', city)
      if (propertyType) params.append('propertyType', propertyType)
      router.push(`/forum/search?${params.toString()}`)
    }
  }

  return (
    <form onSubmit={handleSearch} className={`forum-search-form ${className}`}>
      <div className="forum-search-container">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={placeholder}
          className="forum-search-input"
        />
        <button type="submit" className="forum-search-button" disabled={!query.trim()}>
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
      </div>
    </form>
  )
}
