/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow build to continue even if database is unavailable
  typescript: {
    ignoreBuildErrors: false,
  },
  // Empty turbopack config to use Turbopack (default in Next.js 16)
  turbopack: {},
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
        hostname: 'xnjwil0hstrlcmbv.public.blob.vercel-storage.com',
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
}

module.exports = nextConfig
