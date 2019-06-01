export type SelectorWithProps<AppState, Props, Result> = (appState: AppState, props: Props) => Result
