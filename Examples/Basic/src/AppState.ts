import { Cache } from 'selectorbeak'

export type QueryString = string
export type BookId = number
export type Book = Readonly<{ id: BookId; title: string; comments: CommentId[] }>
export type CommentId = number
export type Comment = Readonly<{ id: CommentId; body: string }>

export type AppState = Readonly<{
  queryString: QueryString
  booksCache: Cache<QueryString, Book[], null>
  commentsCache: Cache<CommentId[], Comment[], null>
}>
