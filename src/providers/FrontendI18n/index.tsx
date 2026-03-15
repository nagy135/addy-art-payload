'use client'

import {
  frontendLocaleCookieName,
  type FrontendLocale,
  frontendLocales,
} from '@/custom-translations'
import {
  defaultFrontendLocale,
  getFrontendMessages,
  translate,
  type FrontendTranslationKey,
} from '@/i18n/frontend'
import { useRouter } from 'next/navigation'
import React, { createContext, useContext, useMemo, useState } from 'react'

type TranslationVariables = Record<string, number | string>

type FrontendI18nContextValue = {
  locale: FrontendLocale
  locales: readonly FrontendLocale[]
  setLocale: (locale: FrontendLocale) => void
  t: (key: FrontendTranslationKey, variables?: TranslationVariables) => string
}

const FrontendI18nContext = createContext<FrontendI18nContextValue | null>(null)

export const FrontendI18nProvider: React.FC<{
  children: React.ReactNode
  initialLocale: FrontendLocale
}> = ({ children, initialLocale }) => {
  const router = useRouter()
  const [locale, setLocaleState] = useState<FrontendLocale>(initialLocale || defaultFrontendLocale)

  const value = useMemo<FrontendI18nContextValue>(() => {
    return {
      locale,
      locales: frontendLocales,
      setLocale: (nextLocale) => {
        setLocaleState(nextLocale)
        document.cookie = `${frontendLocaleCookieName}=${nextLocale}; path=/; max-age=31536000; samesite=lax`
        document.documentElement.lang = nextLocale
        router.refresh()
      },
      t: (key, variables) => translate(locale, key, variables),
    }
  }, [locale, router])

  return <FrontendI18nContext.Provider value={value}>{children}</FrontendI18nContext.Provider>
}

export const useTranslation = () => {
  const context = useContext(FrontendI18nContext)

  if (!context) {
    throw new Error('useTranslation must be used within FrontendI18nProvider')
  }

  return context
}

export const useMessages = () => {
  const { locale } = useTranslation()

  return getFrontendMessages(locale)
}
