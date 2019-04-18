import { QueryString, CommentId } from './AppState'

export const FETCH_BOOKS: 'FETCH_BOOKS' = 'FETCH_BOOKS'
export type FetchBooksCommand = { type: typeof FETCH_BOOKS; queryString: QueryString }
export function fetchBooksCommand(queryString: QueryString): FetchBooksCommand {
  return {
    type: FETCH_BOOKS,
    queryString
  }
}

export const FETCH_COMMENTS: 'FETCH_COMMENTS' = 'FETCH_COMMENTS'
export type FetchCommentsCommand = { type: typeof FETCH_COMMENTS; commentIds: CommentId[] }
export function fetchCommentsCommand(commentIds: CommentId[]): FetchCommentsCommand {
  return {
    type: FETCH_COMMENTS,
    commentIds
  }
}

export const FETCH_USER: 'FETCH_USER' = 'FETCH_USER'
export type FetchUserCommand = { type: typeof FETCH_USER }
export function fetchUserCommand(): FetchUserCommand {
  return {
    type: FETCH_USER
  }
}

export type Command = FetchBooksCommand | FetchUserCommand | FetchCommentsCommand
