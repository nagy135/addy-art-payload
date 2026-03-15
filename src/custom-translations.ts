import type { NestedKeysStripped } from '@payloadcms/translations'
import { enTranslations } from '@payloadcms/translations/languages/en'

import { en } from '@/i18n/en'
import { sk } from '@/i18n/sk'

export const frontendLocales = ['sk', 'en'] as const

export type FrontendLocale = (typeof frontendLocales)[number]

export const frontendLocaleCookieName = 'frontend-locale'

export const customTranslations = {
  en,
  sk,
} as const

export type CustomTranslationsObject = typeof en & typeof enTranslations

export type CustomTranslationsKeys = NestedKeysStripped<CustomTranslationsObject>
