import sharp from 'sharp'
import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { adminOnly } from '@/access/adminOnly'
import { uploadsDir } from '@/utilities/uploadsDir'

const generateBlurDataURL: CollectionBeforeChangeHook = async ({ data, req }) => {
  const mimeType = req.file?.mimetype
  const fileBuffer = req.file?.data

  if (!mimeType?.startsWith('image/') || !fileBuffer) {
    return data
  }

  const blurBuffer = await sharp(fileBuffer)
    .rotate()
    .resize(24, 24, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .blur(4)
    .webp({
      quality: 50,
    })
    .toBuffer()

  return {
    ...data,
    blurDataURL: `data:image/webp;base64,${blurBuffer.toString('base64')}`,
  }
}

export const Media: CollectionConfig = {
  admin: {
    group: 'Content',
  },
  slug: 'media',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: () => true,
    update: adminOnly,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'caption',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
        },
      }),
    },
    {
      name: 'blurDataURL',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
  ],
  hooks: {
    beforeChange: [generateBlurDataURL],
  },
  upload: {
    staticDir: uploadsDir,
  },
}
