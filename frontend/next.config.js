const { withSentryConfig } = require("@sentry/nextjs");
const withPWA = require('next-pwa')({ dest: 'public' });
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer, dev }) => {
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

    // Exclude backend files and test files from compilation
    config.module.rules.push({
      test: /\.(ts|tsx|js|jsx)$/,
      exclude: [
        /\/backend\//,
        /\/electron\//,
        /\/__tests__\//,
        /\.test\.(ts|tsx|js|jsx)$/,
        /\.spec\.(ts|tsx|js|jsx)$/,
      ],
    })

    // Bundle optimization and code splitting for production
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Three.js and 3D libraries
            threejs: {
              test: /[\\/]node_modules[\\/](three|@react-three)[\\/]/,
              name: 'threejs',
              chunks: 'all',
              priority: 20,
            },
            // PDF libraries
            pdf: {
              test: /[\\/]node_modules[\\/](pdfjs-dist|react-pdf)[\\/]/,
              name: 'pdf',
              chunks: 'all',
              priority: 20,
            },
            // ONNX and AI libraries
            ai: {
              test: /[\\/]node_modules[\\/](onnxruntime-web|@tensorflow)[\\/]/,
              name: 'ai',
              chunks: 'all',
              priority: 20,
            },
            // Chart libraries
            charts: {
              test: /[\\/]node_modules[\\/](recharts|d3)[\\/]/,
              name: 'charts',
              chunks: 'all',
              priority: 15,
            },
            // HVAC calculation modules
            hvac: {
              test: /[\\/](lib\/services|lib\/hooks)[\\/].*[Cc]alculation/,
              name: 'hvac-calculations',
              chunks: 'all',
              priority: 25,
            },
            // 3D components
            components3d: {
              test: /[\\/]components[\\/]3d[\\/]/,
              name: 'components-3d',
              chunks: 'all',
              priority: 25,
            },
            // Vendor libraries (default)
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
          },
        },
      };
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
      {
        protocol: 'https',
        hostname: 'cdn.sizewise.app',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // CDN and Asset Optimization
  assetPrefix: process.env.NODE_ENV === 'production' ? process.env.NEXT_PUBLIC_CDN_URL : '',

  // Enhanced caching headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/models/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, immutable',
          },
          {
            key: 'Content-Encoding',
            value: 'gzip',
          },
        ],
      },
      {
        source: '/fonts/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },

  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react'],
    // Note: instrumentationHook is no longer needed as instrumentation.js is available by default
  },

  // API proxy configuration for development
  async rewrites() {
    // Support both local development and containerized environments
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
    const authUrl = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:5002'

    return [
      {
        source: '/api/auth/:path*',
        destination: `${authUrl}/api/:path*`,
      },
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ]
  },
}

module.exports = withBundleAnalyzer(
  withPWA(
    withSentryConfig(
      nextConfig,
    {
      // For all available options, see:
      // https://www.npmjs.com/package/@sentry/webpack-plugin#options

    org: "sizewise",
    project: "javascript-nextjs",

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // This can increase your server load as well as your hosting bill.
    // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
    // side errors will fail.
    tunnelRoute: "/monitoring", // Re-enabled with middleware fix

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
      automaticVercelMonitors: true,
    }
  )
  )
);
