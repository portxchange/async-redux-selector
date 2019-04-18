import { createCacheDefinition, defaultLimiter } from 'selectorbeak'
import { AppState, QueryString, Book, None } from './AppState'

export const booksCacheDefinition = createCacheDefinition<AppState, QueryString, Book[], None>(
  'books',
  appState => appState.booksCache,
  (left, right) => left === right,
  defaultLimiter(5)
)
