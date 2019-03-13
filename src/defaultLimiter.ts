import { Cache } from './Cache'

export const defaultLimiter = (numberOfCacheItems: number) => <Key, Value>(cache: Cache<Key, Value>): Cache<Key, Value> => {
  return cache.slice(0, numberOfCacheItems)
}
