import { NonePartial } from '../None'
import { AsyncSelectorResults } from '../Select/AsyncSelectorResult'
import { FetchCommand, createFetchCommandExecutor } from '../FetchCommand'
import { connectAsync } from './connectAsync'
import * as Redux from 'redux'

export function connectAsyncSimple<AppState, OwnProps extends object, AsyncStateProps, SyncStateProps, DispatchProps>(
  Component: React.ComponentType<NonePartial<AsyncStateProps> & SyncStateProps & DispatchProps>,
  mapStateToAsyncStateProps: (appState: AppState, ownProps: OwnProps) => AsyncSelectorResults<AppState, OwnProps, FetchCommand, AsyncStateProps>,
  mapStateToSyncStateProps: (appState: AppState, ownProps: OwnProps) => SyncStateProps,
  mapDispatchToProps: (dispatch: Redux.Dispatch<Redux.Action>) => DispatchProps
) {
  return connectAsync(Component, mapStateToAsyncStateProps, mapStateToSyncStateProps, mapDispatchToProps, createFetchCommandExecutor)
}
