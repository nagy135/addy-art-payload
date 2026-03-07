import type { Media as MediaType, Post } from '@/payload-types'

import React from 'react'
import clsx from 'clsx'
import Link from 'next/link'
import { Media } from '@/components/Media'

type Props = {
  post: Partial<Post> & {
    gallery?:
      | {
          image?: MediaType | string | null
        }[]
      | null
  }
}

export const PostGridItem: React.FC<Props> = ({ post }) => {
  const { filename, slug, title } = post
  const image =
    post.gallery?.[0]?.image && typeof post.gallery[0].image === 'object'
      ? (post.gallery[0].image as MediaType)
      : (post as Post)

  const content = (
    <>
      <Media
        className={clsx(
          'relative aspect-square object-cover border rounded-2xl p-8 bg-primary-foreground',
        )}
        height={80}
        imgClassName={clsx('h-full w-full object-cover rounded-2xl', {
          'transition duration-300 ease-in-out group-hover:scale-102': true,
        })}
        resource={image}
        width={80}
      />

      {(title || filename) && (
        <div className="font-mono text-primary/50 group-hover:text-primary flex justify-between items-center mt-4">
          <div>{title || filename}</div>
        </div>
      )}
    </>
  )

  if (!slug) {
    return <div className="relative inline-block h-full w-full group">{content}</div>
  }

  return (
    <Link className="relative inline-block h-full w-full group" href={`/posts/${slug}`} prefetch={false}>
      {content}
    </Link>
  )
}
