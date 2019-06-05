import { Book } from './AppState'

const purelyFunctionalDataStructuresBook: Book = { id: 0, title: 'Purely Functional Data Structures', comments: [1, 3] }
const pearlsOfFunctionalAlgorithmDesignBook: Book = { id: 1, title: 'Pearls of Functional Algorithm Design', comments: [2, 5] }
const algebraicSemanticsOfImperativeProgramsBook: Book = { id: 2, title: 'Algebraic Semantics of Imperative Programs', comments: [4] }
const booksOnServer: Book[] = [purelyFunctionalDataStructuresBook, pearlsOfFunctionalAlgorithmDesignBook, algebraicSemanticsOfImperativeProgramsBook]

export function fetchBooks(queryString: string): Promise<Book[]> {
  return new Promise<Book[]>(resolve => {
    setTimeout(() => {
      resolve(booksOnServer.filter(book => book.title.indexOf(queryString) > -1))
    }, 5000)
  })
}
