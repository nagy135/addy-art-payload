'use client'

import * as Sentry from '@sentry/nextjs'
import { useTranslation } from '@/providers/FrontendI18n'
import React from 'react'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { t } = useTranslation()

  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="mx-auto my-4 flex max-w-xl flex-col rounded-lg border border-neutral-200 bg-white p-8 md:p-12 dark:border-neutral-800 dark:bg-black">
      <h2 className="text-xl font-bold">{t('errors.ohNo')}</h2>
      <p className="my-2">{t('errors.storefrontIssue')}</p>
      <button
        className="mx-auto mt-4 flex w-full items-center justify-center rounded-full bg-blue-600 p-4 tracking-wide text-white hover:opacity-90"
        onClick={() => reset()}
        type="button"
      >
        {t('errors.tryAgain')}
      </button>
    </div>
  )
}
