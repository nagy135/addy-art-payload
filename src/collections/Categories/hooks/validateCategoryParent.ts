import type { CollectionBeforeValidateHook } from 'payload'

import type { Category } from '@/payload-types'

type ParentValue = null | number | string | { id?: number | string | null } | undefined

const getRelationshipID = (value: ParentValue): null | string => {
  if (!value) return null

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value)
  }

  if ('id' in value && value.id) {
    return String(value.id)
  }

  return null
}

export const validateCategoryParent: CollectionBeforeValidateHook = async ({
  data,
  originalDoc,
  req,
}) => {
  const parentID = getRelationshipID(data?.parent)
  const currentID = getRelationshipID(originalDoc?.id)

  if (!parentID) return data

  if (currentID && parentID === currentID) {
    throw new Error('A category cannot be its own parent.')
  }

  const visited = new Set<string>()
  let ancestorID: null | string = parentID

  while (ancestorID) {
    if (currentID && ancestorID === currentID) {
      throw new Error('A category cannot be moved beneath one of its descendants.')
    }

    if (visited.has(ancestorID)) {
      throw new Error('Category hierarchy contains a circular parent relationship.')
    }

    visited.add(ancestorID)

    const ancestor: Pick<Category, 'parent'> = await req.payload.findByID({
      collection: 'categories',
      id: ancestorID,
      depth: 0,
      req,
    })

    ancestorID = getRelationshipID(ancestor.parent)
  }

  return data
}
