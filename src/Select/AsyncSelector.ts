import { AsyncSelectorResult } from './AsyncSelectorResult'

export type AsyncSelector<AppState, Command, Value> = (appState: AppState) => AsyncSelectorResult<AppState, {}, Command, Value>
