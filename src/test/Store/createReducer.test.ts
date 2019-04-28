import { GenericAction, awaitValue, receiveValue } from '../../Store/Action'
import { Cache } from '../../Store/Cache'
import { createReducer } from '../../Store/createReducer'
import { awaitingValue, valueReceived } from '../../CacheItem'
import { defaultLimiter } from '../../Store/defaultLimiter'

describe('createReducer', () => {
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
      awaitValue(cacheId, 1, request1, { requestId: request1 }),
      awaitValue(cacheId, 2, request2, { requestId: request2 }),
      awaitValue(cacheId, 3, request3, { requestId: request3 })
    ])
    const expected: Cache<Key, Value, Meta> = [
      awaitingValue(3, request3, { requestId: request3 }),
      awaitingValue(2, request2, { requestId: request2 }),
      awaitingValue(1, request1, { requestId: request1 })
    ]
    expect(cache).toEqual(expected)
  })

  it('should favor the later request if two requests for the same key are started around the same time', () => {
    const cache = reduceAll([awaitValue(cacheId, 1, request1, { requestId: request1 }), awaitValue(cacheId, 1, request2, { requestId: request2 })])
    const expected: Cache<Key, Value, Meta> = [awaitingValue(1, request2, { requestId: request2 })]
    expect(cache).toEqual(expected)
  })

  it('should not register a request for other caches', () => {
    const cache = reduceAll([awaitValue(someOtherCacheId, 1, request1, { requestId: request1 })])
    const expected: Cache<Key, Value, Meta> = []
    expect(cache).toEqual(expected)
  })

  it('should process results', () => {
    const cache = reduceAll([
      awaitValue(cacheId, 1, request1, { requestId: request1 }),
      awaitValue(cacheId, 2, request2, { requestId: request2 }),
      receiveValue<Value>(cacheId, request1, 'one'),
      awaitValue(cacheId, 3, request3, { requestId: request3 }),
      receiveValue<Value>(cacheId, request2, 'two')
    ])
    const expected: Cache<Key, Value, Meta> = [
      valueReceived(2, 'two', { requestId: request2 }),
      awaitingValue(3, request3, { requestId: request3 }),
      valueReceived(1, 'one', { requestId: request1 })
    ]
    expect(cache).toEqual(expected)
  })

  it('should not process a result for other caches, even if the request id matches', () => {
    const cache = reduceAll([awaitValue(cacheId, 1, request1, { requestId: request1 }), receiveValue(someOtherCacheId, request1, 'one')])
    const expected: Cache<Key, Value, Meta> = [awaitingValue(1, request1, { requestId: request1 })]
    expect(cache).toEqual(expected)
  })

  it('should not process a result if the request id does not match', () => {
    const cache = reduceAll([awaitValue(cacheId, 1, request1, { requestId: request1 }), receiveValue(cacheId, request2, 'one')])
    const expected: Cache<Key, Value, Meta> = [awaitingValue(1, request1, { requestId: request1 })]
    expect(cache).toEqual(expected)
  })

  it('should limit the amount of requests open at the same time', () => {
    const cache = reduceAll([
      awaitValue(cacheId, 1, request1, { requestId: request1 }),
      awaitValue(cacheId, 2, request2, { requestId: request2 }),
      awaitValue(cacheId, 3, request3, { requestId: request3 }),
      awaitValue(cacheId, 4, request4, { requestId: request4 }),
      awaitValue(cacheId, 5, request5, { requestId: request5 })
    ])
    const expected: Cache<Key, Value, Meta> = [
      awaitingValue(5, request5, { requestId: request5 }),
      awaitingValue(4, request4, { requestId: request4 }),
      awaitingValue(3, request3, { requestId: request3 }),
      awaitingValue(2, request2, { requestId: request2 })
    ]
    expect(cache).toEqual(expected)
  })
})
