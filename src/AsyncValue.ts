import { ASYNC_COMMAND, ASYNC_AWAITING_VALUE, ASYNC_VALUE_RECEIVED, AWAITING_VALUE, VALUE_RECEIVED } from './const'
import { CacheItem } from './CacheItem'

export type AsyncCommand<Command> = Readonly<{
  type: typeof ASYNC_COMMAND
  commands: Command[]
}>

export function asyncCommand<Command>(commands: Command[]): AsyncCommand<Command> {
  return { type: ASYNC_COMMAND, commands }
}

export type AsyncAwaitingValue = Readonly<{
  type: typeof ASYNC_AWAITING_VALUE
}>

export function asyncAwaitingValue(): AsyncAwaitingValue {
  return { type: ASYNC_AWAITING_VALUE }
}

export type AsyncValueReceived<Value> = Readonly<{
  type: typeof ASYNC_VALUE_RECEIVED
  value: Value
}>

export function asyncValueReceived<Value>(value: Value): AsyncValueReceived<Value> {
  return { type: ASYNC_VALUE_RECEIVED, value }
}

export type AsyncValueType = typeof ASYNC_COMMAND | typeof ASYNC_AWAITING_VALUE | typeof ASYNC_VALUE_RECEIVED

export type AsyncValue<Command, Value> = AsyncCommand<Command> | AsyncAwaitingValue | AsyncValueReceived<Value>

// This is the `combine` of `AsyncResult` as a monoidal applicative:
export function combine<Command, Left, Right, Value>(
  left: AsyncValue<Command, Left>,
  right: AsyncValue<Command, Right>,
  fn: (left: Left, right: Right) => Value
): AsyncValue<Command, Value> {
  switch (left.type) {
    case ASYNC_COMMAND: {
      switch (right.type) {
        case ASYNC_COMMAND:
          return { type: ASYNC_COMMAND, commands: [...left.commands, ...right.commands] }
        case ASYNC_AWAITING_VALUE:
        case ASYNC_VALUE_RECEIVED:
          return left
        default:
          const exhaustive: never = right
          throw new Error(exhaustive)
      }
    }
    case ASYNC_AWAITING_VALUE: {
      switch (right.type) {
        case ASYNC_COMMAND:
          return right
        case ASYNC_AWAITING_VALUE:
        case ASYNC_VALUE_RECEIVED:
          return left
        default:
          const exhaustive: never = right
          throw new Error(exhaustive)
      }
    }
    case ASYNC_VALUE_RECEIVED: {
      switch (right.type) {
        case ASYNC_COMMAND:
        case ASYNC_AWAITING_VALUE:
          return right
        case ASYNC_VALUE_RECEIVED:
          return { type: ASYNC_VALUE_RECEIVED, value: fn(left.value, right.value) }
        default:
          const exhaustive: never = right
          throw new Error(exhaustive)
      }
    }
    default:
      const exhaustive: never = left
      throw new Error(exhaustive)
  }
}

// This is the `sequence` of the applicative:
export function sequence<Command, Value>(asyncValues: Array<AsyncValue<Command, Value>>): AsyncValue<Command, Array<Value>> {
  return asyncValues.reduce<AsyncValue<Command, Value[]>>(
    (acc, curr) =>
      combine(acc, curr, (values, value) => {
        // Mutation to make the `reduce` efficient.
        // Should be OK as we're the ones creating
        // the `Array` with `pure([])`.
        values.push(value)
        return values
      }),
    pure([])
  )
}

export function combineMany<Command, Values extends any[], Result>(
  values: { [K in keyof Values]: AsyncValue<Command, Values[K]> },
  fn: (...args: Values) => Result
): AsyncValue<Command, Result> {
  // Cheat a little and `sequence` the tuple as if it were an `Array`:
  const sequenced = sequence<Command, any>(values) as AsyncValue<Command, Values>
  return map(args => fn(...args), sequenced)
}

export function fromCacheItem<Key, Value, Meta>(cacheItem: CacheItem<Key, Value, Meta>): AsyncAwaitingValue | AsyncValueReceived<Value> {
  switch (cacheItem.type) {
    case AWAITING_VALUE:
      return { type: ASYNC_AWAITING_VALUE }
    case VALUE_RECEIVED:
      return { type: ASYNC_VALUE_RECEIVED, value: cacheItem.value }
    default:
      const exhaustive: never = cacheItem
      throw new Error(exhaustive)
  }
}

export function fromValue<Value>(value: Value): AsyncValueReceived<Value> {
  return pure(value)
}

export function isAsyncValue<Command, Value>(u: Value | AsyncValue<Command, Value>): u is AsyncValue<Command, Value> {
  return typeof u === 'object' && 'type' in u && [ASYNC_COMMAND, ASYNC_AWAITING_VALUE, ASYNC_VALUE_RECEIVED].some(type => type === u.type)
}

export function ensureAsyncValue<Command, Value>(u: Value | AsyncValue<Command, Value>): AsyncValue<Command, Value> {
  return isAsyncValue(u) ? u : fromValue(u)
}

export function pure<Value>(value: Value): AsyncValueReceived<Value> {
  return { type: ASYNC_VALUE_RECEIVED, value }
}

export function map<Command, A, B>(fn: (a: A) => B, asyncValue: AsyncValue<Command, A>): AsyncValue<Command, B> {
  switch (asyncValue.type) {
    case ASYNC_VALUE_RECEIVED:
      return { type: ASYNC_VALUE_RECEIVED, value: fn(asyncValue.value) }
    case ASYNC_COMMAND:
    case ASYNC_AWAITING_VALUE:
      return asyncValue
    default:
      const exhaustive: never = asyncValue
      throw new Error(exhaustive)
  }
}

export function flattenIfNecessary<Command, Value>(u: AsyncValue<Command, Value | AsyncValue<Command, Value>>): AsyncValue<Command, Value> {
  switch (u.type) {
    case ASYNC_VALUE_RECEIVED:
      return ensureAsyncValue(u.value)
    case ASYNC_COMMAND:
    case ASYNC_AWAITING_VALUE:
      return u
    default:
      const exhaustive: never = u
      throw new Error(exhaustive)
  }
}

export function getCommands<Command, Value>(asyncValue: AsyncValue<Command, Value>): Command[] {
  switch (asyncValue.type) {
    case ASYNC_VALUE_RECEIVED:
    case ASYNC_AWAITING_VALUE:
      return []
    case ASYNC_COMMAND:
      return asyncValue.commands
    default:
      const exhaustive: never = asyncValue
      throw new Error(exhaustive)
  }
}
