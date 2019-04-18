import { combineReducers } from 'redux'
import { AppState } from './AppState'
import { booksCacheReducer } from './booksCacheReducer'
import { commentsCacheDefinition } from './commentsCacheDefinition'
import { userCacheDefinition } from './userCacheDefinition'
import { queryStringReducer } from './queryStringReducer'
import { Action } from './actions'

export const appStateReducer = combineReducers<AppState, Action>({
  booksCache: booksCacheReducer,
  commentsCache: commentsCacheDefinition.reducer,
  userCache: userCacheDefinition.reducer,
  queryString: queryStringReducer
})
