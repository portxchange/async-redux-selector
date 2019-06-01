import { AsyncSelector } from './AsyncSelector'
import { memoize } from '../utils'
import { asyncValueReceived } from '../AsyncValue'
import { Equality } from '../Equality'
import { createTracked } from './Tracked'
import { asyncSelectorResult } from './AsyncSelectorResult'
import { SelectorWithProps } from './Selector'

export function createTrackedSelector<AppState, Props, Value>(
  selector: SelectorWithProps<AppState, Props, Value>,
  valuesAreEqual: Equality<Value>
): AsyncSelector<AppState, Props, never, Value> {
  return memoize((appState: AppState, props: Props) => {
    const value = selector(appState, props)
    return asyncSelectorResult<AppState, Props, never, Value>(asyncValueReceived(value), [createTracked(selector, appState, props, valuesAreEqual)])
  }) as AsyncSelector<AppState, Props, never, Value>
}
