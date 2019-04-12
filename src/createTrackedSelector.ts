import { Selector } from './Selector'
import { AsyncSelector } from './AsyncSelector'
import { memoize } from './utils'
import { asyncValueReceived } from './AsyncValue'
import { Equality } from './Equality'
import { createTracked } from './Tracked'
import { asyncSelectorResult } from './AsyncSelectorResult'

export function createTrackedSelector<AppState, Value>(selector: Selector<AppState, Value>, valuesAreEqual: Equality<Value>): AsyncSelector<AppState, never, Value> {
  return memoize((appState: AppState) => {
    const value = selector(appState)
    return asyncSelectorResult<AppState, never, Value>(asyncValueReceived(value), [createTracked(selector, appState, valuesAreEqual)])
  })
}
