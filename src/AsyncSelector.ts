import { Selector } from 'react-redux'
import { AsyncSelectorResult } from './AsyncSelectorResult'

export type AsyncSelector<AppState, Command, Value> = Selector<AppState, AsyncSelectorResult<AppState, Command, Value>>
