import { CallToAction } from '@/blocks/CallToAction/config'
import { Content } from '@/blocks/Content/config'
import { MediaBlock } from '@/blocks/MediaBlock/config'
import type {
  CollectionAfterReadHook,
  CollectionBeforeChangeHook,
  CollectionConfig,
  PayloadRequest,
} from 'payload'
import { slugField } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { adminOnly } from '@/access/adminOnly'
import { uploadsDir } from '@/utilities/uploadsDir'
import sharp from 'sharp'

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

const getPostFileURL = ({ filename, req }: { filename: string; req: PayloadRequest }) => {
  const apiRoute = req.payload.config.routes.api || '/api'

  return `${apiRoute}/posts/file/${encodeURIComponent(filename)}`
}

const normalizePostUploadURLs: CollectionAfterReadHook = ({ doc, req }) => {
  if (!doc?.filename) {
    return doc
  }

  const fileURL = getPostFileURL({
    filename: doc.filename,
    req,
  })

  return {
    ...doc,
    thumbnailURL: fileURL,
    url: fileURL,
  }
}

export const Posts: CollectionConfig = {
  admin: {
    group: 'Content',
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
  },
  slug: 'posts',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: () => true,
    update: adminOnly,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'gallery',
      type: 'array',
      minRows: 1,
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
      ],
    },
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
    {
      name: 'layout',
      type: 'blocks',
      blocks: [CallToAction, Content, MediaBlock],
    },
    slugField({
      position: undefined,
    }),
  ],
  hooks: {
    afterRead: [normalizePostUploadURLs],
    beforeChange: [generateBlurDataURL],
  },
  upload: {
    displayPreview: false,
    staticDir: uploadsDir,
  },
}
