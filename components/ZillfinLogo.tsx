import React from 'react'
import Image from 'next/image'

interface ZillfinLogoProps {
  size?: number
  className?: string
}

const ZillfinLogo: React.FC<ZillfinLogoProps> = ({ size = 40, className = '' }) => {
  return (
    <Image
      src="/images/GrihomeLogo_v1.png"
      alt="Zillfin Logo"
      width={size}
      height={size}
      className={className}
      priority
    />
  )
}

export default ZillfinLogo
