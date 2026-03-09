import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

export const Products: Block = {
  slug: 'products',
  interfaceName: 'ProductsBlock',
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
      name: 'pickedProducts',
      type: 'relationship',
      hasMany: true,
      maxRows: 6,
      relationTo: 'products',
      label: 'Products',
    },
  ],
  labels: {
    plural: 'Products',
    singular: 'Product',
  },
}
