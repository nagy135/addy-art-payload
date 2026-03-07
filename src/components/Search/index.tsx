'use client'

import { cn } from '@/utilities/cn'
import { createUrl } from '@/utilities/createUrl'
import { useDebounce } from '@/utilities/useDebounce'
import { SearchIcon } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'

type Props = {
  className?: string
  target?: string
}

export const Search: React.FC<Props> = ({ className, target = 'products' }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const query = searchParams?.get('q') || ''
  const [value, setValue] = useState(query)
  const debouncedValue = useDebounce(value)
  const pendingQueryRef = useRef<string | null>(null)

  useEffect(() => {
    if (pendingQueryRef.current !== null) {
      if (query === pendingQueryRef.current) {
        pendingQueryRef.current = null
        return
      }

      pendingQueryRef.current = null
    }

    setValue(query)
  }, [query])

  useEffect(() => {
    if (debouncedValue === query) {
      return
    }

    const newParams = new URLSearchParams(searchParams.toString())

    if (debouncedValue) {
      newParams.set('q', debouncedValue)
    } else {
      newParams.delete('q')
    }

    pendingQueryRef.current = debouncedValue
    router.push(createUrl('/shop', newParams))
  }, [debouncedValue, query, router, searchParams])

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const form = e.currentTarget
    const search = form.search as HTMLInputElement
    const newParams = new URLSearchParams(searchParams.toString())

    if (search.value) {
      newParams.set('q', search.value)
    } else {
      newParams.delete('q')
    }

    pendingQueryRef.current = search.value
    router.push(createUrl('/shop', newParams))
  }

  return (
    <form className={cn('relative w-full', className)} onSubmit={onSubmit}>
      <input
        autoComplete="off"
        className="w-full rounded-lg border bg-white px-4 py-2 text-sm text-black placeholder:text-neutral-500 dark:border-neutral-800 dark:bg-black dark:text-white dark:placeholder:text-neutral-400"
        name="search"
        onChange={(e) => setValue(e.target.value)}
        placeholder={`Search for ${target}`}
        type="text"
        value={value}
      />
      <div className="absolute right-0 top-0 mr-3 flex h-full items-center">
        <SearchIcon className="h-4" />
      </div>
    </form>
  )
}
