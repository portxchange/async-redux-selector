import { AWAITING_VALUE, VALUE_RECEIVED } from './const'

export type AwaitingValue<Key, Meta> = Readonly<{
  type: typeof AWAITING_VALUE
  key: Key
  requestId: string
  meta: Meta
}>

export function awaitingValue<Key, Meta>(key: Key, requestId: string, meta: Meta): AwaitingValue<Key, Meta> {
  return {
    type: AWAITING_VALUE,
    key,
    requestId,
    meta
  }
}

export type ValueReceived<Key, Value, Meta> = Readonly<{
  type: typeof VALUE_RECEIVED
  key: Key
  value: Value
  meta: Meta
}>

export function valueReceived<Key, Value, Meta>(key: Key, value: Value, meta: Meta): ValueReceived<Key, Value, Meta> {
  return {
    type: VALUE_RECEIVED,
    key,
    value,
    meta
  }
}

export type CacheItem<Key, Value, Meta> = AwaitingValue<Key, Meta> | ValueReceived<Key, Value, Meta>

// expireForKey
// update
