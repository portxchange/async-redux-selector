import { CacheItem } from './CacheItem'

export type Cache<Key, Result, Meta> = Array<CacheItem<Key, Result, Meta>>
