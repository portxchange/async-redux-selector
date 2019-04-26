import { combineReducers } from 'redux'
import { AppState } from './AppState'
import { booksCacheReducer } from './booksCacheReducer'
import { queryStringReducer } from './queryStringReducer'
import { Action } from './actions'

export const appStateReducer = combineReducers<AppState, Action>({
  queryString: queryStringReducer,
  booksCache: booksCacheReducer
})
