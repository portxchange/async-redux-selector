import { NonePartial } from '../None'
import { AsyncSelectorResults } from '../Select/AsyncSelectorResult'
import { FetchCommand, createFetchCommandExecutor } from '../FetchCommand'
import { connectAsync } from './connectAsync'
import * as Redux from 'redux'

export function connectAsyncSimple<AppState, AsyncStateProps, SyncStateProps, DispatchProps>(
  Component: React.ComponentType<NonePartial<AsyncStateProps> & SyncStateProps & DispatchProps>,
  mapStateToAsyncStateProps: (appState: AppState) => AsyncSelectorResults<AppState, FetchCommand, AsyncStateProps>,
  mapStateToSyncStateProps: (appState: AppState) => SyncStateProps,
  mapDispatchToProps: (dispatch: Redux.Dispatch<Redux.Action>) => DispatchProps
) {
  return connectAsync(Component, mapStateToAsyncStateProps, mapStateToSyncStateProps, mapDispatchToProps, createFetchCommandExecutor)
}
