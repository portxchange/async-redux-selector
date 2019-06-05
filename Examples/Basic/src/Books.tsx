import * as React from 'react'
import { Book, AppState, BookId } from './AppState'
import { PickAsyncProps, connectAsyncSimple } from 'selectorbeak'
import { asyncBooksSelector } from './asyncBooksSelector'
import { None, none } from 'selectorbeak'
import { FetchCommand } from 'selectorbeak/dist/FetchCommand'
import { BookDetails } from './BookDetails'

type PresentationalComponentProps = Readonly<{
  books: Book[] | None
}>

export const PresentationalComponent = (props: PresentationalComponentProps) => {
  const [selectedBookId, setSelectedBookId] = React.useState<BookId | null>(null)

  if (props.books === none) {
    return <>Loading...</>
  }

  return (
    <>
      <ul>
        {props.books.map(book => (
          <li key={book.id} onClick={() => setSelectedBookId(book.id)}>
            {book.title}
          </li>
        ))}
      </ul>
      {selectedBookId === null ? <>No book selected</> : <BookDetails selectedBookId={selectedBookId} />}
    </>
  )
}

function mapStateToAsyncProps(appState: AppState): PickAsyncProps<AppState, FetchCommand, PresentationalComponentProps, 'books'> {
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

export const Books = connectAsyncSimple(mapStateToAsyncProps, mapStateToSyncProps, mapDispatchToProps)(PresentationalComponent)
