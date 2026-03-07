import type { Field, Tab } from 'payload'

const mapTabs = (tabs: Tab[]): Tab[] =>
  tabs.map((tab) => {
    if ('fields' in tab && Array.isArray(tab.fields)) {
      return {
        ...tab,
        fields: overrideEuroPriceFields(tab.fields),
      }
    }

    return tab
  })

export const overrideEuroPriceFields = (fields: Field[]): Field[] =>
  fields.map((field) => {
    let nextField = field

    if ('name' in nextField && nextField.name === 'priceInEUREnabled') {
      nextField = {
        ...nextField,
        defaultValue: true,
        admin: {
          ...(nextField.admin as object),
          hidden: true,
        },
      } as Field
    }

    if ('name' in nextField && nextField.name === 'priceInEUR') {
      nextField = {
        ...nextField,
        label: 'Price',
      } as Field
    }

    if ('fields' in nextField && Array.isArray(nextField.fields)) {
      return {
        ...nextField,
        fields: overrideEuroPriceFields(nextField.fields),
      }
    }

    if (nextField.type === 'tabs') {
      return {
        ...nextField,
        tabs: mapTabs(nextField.tabs),
      }
    }

    return nextField
  })
