import { Cache } from './Cache'

export function noLimiter<Key, Value, Meta>(cache: Cache<Key, Value, Meta>): Cache<Key, Value, Meta> {
  return cache
}
