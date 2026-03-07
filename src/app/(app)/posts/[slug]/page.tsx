import { RenderBlocks } from '@/blocks/RenderBlocks'
import type { Metadata } from 'next'
import type { Media as MediaType, Page, Post } from '@/payload-types'

import { RichText } from '@/components/RichText'
import { Media } from '@/components/Media'
import { Gallery } from '@/components/post/Gallery'
import configPromise from '@payload-config'
import { Button } from '@/components/ui/button'
import { ChevronLeftIcon } from 'lucide-react'
import { getPayload } from 'payload'
import Link from 'next/link'
import { notFound } from 'next/navigation'

type Args = {
  params: Promise<{
    slug: string
  }>
}

type PostWithMedia = Post & {
  gallery?:
    | {
        image?: MediaType | string | null
      }[]
    | null
  layout?: Page['layout']
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const post = await queryPostBySlug({ slug })

  if (!post) return notFound()

  const seoImage = getPostImage(post as PostWithMedia)

  return {
    description: post.alt || undefined,
    openGraph: seoImage?.url
      ? {
          images: [
            {
              alt: seoImage.alt || post.alt,
              height: seoImage.height || undefined,
              url: seoImage.url,
              width: seoImage.width || undefined,
            },
          ],
        }
      : undefined,
    title: post.title || post.filename || 'Post',
  }
}

export default async function PostPage({ params }: Args) {
  const { slug } = await params
  const post = await queryPostBySlug({ slug })

  if (!post) return notFound()

  const typedPost = post as PostWithMedia
  const gallery =
    typedPost.gallery
      ?.filter((item) => typeof item.image === 'object')
      .map((item) => item.image as MediaType) || []
  const postImage = getPostImage(typedPost)

  return (
    <>
      <div className="container pt-8 pb-8">
        <Button asChild className="mb-4" variant="ghost">
          <Link href="/posts">
            <ChevronLeftIcon />
            All posts
          </Link>
        </Button>

        <div className="flex flex-col gap-8 rounded-lg border bg-primary-foreground p-8 md:p-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-start">
            {gallery.length ? (
              <Gallery gallery={gallery} />
            ) : (
              <div className="overflow-hidden rounded-2xl border bg-card">
                <Media imgClassName="h-full w-full object-cover" resource={postImage} />
              </div>
            )}

            <div className="flex flex-col gap-6">
              <div className="space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight">
                  {post.title || post.filename || 'Untitled post'}
                </h1>
                <p className="text-sm text-muted-foreground">{post.alt}</p>
              </div>
            </div>
          </div>

          {post.caption?.root?.children?.length ? (
            <div className="border-t pt-8">
              <RichText data={post.caption} />
            </div>
          ) : null}
        </div>
      </div>

      {typedPost.layout?.length ? <RenderBlocks blocks={typedPost.layout} /> : null}
    </>
  )
}

const queryPostBySlug = async ({ slug }: { slug: string }) => {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'posts',
    depth: 1,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    where: {
      or: [
        {
          slug: {
            equals: slug,
          },
        },
        {
          id: {
            equals: slug,
          },
        },
      ],
    },
  })

  return result.docs?.[0] || null
}

const getPostImage = (post: PostWithMedia) => {
  const firstGalleryImage =
    typeof post.gallery?.[0]?.image === 'object' ? (post.gallery[0].image as MediaType) : null

  return firstGalleryImage || post
}
