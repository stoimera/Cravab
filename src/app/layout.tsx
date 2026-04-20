import { Inter } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from '@/components/providers'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt'
import { SpeedInsightsWrapper } from '@/components/SpeedInsightsWrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CRAVAB - Service Business Management Platform',
  description: 'Professional service business management platform with AI integration',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CRAVAB',
    startupImage: [
      {
        url: '/splash-2048x2732.png',
        media: '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: '/splash-1668x2388.png',
        media: '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: '/splash-1536x2048.png',
        media: '(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: '/splash-1125x2436.png',
        media: '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      {
        url: '/splash-1242x2688.png',
        media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      {
        url: '/splash-750x1334.png',
        media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: '/splash-640x1136.png',
        media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
    ],
  },
  icons: {
    icon: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon-57x57.png', sizes: '57x57' },
      { url: '/apple-touch-icon-60x60.png', sizes: '60x60' },
      { url: '/apple-touch-icon-72x72.png', sizes: '72x72' },
      { url: '/apple-touch-icon-76x76.png', sizes: '76x76' },
      { url: '/apple-touch-icon-114x114.png', sizes: '114x114' },
      { url: '/apple-touch-icon-120x120.png', sizes: '120x120' },
      { url: '/apple-touch-icon-144x144.png', sizes: '144x144' },
      { url: '/apple-touch-icon-152x152.png', sizes: '152x152' },
      { url: '/apple-touch-icon-180x180.png', sizes: '180x180' },
    ],
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'CRAVAB',
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#2563eb',
    'msapplication-config': '/browserconfig.xml',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#2563eb',
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={inter.className}>
        <ErrorBoundary>
          <Providers>
            {children}
            <PWAInstallPrompt />
          </Providers>
        </ErrorBoundary>
        {/* SpeedInsights temporarily disabled due to runtime error */}
        {/* <SpeedInsightsWrapper /> */}
      </body>
    </html>
  );
}