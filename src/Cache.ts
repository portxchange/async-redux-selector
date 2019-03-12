import { CacheItem } from './CacheItem'

export type Cache<Key, Result> = Array<CacheItem<Key, Result>>
