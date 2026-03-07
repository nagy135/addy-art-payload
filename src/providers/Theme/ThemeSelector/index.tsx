'use client'

import React from 'react'
import { MoonIcon, SunIcon } from 'lucide-react'

import type { Theme } from '../types'

import { useTheme } from '..'
import { cn } from '@/utilities/cn'

export const ThemeSelector: React.FC = () => {
  const { setTheme, theme } = useTheme()

  const resolvedTheme: Theme = theme === 'dark' ? 'dark' : 'light'
  const nextTheme: Theme = resolvedTheme === 'dark' ? 'light' : 'dark'

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme)}
      aria-label={`Switch to ${nextTheme} mode`}
      aria-pressed={resolvedTheme === 'dark'}
      className={cn(
        'cursor-pointer inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60',
        'bg-background/70 text-muted-foreground transition-colors hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      )}
    >
      <span className="sr-only">
        Theme follows the browser preference until changed manually. Current theme: {resolvedTheme}.
      </span>
      {resolvedTheme === 'dark' ? (
        <MoonIcon className="h-3.5 w-3.5" />
      ) : (
        <SunIcon className="h-3.5 w-3.5" />
      )}
    </button>
  )
}
