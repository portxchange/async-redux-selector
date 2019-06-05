import { BookId, AppState } from './AppState'

export type BookDetailsContainerProps = Readonly<{
  selectedBookId: BookId
}>

export function selectedBookIdSelector(_appState: AppState, props: BookDetailsContainerProps) {
  return props.selectedBookId
}
