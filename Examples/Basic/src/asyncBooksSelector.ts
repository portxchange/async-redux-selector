import { createAsyncSelector, createTrackedSelector } from 'selectorbeak'
import { queryStringSelector } from './queryStringSelector'
import { booksCacheDefinition } from './booksCacheDefinition'
import { fetchBooksCommand } from './commands'

export const asyncBooksSelector = createAsyncSelector(
  createTrackedSelector(queryStringSelector, (left, right) => left === right),
  booksCacheDefinition.selector,
  (queryString, booksCache) => {
    return booksCache.getFor(queryString).orElse(fetchBooksCommand(queryString))
  }
)
