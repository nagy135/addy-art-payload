import { AuthProvider } from '@/providers/Auth'
import { type FrontendLocale } from '@/custom-translations'
import { translate } from '@/i18n/frontend'
import { EcommerceProvider } from '@payloadcms/plugin-ecommerce/client/react'
import { manualAdapterClient } from '@/payments/manual'
import React from 'react'
import { euroCurrenciesConfig } from '@/utilities/pricing'

import { FrontendI18nProvider } from './FrontendI18n'
import { HeaderThemeProvider } from './HeaderTheme'
import { ThemeProvider } from './Theme'
import { SonnerProvider } from '@/providers/Sonner'

export const Providers: React.FC<{
  children: React.ReactNode
  locale: FrontendLocale
}> = ({ children, locale }) => {
  return (
    <FrontendI18nProvider initialLocale={locale}>
      <ThemeProvider>
        <AuthProvider>
          <HeaderThemeProvider>
            <SonnerProvider />
            <EcommerceProvider
              enableVariants={true}
              currenciesConfig={euroCurrenciesConfig}
              api={{
                cartsFetchQuery: {
                  depth: 2,
                  populate: {
                    products: {
                      slug: true,
                      title: true,
                      gallery: true,
                      inventory: true,
                    },
                    variants: {
                      title: true,
                      inventory: true,
                    },
                  },
                },
              }}
              paymentMethods={[
                manualAdapterClient({
                  label: translate(locale, 'checkout.createOrder'),
                }),
              ]}
            >
              {children}
            </EcommerceProvider>
          </HeaderThemeProvider>
        </AuthProvider>
      </ThemeProvider>
    </FrontendI18nProvider>
  )
}
