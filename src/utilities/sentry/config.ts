const readBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (value == null) return fallback

  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase())
}

const readNumber = (value: string | undefined, fallback: number): number => {
  if (value == null || value.trim() === '') return fallback

  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : fallback
}

const isProduction = process.env.NODE_ENV === 'production'

export const sentryBaseConfig = {
  debug: readBoolean(process.env.SENTRY_DEBUG, false),
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  enableLogs: readBoolean(process.env.SENTRY_ENABLE_LOGS, !isProduction),
  environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
  release: process.env.SENTRY_RELEASE,
  sendDefaultPii: readBoolean(process.env.SENTRY_SEND_DEFAULT_PII, false),
  tracesSampleRate: readNumber(process.env.SENTRY_TRACES_SAMPLE_RATE, isProduction ? 0.1 : 1),
}

export const sentryReplayConfig = {
  replaysOnErrorSampleRate: readNumber(process.env.SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE, 1),
  replaysSessionSampleRate: readNumber(
    process.env.SENTRY_REPLAYS_SESSION_SAMPLE_RATE,
    isProduction ? 0.1 : 1,
  ),
}
