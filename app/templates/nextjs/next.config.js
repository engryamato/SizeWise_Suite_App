/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Fix for Konva.js in Next.js
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false,
      encoding: false,
      fs: false,
      path: false,
    }

    // Exclude canvas from both server and client builds
    config.externals = config.externals || []
    if (isServer) {
      config.externals.push('canvas')
    }

    return config
  },

  // Disable strict mode to prevent double rendering in development
  reactStrictMode: false,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'parsefiles.back4app.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },

  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
}

module.exports = nextConfig
