import { createAsyncSelector } from 'selectorbeak'
import { pure, AsyncValue } from 'selectorbeak/dist/AsyncValue'
import { asyncSelectedBookSelector } from './asyncSelectedBookSelector'
import { commentsCacheDefinition } from './commentsCacheDefinition'
import { FetchCommand } from 'selectorbeak/dist/FetchCommand'
import { Comment } from './AppState'
import { fetchComments } from './fetchComments'

export const asyncSelectedBookCommentsSelector = createAsyncSelector(
  asyncSelectedBookSelector,
  commentsCacheDefinition.selector,
  (book, commentsCache): AsyncValue<FetchCommand, Comment[]> => {
    if (book === 404) {
      return pure([])
    }
    return commentsCache.getFor(book.comments).orFetch(() => fetchComments(book.comments))
  }
)
