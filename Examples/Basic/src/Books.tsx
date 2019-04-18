import * as React from 'react'
import { Book, None, none, AppState } from './AppState'
import { PickAsyncProps, connectAsync } from 'selectorbeak'
import { asyncBooksSelector } from './asyncBooksSelector'
import { createCommandExecutor } from './createCommandExecutor'
import { Command } from './commands'

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

function mapStateToAsyncProps(appState: AppState): PickAsyncProps<AppState, Command, PresentationalComponentProps, 'books'> {
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

export const Books = connectAsync(PresentationalComponent, mapStateToAsyncProps, mapStateToSyncProps, mapDispatchToProps, createCommandExecutor)
