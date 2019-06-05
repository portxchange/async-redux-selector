import { createAsyncSelector } from 'selectorbeak'
import { asyncBooksSelector } from './asyncBooksSelector'
import { Book } from './AppState'
import { asyncSelectedBookIdSelector } from './asyncSelectedBookIdSelector'

export const asyncSelectedBookSelector = createAsyncSelector(
  asyncSelectedBookIdSelector,
  asyncBooksSelector,
  (selectedBookId, books): Book | 404 => {
    const selectedBook = books.find(b => b.id === selectedBookId)
    if (selectedBook === undefined) {
      return 404
    } else {
      return selectedBook
    }
  }
)
