import { createAsyncSelector } from '../../Select/createAsyncSelector'
import { AsyncValue, asyncValueReceived, asyncCommand, asyncAwaitingValue } from '../../AsyncValue'
import { areSameReference } from '../../Equality'
import { createTrackedSelector } from '../../Select/createTrackedSelector'
import { someHasChanged } from '../../Select/Tracked'
import { asyncSelectorResult } from '../../Select/AsyncSelectorResult'

describe('createAsyncSelector', () => {
  enum CommandType {
    DoSomething,
    DoSomethingElse
  }

  type Command = {
    type: CommandType
  }

  describe('two regular selectors', () => {
    type AppState = Readonly<{ version: number; num: number; str: string }>
    const numberSelector = (appState: AppState) => appState.num
    const stringSelector = (appState: AppState) => appState.str

    const initialAppState: AppState = { version: 1, num: 2, str: 'one' }

    describe('producing a regular value', () => {
      it('should correctly combine two regular selectors', () => {
        const asyncSelector = createAsyncSelector(stringSelector, numberSelector, (s, n) => s.length + n)

        const toVerify = asyncSelector(initialAppState)
        const expected = asyncSelectorResult<AppState, {}, Command, number>(asyncValueReceived(5), [])
        expect(toVerify).toEqual(expected)
      })

      it('should run only once when called with the same arguments twice', () => {
        let numberOfTimesExecuted = 0
        const asyncSelector = createAsyncSelector(stringSelector, numberSelector, (s, n) => {
          numberOfTimesExecuted += 1
          return s.length + n
        })

        // Call the selector twice, with the same arguments:
        asyncSelector({ ...initialAppState, version: 1 })
        asyncSelector({ ...initialAppState, version: 2 })

        expect(numberOfTimesExecuted).toEqual(1)
      })

      it('should run again when the arguments change', () => {
        let numberOfTimesExecuted = 0
        const asyncSelector = createAsyncSelector(stringSelector, numberSelector, (s, n) => {
          numberOfTimesExecuted += 1
          return s.length + n
        })

        // Call the selector three times, with the different arguments:
        asyncSelector({ version: 1, num: 1, str: 'one' })
        asyncSelector({ version: 2, num: 1, str: 'uno' })
        asyncSelector({ version: 3, num: 3, str: 'uno' })

        expect(numberOfTimesExecuted).toEqual(3)
      })

      it('should return the exact same reference if the function produces the same result', () => {
        const res = createAsyncSelector(stringSelector, numberSelector, (s, n) => s.length + n)

        // Call the selector two times, with the different arguments but with the same result:
        const toVerify1 = res({ version: 1, num: 1, str: 'one' })
        const toVerify2 = res({ version: 2, num: 1, str: 'one' })

        expect(toVerify1).toBe(toVerify2)
      })
    })

    describe('producing a `AsyncValue`', () => {
      it('should correctly combine two regular selectors and return a `AsyncCommand` when the combinator returns that', () => {
        const asyncSelector = createAsyncSelector(stringSelector, numberSelector, (_s, _n) => asyncCommand<Command>([{ type: CommandType.DoSomething }]))

        const toVerify = asyncSelector(initialAppState)
        const expected = asyncSelectorResult<AppState, {}, Command, number>(asyncCommand([{ type: CommandType.DoSomething }]), [])
        expect(toVerify).toEqual(expected)
      })

      it('should correctly combine two regular selectors and return a `AsyncAwaitingValue` when the combinator returns that', () => {
        const asyncSelector = createAsyncSelector(stringSelector, numberSelector, (_s, _n) => asyncAwaitingValue())

        const toVerify = asyncSelector(initialAppState)
        const expected = asyncSelectorResult<AppState, {}, Command, number>(asyncAwaitingValue(), [])
        expect(toVerify).toEqual(expected)
      })

      it('should correctly combine two regular selectors and return a `AsyncValueReceived` when the combinator returns that', () => {
        const asyncSelector = createAsyncSelector(stringSelector, numberSelector, (s, n) => asyncValueReceived(s.length + n))

        const toVerify = asyncSelector(initialAppState)
        const expected = asyncSelectorResult<AppState, {}, Command, number>(asyncValueReceived(5), [])
        expect(toVerify).toEqual(expected)
      })

      it('should return the exact same reference if the function produces the same result', () => {
        const res = createAsyncSelector(stringSelector, numberSelector, (s, n) => asyncValueReceived(s.length + n))

        // Call the selector two times, with the different arguments but with the same result:
        const toVerify1 = res({ version: 1, num: 1, str: 'one' })
        const toVerify2 = res({ version: 2, num: 1, str: 'one' })

        expect(toVerify1).toBe(toVerify2)
      })
    })
  })

  describe('two async selectors and a regular selector', () => {
    type AppState = Readonly<{ version: number; num: AsyncValue<Command, number>; str: AsyncValue<Command, string>; bool: boolean }>
    const asyncNumberSelector = (appState: AppState) => asyncSelectorResult<AppState, {}, Command, number>(appState.num, [])
    const asyncStringSelector = (appState: AppState) => asyncSelectorResult<AppState, {}, Command, string>(appState.str, [])
    const boolSelector = (appState: AppState) => appState.bool

    const initialAppState: AppState = { version: 1, num: asyncValueReceived(2), str: asyncValueReceived('one'), bool: false }

    describe('producing a regular value', () => {
      it('should return an `AsyncValueReceived` when all async selectors produce an `AsyncValueReceived`', () => {
        let wasCalled = false
        const asyncSelector = createAsyncSelector(asyncStringSelector, asyncNumberSelector, boolSelector, (s, n, b) => {
          wasCalled = true
          return s.length + n * (b ? 2 : 1)
        })

        const toVerify = asyncSelector(initialAppState)
        const expected = asyncSelectorResult<AppState, {}, Command, number>(asyncValueReceived(5), [])
        expect(toVerify).toEqual(expected)
        expect(wasCalled).toEqual(true)
      })

      it('should return an `AsyncAwaitingValue` when one of the async selectors produces an `AsyncAwaitingValue` and the rest produces an `AsyncValueReceived`', () => {
        let wasCalled = false
        const appState: AppState = { version: 1, num: asyncAwaitingValue(), str: asyncValueReceived('one'), bool: false }
        const asyncSelector = createAsyncSelector(asyncStringSelector, asyncNumberSelector, boolSelector, (s, n, b) => {
          wasCalled = true
          return s.length + n * (b ? 2 : 1)
        })

        const toVerify = asyncSelector(appState)
        const expected = asyncSelectorResult<AppState, {}, Command, number>(asyncAwaitingValue(), [])
        expect(toVerify).toEqual(expected)
        expect(wasCalled).toEqual(false)
      })

      it('should return an `AsyncCommand` when one of the async selectors produces an `AsyncCommand`', () => {
        let wasCalled = false
        const appState: AppState = {
          version: 1,
          num: asyncAwaitingValue(),
          str: asyncCommand([{ type: CommandType.DoSomething }, { type: CommandType.DoSomethingElse }]),
          bool: false
        }
        const asyncSelector = createAsyncSelector(asyncStringSelector, asyncNumberSelector, boolSelector, (s, n, b) => {
          wasCalled = true
          return s.length + n * (b ? 2 : 1)
        })

        const toVerify = asyncSelector(appState)
        const expected = asyncSelectorResult<AppState, {}, Command, number>(asyncCommand([{ type: CommandType.DoSomething }, { type: CommandType.DoSomethingElse }]), [])
        expect(toVerify).toEqual(expected)
        expect(wasCalled).toEqual(false)
      })

      it('should return an `AsyncCommand` with multiple commands if more of the async selectors produce an `AsyncCommand`', () => {
        let wasCalled = false
        const appState: AppState = {
          version: 1,
          num: asyncCommand([{ type: CommandType.DoSomethingElse }]),
          str: asyncCommand([{ type: CommandType.DoSomething }]),
          bool: false
        }
        const asyncSelector = createAsyncSelector(asyncStringSelector, asyncNumberSelector, boolSelector, (s, n, b) => {
          wasCalled = true
          return s.length + n * (b ? 2 : 1)
        })

        const toVerify = asyncSelector(appState)
        const expected = asyncSelectorResult<AppState, {}, Command, number>(asyncCommand([{ type: CommandType.DoSomething }, { type: CommandType.DoSomethingElse }]), [])
        expect(toVerify).toEqual(expected)
        expect(wasCalled).toEqual(false)
      })

      it('should run only once when called with the same arguments twice', () => {
        let numberOfTimesExecuted = 0
        const asyncSelector = createAsyncSelector(asyncStringSelector, asyncNumberSelector, boolSelector, (s, n, b) => {
          numberOfTimesExecuted += 1
          return s.length + n * (b ? 2 : 1)
        })

        // Call the selector twice, with the same arguments:
        asyncSelector({ ...initialAppState, version: 1 })
        asyncSelector({ ...initialAppState, version: 2 })

        expect(numberOfTimesExecuted).toEqual(1)
      })

      it('should run only once when called with different async values, which contain the same values', () => {
        let numberOfTimesExecuted = 0
        const asyncSelector = createAsyncSelector(asyncStringSelector, asyncNumberSelector, boolSelector, (s, n, b) => {
          numberOfTimesExecuted += 1
          return s.length + n * (b ? 2 : 1)
        })

        // Call the selector twice, with different async values which contain the same values:
        asyncSelector({ ...initialAppState, version: 1, str: asyncValueReceived('one') })
        asyncSelector({ ...initialAppState, version: 2, str: asyncValueReceived('one') })

        expect(numberOfTimesExecuted).toEqual(1)
      })

      it('should run again when the arguments change', () => {
        let numberOfTimesExecuted = 0
        const asyncSelector = createAsyncSelector(asyncStringSelector, asyncNumberSelector, boolSelector, (s, n, b) => {
          numberOfTimesExecuted += 1
          return s.length + n * (b ? 2 : 1)
        })

        // Call the selector three times, with the different arguments:
        asyncSelector({ ...initialAppState, version: 1, str: asyncValueReceived('one'), num: asyncValueReceived(2) })
        asyncSelector({ ...initialAppState, version: 1, str: asyncValueReceived('uno'), num: asyncValueReceived(2) })
        asyncSelector({ ...initialAppState, version: 1, str: asyncValueReceived('uno'), num: asyncValueReceived(3) })

        expect(numberOfTimesExecuted).toEqual(3)
      })

      it('should return the exact same reference if the function produces the same result', () => {
        const res = createAsyncSelector(asyncStringSelector, asyncNumberSelector, boolSelector, (s, n, b) => s.length + n * (b ? 2 : 1))

        // Call the selector two times, with the different arguments but with the same result:
        const toVerify1 = res({ ...initialAppState, version: 1, str: asyncValueReceived('one'), num: asyncValueReceived(1) })
        const toVerify2 = res({ ...initialAppState, version: 2, str: asyncValueReceived('one'), num: asyncValueReceived(1) })

        expect(toVerify1).toBe(toVerify2)
      })
    })

    describe('producing a `AsyncValue`', () => {
      it('should correctly combine two async selectors and a regular selector and return a `AsyncCommand` when the combinator returns that', () => {
        const asyncSelector = createAsyncSelector(asyncStringSelector, asyncNumberSelector, boolSelector, (_s, _n, _b) =>
          asyncCommand<Command>([{ type: CommandType.DoSomething }])
        )

        const toVerify = asyncSelector(initialAppState)
        const expected = asyncSelectorResult<AppState, {}, Command, number>(asyncCommand([{ type: CommandType.DoSomething }]), [])
        expect(toVerify).toEqual(expected)
      })

      it('should correctly combine two async selectors and a regular selector and return a `AsyncAwaitingValue` when the combinator returns that', () => {
        const asyncSelector = createAsyncSelector(asyncStringSelector, asyncNumberSelector, boolSelector, (_s, _n, _b) => asyncAwaitingValue())

        const toVerify = asyncSelector(initialAppState)
        const expected = asyncSelectorResult<AppState, {}, Command, number>(asyncAwaitingValue(), [])
        expect(toVerify).toEqual(expected)
      })

      it('should correctly combine two async selectors and a regular selector and return a `AsyncValueReceived` when the combinator returns that', () => {
        const res = createAsyncSelector(asyncStringSelector, asyncNumberSelector, boolSelector, (s, n, b) => asyncValueReceived(s.length + n * (b ? 2 : 1)))

        const toVerify = res(initialAppState)
        const expected = asyncSelectorResult<AppState, {}, Command, number>(asyncValueReceived(5), [])
        expect(toVerify).toEqual(expected)
      })

      it('should return the exact same reference if the function produces the same result', () => {
        const res = createAsyncSelector(asyncStringSelector, asyncNumberSelector, boolSelector, (s, n, b) => asyncValueReceived(s.length + n * (b ? 2 : 1)))

        // Call the selector two times, with the different arguments but with the same result:
        const toVerify1 = res({ ...initialAppState, version: 1, str: asyncValueReceived('one'), num: asyncValueReceived(1) })
        const toVerify2 = res({ ...initialAppState, version: 2, str: asyncValueReceived('one'), num: asyncValueReceived(1) })

        expect(toVerify1).toBe(toVerify2)
      })
    })
  })

  describe('tracking inputs', () => {
    type AppState = Readonly<{ version: number; num: number; str: string }>
    const trackedNumberSelector = createTrackedSelector((appState: AppState) => appState.num, areSameReference)
    const trackedStringSelector = createTrackedSelector((appState: AppState) => appState.str, areSameReference)
    const res = createAsyncSelector(trackedStringSelector, trackedNumberSelector, (s, n) => s.length + n)

    const initialAppState: AppState = { version: 1, num: 2, str: 'one' }

    it('should be able to conclude that the inputs are the same', () => {
      const asyncSelectorResult = res({ ...initialAppState, version: 1 })
      const nextAppState: AppState = { ...initialAppState, version: 2 }
      expect(someHasChanged(asyncSelectorResult.trackedUserInput, nextAppState, {})).toEqual(false)
    })

    it('should be able to conclude that the inputs are different', () => {
      const asyncSelectorResult = res({ ...initialAppState, version: 1, num: 2 })
      const nextAppState: AppState = { ...initialAppState, version: 2, num: 3 }
      expect(someHasChanged(asyncSelectorResult.trackedUserInput, nextAppState, {})).toEqual(true)
    })
  })

  describe('passing props', () => {
    type AppState = Readonly<{ version: number; num: AsyncValue<Command, number> }>
    type Props = Readonly<{ version: number; str: string }>
    const asyncNumberSelector = (appState: AppState) => asyncSelectorResult<AppState, Props, Command, number>(appState.num, [])
    const stringSelector = (_appState: AppState, props: Props) => props.str

    it('should be able to use data from second argument', () => {
      const res = createAsyncSelector(stringSelector, asyncNumberSelector, (s, n) => s.length + n)
      const toVerify = res({ version: 1, num: asyncValueReceived(4) }, { version: 1, str: 'four' })
      const expected = asyncSelectorResult<AppState, Props, Command, number>(asyncValueReceived(8), [])
      expect(toVerify).toEqual(expected)
    })

    it('should run only once when called with the same arguments twice', () => {
      let numberOfTimesExecuted = 0
      const asyncSelector = createAsyncSelector(stringSelector, asyncNumberSelector, (s, n) => {
        numberOfTimesExecuted += 1
        return s.length + n
      })

      // Call the selector twice, with the same arguments:
      asyncSelector({ version: 1, num: asyncValueReceived(4) }, { version: 1, str: 'four' })
      asyncSelector({ version: 2, num: asyncValueReceived(4) }, { version: 2, str: 'four' })

      expect(numberOfTimesExecuted).toEqual(1)
    })

    it('should return the exact same reference if the function produces the same result', () => {
      const res = createAsyncSelector(stringSelector, asyncNumberSelector, (s, n) => s.length + n)

      // Call the selector two times, with the different arguments but with the same result:
      const toVerify1 = res({ version: 1, num: asyncValueReceived(4) }, { version: 1, str: 'four' })
      const toVerify2 = res({ version: 2, num: asyncValueReceived(3) }, { version: 2, str: 'three' })

      expect(toVerify1).toBe(toVerify2)
    })
  })
})
