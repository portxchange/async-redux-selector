import { createAsyncSelector, createTrackedSelector } from 'selectorbeak'
import { asyncBooksSelector } from './asyncBooksSelector'
import { selectedBookSelector } from './selectedBookSelector'
import { asyncValueReceived } from 'selectorbeak'
import { commentsCacheDefinition } from './commentsCacheDefinition'
import { fetchComments } from './fetchComments'

export const asyncCommentsForSelectedBookSelector = createAsyncSelector(
  asyncBooksSelector,
  createTrackedSelector(selectedBookSelector, (left, right) => left === right),
  commentsCacheDefinition.selector,
  (books, selectedBookId, commentsCache) => {
    const selectedBook = books.find(book => book.id === selectedBookId)
    if (selectedBook === undefined) {
      return asyncValueReceived(null)
    } else {
      return commentsCache.getFor(selectedBook.comments).orFetch(() => fetchComments(selectedBook.comments))
    }
  }
)
