import { Grid } from '@/components/Grid'
import { Media } from '@/components/Media'
import type { Media as MediaType, Post } from '@/payload-types'
import { FilterList } from '@/components/layout/search/filter'
import { Search } from '@/components/Search'
import { contentSorting } from '@/lib/constants'
import configPromise from '@payload-config'
import Link from 'next/link'
import { getPayload } from 'payload'
import React, { Suspense } from 'react'

export const metadata = {
  description: 'Search for posts in the store.',
  title: 'Posts',
}

type SearchParams = { [key: string]: string | string[] | undefined }

type Props = {
  searchParams: Promise<SearchParams>
}

type PostWithGallery = Post & {
  gallery?:
    | {
        image?: MediaType | string | null
      }[]
    | null
}

export default async function PostsPage({ searchParams }: Props) {
  const { q: searchValue, sort } = await searchParams
  const payload = await getPayload({ config: configPromise })

  const posts = await payload.find({
    collection: 'posts',
    depth: 1,
    draft: false,
    overrideAccess: false,
    ...(sort ? { sort } : { sort: 'title' }),
    ...(searchValue
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
            ],
          },
        }
      : {}),
  })
  const resultsText = posts.docs.length > 1 ? 'results' : 'result'

  return (
    <Suspense fallback={null}>
      <div className="container my-16 flex flex-col gap-8 pb-4">
        <Search className="mb-8" target="posts" />

        <div className="flex flex-col items-start justify-between gap-16 md:flex-row md:gap-4">
          <div className="basis-1/5 flex w-full flex-none flex-col gap-4 md:gap-8">
            <FilterList list={contentSorting} title="Sort by" />
          </div>
          <div className="min-h-screen w-full">
            {searchValue ? (
              <p className="mb-4">
                {posts.docs?.length === 0
                  ? 'There are no posts that match '
                  : `Showing ${posts.docs.length} ${resultsText} for `}
                <span className="font-bold">&quot;{searchValue}&quot;</span>
              </p>
            ) : null}

            {!searchValue && posts.docs?.length === 0 && (
              <p className="mb-4">No posts found. Please try different filters.</p>
            )}

            {posts?.docs.length > 0 ? (
              <Grid className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {posts.docs.map((post) => {
                  const href = post.slug ? `/posts/${post.slug}` : null
                  const image = getPostImage(post as PostWithGallery)

                  return (
                    <div
                      key={post.id}
                      className="group overflow-hidden rounded-2xl border border-border bg-card transition-transform duration-200 hover:-translate-y-1"
                    >
                      {href ? (
                        <Link
                          className="block aspect-square overflow-hidden bg-muted"
                          href={href}
                          prefetch={false}
                        >
                          <Media
                            resource={image}
                            imgClassName="h-full w-full object-cover transition duration-300 ease-in-out group-hover:scale-105"
                          />
                        </Link>
                      ) : (
                        <div className="block aspect-square overflow-hidden bg-muted">
                          <Media
                            resource={image}
                            imgClassName="h-full w-full object-cover transition duration-300 ease-in-out group-hover:scale-105"
                          />
                        </div>
                      )}
                      <div className="px-4 py-3 text-center">
                        {href ? (
                          <Link
                            className="text-sm font-medium tracking-wide text-foreground hover:underline"
                            href={href}
                            prefetch={false}
                          >
                            {post.title || post.filename || 'Untitled post'}
                          </Link>
                        ) : (
                          <h2 className="text-sm font-medium tracking-wide text-foreground">
                            {post.title || post.filename || 'Untitled post'}
                          </h2>
                        )}
                      </div>
                    </div>
                  )
                })}
              </Grid>
            ) : null}
          </div>
        </div>
      </div>
    </Suspense>
  )
}

const getPostImage = (post: PostWithGallery) => {
  const firstGalleryImage =
    typeof post.gallery?.[0]?.image === 'object' ? (post.gallery[0].image as MediaType) : null

  return firstGalleryImage || post
}
