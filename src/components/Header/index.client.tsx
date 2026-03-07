'use client'
import { CMSLink } from '@/components/Link'
import { Cart } from '@/components/Cart'
import { OpenCartButton } from '@/components/Cart/OpenCart'
import Link from 'next/link'
import React, { Suspense } from 'react'

import { MobileMenu } from './MobileMenu'
import type { Header } from 'src/payload-types'

import { LogoIcon } from '@/components/icons/logo'
import { usePathname } from 'next/navigation'
import { cn } from '@/utilities/cn'
import { ThemeSelector } from '@/providers/Theme/ThemeSelector'

type Props = {
  header: Header
}

export function HeaderClient({ header }: Props) {
  const menu = header.navItems || []
  const pathname = usePathname()
  const headerLinkClassName = 'text-foreground/70 hover:text-foreground [&.active]:text-foreground'

  return (
    <div className="relative z-20 border-b border-border bg-background text-foreground transition-colors">
      <nav className="container flex items-center justify-between gap-4 pt-2">
        <div className="block flex-none md:hidden">
          <Suspense fallback={null}>
            <MobileMenu menu={menu} />
          </Suspense>
        </div>
        <div className="flex w-full items-end justify-between gap-6">
          <div className="flex w-full items-end gap-6 md:w-1/3">
            <Link className="flex w-full items-center justify-center pt-4 pb-4 md:w-auto" href="/">
              <LogoIcon className="w-6 h-auto" />
            </Link>
            {menu.length ? (
              <ul className="hidden gap-4 text-sm md:flex md:items-center">
                {menu.map((item) => (
                  <li key={item.id}>
                    <CMSLink
                      {...item.link}
                      size={'clear'}
                      className={cn('relative navLink', headerLinkClassName, {
                        active:
                          item.link.url && item.link.url !== '/' ? pathname.includes(item.link.url) : false,
                      })}
                      appearance="nav"
                    />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="flex items-start justify-end gap-4 md:w-1/3">
            <Suspense fallback={<OpenCartButton className={headerLinkClassName} />}>
              <Cart buttonClassName={headerLinkClassName} />
            </Suspense>
            <ThemeSelector />
          </div>
        </div>
      </nav>
    </div>
  )
}
