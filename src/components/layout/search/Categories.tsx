import configPromise from '@payload-config'
import { getPayload } from 'payload'
import clsx from 'clsx'
import React, { Suspense } from 'react'

import { FilterList } from './filter'
import { CategoryItem } from './Categories.client'

import type { Category } from '@/payload-types'

type CategoryNode = Category & {
  childrenNodes: CategoryNode[]
}

const getParentID = (parent: Category['parent']): null | string => {
  if (!parent) return null

  if (typeof parent === 'string') return parent

  return parent.id
}

const buildCategoryTree = (categories: Category[]): CategoryNode[] => {
  const categoryMap = new Map<string, CategoryNode>()

  categories.forEach((category) => {
    categoryMap.set(category.id, {
      ...category,
      childrenNodes: [],
    })
  })

  const roots: CategoryNode[] = []

  categoryMap.forEach((category) => {
    const parentID = getParentID(category.parent)

    if (parentID) {
      const parent = categoryMap.get(parentID)

      if (parent) {
        parent.childrenNodes.push(category)
        return
      }
    }

    roots.push(category)
  })

  const sortNodes = (nodes: CategoryNode[]) => {
    nodes.sort((a, b) => a.title.localeCompare(b.title))
    nodes.forEach((node) => sortNodes(node.childrenNodes))
  }

  sortNodes(roots)

  return roots
}

function CategoryTree({ categories, level = 0 }: { categories: CategoryNode[]; level?: number }) {
  return (
    <ul
      className={clsx(
        level === 0
          ? 'space-y-1'
          : 'mt-1 space-y-1 border-l border-neutral-200/80 pl-3 dark:border-neutral-800/80',
      )}
    >
      {categories.map((category) => {
        return (
          <li key={category.id}>
            <CategoryItem
              category={category}
              hasChildren={category.childrenNodes.length > 0}
              level={level}
            >
              {category.childrenNodes.length > 0 ? (
                <CategoryTree categories={category.childrenNodes} level={level + 1} />
              ) : null}
            </CategoryItem>
          </li>
        )
      })}
    </ul>
  )
}

async function CategoryList() {
  const payload = await getPayload({ config: configPromise })

  const categories = await payload.find({
    collection: 'categories',
    depth: 1,
    limit: 1000,
    sort: 'title',
  })

  const categoryTree = buildCategoryTree(categories.docs)

  return (
    <div className="rounded-xl border border-neutral-200/80 bg-white/60 p-3 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-950/40">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
        Category
      </h3>
      <CategoryTree categories={categoryTree} />
    </div>
  )
}

const skeleton = 'mb-3 h-4 w-5/6 animate-pulse rounded'
const activeAndTitles = 'bg-neutral-800 dark:bg-neutral-300'
const items = 'bg-neutral-400 dark:bg-neutral-700'

export function Categories() {
  return (
    <Suspense
      fallback={
        <div className="col-span-2 hidden h-[400px] w-full flex-none py-4 lg:block">
          <div className={clsx(skeleton, activeAndTitles)} />
          <div className={clsx(skeleton, activeAndTitles)} />
          <div className={clsx(skeleton, items)} />
          <div className={clsx(skeleton, items)} />
          <div className={clsx(skeleton, items)} />
          <div className={clsx(skeleton, items)} />
          <div className={clsx(skeleton, items)} />
          <div className={clsx(skeleton, items)} />
          <div className={clsx(skeleton, items)} />
          <div className={clsx(skeleton, items)} />
        </div>
      }
    >
      <CategoryList />
    </Suspense>
  )
}
