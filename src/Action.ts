import { RECEIVE_VALUE, AWAIT_VALUE, AWAITING_VALUE } from './const'
import { CacheItem } from './CacheItem'

export type GenericAction = Readonly<{ type: string }>

export type CacheAction<Key, Value, Meta> = AwaitValue<Key, Meta> | ReceiveValue<Value>

export type AwaitValue<Key, Meta> = Readonly<{
  type: typeof AWAIT_VALUE
  cacheId: string
  key: Key
  requestId: string
  meta: Meta
}>

export function awaitValue<Key, Meta>(cacheId: string, key: Key, requestId: string, meta: Meta): AwaitValue<Key, Meta> {
  return {
    type: AWAIT_VALUE,
    cacheId,
    key,
    requestId,
    meta
  }
}

export function isAwaitValue<Key, Meta>(action: GenericAction): action is AwaitValue<Key, Meta> {
  return action.type === AWAIT_VALUE
}

export type ReceiveValue<Value> = Readonly<{
  type: typeof RECEIVE_VALUE
  cacheId: string
  requestId: string
  value: Value
}>

export function receiveValue<Value>(cacheId: string, requestId: string, value: Value): ReceiveValue<Value> {
  return {
    type: RECEIVE_VALUE,
    cacheId,
    requestId,
    value
  }
}

export function isReceiveValue<Value>(action: GenericAction): action is ReceiveValue<Value> {
  return action.type === RECEIVE_VALUE
}

export const isMatchingAwaitingValue = <Value>(action: ReceiveValue<Value>) => (cacheItem: CacheItem<unknown, Value, unknown>): boolean => {
  return cacheItem.type === AWAITING_VALUE && cacheItem.requestId === action.requestId
}
