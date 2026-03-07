import type { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'

import { overrideEuroPriceFields } from '@/utilities/overrideEuroPriceFields'

export const VariantsCollection: CollectionOverride = ({ defaultCollection }) => ({
  ...defaultCollection,
  fields: overrideEuroPriceFields(defaultCollection.fields),
})
