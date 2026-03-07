'use client'

import type { Media as MediaType } from '@/payload-types'

import { GridTileImage } from '@/components/Grid/tile'
import { Media } from '@/components/Media'
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import React from 'react'

type Props = {
  gallery: MediaType[]
}

export const Gallery: React.FC<Props> = ({ gallery }) => {
  const [current, setCurrent] = React.useState(0)

  if (!gallery.length) return null

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-2xl border bg-card">
        <Media
          className="w-full"
          imgClassName="h-full w-full object-cover"
          resource={gallery[current]}
        />
      </div>

      {gallery.length > 1 ? (
        <Carousel className="w-full" opts={{ align: 'start', loop: false }}>
          <CarouselContent>
            {gallery.map((image, index) => (
              <CarouselItem
                className="basis-1/3 sm:basis-1/4 lg:basis-1/5"
                key={`${image.id}-${index}`}
              >
                <button
                  aria-label={`Show gallery image ${index + 1}`}
                  className="block aspect-square w-full"
                  onClick={() => setCurrent(index)}
                  type="button"
                >
                  <GridTileImage active={index === current} media={image} />
                </button>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      ) : null}
    </div>
  )
}
