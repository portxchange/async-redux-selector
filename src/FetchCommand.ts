export const FETCH_COMMAND: 'FETCH_COMMAND' = 'FETCH_COMMAND'

export type FetchCommand<Key, Value> = Readonly<{
  type: typeof FETCH_COMMAND
  cacheId: string
  key: Key
  promise: () => Promise<Value>
}>

export function fetchCommand<Key, Value>(cacheId: string, key: Key, promise: () => Promise<Value>): FetchCommand<Key, Value> {
  return {
    type: FETCH_COMMAND,
    cacheId,
    key,
    promise
  }
}
