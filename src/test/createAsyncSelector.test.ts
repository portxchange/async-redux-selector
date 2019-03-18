import { createAsyncSelector } from '../createAsyncSelector'
import { AsyncValue, asyncValueReceived, asyncCommand, asyncAwaitingValue } from '../AsyncValue'

describe('createAsyncSelector', () => {
  type AppState = Readonly<{ version: number }>

  type MockSelector<A> = Readonly<{
    selector(appState: AppState): A
    setValue(a: A): void
  }>

  function mockSelector<A>(initialValue: A): MockSelector<A> {
    let value = initialValue
    const selector = (_appState: AppState) => value
    const setValue = (newValue: A) => {
      value = newValue
    }
    return { selector, setValue }
  }

  enum CommandType {
    DoSomething,
    DoSomethingElse
  }

  type Command = {
    type: CommandType
  }

  describe('two regular selectors', () => {
    let str: MockSelector<string>
    let num: MockSelector<number>

    beforeEach(() => {
      str = mockSelector('one')
      num = mockSelector(2)
    })

    describe('producing a regular value', () => {
      it('should correctly combine two regular selectors', () => {
        const res = createAsyncSelector(str.selector, num.selector, (s, n) => s.length + n)

        const toVerify = res({ version: 1 })
        const expected: AsyncValue<Command, number> = asyncValueReceived(5)
        expect(toVerify).toEqual(expected)
      })

      it('should run only once when called with the same arguments twice', () => {
        let numberOfTimesExecuted = 0
        const res = createAsyncSelector(str.selector, num.selector, (s, n) => {
          numberOfTimesExecuted += 1
          return s.length + n
        })

        // Call the selector twice, with the same arguments:
        res({ version: 1 })
        res({ version: 2 })

        expect(numberOfTimesExecuted).toEqual(1)
      })

      it('should run again when the arguments change', () => {
        let numberOfTimesExecuted = 0
        const res = createAsyncSelector(str.selector, num.selector, (s, n) => {
          numberOfTimesExecuted += 1
          return s.length + n
        })

        // Call the selector three times, with the different arguments:
        res({ version: 1 })
        str.setValue('uno')
        res({ version: 2 })
        num.setValue(3)
        res({ version: 3 })

        expect(numberOfTimesExecuted).toEqual(3)
      })

      it('should return the exact same reference if the function produces the same result', () => {
        const res = createAsyncSelector(str.selector, num.selector, (s, n) => s.length + n)

        // Call the selector two times, with the different arguments but with the same result:
        const toVerify1 = res({ version: 1 })
        str.setValue('uno')
        const toVerify2 = res({ version: 2 })

        expect(toVerify1).toBe(toVerify2)
      })
    })

    describe('producing a `AsyncValue`', () => {
      it('should correctly combine two regular selectors and return a `AsyncCommand` when the combinator returns that', () => {
        const res = createAsyncSelector(str.selector, num.selector, (_s, _n) => asyncCommand<Command>([{ type: CommandType.DoSomething }]))

        const toVerify = res({ version: 1 })
        const expected: AsyncValue<Command, number> = asyncCommand<Command>([{ type: CommandType.DoSomething }])
        expect(toVerify).toEqual(expected)
      })

      it('should correctly combine two regular selectors and return a `AsyncAwaitingValue` when the combinator returns that', () => {
        const res = createAsyncSelector(str.selector, num.selector, (_s, _n) => asyncAwaitingValue())

        const toVerify = res({ version: 1 })
        const expected: AsyncValue<Command, number> = asyncAwaitingValue()
        expect(toVerify).toEqual(expected)
      })

      it('should correctly combine two regular selectors and return a `AsyncValueReceived` when the combinator returns that', () => {
        const res = createAsyncSelector(str.selector, num.selector, (s, n) => asyncValueReceived(s.length + n))

        const toVerify = res({ version: 1 })
        const expected: AsyncValue<Command, number> = asyncValueReceived(5)
        expect(toVerify).toEqual(expected)
      })

      it('should return the exact same reference if the function produces the same result', () => {
        const res = createAsyncSelector(str.selector, num.selector, (s, n) => asyncValueReceived(s.length + n))

        // Call the selector two times, with the different arguments but with the same result:
        const toVerify1 = res({ version: 1 })
        str.setValue('uno')
        const toVerify2 = res({ version: 2 })

        expect(toVerify1).toBe(toVerify2)
      })
    })
  })

  describe('two async selectors and a regular selector', () => {
    describe('producing a regular value', () => {
      it('should return an `AsyncValueReceived` when all async selectors produce an `AsyncValueReceived`', () => {
        const str = mockSelector<AsyncValue<Command, string>>(asyncValueReceived('one'))
        const num = mockSelector<AsyncValue<Command, number>>(asyncValueReceived(2))
        const bool = mockSelector(false)
        const res = createAsyncSelector(str.selector, num.selector, bool.selector, (s, n, b) => s.length + n * (b ? 2 : 1))

        const toVerify = res({ version: 1 })
        const expected: AsyncValue<Command, number> = asyncValueReceived(5)
        expect(toVerify).toEqual(expected)
      })

      it('should return an `AsyncAwaitingValue` when one of the async selectors produces an `AsyncAwaitingValue` and the result produce an `AsyncValueReceived`', () => {
        const str = mockSelector<AsyncValue<Command, string>>(asyncValueReceived('one'))
        const num = mockSelector<AsyncValue<Command, number>>(asyncAwaitingValue())
        const bool = mockSelector(false)
        const res = createAsyncSelector(str.selector, num.selector, bool.selector, (s, n, b) => s.length + n * (b ? 2 : 1))

        const toVerify = res({ version: 1 })
        const expected: AsyncValue<Command, number> = asyncAwaitingValue()
        expect(toVerify).toEqual(expected)
      })

      it('should return an `AsyncCommand` when one of the async selectors produces an `AsyncCommand`', () => {
        const str = mockSelector<AsyncValue<Command, string>>(asyncCommand([{ type: CommandType.DoSomething }, { type: CommandType.DoSomethingElse }]))
        const num = mockSelector<AsyncValue<Command, number>>(asyncAwaitingValue())
        const bool = mockSelector(false)
        const res = createAsyncSelector(str.selector, num.selector, bool.selector, (s, n, b) => s.length + n * (b ? 2 : 1))

        const toVerify = res({ version: 1 })
        const expected: AsyncValue<Command, number> = asyncCommand([{ type: CommandType.DoSomething }, { type: CommandType.DoSomethingElse }])
        expect(toVerify).toEqual(expected)
      })

      it('should return an `AsyncCommand` with multiple commands if more of the async selectors produce an `AsyncCommand`', () => {
        const str = mockSelector<AsyncValue<Command, string>>(asyncCommand([{ type: CommandType.DoSomething }]))
        const num = mockSelector<AsyncValue<Command, number>>(asyncCommand([{ type: CommandType.DoSomethingElse }]))
        const bool = mockSelector(false)
        const res = createAsyncSelector(str.selector, num.selector, bool.selector, (s, n, b) => s.length + n * (b ? 2 : 1))

        const toVerify = res({ version: 1 })
        const expected: AsyncValue<Command, number> = asyncCommand([{ type: CommandType.DoSomething }, { type: CommandType.DoSomethingElse }])
        expect(toVerify).toEqual(expected)
      })
    })
  })
})
