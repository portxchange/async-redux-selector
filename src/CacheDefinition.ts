import { Selector } from './Selector'
import { Cache } from './Cache'
import { AsyncValue } from './AsyncValue'
import { Equality } from './Equality'
import { createAsyncResult } from './createAsyncResult'
import { GenericAction, AwaitValue, ReceiveValue, awaitValue, receiveValue } from './Action'
import { createReducer } from './createReducer'

export type CacheApiGetFor<Value> = Readonly<{
  orElse<Command>(command: Command): AsyncValue<Command, Value>
}>

export function cacheApiGetFor<Key, Value, Meta>(cache: Cache<Key, Value, Meta>, key: Key, keysAreEqual: Equality<Key>): CacheApiGetFor<Value> {
  return {
    orElse<Command>(command: Command): AsyncValue<Command, Value> {
      return createAsyncResult(cache, key, keysAreEqual, command)
    }
  }
}

export type CacheApi<Key, Value> = Readonly<{
  getFor(key: Key): CacheApiGetFor<Value>
}>

export function cacheApi<Key, Value, Meta>(cache: Cache<Key, Value, Meta>, keysAreEqual: Equality<Key>): CacheApi<Key, Value> {
  return {
    getFor(key: Key): CacheApiGetFor<Value> {
      return cacheApiGetFor(cache, key, keysAreEqual)
    }
  }
}

export type CacheDefinition<AppState, Key, Value, Meta> = Readonly<{
  cacheId: string
  cacheSelector: Selector<AppState, Cache<Key, Value, Meta>>
  keysAreEqual: Equality<Key>
  reducer: (state: Cache<Key, Value, Meta> | undefined, action: GenericAction) => Cache<Key, Value, Meta>
  selector: Selector<AppState, CacheApi<Key, Value>>
  awaitValue(key: Key, requestId: string, meta: Meta): AwaitValue<Key, Meta>
  receiveValue(requestId: string, value: Value): ReceiveValue<Value>
}>

export function createCacheDefinition<AppState, Key, Value, Meta>(
  cacheId: string,
  cacheSelector: Selector<AppState, Cache<Key, Value, Meta>>,
  keysAreEqual: Equality<Key>,
  limiter: (cache: Cache<Key, Value, Meta>) => Cache<Key, Value, Meta>
): CacheDefinition<AppState, Key, Value, Meta> {
  return {
    cacheId,
    cacheSelector,
    keysAreEqual,
    reducer: createReducer(cacheId, keysAreEqual, limiter),
    selector(appState: AppState): CacheApi<Key, Value> {
      const cache = cacheSelector(appState)
      return cacheApi(cache, keysAreEqual)
    },
    awaitValue(key: Key, requestId: string, meta: Meta): AwaitValue<Key, Meta> {
      return awaitValue(cacheId, key, requestId, meta)
    },
    receiveValue(requestId: string, value: Value): ReceiveValue<Value> {
      return receiveValue(cacheId, requestId, value)
    }
  }
}
