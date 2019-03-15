import { AsyncResult } from './AsyncResult'
import { None, none } from './None'
import { keys } from './utils'
import { ASYNC_COMMAND, ASYNC_CACHE_ITEM, AWAITING_RESULT, RESULT_RECEIVED } from './const'

export function toSyncStateProps<Command, AsyncStateProps>(
  asyncResults: { [K in keyof AsyncStateProps]: AsyncResult<Command, unknown, AsyncStateProps[K], unknown> }
): [{ [K in keyof AsyncStateProps]: AsyncStateProps[K] | None }, Command[]] {
  const commands: Command[] = []
  const acc: Partial<{ [K in keyof AsyncStateProps]: AsyncStateProps[K] | None }> = {}
  keys(asyncResults).forEach(key => {
    const asyncResult: AsyncResult<Command, unknown, AsyncStateProps[keyof AsyncStateProps], unknown> = asyncResults[key]
    if (asyncResult.type === ASYNC_COMMAND) {
      acc[key] = none
      commands.push(asyncResult.command)
    } else if (asyncResult.type === ASYNC_CACHE_ITEM) {
      if (asyncResult.cacheItem.type === AWAITING_RESULT) {
        acc[key] = none
      } else if (asyncResult.cacheItem.type === RESULT_RECEIVED) {
        acc[key] = asyncResult.cacheItem.value
      } else {
        const exhaustive: never = asyncResult.cacheItem
        throw new Error(exhaustive)
      }
    } else {
      const exhaustive: never = asyncResult
      throw new Error(exhaustive)
    }
  })
  return [acc as { [K in keyof AsyncStateProps]: AsyncStateProps[K] | None }, commands]
}
