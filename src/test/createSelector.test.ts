import { GenericAction, awaitResult, receiveResult } from '../Action'
import { Cache } from '../Cache'
import { createReducer } from '../createReducer'
import { awaitingResult, resultReceived } from '../CacheItem'
import { defaultLimiter } from '../defaultLimiter'

describe('createSelector', () => {
  type Key = number
  type Value = string
  type Meta = { requestId: string }

  function keysAreEqual(left: Key, right: Key): boolean {
    return left === right
  }

  const cacheId = 'my-cache'
  const someOtherCacheId = 'some-other-cache'

  const request1 = 'request-1'
  const request2 = 'request-2'
  const request3 = 'request-3'
  const request4 = 'request-4'
  const request5 = 'request-5'

  const reducer = createReducer(cacheId, keysAreEqual, defaultLimiter(4))

  function reduceAll(actions: GenericAction[]) {
    return actions.reduce(reducer, undefined)
  }

  it('should not crash on unknown actions', () => {
    const cache = reduceAll([{ type: 'some-action' }])
    const expected: Cache<Key, Value, Meta> = []
    expect(cache).toEqual(expected)
  })

  it('should register requests', () => {
    const cache = reduceAll([
      awaitResult(cacheId, 1, request1, { requestId: request1 }),
      awaitResult(cacheId, 2, request2, { requestId: request2 }),
      awaitResult(cacheId, 3, request3, { requestId: request3 })
    ])
    const expected: Cache<Key, Value, Meta> = [
      awaitingResult(3, request3, { requestId: request3 }),
      awaitingResult(2, request2, { requestId: request2 }),
      awaitingResult(1, request1, { requestId: request1 })
    ]
    expect(cache).toEqual(expected)
  })

  it('should favor the later request if two requests for the same key are started around the same time', () => {
    const cache = reduceAll([awaitResult(cacheId, 1, request1, { requestId: request1 }), awaitResult(cacheId, 1, request2, { requestId: request2 })])
    const expected: Cache<Key, Value, Meta> = [awaitingResult(1, request2, { requestId: request2 })]
    expect(cache).toEqual(expected)
  })

  it('should not register a request for other caches', () => {
    const cache = reduceAll([awaitResult(someOtherCacheId, 1, request1, { requestId: request1 })])
    const expected: Cache<Key, Value, Meta> = []
    expect(cache).toEqual(expected)
  })

  it('should process results', () => {
    const cache = reduceAll([
      awaitResult(cacheId, 1, request1, { requestId: request1 }),
      awaitResult(cacheId, 2, request2, { requestId: request2 }),
      receiveResult<Value>(cacheId, request1, 'one'),
      awaitResult(cacheId, 3, request3, { requestId: request3 }),
      receiveResult<Value>(cacheId, request2, 'two')
    ])
    const expected: Cache<Key, Value, Meta> = [
      resultReceived(2, 'two', { requestId: request2 }),
      awaitingResult(3, request3, { requestId: request3 }),
      resultReceived(1, 'one', { requestId: request1 })
    ]
    expect(cache).toEqual(expected)
  })

  it('should not process a result for other caches, even if the request id matches', () => {
    const cache = reduceAll([awaitResult(cacheId, 1, request1, { requestId: request1 }), receiveResult(someOtherCacheId, request1, 'one')])
    const expected: Cache<Key, Value, Meta> = [awaitingResult(1, request1, { requestId: request1 })]
    expect(cache).toEqual(expected)
  })

  it('should not process a result if the request id does not match', () => {
    const cache = reduceAll([awaitResult(cacheId, 1, request1, { requestId: request1 }), receiveResult(cacheId, request2, 'one')])
    const expected: Cache<Key, Value, Meta> = [awaitingResult(1, request1, { requestId: request1 })]
    expect(cache).toEqual(expected)
  })

  it('should limit the amount of requests open at the same time', () => {
    const cache = reduceAll([
      awaitResult(cacheId, 1, request1, { requestId: request1 }),
      awaitResult(cacheId, 2, request2, { requestId: request2 }),
      awaitResult(cacheId, 3, request3, { requestId: request3 }),
      awaitResult(cacheId, 4, request4, { requestId: request4 }),
      awaitResult(cacheId, 5, request5, { requestId: request5 })
    ])
    const expected: Cache<Key, Value, Meta> = [
      awaitingResult(5, request5, { requestId: request5 }),
      awaitingResult(4, request4, { requestId: request4 }),
      awaitingResult(3, request3, { requestId: request3 }),
      awaitingResult(2, request2, { requestId: request2 })
    ]
    expect(cache).toEqual(expected)
  })
})
