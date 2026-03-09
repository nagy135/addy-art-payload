import type { Metadata } from 'next'

import * as Sentry from '@sentry/nextjs'
import type { ReactNode } from 'react'

import { InitTheme } from '@/providers/Theme/InitTheme'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'

export function generateMetadata(): Metadata {
  return {
    icons: {
      icon: [
        { rel: 'icon', url: '/favicon.ico', sizes: '32x32' },
        { rel: 'icon', url: '/favicon.svg', type: 'image/svg+xml' },
      ],
    },
    other: {
      ...Sentry.getTraceData(),
    },
  }
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      className={[GeistSans.variable, GeistMono.variable].filter(Boolean).join(' ')}
      lang="en"
      suppressHydrationWarning
    >
      <body>
        <InitTheme />
        {children}
      </body>
    </html>
  )
}
