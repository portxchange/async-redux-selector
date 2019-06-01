import { createCacheDefinition, defaultLimiter } from 'selectorbeak'
import { AppState, CommentId, Comment } from './AppState'

export const commentsCacheDefinition = createCacheDefinition<AppState, CommentId[], Comment[], null>(
  'comments',
  appState => appState.commentsCache,
  (left, right) => left.length === right.length && left.every((e, index) => e === right[index]),
  defaultLimiter(5)
)
