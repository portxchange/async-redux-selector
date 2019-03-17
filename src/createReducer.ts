import { Cache } from './Cache'
import { GenericAction, isAwaitValue, isReceiveValue, isMatchingAwaitingValue } from './Action'
import { Equality } from './Equality'
import { awaitingValue, valueReceived } from './CacheItem'
import { not } from './Predicate'

export function createReducer<Key, Value, Meta>(cacheId: string, keysAreEqual: Equality<Key>, limiter: (cache: Cache<Key, Value, Meta>) => Cache<Key, Value, Meta>) {
  return function(state: Cache<Key, Value, Meta> = [], action: GenericAction): Cache<Key, Value, Meta> {
    if (isAwaitValue<Key, Meta>(action) && action.cacheId === cacheId) {
      return limiter([awaitingValue(action.key, action.requestId, action.meta), ...state.filter(cacheItem => !keysAreEqual(cacheItem.key, action.key))])
    } else if (isReceiveValue<Value>(action) && action.cacheId === cacheId) {
      const matchingAwaitingResult = state.find(isMatchingAwaitingValue(action))
      if (matchingAwaitingResult === undefined) {
        return state
      } else {
        return limiter([valueReceived(matchingAwaitingResult.key, action.value, matchingAwaitingResult.meta), ...state.filter(not(isMatchingAwaitingValue(action)))])
      }
    } else {
      return state
    }
  }
}
