const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow build to continue even if database is unavailable
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'jeczfxlhtp0pv0xq.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.myhomeconstructions.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'myhomeconstructions.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.99acres.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.housing.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.magicbricks.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.squareyards.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: config => {
    config.resolve.alias['@'] = path.resolve(__dirname)
    return config
  },
}

module.exports = nextConfig
