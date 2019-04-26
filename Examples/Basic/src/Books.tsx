import * as React from 'react'
import { Book, AppState } from './AppState'
import { PickAsyncProps, connectAsyncSimple } from 'selectorbeak'
import { asyncBooksSelector } from './asyncBooksSelector'
import { None, none } from 'selectorbeak'
import { FetchCommand } from 'selectorbeak/dist/FetchCommand'

type PresentationalComponentProps = Readonly<{
  books: Book[] | None
}>

export const PresentationalComponent = (props: PresentationalComponentProps) => {
  if (props.books === none) {
    return <>Loading...</>
  }

  return (
    <ul>
      {props.books.map((book, index) => (
        <li key={index}>{book.title}</li>
      ))}
    </ul>
  )
}

function mapStateToAsyncProps(appState: AppState): PickAsyncProps<AppState, FetchCommand<any, any>, PresentationalComponentProps, 'books'> {
  return {
    books: asyncBooksSelector(appState)
  }
}

function mapStateToSyncProps(): Pick<PresentationalComponentProps, never> {
  return {}
}

function mapDispatchToProps(): Pick<PresentationalComponentProps, never> {
  return []
}

export const Books = connectAsyncSimple(PresentationalComponent, mapStateToAsyncProps, mapStateToSyncProps, mapDispatchToProps)
