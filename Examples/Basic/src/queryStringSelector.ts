import { AppState, QueryString } from './AppState'

export function queryStringSelector(appState: AppState): QueryString {
  return appState.queryString
}
