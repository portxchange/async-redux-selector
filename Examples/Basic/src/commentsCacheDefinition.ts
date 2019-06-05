import { createCacheDefinition, defaultLimiter } from 'selectorbeak'
import { AppState, CommentId, Comment } from './AppState'

function keysAreEqual(left: CommentId[], right: CommentId[]): boolean {
  if (left.length !== right.length) {
    return false
  }
  return left.every((leftElem, index) => {
    const rightElem = right[index]
    return leftElem === rightElem
  })
}

export const commentsCacheDefinition = createCacheDefinition<AppState, CommentId[], Comment[], null>(
  'comments',
  appState => appState.commentsCache,
  keysAreEqual,
  defaultLimiter(5)
)
