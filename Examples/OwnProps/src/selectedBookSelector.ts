import { AppState } from './AppState'
import { CommentsProps } from './CommentsProps'

export function selectedBookSelector(_appState: AppState, props: CommentsProps) {
  return props.selectedBookId
}
