import { cn } from '@/utilities/cn'
import React from 'react'

import type { Post } from '@/payload-types'
import { Media } from '../Media'
import { clsx } from 'clsx'

/* import { Card } from '../Card' */

export type Props = {
  posts: Post[]
}

export const CollectionArchive: React.FC<Props> = (props) => {
  const { posts } = props

  return (
    <div className={cn('container')}>
      <div>
        <div className="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-12 gap-y-4 gap-x-4 lg:gap-y-8 lg:gap-x-8 xl:gap-x-8">
          {posts?.map((result, index) => {
            if (typeof result === 'object' && result !== null && result.url) {
              return (
                <div className="col-span-4" key={index}>
                  <Media
                    className={clsx('relative h-full w-full object-cover', {
                      'transition duration-300 ease-in-out group-hover:scale-105': true,
                    })}
                    height={80}
                    imgClassName="h-full w-full object-cover"
                    resource={result}
                    width={80}
                  />
                </div>
              )
            }

            return null
          })}
        </div>
      </div>
    </div>
  )
}
