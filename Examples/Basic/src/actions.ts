import { QueryString } from './AppState'
import { CacheAction } from 'async-redux-selector'

export const SET_QUERY_STRING: 'SET_QUERY_STRING' = 'SET_QUERY_STRING'
export type SetQueryString = Readonly<{ type: typeof SET_QUERY_STRING; queryString: QueryString }>
export function setQueryString(queryString: QueryString): SetQueryString {
  return { type: SET_QUERY_STRING, queryString }
}

export const CLEAR_BOOKS: 'CLEAR_BOOKS' = 'CLEAR_BOOKS'
export type ClearBooks = Readonly<{ type: typeof CLEAR_BOOKS }>
export function clearBooks(): ClearBooks {
  return { type: CLEAR_BOOKS }
}

export type Action = CacheAction<any, any, any> | SetQueryString | ClearBooks
