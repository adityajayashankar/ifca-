/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    // NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api/v1',
    NEXT_PUBLIC_USER_URL: process.env.NEXT_PUBLIC_USER_URL || 'http://localhost:3001',
    NEXT_PUBLIC_ADMIN_URL: process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3005',
  },
  images: {
    domains: [
      "session-images-0.s3.ap-south-1.amazonaws.com",
      "community-images-0.s3.ap-south-1.amazonaws.com",
      "robohash.org",
      "loremflickr.com",
      "community-bucket-0.s3.ap-south-1.amazonaws.com",
      "subspace-test0.s3.ap-south-1.amazonaws.com",
      "subspacetest-0.s3.ap-south-1.amazonaws.com",
      "subspacetest-0.s3.ap-south-1.amazonaws.com",
      "static.wixstatic.com",
      "encrypted-tbn0.gstatic.com",
      'hebbkx1anhila5yf.public.blob.vercel-storage.com',
      'getsubspace.tech',
      'example.com',
      'ifca-dummy.s3.ap-south-1.amazonaws.com',
      'images.unsplash.com',
      '*'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      }
    ]
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://pvl.ifcaindia.com/api/api/:path*'
      }
    ]
  }
};

module.exports = nextConfig;
