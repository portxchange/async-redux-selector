import * as React from 'react'
import { Book, AppState, Comment, BookId } from './AppState'
import { None, none, connectAsyncSimple, PickAsyncPropsWithOwnPropsSimple } from 'async-redux-selector'
import { BookDetailsContainerProps } from './BookDetailsContainerProps'
import { asyncSelectedBookSelector } from './asyncSelectedBookSelector'
import { asyncSelectedBookCommentsSelector } from './asyncSelectedBookCommentsSelector'

type PresentationalComponentProps = Readonly<{
  selectedBookId: BookId
  book: Book | None | 404
  comments: Comment[] | None
}>

const PresentationalComponent = (props: PresentationalComponentProps) => {
  if (props.book === 404) {
    return <>Selected book with id {props.selectedBookId} not found!</>
  }

  if (props.book === none || props.comments === none) {
    return <>Loading...</>
  }

  return (
    <div>
      <h1>{props.book.title}</h1>
      <ul>
        {props.comments.map(comment => (
          <li key={comment.id}>{comment.body}</li>
        ))}
      </ul>
    </div>
  )
}

function mapStateToAsyncProps(
  appState: AppState,
  props: BookDetailsContainerProps
): PickAsyncPropsWithOwnPropsSimple<AppState, BookDetailsContainerProps, PresentationalComponentProps, 'book' | 'comments'> {
  return {
    book: asyncSelectedBookSelector(appState, props),
    comments: asyncSelectedBookCommentsSelector(appState, props)
  }
}

function mapStateToSyncProps(_appState: AppState, props: BookDetailsContainerProps): Pick<PresentationalComponentProps, 'selectedBookId'> {
  return {
    selectedBookId: props.selectedBookId
  }
}

function mapDispatchToProps(): Pick<PresentationalComponentProps, never> {
  return []
}

export const BookDetails = connectAsyncSimple(mapStateToAsyncProps, mapStateToSyncProps, mapDispatchToProps)(PresentationalComponent)
