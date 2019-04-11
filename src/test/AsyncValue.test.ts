import {
  AsyncValue,
  combine,
  asyncValueReceived,
  asyncAwaitingValue,
  asyncCommand,
  sequence,
  combineMany,
  fromCacheItem,
  map,
  flattenIfNecessary,
  getCommands
} from '../AsyncValue'
import { awaitingValue, valueReceived } from '../CacheItem'

describe('AsynValue', () => {
  enum Command {
    DoSomething,
    DoSomethingElse
  }

  describe('combine', () => {
    const fn = (str: string, num: number): number => str.length + num

    type TestCase<Left, Right, Result> = Readonly<{
      left: AsyncValue<Command, Left>
      right: AsyncValue<Command, Right>
      fn: (left: Left, right: Right) => Result
      expected: AsyncValue<Command, Result>
    }>

    function runTestCase<Left, Right, Result>(description: string, testCase: TestCase<Left, Right, Result>) {
      expect({
        description,
        asyncValue: combine(testCase.left, testCase.right, testCase.fn)
      }).toEqual({
        description,
        asyncValue: testCase.expected
      })
    }

    it('should combine two `AsyncValue`-instances', () => {
      runTestCase('should return `AsyncValueReceived` when both inputs are `AsyncValueReceived`-instances', {
        left: asyncValueReceived('one'),
        right: asyncValueReceived(2),
        fn,
        expected: asyncValueReceived(5)
      })

      runTestCase('should return `AsyncAwaitingValue` with an `AsyncValueReceived` and a `AsyncAwaitingValue`', {
        left: asyncValueReceived('one'),
        right: asyncAwaitingValue(),
        fn,
        expected: asyncAwaitingValue()
      })

      runTestCase('should return `AsyncAwaitingValue` with an `AsyncValueReceived` and a `AsyncAwaitingValue` (swapped)', {
        left: asyncAwaitingValue(),
        right: asyncValueReceived(2),
        fn,
        expected: asyncAwaitingValue()
      })

      runTestCase('should return `AsyncCommand` with an `AsyncValueReceived` and a `AsyncCommand`', {
        left: asyncValueReceived('one'),
        right: asyncCommand([Command.DoSomething]),
        fn,
        expected: asyncCommand([Command.DoSomething])
      })

      runTestCase('should return `AsyncCommand` with an `AsyncValueReceived` and a `AsyncCommand` (swapped)', {
        left: asyncCommand([Command.DoSomething]),
        right: asyncValueReceived(2),
        fn,
        expected: asyncCommand([Command.DoSomething])
      })

      runTestCase('should return `AsyncAwaitingValue when both inputs are `AsyncAwaitingValue`-instances', {
        left: asyncAwaitingValue(),
        right: asyncAwaitingValue(),
        fn,
        expected: asyncAwaitingValue()
      })

      runTestCase('should return `AsyncCommand` with an `AsyncAwaitingValue` and a `AsyncCommand`', {
        left: asyncAwaitingValue(),
        right: asyncCommand([Command.DoSomething]),
        fn,
        expected: asyncCommand([Command.DoSomething])
      })

      runTestCase('should return `AsyncCommand` with an `AsyncAwaitingValue` and a `AsyncCommand` (swapped)', {
        left: asyncCommand([Command.DoSomething]),
        right: asyncAwaitingValue(),
        fn,
        expected: asyncCommand([Command.DoSomething])
      })

      runTestCase('should return `AsyncCommand` when both inputs are `AsyncCommand`-instances', {
        left: asyncCommand([Command.DoSomething]),
        right: asyncCommand([Command.DoSomethingElse]),
        fn,
        expected: asyncCommand([Command.DoSomething, Command.DoSomethingElse])
      })
    })
  })

  describe('sequence', () => {
    type TestCase<Value> = Readonly<{
      inputs: AsyncValue<Command, Value>[]
      expected: AsyncValue<Command, Value[]>
    }>

    function runTestCase<Value>(description: string, testCase: TestCase<Value>) {
      expect({
        description,
        asyncValue: sequence(testCase.inputs)
      }).toEqual({
        description,
        asyncValue: testCase.expected
      })
    }

    it('should sequence multiple `AsyncValue`-instances', () => {
      runTestCase<number>('should be able to sequence an empty array', {
        inputs: [],
        expected: asyncValueReceived([])
      })

      runTestCase('should be able to sequence multiple `AsyncValueReceived`-instances', {
        inputs: [asyncValueReceived(1), asyncValueReceived(3), asyncValueReceived(2)],
        expected: asyncValueReceived([1, 3, 2])
      })

      runTestCase('should be able to sequence multiple `AsyncValue`-instances when some of them are `AsyncCommand`-instances', {
        inputs: [asyncCommand([Command.DoSomething]), asyncValueReceived(3), asyncCommand([Command.DoSomethingElse]), asyncAwaitingValue()],
        expected: asyncCommand([Command.DoSomething, Command.DoSomethingElse])
      })

      runTestCase('should be able to sequence multiple `AsyncValue`-instances when some of them are `AsyncAwaitingValue`-instances', {
        inputs: [asyncAwaitingValue(), asyncValueReceived(3), asyncAwaitingValue()],
        expected: asyncAwaitingValue()
      })
    })
  })

  describe('combine', () => {
    type TestCase<Params extends any[], Result> = Readonly<{
      inputs: { [K in keyof Params]: AsyncValue<Command, Params[K]> }
      fn: (...params: Params) => Result
      expected: AsyncValue<Command, Result>
    }>

    function runTestCase<Params extends any[], Result>(description: string, testCase: TestCase<Params, Result>) {
      expect({
        description,
        asyncValue: combineMany(testCase.inputs, testCase.fn)
      }).toEqual({
        description,
        asyncValue: testCase.expected
      })
    }

    it('should combine many `AsyncValue`-instances', () => {
      runTestCase<[], number>('should be able to combine no `AsyncValue`-instances', {
        inputs: [],
        fn: () => 4,
        expected: asyncValueReceived(4)
      })

      runTestCase('should be able to sequence multiple `AsyncValueReceived`-instances', {
        inputs: [asyncValueReceived(1), asyncValueReceived(3), asyncValueReceived(2)],
        fn: (p1: number, p2: number, p3: number) => p1 + p2 + p3,
        expected: asyncValueReceived(6)
      })

      runTestCase('should be able to sequence multiple `AsyncValue`-instances when some of them are `AsyncCommand`-instances', {
        inputs: [asyncCommand([Command.DoSomething]), asyncValueReceived(3), asyncCommand([Command.DoSomethingElse]), asyncAwaitingValue()],
        fn: (p1: number, p2: number, p3: number, p4: number) => p1 + p2 + p3 + p4,
        expected: asyncCommand([Command.DoSomething, Command.DoSomethingElse])
      })

      runTestCase('should be able to sequence multiple `AsyncValue`-instances when some of them are `AsyncAwaitingValue`-instances', {
        inputs: [asyncAwaitingValue(), asyncValueReceived(3), asyncAwaitingValue()],
        fn: (p1: number, p2: number, p3: number) => p1 + p2 + p3,
        expected: asyncAwaitingValue()
      })
    })
  })

  describe('fromCacheItem', () => {
    it('should be able to construct an `AsyncValue` from a `AwaitingValue`', () => {
      const cacheItem = awaitingValue<number, boolean>(4, 'request-id', true)
      const expected: AsyncValue<Command, string> = asyncAwaitingValue()
      expect(fromCacheItem(cacheItem)).toEqual(expected)
    })

    it('should be able to construct an `AsyncValue` from a `ValueReceived`', () => {
      const cacheItem = valueReceived<number, string, boolean>(4, 'four', true)
      const expected: AsyncValue<Command, string> = asyncValueReceived('four')
      expect(fromCacheItem(cacheItem)).toEqual(expected)
    })
  })

  describe('map', () => {
    const fn = (s: string) => s.length

    it('should apply the function to the value inside the `AsyncValueReceived`', () => {
      const asyncValue: AsyncValue<Command, string> = asyncValueReceived('four')
      const expected: AsyncValue<Command, number> = asyncValueReceived(4)
      expect(map(fn, asyncValue)).toEqual(expected)
    })

    it('should return an `AsyncAwaitingValue` when given an `AsyncAwaitingValue`', () => {
      const asyncValue: AsyncValue<Command, string> = asyncAwaitingValue()
      const expected: AsyncValue<Command, number> = asyncAwaitingValue()
      expect(map(fn, asyncValue)).toEqual(expected)
    })

    it('should return an `AsyncCommand` when given an `AsyncCommand`', () => {
      const asyncValue: AsyncValue<Command, string> = asyncCommand([Command.DoSomething, Command.DoSomethingElse])
      const expected: AsyncValue<Command, number> = asyncCommand([Command.DoSomething, Command.DoSomethingElse])
      expect(map(fn, asyncValue)).toEqual(expected)
    })
  })

  describe('flattenIfNecessary', () => {
    it('should flatten a nested `AsyncValueReceived`', () => {
      const asyncValue: AsyncValue<Command, AsyncValue<Command, string>> = asyncValueReceived(asyncValueReceived('four'))
      const expected: AsyncValue<Command, string> = asyncValueReceived('four')
      expect(flattenIfNecessary(asyncValue)).toEqual(expected)
    })

    it('should flatten an `AsyncCommand` inside a `AsyncValueReceived`', () => {
      const asyncValue: AsyncValue<Command, AsyncValue<Command, string>> = asyncValueReceived(asyncCommand([Command.DoSomething]))
      const expected: AsyncValue<Command, string> = asyncCommand([Command.DoSomething])
      expect(flattenIfNecessary(asyncValue)).toEqual(expected)
    })

    it('should flatten an `AsyncAwaitingValue` inside a `AsyncValueReceived`', () => {
      const asyncValue: AsyncValue<Command, AsyncValue<Command, string>> = asyncValueReceived(asyncAwaitingValue())
      const expected: AsyncValue<Command, string> = asyncAwaitingValue()
      expect(flattenIfNecessary(asyncValue)).toEqual(expected)
    })

    it('should just return a unnested `AsyncValue`', () => {
      const asyncValue: AsyncValue<Command, string> = asyncValueReceived('four')
      const expected: AsyncValue<Command, string> = asyncValueReceived('four')
      expect(flattenIfNecessary(asyncValue)).toEqual(expected)
    })
  })

  describe('getCommands', () => {
    it('should return the commands from an `AsyncCommand`', () => {
      const asyncValue: AsyncValue<Command, string> = asyncCommand([Command.DoSomething, Command.DoSomethingElse])
      const expected: Command[] = [Command.DoSomething, Command.DoSomethingElse]
      expect(getCommands(asyncValue)).toEqual(expected)
    })

    it('should return an empty array when given an `AsyncValueReceived`', () => {
      const asyncValue: AsyncValue<Command, string> = asyncValueReceived('four')
      const expected: Command[] = []
      expect(getCommands(asyncValue)).toEqual(expected)
    })

    it('should return an empty array when given an `AsyncAwaitingValue`', () => {
      const asyncValue: AsyncValue<Command, string> = asyncAwaitingValue()
      const expected: Command[] = []
      expect(getCommands(asyncValue)).toEqual(expected)
    })
  })
})
