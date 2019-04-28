import { Cache } from '../../Store/Cache'
import { None, none } from '../../None'
import { createCacheDefinition } from '../../Store/CacheDefinition'
import { areSameReference } from '../../Equality'
import { defaultLimiter } from '../../Store/defaultLimiter'
import { GenericAction, awaitValue, receiveValue } from '../../Store/Action'
import { AsyncCommand, asyncCommand, AsyncAwaitingValue, asyncAwaitingValue, AsyncValueReceived, asyncValueReceived } from '../../AsyncValue'

describe('CacheDefinition', () => {
  type AppState = {
    stringCache: Cache<number, string, None>
  }

  const initialAppState: AppState = {
    stringCache: []
  }

  const cacheDefinition = createCacheDefinition<AppState, number, string, None>('string', appState => appState.stringCache, areSameReference, defaultLimiter(5))

  const appStateReducer = (appState: Partial<AppState> = {}, action: GenericAction): AppState => {
    return {
      stringCache: cacheDefinition.reducer(appState.stringCache, action)
    }
  }

  type Command = Readonly<{ numberToFetchStringFor: number }>

  it('should return a `AsyncCommand` to fetch a string when trying to obtain a string from an empty cache', () => {
    const appState = initialAppState
    const asyncValue = cacheDefinition
      .selector(appState)
      .getFor(1)
      .orElse<Command>({
        numberToFetchStringFor: 1
      })
    const expected: AsyncCommand<Command> = asyncCommand([{ numberToFetchStringFor: 1 }])
    expect(asyncValue).toEqual(expected)
  })

  it('should return a `AsyncAwaitingValue` when trying to obtain a string from a cache for which a request is ongoing', () => {
    const appState = appStateReducer(initialAppState, awaitValue<number, None>('string', 1, 'request-1', none))
    const asyncValue = cacheDefinition
      .selector(appState)
      .getFor(1)
      .orElse<Command>({
        numberToFetchStringFor: 1
      })
    const expected: AsyncAwaitingValue = asyncAwaitingValue()
    expect(asyncValue).toEqual(expected)
  })

  it('should return a `AsyncValue` when trying to obtain a string from a cache that contains that string', () => {
    const actions: GenericAction[] = [awaitValue<number, None>('string', 1, 'request-1', none), receiveValue<string>('string', 'request-1', 'one')]
    const appState = actions.reduce<AppState>(appStateReducer, initialAppState)
    const asyncValue = cacheDefinition
      .selector(appState)
      .getFor(1)
      .orElse<Command>({
        numberToFetchStringFor: 1
      })
    const expected: AsyncValueReceived<string> = asyncValueReceived('one')
    expect(asyncValue).toEqual(expected)
  })
})
