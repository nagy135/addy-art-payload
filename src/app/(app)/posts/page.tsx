import { Grid } from '@/components/Grid'
import { Media } from '@/components/Media'
import { FilterList } from '@/components/layout/search/filter'
import { Search } from '@/components/Search'
import { sorting } from '@/lib/constants'
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

export default async function PostsPage({ searchParams }: Props) {
  const { q: searchValue, sort } = await searchParams
  const payload = await getPayload({ config: configPromise })

  const posts = await payload.find({
    collection: 'posts',
    draft: false,
    overrideAccess: false,
    select: {
      alt: true,
      filename: true,
      height: true,
      slug: true,
      thumbnailURL: true,
      title: true,
      updatedAt: true,
      url: true,
      width: true,
      createdAt: true,
    },
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
            <FilterList list={sorting} title="Sort by" />
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
                  const href = `/posts/${post.slug || post.id}`

                  return (
                    <div
                      key={post.id}
                      className="group overflow-hidden rounded-2xl border border-border bg-card transition-transform duration-200 hover:-translate-y-1"
                    >
                      <Link className="block aspect-square overflow-hidden bg-muted" href={href}>
                        <Media
                          resource={post}
                          imgClassName="h-full w-full object-cover transition duration-300 ease-in-out group-hover:scale-105"
                        />
                      </Link>
                      <div className="px-4 py-3 text-center">
                        {(post.slug || post.id) ? (
                          <Link
                            className="text-sm font-medium tracking-wide text-foreground hover:underline"
                            href={href}
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
