import { Cache } from './Cache'

export function noLimiter<Key, Value>(cache: Cache<Key, Value>): Cache<Key, Value> {
  return cache
}
