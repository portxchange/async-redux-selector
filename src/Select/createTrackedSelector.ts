import { AsyncSelector } from './AsyncSelector'
import { memoize } from '../utils'
import { asyncValueReceived } from '../AsyncValue'
import { Equality } from '../Equality'
import { createTracked } from './Tracked'
import { asyncSelectorResult } from './AsyncSelectorResult'
import { Selector } from './Selector'
import { SelectorWithProps } from './SelectorWithProps'
import { AsyncSelectorWithProps } from './AsyncSelectorWithProps'

export function createTrackedSelector<AppState, Value>(selector: Selector<AppState, Value>, valuesAreEqual: Equality<Value>): AsyncSelector<AppState, never, Value>

export function createTrackedSelector<AppState, Props, Value>(
  selector: SelectorWithProps<AppState, Props, Value>,
  valuesAreEqual: Equality<Value>
): AsyncSelectorWithProps<AppState, Props, never, Value>

export function createTrackedSelector<AppState, Props, Value>(
  selector: SelectorWithProps<AppState, Props, Value>,
  valuesAreEqual: Equality<Value>
): AsyncSelectorWithProps<AppState, Props, never, Value> {
  return memoize((appState: AppState, props: Props) => {
    const value = selector(appState, props)
    return asyncSelectorResult<AppState, Props, never, Value>(asyncValueReceived(value), [createTracked(selector, appState, props, valuesAreEqual)])
  })
}
