import React from 'react'

import type { Post, PostsBlock as PostsBlockProps } from '@/payload-types'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { Grid } from '@/components/Grid'
import { PostGridItem } from '@/components/PostGridItem'
import { RichText } from '@/components/RichText'
import { CMSLink } from '@/components/Link'

type LinkItem = {
  link: React.ComponentProps<typeof CMSLink>
  id?: string | null
}

type PostsBlockComponentProps = PostsBlockProps & {
  links?: LinkItem[] | null
}

type RichTextNode = {
  type: string
  version: number
  children?: Array<{
    text?: string
  }>
}

const hasRichTextContent = (richText: PostsBlockProps['richText']) => {
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

export const PostsBlock: React.FC<
  PostsBlockComponentProps & {
    id?: string | number
    className?: string
  }
> = async ({ links, richText }) => {
  const payload = await getPayload({ config: configPromise })

  const latestPosts = await payload.find({
    collection: 'posts',
    depth: 1,
    limit: 6,
    overrideAccess: false,
    select: {
      title: true,
      alt: true,
      url: true,
      filename: true,
      mimeType: true,
      filesize: true,
      width: true,
      height: true,
    },
    sort: '-createdAt',
  })

  const posts = latestPosts.docs as Post[]
  const blockLinks: LinkItem[] = Array.isArray(links) ? links : []
  const showHeader = hasRichTextContent(richText) || blockLinks.length > 0

  if (!showHeader && posts.length === 0) return null

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

        {posts.length > 0 ? (
          <Grid className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => {
              return <PostGridItem key={post.id} post={post} />
            })}
          </Grid>
        ) : null}
      </div>
    </section>
  )
}
