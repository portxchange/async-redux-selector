import { AsyncSelectorResult } from './AsyncSelectorResult'

export type AsyncSelectorWithProps<AppState, Props, Command, Value> = (appState: AppState, props: Props) => AsyncSelectorResult<AppState, Props, Command, Value>
