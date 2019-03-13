import { AWAITING_RESULT, RESULT_RECEIVED } from './const'

export type AwaitingResult<Key, Meta> = Readonly<{
  type: typeof AWAITING_RESULT
  key: Key
  requestId: string
  meta: Meta
}>

export function awaitingResult<Key, Meta>(key: Key, requestId: string, meta: Meta): AwaitingResult<Key, Meta> {
  return {
    type: AWAITING_RESULT,
    key,
    requestId,
    meta
  }
}

export type ResultReceived<Key, Value, Meta> = Readonly<{
  type: typeof RESULT_RECEIVED
  key: Key
  value: Value
  meta: Meta
}>

export function resultReceived<Key, Value, Meta>(key: Key, value: Value, meta: Meta): ResultReceived<Key, Value, Meta> {
  return {
    type: RESULT_RECEIVED,
    key,
    value,
    meta
  }
}

export type CacheItem<Key, Value, Meta> = AwaitingResult<Key, Meta> | ResultReceived<Key, Value, Meta>
