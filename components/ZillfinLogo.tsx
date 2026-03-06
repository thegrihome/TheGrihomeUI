import React from 'react'
import Image from 'next/image'

interface ZillfinLogoProps {
  size?: number
  className?: string
}

const ZillfinLogo: React.FC<ZillfinLogoProps> = ({ size = 40, className = '' }) => {
  // Calculate width based on aspect ratio (logo is wider than tall)
  const aspectRatio = 1.35
  const width = Math.round(size * aspectRatio)

  return (
    <Image
      src="/images/zillfin-logo.png"
      alt="Zillfin Real Estate"
      width={width}
      height={size}
      className={className}
      priority
    />
  )
}

export default ZillfinLogo
