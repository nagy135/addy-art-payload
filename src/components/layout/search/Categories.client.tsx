'use client'
import React, { useCallback, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

import { Category } from '@/payload-types'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import clsx from 'clsx'

type Props = {
  category: Category
  children?: React.ReactNode
  hasChildren?: boolean
  level?: number
}

export const CategoryItem: React.FC<Props> = ({
  category,
  children,
  hasChildren = false,
  level = 0,
}) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(true)

  const isActive = useMemo(() => {
    return searchParams.get('category') === String(category.id)
  }, [category.id, searchParams])

  const setQuery = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())

    if (isActive) {
      params.delete('category')
    } else {
      params.set('category', String(category.id))
    }

    const newParams = params.toString()

    router.push(pathname + '?' + newParams)
  }, [category.id, isActive, pathname, router, searchParams])

  const toggleOpen = useCallback(() => {
    setIsOpen((value) => !value)
  }, [])

  const textClassName = useMemo(() => {
    if (level === 0) return 'text-sm font-medium text-neutral-900 dark:text-neutral-100'
    if (level === 1) return 'text-sm font-normal text-neutral-700 dark:text-neutral-300'
    return 'text-xs font-normal text-neutral-600 dark:text-neutral-400'
  }, [level])

  return (
    <div className="space-y-1">
      <div className="group flex items-center gap-1 rounded-md px-1 py-1 transition-colors hover:bg-neutral-100/80 dark:hover:bg-neutral-900/80">
        {hasChildren ? (
          <button
            type="button"
            onClick={toggleOpen}
            className="inline-flex h-5 w-5 items-center justify-center rounded text-neutral-500 transition hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-neutral-100"
            aria-expanded={isOpen}
            aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${category.title}`}
          >
            {isOpen ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        ) : (
          <span className="inline-flex h-5 w-5" aria-hidden="true" />
        )}

        <button
          type="button"
          onClick={setQuery}
          className={clsx(
            'w-full rounded px-1 py-0.5 text-left transition hover:cursor-pointer hover:text-neutral-950 dark:hover:text-white',
            textClassName,
            {
              'bg-neutral-100 font-semibold text-neutral-950 dark:bg-neutral-900 dark:text-white':
                isActive,
            },
          )}
        >
          {category.title}
        </button>
      </div>

      {hasChildren && isOpen ? children : null}
    </div>
  )
}
