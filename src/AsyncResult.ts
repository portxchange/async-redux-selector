import { ASYNC_COMMAND, ASYNC_CACHE_ITEM } from './const'
import { CacheItem } from './CacheItem'

export type AsyncCommand<Command> = Readonly<{
  type: typeof ASYNC_COMMAND
  command: Command
}>

export function asyncCommand<Command>(command: Command): AsyncCommand<Command> {
  return { type: ASYNC_COMMAND, command }
}

export type AsyncCacheItem<Key, Value, Meta> = Readonly<{
  type: typeof ASYNC_CACHE_ITEM
  cacheItem: CacheItem<Key, Value, Meta>
}>

export function asyncCacheItem<Key, Value, Meta>(cacheItem: CacheItem<Key, Value, Meta>): AsyncCacheItem<Key, Value, Meta> {
  return { type: ASYNC_CACHE_ITEM, cacheItem }
}

export type AsyncResult<Command, Key, Value, Meta> = AsyncCommand<Command> | AsyncCacheItem<Key, Value, Meta>
