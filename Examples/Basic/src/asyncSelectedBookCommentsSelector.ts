import { createAsyncSelector, asyncValueReceived, AsyncValue, FetchCommand } from 'selectorbeak'
import { asyncSelectedBookSelector } from './asyncSelectedBookSelector'
import { commentsCacheDefinition } from './commentsCacheDefinition'
import { Comment } from './AppState'
import { fetchComments } from './fetchComments'

export const asyncSelectedBookCommentsSelector = createAsyncSelector(
  asyncSelectedBookSelector,
  commentsCacheDefinition.selector,
  (book, commentsCache): AsyncValue<FetchCommand, Comment[]> => {
    if (book === 404) {
      return asyncValueReceived([])
    }
    return commentsCache.getFor(book.comments).orFetch(() => fetchComments(book.comments))
  }
)
