import { Cache } from './Cache'
import { Equality } from './Equality'
import { asyncCommand, asyncCacheItem } from './AsyncResult'

export function createAsyncResult<Command, Key, Value, Meta>(cache: Cache<Key, Value, Meta>, key: Key, keysAreEqual: Equality<Key>, command: Command) {
  const cacheItem = cache.find(cacheItem => keysAreEqual(cacheItem.key, key))
  if (cacheItem === undefined) {
    return asyncCommand(command)
  } else {
    return asyncCacheItem(cacheItem)
  }
}
