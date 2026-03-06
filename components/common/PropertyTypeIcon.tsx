import { PROPERTY_TYPES } from '@/lib/constants'

interface PropertyTypeIconProps {
  type: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className?: string
}

// SVG paths for each property type
const PROPERTY_SVG_PATHS: Record<string, React.ReactNode> = {
  [PROPERTY_TYPES.VILLA]: (
    <>
      <path
        d="M3 21h18M5 21V9l7-6 7 6v12M9 21v-6h6v6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M9 12h6M9 15h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  [PROPERTY_TYPES.APARTMENT]: (
    <>
      <rect
        x="4"
        y="3"
        width="16"
        height="18"
        rx="1"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </>
  ),
  [PROPERTY_TYPES.RESIDENTIAL_LAND]: (
    <>
      <path
        d="M2 20h20M4 20c2-4 4-8 8-8s6 4 8 8M8 10c1-2 2-4 4-4s3 2 4 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="17" cy="6" r="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </>
  ),
  [PROPERTY_TYPES.AGRICULTURE_LAND]: (
    <>
      <path
        d="M12 3v18M12 3c-2 4-2 8 0 10M12 3c2 4 2 8 0 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M8 21c0-3 2-5 4-5s4 2 4 5M6 17l2-2M18 17l-2-2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </>
  ),
  [PROPERTY_TYPES.COMMERCIAL]: (
    <>
      <rect
        x="3"
        y="7"
        width="18"
        height="14"
        rx="1"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <path d="M3 11h18M7 3h10l3 4H4l3-4z" stroke="currentColor" strokeWidth="2" fill="none" />
      <path
        d="M7 15h2v6H7zM11 15h2v6h-2zM15 15h2v6h-2z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
    </>
  ),
}

const SIZE_CLASSES: Record<string, string> = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
  '2xl': 'w-10 h-10',
}

export default function PropertyTypeIcon({
  type,
  size = 'md',
  className = '',
}: PropertyTypeIconProps) {
  const svgContent = PROPERTY_SVG_PATHS[type]

  if (!svgContent) {
    return null
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={`${SIZE_CLASSES[size]} ${className}`}
      aria-hidden="true"
    >
      {svgContent}
    </svg>
  )
}

// Forum category icons
export const FORUM_CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'member-introductions': (
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" aria-hidden="true">
      <path
        d="M7 11c-1.5 0-2.5-1-2.5-2.5S5.5 6 7 6s2.5 1 2.5 2.5S8.5 11 7 11z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M17 11c-1.5 0-2.5-1-2.5-2.5S15.5 6 17 6s2.5 1 2.5 2.5S18.5 11 17 11z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M3 18c0-2.5 2-4 4-4s4 1.5 4 4M13 18c0-2.5 2-4 4-4s4 1.5 4 4M10 5l2-2 2 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  'latest-news': (
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M7 8h10M7 12h6M7 16h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  'grihome-latest-deals': (
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 6v2M12 16v2M9 12c0-1.5 1-2 2-2 1.5 0 2.5.5 2.5 2s-1 2-2.5 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  'general-discussions': (
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" aria-hidden="true">
      <path
        d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
}

// Forum flag icons (pin, lock)
export function PinIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 17v5M9 4h6l1 7h-8l1-7zM6 11h12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function LockIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
