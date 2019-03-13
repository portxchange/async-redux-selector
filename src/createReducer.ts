import { Cache } from './Cache'
import { GenericAction, isAwaitResult, isReceiveResult, isMatchingAwaitingResult } from './Action'
import { Equality } from './Equality'
import { awaitingResult, resultReceived } from './CacheItem'
import { not } from './Predicate'

export function createReducer<Key, Value>(cacheId: string, keysAreEqual: Equality<Key>, limiter: (cache: Cache<Key, Value>) => Cache<Key, Value>) {
  return function(state: Cache<Key, Value> = [], action: GenericAction): Cache<Key, Value> {
    if (isAwaitResult<Key>(action) && action.cacheId === cacheId) {
      return limiter([awaitingResult(action.key, action.requestId), ...state.filter(cacheItem => !keysAreEqual(cacheItem.key, action.key))])
    } else if (isReceiveResult<Value>(action) && action.cacheId === cacheId) {
      const matchingAwaitingResult = state.find(isMatchingAwaitingResult(action))
      if (matchingAwaitingResult === undefined) {
        return state
      } else {
        return limiter([resultReceived(matchingAwaitingResult.key, action.value), ...state.filter(not(isMatchingAwaitingResult(action)))])
      }
    } else {
      return state
    }
  }
}
