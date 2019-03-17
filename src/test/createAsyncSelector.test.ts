import { createAsyncSelector } from '../createAsyncSelector'
import { AsyncValue, asyncValueReceived } from '../AsyncValue'

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

  describe('two regular selectors', () => {
    it('should correctly combine two regular selectors', () => {
      const first = mockSelector('one')
      const second = mockSelector(2)
      const third = createAsyncSelector(first.selector, second.selector, (f, s) => f.length + s)

      const toVerify = third({ version: 1 })
      const expected: AsyncValue<never, number> = asyncValueReceived(5)
      expect(toVerify).toEqual(expected)
    })

    it('should run only once when called with the same arguments twice', () => {
      const first = mockSelector('one')
      const second = mockSelector(2)
      let numberOfTimesExecuted = 0
      const third = createAsyncSelector(first.selector, second.selector, (f, s) => {
        numberOfTimesExecuted += 1
        return f.length + s
      })

      // Call the selector twice, with the same arguments:
      third({ version: 1 })
      third({ version: 2 })

      expect(numberOfTimesExecuted).toEqual(1)
    })

    it('should run again when the arguments change', () => {
      const first = mockSelector('one')
      const second = mockSelector(2)
      let numberOfTimesExecuted = 0
      const third = createAsyncSelector(first.selector, second.selector, (f, s) => {
        numberOfTimesExecuted += 1
        return f.length + s
      })

      // Call the selector three times, with the different arguments:
      third({ version: 1 })
      first.setValue('uno')
      third({ version: 2 })
      second.setValue(3)
      third({ version: 3 })

      expect(numberOfTimesExecuted).toEqual(3)
    })
  })
})
