export type SelectorWithoutProps<AppState, Result> = (appState: AppState) => Result
export type SelectorWithProps<AppState, Props, Result> = (appState: AppState, props: Props) => Result
