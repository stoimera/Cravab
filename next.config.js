/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Disable ESLint during builds for production deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disable TypeScript errors during builds (optional - only if needed)
  typescript: {
    ignoreBuildErrors: false, // Keep this as false to catch TypeScript errors
  },
  
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  
  // Static asset optimization
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  trailingSlash: false,
  
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    webpackBuildWorker: true,
  },

  // Webpack configuration for ngrok development
  webpack: (config, { isServer, dev }) => {
    // Handle SVG imports
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    // Fix for 'self is not defined' error
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // Fix WebSocket HMR for ngrok
    if (dev && !isServer) {
      config.devServer = {
        ...config.devServer,
        client: {
          webSocketURL: {
            hostname: 'localhost',
            pathname: '/_next/webpack-hmr',
            port: 3000,
            protocol: 'ws',
          },
        },
      };
    }

    return config;
  },
  
    // Allow ngrok domains for development
    allowedDevOrigins: [
      'https://CRAVAB.com',
      'https://CRAVAB.vercel.app'
    ],
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Security and API headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Service-Worker-Allowed",
            value: "/"
          },
          {
            key: "X-Frame-Options",
            value: "DENY"
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff"
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin"
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()"
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on"
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload"
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block"
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://maps.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' http://localhost:3000 https://CRAVAB.com https://CRAVAB.vercel.app https://maps.googleapis.com https://api.vapi.ai https://*.supabase.co https://*.supabase.com wss:; frame-src 'none'; worker-src 'self' blob:; object-src 'none'; base-uri 'self';"
          }
        ]
      },
      // Additional security for API routes
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
          {
            key: "Expires",
            value: "0",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET" },
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" }
        ]
      },
      {
        source: "/manifest.json",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Content-Type", value: "application/manifest+json" }
        ]
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Tenant-ID' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
