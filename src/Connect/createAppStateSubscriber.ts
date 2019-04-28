import { getNextOuterComponentStateAsyncStateProps } from './getNextOuterComponentStateAsyncStateProps'
import { AsyncSelectorResults } from '../Select/AsyncSelectorResult'
import { CommandExecutor } from '../CommandExecutor'
import { OuterComponentState } from './OuterComponentState'

export function createAppStateSubscriber<AppState, Command, AsyncStateProps, SyncStateProps, OwnProps>(
  mapStateToAsyncStateProps: (appState: AppState, ownProps: OwnProps) => AsyncSelectorResults<AppState, Command, AsyncStateProps>,
  mapStateToSyncStateProps: (appState: AppState, ownProps: OwnProps) => SyncStateProps,
  commandExecutor: CommandExecutor<Command>,
  getAppState: () => AppState,
  getOwnProps: () => OwnProps,
  getOuterComponentState: () => OuterComponentState<AppState, Command, AsyncStateProps, SyncStateProps>,
  setOuterComponentState: (state: OuterComponentState<AppState, Command, AsyncStateProps, SyncStateProps>) => void
) {
  let isCurrentlyOnCallStack = false
  return () => {
    // When an action is dispatched from this subscriber (through
    // the `CommandExecutor<..>`), this subscriber will be called
    // again. We don't want those nested calls to this subscriber
    // so we ignore all calls except the outer one.
    if (isCurrentlyOnCallStack) {
      return
    }

    isCurrentlyOnCallStack = true
    const currentOuterComponentState = getOuterComponentState()
    const ownProps = getOwnProps()
    const nextOuterComponentStateAsyncStateProps = getNextOuterComponentStateAsyncStateProps<AppState, Command, AsyncStateProps, OwnProps>(
      commandExecutor,
      getAppState,
      ownProps,
      mapStateToAsyncStateProps,
      currentOuterComponentState.asyncStateProps
    )
    const nextOuterComponentStateSyncStateProps = mapStateToSyncStateProps(getAppState(), ownProps)
    setOuterComponentState({
      asyncStateProps: nextOuterComponentStateAsyncStateProps,
      syncStateProps: nextOuterComponentStateSyncStateProps
    })
    isCurrentlyOnCallStack = false
  }
}
