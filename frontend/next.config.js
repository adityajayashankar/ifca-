/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    // NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://pvl.ifcaindia.com/api/api/v1',
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
      'api.dicebear.com',
      'cdn.pixabay.com',
      'www.google.com',
      'cdn.tools.unlayer.com',
      'cdn.templates.unlayer.com',
      'publisher.flowbite.com',
      'via.placeholder.com',
      's3.amazonaws.com',
      'ui-avatars.com',
      'images.unsplash.com',
      'localhost',
      '127.0.0.1',
      '*.amazonaws.com',
      '*.s3.ap-south-1.amazonaws.com',
      '*.s3.amazonaws.com',
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
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: true, // Add this to bypass image optimization for external images
  },
  async rewrites() {
    // Use local backend in development, production backend in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    const destination = isDevelopment 
      ? 'http://localhost:5000/api/:path*'
      : 'https://pvl.ifcaindia.com/api/api/:path*';
    
    console.log('Next.js rewrite destination:', destination);
    
    return [
      {
        source: '/api/:path*',
        destination: destination
      }
    ]
  },
  // Increase the timeout for static page generation
  staticPageGenerationTimeout: 120,
  // Configure which pages should be statically generated
  experimental: {
    // This will make all pages use dynamic rendering by default
    // unless explicitly marked as static
  },
  // Ensure proper client-side navigation
  trailingSlash: false,
  // Disable static optimization for dynamic routes
  generateEtags: false,
}

module.exports = nextConfig
