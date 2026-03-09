import React from 'react'

import type { ProductsBlock as ProductsBlockProps } from '@/payload-types'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { Grid } from '@/components/Grid'
import { ProductGridItem } from '@/components/ProductGridItem'
import { RichText } from '@/components/RichText'
import { CMSLink } from '@/components/Link'

type ProductsBlockComponentProps = ProductsBlockProps

type RichTextNode = {
  type: string
  version: number
  children?: Array<{
    text?: string
  }>
}

const hasRichTextContent = (richText: ProductsBlockProps['richText']) => {
  if (!richText?.root?.children || richText.root.children.length === 0) return false

  return (richText.root.children as RichTextNode[]).some((node) => {
    if ('children' in node && Array.isArray(node.children)) {
      return node.children.some((child: { text?: string }) => {
        return 'text' in child && typeof child.text === 'string' && child.text.trim().length > 0
      })
    }

    return false
  })
}

export const ProductsBlock: React.FC<
  ProductsBlockComponentProps & {
    id?: string | number
    className?: string
  }
> = async ({ pickedProducts: products, richText }) => {
  const showHeader = hasRichTextContent(richText)

  if (!products) return null
  if (!showHeader && products.length === 0) return null

  return (
    <section className="container">
      <div className="flex flex-col gap-8">
        {showHeader ? (
          <div className="bg-card rounded border-border border p-4 flex flex-col gap-8 md:flex-row md:justify-between md:items-center">
            <div className="max-w-3xl flex items-center">
              {hasRichTextContent(richText) ? (
                <RichText className="mb-0" data={richText!} enableGutter={false} />
              ) : null}
            </div>
          </div>
        ) : null}

        {products.length > 0 ? (
          <Grid className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product, index) => {
              if (typeof product === 'string') return null
              return <ProductGridItem key={product.id || index} product={product} />
            })}
          </Grid>
        ) : null}
      </div>
    </section>
  )
}
