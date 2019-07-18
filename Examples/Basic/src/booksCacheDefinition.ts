import { createCacheDefinition, defaultLimiter } from 'async-redux-selector'
import { AppState, QueryString, Book } from './AppState'

export const booksCacheDefinition = createCacheDefinition<AppState, QueryString, Book[], null>(
  'books',
  appState => appState.booksCache,
  (left, right) => left === right,
  defaultLimiter(5)
)
