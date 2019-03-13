import { RECEIVE_RESULT, AWAIT_RESULT, AWAITING_RESULT } from './const'
import { CacheItem } from './CacheItem'

export type GenericAction = Readonly<{ type: string }>

export type AwaitResult<Key> = Readonly<{
  type: typeof AWAIT_RESULT
  cacheId: string
  key: Key
  requestId: string
}>

export function awaitResult<Key>(cacheId: string, key: Key, requestId: string): AwaitResult<Key> {
  return {
    type: AWAIT_RESULT,
    cacheId,
    key,
    requestId
  }
}

export function isAwaitResult<Key>(action: GenericAction): action is AwaitResult<Key> {
  return action.type === AWAIT_RESULT
}

export type ReceiveResult<Value> = Readonly<{
  type: typeof RECEIVE_RESULT
  cacheId: string
  requestId: string
  value: Value
}>

export function receiveResult<Value>(cacheId: string, requestId: string, value: Value): ReceiveResult<Value> {
  return {
    type: RECEIVE_RESULT,
    cacheId,
    requestId,
    value
  }
}

export function isReceiveResult<Value>(action: GenericAction): action is ReceiveResult<Value> {
  return action.type === RECEIVE_RESULT
}

export const isMatchingAwaitingResult = <Value>(action: ReceiveResult<Value>) => (cacheItem: CacheItem<unknown, Value>): boolean => {
  return cacheItem.type === AWAITING_RESULT && cacheItem.requestId === action.requestId
}
