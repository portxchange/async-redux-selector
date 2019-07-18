import { createAsyncSelector, createTrackedSelector } from 'async-redux-selector'
import { queryStringSelector } from './queryStringSelector'
import { booksCacheDefinition } from './booksCacheDefinition'
import { fetchBooks } from './fetchBooks'

export const asyncBooksSelector = createAsyncSelector(
  createTrackedSelector(queryStringSelector, (left, right) => left === right),
  booksCacheDefinition.selector,
  (queryString, booksCache) => {
    return booksCache.getFor(queryString).orFetch(() => fetchBooks(queryString))
  }
)
