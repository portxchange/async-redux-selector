import { createCacheDefinition, defaultLimiter } from 'selectorbeak'
import { AppState, Comment, None, CommentId } from './AppState'

export const commentsCacheDefinition = createCacheDefinition<AppState, CommentId[], Comment[], None>(
  'comments',
  appState => appState.commentsCache,
  (left, right) => {
    if (left.length !== right.length) {
      return false
    }
    return left.every((commentLeft, index) => {
      const commentRight = right[index]
      return commentLeft === commentRight
    })
  },
  defaultLimiter(5)
)
