import { Cache } from "selectorbeak";

export type QueryString = string;
export type CommentId = number;
export type Comment = Readonly<{ id: CommentId; body: string }>;
export type Book = Readonly<{ title: string; comments: CommentId[] }>;
export type User = string;
export type None = false;
export const none = false;

export type AppState = Readonly<{
  queryString: QueryString;
  commentsCache: Cache<CommentId[], Comment[], None>;
  booksCache: Cache<QueryString, Book[], None>;
  userCache: Cache<None, User, None>;
}>;
