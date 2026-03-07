'use client'
import type { Product, Variant } from '@/payload-types'

import { RichText } from '@/components/RichText'
import { AddToCart } from '@/components/Cart/AddToCart'
import { Price } from '@/components/Price'
import React, { Suspense } from 'react'

import { VariantSelector } from './VariantSelector'
import { StockIndicator } from '@/components/product/StockIndicator'
import { getPrice, getProductPriceRange } from '@/utilities/pricing'

export function ProductDescription({ product }: { product: Product }) {
  const hasVariants = product.enableVariants && Boolean(product.variants?.docs?.length)
  const { highestPrice, lowestPrice } = getProductPriceRange(product)
  const price = getPrice(product)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-2xl font-medium">{product.title}</h1>
        <div className="uppercase font-mono">
          {hasVariants && typeof lowestPrice === 'number' ? (
            <Price highestAmount={highestPrice ?? lowestPrice} lowestAmount={lowestPrice} />
          ) : (
            typeof price === 'number' && <Price amount={price} />
          )}
        </div>
      </div>
      {product.description ? (
        <RichText className="" data={product.description} enableGutter={false} />
      ) : null}
      <hr />
      {hasVariants && (
        <>
          <Suspense fallback={null}>
            <VariantSelector product={product} />
          </Suspense>

          <hr />
        </>
      )}
      <div className="flex items-center justify-between">
        <Suspense fallback={null}>
          <StockIndicator product={product} />
        </Suspense>
      </div>

      <div className="flex items-center justify-between">
        <Suspense fallback={null}>
          <AddToCart product={product} />
        </Suspense>
      </div>
    </div>
  )
}
