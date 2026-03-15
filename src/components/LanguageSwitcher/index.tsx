'use client'

import { Button } from '@/components/ui/button'
import { useTranslation } from '@/providers/FrontendI18n'
import { LanguagesIcon } from 'lucide-react'

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useTranslation()
  const nextLocale = locale === 'sk' ? 'en' : 'sk'

  return (
    <Button
      aria-label={t('locale.language')}
      className="gap-2 px-2"
      onClick={() => setLocale(nextLocale)}
      size="clear"
      type="button"
      variant="nav"
    >
      <LanguagesIcon className="h-4 w-4" />
      <span>{locale.toUpperCase()}</span>
    </Button>
  )
}
