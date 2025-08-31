const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
    ],
  },
  webpack: config => {
    config.resolve.alias['@'] = path.resolve(__dirname)
    return config
  },
}

module.exports = nextConfig
