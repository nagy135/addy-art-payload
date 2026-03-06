import type { Post } from '@/payload-types'

import React from 'react'
import clsx from 'clsx'
import { Media } from '@/components/Media'

type Props = {
  post: Partial<Post>
}

export const PostGridItem: React.FC<Props> = ({ post }) => {
  const { title } = post

  return (
    <div className="relative inline-block h-full w-full group">
      <Media
        className={clsx(
          'relative aspect-square object-cover border rounded-2xl p-8 bg-primary-foreground',
        )}
        height={80}
        imgClassName={clsx('h-full w-full object-cover rounded-2xl', {
          'transition duration-300 ease-in-out group-hover:scale-102': true,
        })}
        resource={post as any}
        width={80}
      />

      {title && (
        <div className="font-mono text-primary/50 group-hover:text-primary flex justify-between items-center mt-4">
          <div>{title}</div>
        </div>
      )}
    </div>
  )
}
