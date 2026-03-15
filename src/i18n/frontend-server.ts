import 'server-only'

import { frontendLocaleCookieName } from '@/custom-translations'
import {
  defaultFrontendLocale,
  isFrontendLocale,
  translate,
  type FrontendTranslationKey,
} from '@/i18n/frontend'
import { cookies } from 'next/headers'

type TranslationVariables = Record<string, number | string>

export const getFrontendLocale = async () => {
  const cookieStore = await cookies()
  const locale = cookieStore.get(frontendLocaleCookieName)?.value

  if (locale && isFrontendLocale(locale)) {
    return locale
  }

  return defaultFrontendLocale
}

export const getServerTranslation = async () => {
  const locale = await getFrontendLocale()

  return {
    locale,
    t: (key: FrontendTranslationKey, variables?: TranslationVariables) =>
      translate(locale, key, variables),
  }
}
