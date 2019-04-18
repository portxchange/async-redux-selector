import { Dispatch } from 'react'
import { Action } from './actions'
import { AppState, Comment, Book, User } from './AppState'
import { CommandExecutor } from 'selectorbeak'
import { Command, FETCH_BOOKS, FETCH_USER, FETCH_COMMENTS } from './commands'
import { booksCacheDefinition } from './booksCacheDefinition'
import { none } from 'selectorbeak/dist/None'
import { userCacheDefinition } from './userCacheDefinition'
import { commentsCacheDefinition } from './commentsCacheDefinition'

const purelyFunctionalDataStructuresBook: Book = { title: 'Purely Functional Data Structures', comments: [1, 3] }
const pearlsOfFunctionalAlgorithmDesignBook: Book = { title: 'Pearls of Functional Algorithm Design', comments: [2, 5] }
const algebraicSemanticsOfImperativeProgramsBook: Book = { title: 'Algebraic Semantics of Imperative Programs', comments: [4] }
const comment1: Comment = { id: 1, body: 'Excellent stuff!' }
const comment2: Comment = { id: 2, body: 'Very interesting!' }
const comment3: Comment = { id: 3, body: 'A worthy read!' }
const comment4: Comment = { id: 4, body: 'I like it a lot!' }
const comment5: Comment = { id: 5, body: 'Bestseller of the year!' }
const commentsOnServer: Comment[] = [comment1, comment2, comment3, comment4, comment5]
const booksOnServer: Book[] = [purelyFunctionalDataStructuresBook, pearlsOfFunctionalAlgorithmDesignBook, algebraicSemanticsOfImperativeProgramsBook]
const userOnServer: User = 'Hank'

let requestId = 0
export const createCommandExecutor = (dispatch: Dispatch<Action>, _getState: () => AppState): CommandExecutor<Command> => (command: Command) => {
  switch (command.type) {
    case FETCH_BOOKS:
      {
        const nextRequestId = 'request-' + String(requestId++)
        dispatch(booksCacheDefinition.awaitValue(command.queryString, nextRequestId, none))
        setTimeout(() => {
          dispatch(booksCacheDefinition.receiveValue(nextRequestId, booksOnServer.filter(book => book.title.indexOf(command.queryString) > -1)))
        }, 5000)
      }
      break
    case FETCH_USER:
      {
        const nextRequestId = 'request-' + String(requestId++)
        dispatch(userCacheDefinition.awaitValue(none, nextRequestId, none))
        setTimeout(() => {
          dispatch(userCacheDefinition.receiveValue(nextRequestId, userOnServer))
        }, 5000)
      }
      break
    case FETCH_COMMENTS:
      {
        const nextRequestId = 'request-' + String(requestId++)
        dispatch(commentsCacheDefinition.awaitValue(command.commentIds, nextRequestId, none))
        setTimeout(() => {
          const comments = commentsOnServer.filter(comment => command.commentIds.indexOf(comment.id) > -1)
          dispatch(commentsCacheDefinition.receiveValue(nextRequestId, comments))
        }, 5000)
      }
      break
  }
}
