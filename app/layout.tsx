import './globals.css'
import { Inter } from 'next/font/google'
import Navigation from '@/components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Urban Intelligence - Live City Assistant',
  description: 'AI-powered real-time city insights for Bengaluru',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Urban Intelligence" />
        <meta name="theme-color" content="#007acc" />
      </head>
      <body className={`${inter.className} h-full flex flex-col bg-gray-50`}>
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
