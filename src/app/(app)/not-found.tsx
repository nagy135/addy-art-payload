import Link from 'next/link'
import React from 'react'

import { getServerTranslation } from '@/i18n/frontend-server'
import { Button } from '@/components/ui/button'

export default async function NotFound() {
  const { t } = await getServerTranslation()

  return (
    <div className="container py-28">
      <div className="prose max-w-none">
        <h1 style={{ marginBottom: 0 }}>404</h1>
        <p className="mb-4">{t('errors.pageNotFound')}</p>
      </div>
      <Button asChild variant="default">
        <Link href="/">{t('general.goHome')}</Link>
      </Button>
    </div>
  )
}
