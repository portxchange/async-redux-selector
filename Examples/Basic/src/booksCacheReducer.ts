import { Cache } from 'selectorbeak'
import { QueryString, Book, None } from './AppState'
import { booksCacheDefinition } from './booksCacheDefinition'
import { Action, CLEAR_BOOKS } from './actions'

export function booksCacheReducer(booksCache: Cache<QueryString, Book[], None> = [], action: Action): Cache<QueryString, Book[], None> {
  const afterCacheActions = booksCacheDefinition.reducer(booksCache, action)
  switch (action.type) {
    case CLEAR_BOOKS:
      return []
    default:
      return afterCacheActions
  }
}
