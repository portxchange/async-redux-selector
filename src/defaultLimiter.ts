import { Cache } from './Cache'

export const defaultLimiter = (numberOfCacheItems: number) => <Key, Value, Meta>(cache: Cache<Key, Value, Meta>): Cache<Key, Value, Meta> => {
  return cache.slice(0, numberOfCacheItems)
}
