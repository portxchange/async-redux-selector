import { AsyncValue, ensureAsyncValue, combineMany, flattenIfNecessary } from './AsyncValue'
import { AsyncSelector } from './AsyncSelector'
import { Selector } from './Selector'
import { memoize, arraysAreEqual } from './utils'
import { ASYNC_VALUE_RECEIVED, ASYNC_AWAITING_VALUE } from './const'

// This equality function compares two `AsyncValue` instances.
// When they are not strictly equal (the same reference), we
// compare the values *inside* the `AsyncValue` instances for
// equality instead. This makes a memoized function operating
// on these `AsyncValue` instances more efficient.
function asyncValuesAreEqual<Command, Value>(left: AsyncValue<Command, Value>, right: AsyncValue<Command, Value>): boolean {
  if (left === right) {
    return true
  }

  if (left.type === ASYNC_VALUE_RECEIVED && right.type === ASYNC_VALUE_RECEIVED) {
    // Only return the new `AsyncValue` if the value is actually different:
    return left.value === right.value
  } else if (left.type === ASYNC_AWAITING_VALUE && right.type === ASYNC_AWAITING_VALUE) {
    // If two `AsyncValue` instances are both `AsyncAwaitingValue`, they
    // are equal:
    return true
  } else {
    return false
  }
}

export function createAsyncSelector<AppState, Command, P1, Result>(
  s1: Selector<AppState, P1 | AsyncValue<Command, P1>>,
  fn: (p1: P1) => Result | AsyncValue<Command, Result>
): AsyncSelector<AppState, Command, Result>

export function createAsyncSelector<AppState, Command, P1, P2, Result>(
  s1: Selector<AppState, P1 | AsyncValue<Command, P1>>,
  s2: Selector<AppState, P2 | AsyncValue<Command, P2>>,
  fn: (p1: P1, p2: P2) => Result | AsyncValue<Command, Result>
): AsyncSelector<AppState, Command, Result>

export function createAsyncSelector<AppState, Command, Result>(...args: any[]): AsyncSelector<AppState, Command, Result> {
  const selectors = args.slice(0, -1) as Array<Selector<AppState, unknown | AsyncValue<Command, unknown>>>
  const fn = args[args.length - 1] as (...args: any[]) => Result | AsyncValue<Command, Result>

  // We memoize the `combineMany` (with `fn`) so that `fn` is only executed
  // when the input values change. Because the input values are `AsyncValue`
  // instances, we must customize our equality check for the parameters as
  // we would like to compare the values *inside* the `AsyncValue` instead
  // of the `AsyncValue` instances themselves.
  const combineManyWithFn = memoize(
    (asyncValues: Array<AsyncValue<Command, any>>): AsyncValue<Command, Result> => {
      return flattenIfNecessary(combineMany(asyncValues, fn))
    },
    {
      paramsAreEqual: ([left], [right]) => arraysAreEqual(left, right, asyncValuesAreEqual),
      resultsAreEqual: asyncValuesAreEqual
    }
  )

  // Memoize to ensure applying the selector on the same `AppState` twice
  // is very efficient:
  return memoize(
    (appState: AppState): AsyncValue<Command, Result> => {
      const asyncValues = selectors.map(selector => selector(appState)).map(value => ensureAsyncValue<Command, unknown>(value))
      return combineManyWithFn(asyncValues)
    }
  )
}
