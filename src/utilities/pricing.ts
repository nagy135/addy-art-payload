import type { Currency, CurrenciesConfig } from '@payloadcms/plugin-ecommerce/types'
import type { Product, Variant } from '@/payload-types'

type Priceable = {
  price?: number | null
  priceInEUR?: number | null
}

export const euroCurrency: Currency = {
  code: 'EUR',
  decimals: 2,
  label: 'Euro',
  symbol: '€',
}

export const euroCurrenciesConfig: CurrenciesConfig = {
  defaultCurrency: euroCurrency.code,
  supportedCurrencies: [euroCurrency],
}

const euroFormatter = new Intl.NumberFormat('en', {
  style: 'currency',
  currency: euroCurrency.code,
  minimumFractionDigits: euroCurrency.decimals,
  maximumFractionDigits: euroCurrency.decimals,
})

export const formatEuroCents = (amount: number): string =>
  euroFormatter.format(amount / 10 ** euroCurrency.decimals)

export const getPrice = (item?: Priceable | null): number | null => {
  if (!item) return null
  if (typeof item.price === 'number') return item.price
  if (typeof item.priceInEUR === 'number') return item.priceInEUR
  return null
}

export const getDisplayProductPrice = (product?: Partial<Product> | null): number | null => {
  if (!product) return null

  const firstVariant = product.variants?.docs?.find(
    (variant): variant is Variant => Boolean(variant && typeof variant === 'object'),
  )

  return getPrice(firstVariant) ?? getPrice(product)
}

export const getProductPriceRange = (product: Product) => {
  const variantPrices =
    product.variants?.docs
      ?.filter((variant): variant is Variant => Boolean(variant && typeof variant === 'object'))
      .map((variant) => getPrice(variant))
      .filter((price): price is number => typeof price === 'number')
      .sort((a, b) => a - b) ?? []

  if (variantPrices.length > 0) {
    return {
      highestPrice: variantPrices[variantPrices.length - 1] ?? null,
      lowestPrice: variantPrices[0] ?? null,
    }
  }

  const price = getPrice(product)

  return {
    highestPrice: price,
    lowestPrice: price,
  }
}

export const getHighestProductPrice = (product: Product): number | null =>
  getProductPriceRange(product).highestPrice

export const resolveProductSort = (sort?: string | string[]): string | undefined => {
  const sortValue = Array.isArray(sort) ? sort[0] : sort

  if (!sortValue) return undefined

  if (sortValue === 'price' || sortValue === 'priceInEUR') {
    return 'priceInEUR'
  }

  if (sortValue === '-price' || sortValue === '-priceInEUR') {
    return '-priceInEUR'
  }

  return sortValue
}
