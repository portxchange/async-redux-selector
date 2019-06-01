import { combineReducers } from 'redux'
import { AppState } from './AppState'
import { booksCacheReducer } from './booksCacheReducer'
import { queryStringReducer } from './queryStringReducer'
import { Action } from './actions'
import { commentsCacheDefinition } from './commentsCacheDefinition'

export const appStateReducer = combineReducers<AppState, Action>({
  queryString: queryStringReducer,
  booksCache: booksCacheReducer,
  commentsCache: commentsCacheDefinition.reducer
})
