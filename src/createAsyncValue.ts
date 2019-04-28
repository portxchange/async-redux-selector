import { Cache } from './Store/Cache'
import { Equality } from './Equality'
import { fromCacheItem } from './AsyncValue'
import { ASYNC_COMMAND } from './const'

export function createAsyncValue<Command, Key, Value, Meta>(cache: Cache<Key, Value, Meta>, key: Key, keysAreEqual: Equality<Key>, command: Command) {
  const cacheItem = cache.find(cacheItem => keysAreEqual(cacheItem.key, key))
  if (cacheItem === undefined) {
    return { type: ASYNC_COMMAND, commands: [command] }
  } else {
    return fromCacheItem(cacheItem)
  }
}
