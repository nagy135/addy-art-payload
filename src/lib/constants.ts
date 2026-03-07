export type SortFilterItem = {
  reverse: boolean
  slug: null | string
  title: string
}

export const defaultSort: SortFilterItem = {
  slug: null,
  reverse: false,
  title: 'Alphabetic A-Z',
}

export const contentSorting: SortFilterItem[] = [
  defaultSort,
  { slug: '-createdAt', reverse: true, title: 'Latest arrivals' },
]

export const productSorting: SortFilterItem[] = [
  ...contentSorting,
  { slug: 'price', reverse: false, title: 'Price: Low to high' },
  { slug: '-price', reverse: true, title: 'Price: High to low' },
]
