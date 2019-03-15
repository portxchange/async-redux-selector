import { Selector } from './Selector'
import { Cache } from './Cache'
import { AsyncResult } from './AsyncResult'
import { Equality } from './Equality'
import { createAsyncResult } from './createAsyncResult'

export type CacheApiGetFor<Key, Value, Meta> = Readonly<{
  orElse<Command>(command: Command): AsyncResult<Command, Key, Value, Meta>
}>

export function cacheApiGetFor<Key, Value, Meta>(cache: Cache<Key, Value, Meta>, key: Key, keysAreEqual: Equality<Key>): CacheApiGetFor<Key, Value, Meta> {
  return {
    orElse<Command>(command: Command): AsyncResult<Command, Key, Value, Meta> {
      return createAsyncResult(cache, key, keysAreEqual, command)
    }
  }
}

export type CacheApi<Key, Value, Meta> = Readonly<{
  getFor(key: Key): CacheApiGetFor<Key, Value, Meta>
}>

export function cacheApi<Key, Value, Meta>(cache: Cache<Key, Value, Meta>, keysAreEqual: Equality<Key>): CacheApi<Key, Value, Meta> {
  return {
    getFor(key: Key): CacheApiGetFor<Key, Value, Meta> {
      return cacheApiGetFor(cache, key, keysAreEqual)
    }
  }
}

export type CacheDefinition<AppState, Key, Value, Meta> = Readonly<{
  cacheSelector: Selector<AppState, Cache<Key, Value, Meta>>
  keysAreEqual: Equality<Key>
  selector: Selector<AppState, CacheApi<Key, Value, Meta>>
}>

export function cacheDefinition<AppState, Key, Value, Meta>(
  cacheSelector: Selector<AppState, Cache<Key, Value, Meta>>,
  keysAreEqual: Equality<Key>
): CacheDefinition<AppState, Key, Value, Meta> {
  return {
    cacheSelector,
    keysAreEqual,
    selector(appState: AppState): CacheApi<Key, Value, Meta> {
      const cache = cacheSelector(appState)
      return cacheApi(cache, keysAreEqual)
    }
  }
}
