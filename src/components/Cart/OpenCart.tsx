import { Button } from '@/components/ui/button'
import { useTranslation } from '@/providers/FrontendI18n'
import React from 'react'
import { cn } from '@/utilities/cn'

export function OpenCartButton({
  className,
  quantity,
  ...rest
}: {
  className?: string
  quantity?: number
}) {
  const { t } = useTranslation()

  return (
    <Button
      variant="nav"
      size="clear"
      className={cn('navLink relative items-end hover:cursor-pointer', className)}
      {...rest}
    >
      <span>{t('cart.cart')}</span>

      {quantity ? (
        <>
          <span>•</span>
          <span>{quantity}</span>
        </>
      ) : null}
    </Button>
  )
}
