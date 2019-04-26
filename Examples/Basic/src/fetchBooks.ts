import { Book } from './AppState'

const purelyFunctionalDataStructuresBook: Book = { title: 'Purely Functional Data Structures' }
const pearlsOfFunctionalAlgorithmDesignBook: Book = { title: 'Pearls of Functional Algorithm Design' }
const algebraicSemanticsOfImperativeProgramsBook: Book = { title: 'Algebraic Semantics of Imperative Programs' }
const booksOnServer: Book[] = [purelyFunctionalDataStructuresBook, pearlsOfFunctionalAlgorithmDesignBook, algebraicSemanticsOfImperativeProgramsBook]

export function fetchBooks(queryString: string): Promise<Book[]> {
  return new Promise<Book[]>(resolve => {
    setTimeout(() => {
      resolve(booksOnServer.filter(book => book.title.indexOf(queryString) > -1))
    }, 5000)
  })
}
