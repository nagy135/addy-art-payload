import { slugField } from 'payload'
import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { validateCategoryParent } from '@/collections/Categories/hooks/validateCategoryParent'

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: () => true,
    update: adminOnly,
  },
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    defaultColumns: ['title', 'parent', 'slug'],
  },
  hooks: {
    beforeValidate: [validateCategoryParent],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories',
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Optional parent category to create nested category trees.',
      },
      filterOptions: ({ id }) => {
        if (!id) return true

        return {
          id: {
            not_equals: id,
          },
        }
      },
    },
    {
      name: 'children',
      type: 'join',
      collection: 'categories',
      on: 'parent',
      admin: {
        allowCreate: false,
      },
    },
    slugField({
      position: undefined,
    }),
  ],
}
