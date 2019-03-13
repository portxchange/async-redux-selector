import { Cache } from './Cache'
import { GenericAction, isAwaitResult, isReceiveResult, isMatchingAwaitingResult } from './Action'
import { Equality } from './Equality'
import { awaitingResult, resultReceived } from './CacheItem'
import { not } from './Predicate'

export function createReducer<Key, Value, Meta>(cacheId: string, keysAreEqual: Equality<Key>, limiter: (cache: Cache<Key, Value, Meta>) => Cache<Key, Value, Meta>) {
  return function(state: Cache<Key, Value, Meta> = [], action: GenericAction): Cache<Key, Value, Meta> {
    if (isAwaitResult<Key, Meta>(action) && action.cacheId === cacheId) {
      return limiter([awaitingResult(action.key, action.requestId, action.meta), ...state.filter(cacheItem => !keysAreEqual(cacheItem.key, action.key))])
    } else if (isReceiveResult<Value>(action) && action.cacheId === cacheId) {
      const matchingAwaitingResult = state.find(isMatchingAwaitingResult(action))
      if (matchingAwaitingResult === undefined) {
        return state
      } else {
        return limiter([resultReceived(matchingAwaitingResult.key, action.value, matchingAwaitingResult.meta), ...state.filter(not(isMatchingAwaitingResult(action)))])
      }
    } else {
      return state
    }
  }
}
