import { AsyncValue, combineMany, flattenIfNecessary } from '../AsyncValue'
import { AsyncSelector, AsyncSelectorWithProps } from './AsyncSelector'
import { Selector, SelectorWithProps } from './Selector'
import { memoize } from '../utils'
import { AsyncSelectorResult, asyncSelectorResult, ensureAsyncSelectorResult } from './AsyncSelectorResult'
import { combineTracked } from './Tracked'
import { ASYNC_VALUE_RECEIVED, ASYNC_AWAITING_VALUE } from '../const'
import { arraysAreEqual } from '../Equality'

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
    // Even if two commands are exactly equal, it doesn't really matter if
    // we tell here that they aren't. Commands are very volatile, and are
    // supposed to disappear quickly after the are created, so performance
    // won't suffer much by this approximation.
    return false
  }
}

function asyncSelectorResultsAreEqual<AppState, Command, Value>(
  left: AsyncSelectorResult<AppState, Command, Value>,
  right: AsyncSelectorResult<AppState, Command, Value>
): boolean {
  if (left === right) {
    return true
  }

  // We ignore the `trackedUserInput` as there is no way that there's a difference
  // there if two `AsyncSelectorResult`-instances are created by the same selectors:
  return asyncValuesAreEqual(left.asyncValue, right.asyncValue)
}

export function createAsyncSelector<AppState, Command, P1, Result>(
  s1: Selector<AppState, P1 | AsyncSelectorResult<AppState, Command, P1>>,
  fn: (p1: P1) => Result | AsyncValue<Command, Result>
): AsyncSelector<AppState, Command, Result>

export function createAsyncSelector<AppState, Props1, Command, P1, Result>(
  s1: SelectorWithProps<AppState, Props1, P1 | AsyncSelectorResult<AppState, Command, P1>>,
  fn: (p1: P1) => Result | AsyncValue<Command, Result>
): AsyncSelectorWithProps<AppState, Props1, Command, Result>

export function createAsyncSelector<AppState, Command, P1, P2, Result>(
  s1: Selector<AppState, P1 | AsyncSelectorResult<AppState, Command, P1>>,
  s2: Selector<AppState, P2 | AsyncSelectorResult<AppState, Command, P2>>,
  fn: (p1: P1, p2: P2) => Result | AsyncValue<Command, Result>
): AsyncSelector<AppState, Command, Result>

export function createAsyncSelector<AppState, Props1, Props2, Command, P1, P2, Result>(
  s1: SelectorWithProps<AppState, Props1, P1 | AsyncSelectorResult<AppState, Command, P1>>,
  s2: SelectorWithProps<AppState, Props2, P2 | AsyncSelectorResult<AppState, Command, P2>>,
  fn: (p1: P1, p2: P2) => Result | AsyncValue<Command, Result>
): AsyncSelectorWithProps<AppState, Props1 & Props2, Command, Result>

export function createAsyncSelector<AppState, Command, P1, P2, P3, Result>(
  s1: Selector<AppState, P1 | AsyncSelectorResult<AppState, Command, P1>>,
  s2: Selector<AppState, P2 | AsyncSelectorResult<AppState, Command, P2>>,
  s3: Selector<AppState, P3 | AsyncSelectorResult<AppState, Command, P3>>,
  fn: (p1: P1, p2: P2, p3: P3) => Result | AsyncValue<Command, Result>
): AsyncSelector<AppState, Command, Result>

export function createAsyncSelector<AppState, Props1, Props2, Props3, Command, P1, P2, P3, Result>(
  s1: SelectorWithProps<AppState, Props1, P1 | AsyncSelectorResult<AppState, Command, P1>>,
  s2: SelectorWithProps<AppState, Props2, P2 | AsyncSelectorResult<AppState, Command, P2>>,
  s3: SelectorWithProps<AppState, Props3, P3 | AsyncSelectorResult<AppState, Command, P3>>,
  fn: (p1: P1, p2: P2, p3: P3) => Result | AsyncValue<Command, Result>
): AsyncSelectorWithProps<AppState, Props1 & Props2 & Props3, Command, Result>

export function createAsyncSelector<AppState, Props, Command, Result>(...args: any[]): AsyncSelectorWithProps<AppState, Props, Command, Result> {
  // To maintain a modicum of type safety:
  function typeSafe<Arg>(
    selectors: Array<SelectorWithProps<AppState, Props, Arg | AsyncSelectorResult<AppState, Command, Arg>>>,
    fn: (...args: Arg[]) => Result | AsyncValue<Command, Result>
  ) {
    const memoizedFn = memoize(fn)

    const combineManyWithFn = memoize(
      (asyncSelectorResults: Array<AsyncSelectorResult<AppState, Command, Arg>>): AsyncSelectorResult<AppState, Command, Result> => {
        const asyncValues = asyncSelectorResults.map(asyncSelectorResult => asyncSelectorResult.asyncValue)
        const asyncValue = flattenIfNecessary(combineMany<Command, Arg[], Result | AsyncValue<Command, Result>>(asyncValues, memoizedFn))

        const trackedUserInputs = asyncSelectorResults.map(asyncSelectorResult => asyncSelectorResult.trackedUserInput)
        const trackedUserInput = trackedUserInputs.reduce(combineTracked, [])

        return asyncSelectorResult(asyncValue, trackedUserInput)
      },
      {
        paramsAreEqual: ([left]: [Array<AsyncSelectorResult<AppState, Command, Arg>>], [right]: [Array<AsyncSelectorResult<AppState, Command, Arg>>]) =>
          arraysAreEqual(left, right, asyncSelectorResultsAreEqual),
        resultsAreEqual: asyncSelectorResultsAreEqual
      }
    )

    // Memoize to ensure applying the selector on the same `AppState` twice
    // is very efficient:
    return memoize(
      (appState: AppState, props: Props): AsyncSelectorResult<AppState, Command, Result> => {
        const asyncSelectorResults = selectors.map(selector => selector(appState, props)).map(ensureAsyncSelectorResult)
        return combineManyWithFn(asyncSelectorResults)
      }
    )
  }

  return typeSafe<any>(args.slice(0, -1), args[args.length - 1])
}
