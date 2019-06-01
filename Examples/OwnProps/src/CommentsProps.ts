import { BookId } from './AppState'

export type CommentsProps = Readonly<{
  selectedBookId: BookId | null
}>
