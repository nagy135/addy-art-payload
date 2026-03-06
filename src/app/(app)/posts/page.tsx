import { Grid } from '@/components/Grid'
import { Media } from '@/components/Media'
import configPromise from '@payload-config'
import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'

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
    <div>
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
        <Grid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.docs.map((post) => {
            return (
              <div
                key={post.id}
                className="group overflow-hidden rounded-2xl border border-border bg-card transition-transform duration-200 hover:-translate-y-1"
              >
                <div className="aspect-square overflow-hidden bg-muted">
                  <Media
                    resource={post}
                    imgClassName="h-full w-full object-cover transition duration-300 ease-in-out group-hover:scale-105"
                  />
                </div>
                <div className="px-4 py-3 text-center">
                  {post.url ? (
                    <Link
                      className="text-sm font-medium tracking-wide text-foreground hover:underline"
                      href={post.url}
                      target="_blank"
                      rel="noreferrer"
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
  )
}
