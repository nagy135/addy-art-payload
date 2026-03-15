import { customTranslations, frontendLocales, type FrontendLocale } from '@/custom-translations'

type Messages = typeof customTranslations.en

type Join<K extends string, P extends string> = `${K}.${P}`

type NestedKeyOf<T> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object ? Join<K, NestedKeyOf<T[K]>> : K
    }[keyof T & string]
  : never

export type FrontendTranslationKey = NestedKeyOf<Messages>

type TranslationVariables = Record<string, number | string>

export const defaultFrontendLocale: FrontendLocale = 'sk'

export const isFrontendLocale = (value: string): value is FrontendLocale =>
  frontendLocales.includes(value as FrontendLocale)

export const getFrontendMessages = (locale: FrontendLocale): Messages => {
  return customTranslations[locale] as Messages
}

const resolveTranslation = (messages: Messages, key: FrontendTranslationKey): string | null => {
  const value = key.split('.').reduce<unknown>((current, segment) => {
    if (!current || typeof current !== 'object') {
      return null
    }

    return (current as Record<string, unknown>)[segment]
  }, messages)

  return typeof value === 'string' ? value : null
}

const interpolate = (message: string, variables?: TranslationVariables): string => {
  if (!variables) {
    return message
  }

  return message.replace(/{{\s*(\w+)\s*}}/g, (_, variable: string) => {
    const value = variables[variable]

    return value === undefined ? '' : String(value)
  })
}

export const translate = (
  locale: FrontendLocale,
  key: FrontendTranslationKey,
  variables?: TranslationVariables,
): string => {
  const messages = getFrontendMessages(locale)
  const message = resolveTranslation(messages, key)

  if (!message) {
    return key
  }

  return interpolate(message, variables)
}
