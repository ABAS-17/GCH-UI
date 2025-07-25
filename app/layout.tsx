import './globals.css'
import { Inter } from 'next/font/google'
import Navigation from '@/components/Navigation'
import type { Metadata, Viewport } from 'next'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: 'Urban Intelligence - Live City Assistant',
  description: 'AI-powered real-time city insights for Bengaluru',
  keywords: ['bengaluru', 'city intelligence', 'ai', 'traffic', 'weather', 'events'],
  authors: [{ name: 'Urban Intelligence Team' }],
  creator: 'Urban Intelligence',
  publisher: 'Urban Intelligence',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('http://localhost:3000'),
  openGraph: {
    title: 'Urban Intelligence - Live City Assistant',
    description: 'AI-powered real-time city insights for Bengaluru',
    url: 'http://localhost:3000',
    siteName: 'Urban Intelligence',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Urban Intelligence - Live City Assistant',
    description: 'AI-powered real-time city insights for Bengaluru',
  },
  manifest: '/manifest.json',
  icons: {
    icon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHJ4PSIzIiBmaWxsPSIjMDA3YWNjIi8+CiAgPHRleHQgeD0iMTYiIHk9IjE4IiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9InN5c3RlbS11aSIgZm9udC1zaXplPSIxMiIgZm9udC13ZWlnaHQ9ImJvbGQiPlVJPC90ZXh0Pgo8L3N2Zz4K",
    shortcut: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHJ4PSIxLjYiIGZpbGw9IiMwMDdhY2MiLz4KICA8dGV4dCB4PSI4IiB5PSI5IiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9InN5c3RlbS11aSIgZm9udC1zaXplPSI2IiBmb250LXdlaWdodD0iYm9sZCI+VUk8L3RleHQ+Cjwvc3ZnPgo=",
    apple: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDE4MCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHJlY3Qgd2lkdGg9IjE4MCIgaGVpZ2h0PSIxODAiIHJ4PSIxOCIgZmlsbD0iIzAwN2FjYyIvPgogIDx0ZXh0IHg9IjkwIiB5PSI5OCIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJzeXN0ZW0tdWkiIGZvbnQtc2l6ZT0iNzIiIGZvbnQtd2VpZ2h0PSJib2xkIj5VSTwvdGV4dD4KPC9zdmc+Cg==",
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#007acc' },
    { media: '(prefers-color-scheme: dark)', color: '#007acc' }
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`h-full ${inter.variable}`}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Urban Intelligence" />
        <link rel="preconnect" href="http://localhost:8000" />
      </head>
      <body className={`${inter.className} h-full flex flex-col bg-gray-50 font-sans antialiased`}>
        <div className="flex-1 flex flex-col max-w-screen-2xl mx-auto w-full">
          <main className="flex-1 relative">
            {children}
          </main>
          <Navigation />
        </div>
      </body>
    </html>
  )
}
