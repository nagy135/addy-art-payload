'use client'

import { Button } from '@/components/ui/button'
import { useTranslation } from '@/providers/FrontendI18n'
import clsx from 'clsx'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Props = {
  className?: string
}

export const AccountNav: React.FC<Props> = ({ className }) => {
  const pathname = usePathname()
  const { t } = useTranslation()

  return (
    <div className={clsx(className)}>
      <ul className="flex flex-col gap-2">
        <li>
          <Button asChild variant="link">
            <Link
              href="/account"
              className={clsx('text-primary/50 hover:text-primary hover:no-underline', {
                'text-primary': pathname === '/account',
              })}
            >
              {t('account.accountSettings')}
            </Link>
          </Button>
        </li>

        <li>
          <Button asChild variant="link">
            <Link
              href="/account/addresses"
              className={clsx('text-primary/50 hover:text-primary hover:no-underline', {
                'text-primary': pathname === '/account/addresses',
              })}
            >
              {t('account.addresses')}
            </Link>
          </Button>
        </li>

        <li>
          <Button
            asChild
            variant="link"
            className={clsx('text-primary/50 hover:text-primary hover:no-underline', {
              'text-primary': pathname === '/orders' || pathname.includes('/orders'),
            })}
          >
            <Link href="/orders">{t('orders.orders')}</Link>
          </Button>
        </li>
      </ul>

      <hr className="w-full border-white/5" />

      <Button
        asChild
        variant="link"
        className={clsx('text-primary/50 hover:text-primary hover:no-underline', {
          'text-primary': pathname === '/logout',
        })}
      >
        <Link href="/logout">{t('auth.logout')}</Link>
      </Button>
    </div>
  )
}
