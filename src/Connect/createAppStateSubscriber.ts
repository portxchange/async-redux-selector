import { getNextOuterComponentStateAsyncStateProps } from './getNextOuterComponentStateAsyncStateProps'
import { AsyncSelectorResults } from '../AsyncSelectorResult'
import { CommandExecutor } from '../CommandExecutor'
import { OuterComponentState } from './OuterComponentState'

export function createAppStateSubscriber<AppState, Command, AsyncStateProps, SyncStateProps>(
  mapStateToAsyncStateProps: (appState: AppState) => AsyncSelectorResults<AppState, Command, AsyncStateProps>,
  mapStateToSyncStateProps: (appState: AppState) => SyncStateProps,
  commandExecutor: CommandExecutor<Command>,
  getAppState: () => AppState,
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
    const nextAsyncStateProps = getNextOuterComponentStateAsyncStateProps<AppState, Command, AsyncStateProps>(
      commandExecutor,
      getAppState,
      mapStateToAsyncStateProps,
      currentOuterComponentState.asyncStateProps
    )
    const nextSyncStateProps = mapStateToSyncStateProps(getAppState())
    setOuterComponentState({
      asyncStateProps: nextAsyncStateProps,
      syncStateProps: nextSyncStateProps
    })
    isCurrentlyOnCallStack = false
  }
}
