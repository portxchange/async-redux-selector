import { Selector } from 'react-redux'
import { AsyncSelectorResult } from './AsyncSelectorResult'
import { SelectorWithProps } from './Selector'

export type AsyncSelector<AppState, Command, Value> = Selector<AppState, AsyncSelectorResult<AppState, Command, Value>>
export type AsyncSelectorWithProps<AppState, Props, Command, Value> = SelectorWithProps<AppState, Props, AsyncSelectorResult<AppState, Command, Value>>
