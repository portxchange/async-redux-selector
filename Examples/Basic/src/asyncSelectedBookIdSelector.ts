import { createTrackedSelector } from 'async-redux-selector'
import { selectedBookIdSelector } from './BookDetailsContainerProps'
import { BookId } from './AppState'

export const asyncSelectedBookIdSelector = createTrackedSelector(selectedBookIdSelector, (left: BookId, right: BookId) => left === right)
