import { AWAITING_RESULT, RESULT_RECEIVED } from './const'

export type AwaitingResult<Key> = Readonly<{
  type: typeof AWAITING_RESULT
  key: Key
  requestId: string
}>

export function awaitingResult<Key>(key: Key, requestId: string): AwaitingResult<Key> {
  return {
    type: AWAITING_RESULT,
    key,
    requestId
  }
}

export type ResultReceived<Key, Value> = Readonly<{
  type: typeof RESULT_RECEIVED
  key: Key
  value: Value
}>

export function resultReceived<Key, Value>(key: Key, value: Value): ResultReceived<Key, Value> {
  return {
    type: RESULT_RECEIVED,
    key,
    value
  }
}

export type CacheItem<Key, Value> = AwaitingResult<Key> | ResultReceived<Key, Value>
