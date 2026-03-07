import { Grid } from '@/components/Grid'
import { ProductGridItem } from '@/components/ProductGridItem'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import { resolveProductSort } from '@/utilities/pricing'

export const metadata = {
  description: 'Search for products in the store.',
  title: 'Shop',
}

type SearchParams = { [key: string]: string | string[] | undefined }

type CategoryDoc = {
  id: string
  parent?: null | string | { id: string }
}

const getSearchParam = (value: string | string[] | undefined): string | undefined => {
  if (Array.isArray(value)) return value[0]

  return value
}

const getCategoryID = (value: CategoryDoc['parent']): null | string => {
  if (!value) return null

  if (typeof value === 'string') return value

  return value.id
}

const getCategoryIDsWithDescendants = (
  categories: CategoryDoc[],
  rootCategoryID: string,
): string[] => {
  const childrenByParent = new Map<string, string[]>()

  categories.forEach((category) => {
    const parentID = getCategoryID(category.parent)

    if (!parentID) return

    const siblings = childrenByParent.get(parentID) ?? []
    siblings.push(category.id)
    childrenByParent.set(parentID, siblings)
  })

  const ids = new Set<string>([rootCategoryID])
  const queue = [rootCategoryID]

  while (queue.length > 0) {
    const currentID = queue.shift()

    if (!currentID) continue

    const childIDs = childrenByParent.get(currentID) ?? []

    childIDs.forEach((childID) => {
      if (ids.has(childID)) return

      ids.add(childID)
      queue.push(childID)
    })
  }

  return [...ids]
}

type Props = {
  searchParams: Promise<SearchParams>
}

export default async function ShopPage({ searchParams }: Props) {
  const { q, sort, category } = await searchParams
  const payload = await getPayload({ config: configPromise })
  const searchValue = getSearchParam(q)
  const selectedCategory = getSearchParam(category)
  const resolvedSort = resolveProductSort(sort)

  const categoryIDs = selectedCategory
    ? getCategoryIDsWithDescendants(
        (
          await payload.find({
            collection: 'categories',
            depth: 0,
            limit: 1000,
            pagination: false,
            select: {
              parent: true,
            },
          })
        ).docs as CategoryDoc[],
        selectedCategory,
      )
    : []

  const products = await payload.find({
    collection: 'products',
    draft: false,
    overrideAccess: false,
    select: {
      title: true,
      slug: true,
      gallery: true,
      categories: true,
      priceInEUR: true,
    },
    ...(resolvedSort ? { sort: resolvedSort } : { sort: 'title' }),
    ...(searchValue || selectedCategory
      ? {
          where: {
            and: [
              {
                _status: {
                  equals: 'published',
                },
              },
              ...(searchValue
                ? [
                    {
                      or: [
                        {
                          title: {
                            like: searchValue,
                          },
                        },
                        {
                          description: {
                            like: searchValue,
                          },
                        },
                      ],
                    },
                  ]
                : []),
              ...(selectedCategory
                ? [
                    {
                      categories: {
                        in: categoryIDs,
                      },
                    },
                  ]
                : []),
            ],
          },
        }
      : {}),
  })

  const resultsText = products.docs.length > 1 ? 'results' : 'result'

  return (
    <div>
      {searchValue ? (
        <p className="mb-4">
          {products.docs?.length === 0
            ? 'There are no products that match '
            : `Showing ${products.docs.length} ${resultsText} for `}
          <span className="font-bold">&quot;{searchValue}&quot;</span>
        </p>
      ) : null}

      {!searchValue && products.docs?.length === 0 && (
        <p className="mb-4">No products found. Please try different filters.</p>
      )}

      {products?.docs.length > 0 ? (
        <Grid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.docs.map((product) => {
            return <ProductGridItem key={product.id} product={product} />
          })}
        </Grid>
      ) : null}
    </div>
  )
}
