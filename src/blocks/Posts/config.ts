import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

export const Posts: Block = {
  slug: 'posts',
  interfaceName: 'PostsBlock',
  fields: [
    {
      name: 'richText',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [
            ...rootFeatures,
            HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
            FixedToolbarFeature(),
            InlineToolbarFeature(),
          ]
        },
      }),
      label: false,
    },
    {
      name: 'pickedPosts',
      type: 'relationship',
      hasMany: true,
      relationTo: 'posts',
      maxRows: 6,
      label: 'Posts',
    },
  ],
  labels: {
    plural: 'Posts',
    singular: 'Post',
  },
}
