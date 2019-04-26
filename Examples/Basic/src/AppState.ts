import { Cache } from 'selectorbeak'

export type QueryString = string
export type Book = Readonly<{ title: string }>

export type AppState = Readonly<{
  queryString: QueryString
  booksCache: Cache<QueryString, Book[], null>
}>
