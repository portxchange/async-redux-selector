import { AsyncValue, combineMany, flattenIfNecessary } from './AsyncValue'
import { AsyncSelector } from './AsyncSelector'
import { Selector } from './Selector'
import { memoize } from './utils'
import { AsyncSelectorResult, asyncSelectorResult, ensureAsyncSelectorResult } from './AsyncSelectorResult'
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
  // To maintain a modicum of type safety:
  function typeSafe<Arg>(selectors: Array<Selector<AppState, Arg | AsyncSelectorResult<AppState, Command, Arg>>>, fn: (...args: Arg[]) => Result | AsyncValue<Command, Result>) {
    const memoizedFn = memoize(fn)

    const combineManyWithFn = memoize(
      (asyncSelectorResults: Array<AsyncSelectorResult<AppState, Command, Arg>>): AsyncSelectorResult<AppState, Command, Result> => {
        const asyncValues = asyncSelectorResults.map(asyncSelectorResult => asyncSelectorResult.asyncValue)
        const asyncValue = flattenIfNecessary(combineMany<Command, Arg[], Result | AsyncValue<Command, Result>>(asyncValues, memoizedFn))

        const trackedUserInputs = asyncSelectorResults.map(asyncSelectorResult => asyncSelectorResult.trackedUserInput)
        const trackedUserInput = trackedUserInputs.reduce(combineTracked, [])

        return asyncSelectorResult(asyncValue, trackedUserInput)
      }
    )

    // Memoize to ensure applying the selector on the same `AppState` twice
    // is very efficient:
    return memoize(
      (appState: AppState): AsyncSelectorResult<AppState, Command, Result> => {
        const asyncSelectorResults = selectors.map(selector => selector(appState)).map(ensureAsyncSelectorResult)
        return combineManyWithFn(asyncSelectorResults)
      }
    )
  }

  return typeSafe<any>(args.slice(0, -1), args[args.length - 1])
}
