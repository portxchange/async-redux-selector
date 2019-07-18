import { Cache } from 'async-redux-selector'
import { QueryString, Book } from './AppState'
import { booksCacheDefinition } from './booksCacheDefinition'
import { Action, CLEAR_BOOKS } from './actions'

export function booksCacheReducer(booksCache: Cache<QueryString, Book[], null> = [], action: Action): Cache<QueryString, Book[], null> {
  const afterCacheActions = booksCacheDefinition.reducer(booksCache, action)
  switch (action.type) {
    case CLEAR_BOOKS:
      return []
    default:
      return afterCacheActions
  }
}
