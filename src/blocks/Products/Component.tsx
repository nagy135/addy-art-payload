import React from 'react'

import type { Product, ProductsBlock as ProductsBlockProps } from '@/payload-types'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { Grid } from '@/components/Grid'
import { ProductGridItem } from '@/components/ProductGridItem'
import { RichText } from '@/components/RichText'
import { CMSLink } from '@/components/Link'

type LinkItem = {
  link: React.ComponentProps<typeof CMSLink>
  id?: string | null
}

type ProductsBlockComponentProps = ProductsBlockProps & {
  links?: LinkItem[] | null
}

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
> = async ({ links, richText }) => {
  console.log('================\n', 'richText: ', richText, '\n================')
  console.log('================\n', 'links: ', links, '\n================')
  const payload = await getPayload({ config: configPromise })

  const latestProducts = await payload.find({
    collection: 'products',
    depth: 1,
    draft: false,
    limit: 6,
    overrideAccess: false,
    select: {
      title: true,
      slug: true,
      gallery: true,
      priceInEUR: true,
      variants: true,
    },
    sort: '-createdAt',
    where: {
      _status: {
        equals: 'published',
      },
    },
  })

  const products = latestProducts.docs as Product[]
  const blockLinks: LinkItem[] = Array.isArray(links) ? links : []
  const showHeader = hasRichTextContent(richText) || blockLinks.length > 0

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
            <div className="flex flex-col gap-8">
              {blockLinks.map(({ link }: LinkItem, i: number) => {
                return <CMSLink key={i} size="lg" {...link} />
              })}
            </div>
          </div>
        ) : null}

        {products.length > 0 ? (
          <Grid className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => {
              return <ProductGridItem key={product.id} product={product} />
            })}
          </Grid>
        ) : null}
      </div>
    </section>
  )
}
