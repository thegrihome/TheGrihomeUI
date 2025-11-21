import React from 'react'

interface GrihomeLogoProps {
  size?: number
  className?: string
}

const GrihomeLogo: React.FC<GrihomeLogoProps> = ({ size = 40, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Define the gradient */}
      <defs>
        <linearGradient id="grihomeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="50%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1E40AF" />
        </linearGradient>
      </defs>

      {/* House shape with gradient */}
      {/* Roof */}
      <path
        d="M50 10 L85 40 L80 40 L80 45 L65 45 L65 40 L35 40 L35 45 L20 45 L20 40 L15 40 Z"
        fill="url(#grihomeGradient)"
      />

      {/* Chimney */}
      <rect x="70" y="20" width="8" height="20" fill="url(#grihomeGradient)" />

      {/* House body */}
      <rect x="20" y="40" width="60" height="50" fill="url(#grihomeGradient)" opacity="0.9" />

      {/* Door */}
      <rect x="42" y="60" width="16" height="30" fill="white" rx="2" />
      <circle cx="52" cy="75" r="2" fill="url(#grihomeGradient)" />

      {/* Windows */}
      <rect x="28" y="50" width="12" height="12" fill="white" rx="1" />
      <rect x="60" y="50" width="12" height="12" fill="white" rx="1" />

      {/* Window panes */}
      <line x1="34" y1="50" x2="34" y2="62" stroke="url(#grihomeGradient)" strokeWidth="1" />
      <line x1="28" y1="56" x2="40" y2="56" stroke="url(#grihomeGradient)" strokeWidth="1" />
      <line x1="66" y1="50" x2="66" y2="62" stroke="url(#grihomeGradient)" strokeWidth="1" />
      <line x1="60" y1="56" x2="72" y2="56" stroke="url(#grihomeGradient)" strokeWidth="1" />
    </svg>
  )
}

export default GrihomeLogo
