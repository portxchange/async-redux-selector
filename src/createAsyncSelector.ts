import { AsyncValue, ensureAsyncValue, combineMany, flattenIfNecessary } from './AsyncValue'
import { AsyncSelector } from './AsyncSelector'
import { Selector } from './Selector'
import { memoize, arraysAreEqual } from './utils'
import { AsyncSelectorResult } from './AsyncSelectorResult'
import { combineTracked } from './Tracked'

export function createAsyncSelector<AppState, Command, P1, Result>(
  s1: Selector<AppState, P1 | AsyncSelectorResult<AppState, Command, P1>>,
  fn: (p1: P1) => Result | AsyncValue<Command, Result>
): AsyncSelector<AppState, Command, Result>

export function createAsyncSelector<AppState, Command, P1, P2, Result>(
  s1: Selector<AppState, P1 | AsyncSelectorResult<AppState, Command, P1>>,
  s2: Selector<AppState, P2 | AsyncSelectorResult<AppState, Command, P2>>,
  fn: (p1: P1, p2: P2) => Result | AsyncValue<Command, Result>
): AsyncSelector<AppState, Command, Result>

export function createAsyncSelector<AppState, Command, P1, P2, P3, Result>(
  s1: Selector<AppState, P1 | AsyncSelectorResult<AppState, Command, P1>>,
  s2: Selector<AppState, P2 | AsyncSelectorResult<AppState, Command, P2>>,
  s3: Selector<AppState, P3 | AsyncSelectorResult<AppState, Command, P3>>,
  fn: (p1: P1, p2: P2, p3: P3) => Result | AsyncValue<Command, Result>
): AsyncSelector<AppState, Command, Result>

export function createAsyncSelector<AppState, Command, Result>(...args: any[]): AsyncSelector<AppState, Command, Result> {
  const selectors = args.slice(0, -1) as Array<Selector<AppState, unknown | AsyncSelectorResult<AppState, Command, unknown>>>
  const fn = args[args.length - 1] as (...args: any[]) => Result | AsyncValue<Command, Result>
  const memoizedFn = memoize(fn)

  const combineManyWithFn = memoize(
    (asyncSelectorResults: Array<AsyncSelectorResult<AppState, Command, any>>): AsyncSelectorResult<AppState, Command, Result> => {
      const asyncValues = asyncSelectorResults.map(asyncSelectorResult => asyncSelectorResult.asyncValue)
      const asyncValue = flattenIfNecessary(combineMany<Command, any[], Result | AsyncValue<Command, Result>>(asyncValues, memoizedFn))

      const trackedUserInputs = asyncSelectorResults.map(asyncSelectorResult => asyncSelectorResult.trackedUserInput)
      const trackedUserInput = trackedUserInputs.reduce(combineTracked, [])

      const trackedCacheses = asyncSelectorResults.map(asyncSelectorResult => asyncSelectorResult.trackedCaches)
      const trackedCaches = trackedCacheses.reduce(combineTracked, [])

      return { asyncValue, trackedUserInput, trackedCaches }
    }
  )

  // Memoize to ensure applying the selector on the same `AppState` twice
  // is very efficient:
  return memoize(
    (appState: AppState): AsyncSelectorResult<AppState, Command, Result> => {
      const asyncValues = selectors.map(selector => selector(appState))
      return combineManyWithFn(asyncValues)
    }
  )
}
