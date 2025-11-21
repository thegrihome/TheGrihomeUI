import React from 'react'
import Image from 'next/image'

interface GrihomeLogoProps {
  size?: number
  className?: string
}

const GrihomeLogo: React.FC<GrihomeLogoProps> = ({ size = 40, className = '' }) => {
  return (
    <Image
      src="/images/GrihomeLogo_v1.png"
      alt="Grihome Logo"
      width={size}
      height={size}
      className={className}
      priority
    />
  )
}

export default GrihomeLogo
