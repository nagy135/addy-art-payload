import configPromise from '@payload-config'
import { getFrontendLocale } from '@/i18n/frontend-server'
import { getPayload } from 'payload'

import './index.css'
import { HeaderClient } from './index.client'

export async function Header() {
  const locale = await getFrontendLocale()
  const payload = await getPayload({ config: configPromise })
  const header = await payload.findGlobal({
    slug: 'header',
    depth: 1,
    locale: locale as never,
    fallbackLocale: false as never,
  })

  return <HeaderClient header={header} />
}
