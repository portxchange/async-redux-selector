import { AsyncSelectorResult } from './AsyncSelectorResult'

export type AsyncSelector<AppState, Props, Command, Value> = keyof Props extends never
  ? (appState: AppState) => AsyncSelectorResult<AppState, {}, Command, Value>
  : (appState: AppState, props: Props) => AsyncSelectorResult<AppState, Props, Command, Value>
