import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/lib/theme';

export const metadata: Metadata = {
  title: 'HealthGuard PWA | AI-Driven Disease Surveillance Uganda',
  description:
    'HealthGuard PWA: AI-Driven Surveillance for Contagious Diseases & Image-Based Malnutrition Detection in Uganda. Developed by NDUHURA MARVIN for ANGEL TECHNOLOGIES LTD.',
  keywords: ['Uganda', 'COVID-19', 'health surveillance', 'malnutrition', 'AI', 'disease monitoring', 'PWA'],
  authors: [{ name: 'NDUHURA MARVIN', url: 'https://angeltechnologies.ug' }],
  creator: 'NDUHURA MARVIN — ANGEL TECHNOLOGIES LTD',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'HealthGuard',
  },
  icons: {
    icon: '/icons/icon-192.png',
    shortcut: '/icons/icon-192.png',
    apple: '/icons/icon-512.png',
  },
  openGraph: {
    title: 'HealthGuard PWA — AI Disease Surveillance Uganda',
    description: 'Real-time AI-powered COVID-19 hotspot prediction and malnutrition detection for all 136 Uganda districts.',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
};

export const viewport: Viewport = {
  themeColor: '#0ea5e9',
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="msapplication-TileColor" content="#0ea5e9" />
        <link rel="apple-touch-icon" href="/icons/icon-512.png" />
        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('hg-theme') || 'dark';
                var isDark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                document.documentElement.classList.toggle('dark', isDark);
                document.documentElement.classList.toggle('light', !isDark);
              } catch(e){}
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
