import { AsyncResult } from './AsyncResult'
import { None } from './None'
import { toSyncStateProps } from './toSyncStateProps'

export const createGetStatePropsAndCommands = <AppState, AsyncStateProps, SyncStateProps, Command>(
  mapStateToAsyncStateProps: (appState: AppState) => { [K in keyof AsyncStateProps]: AsyncResult<Command, unknown, AsyncStateProps[K], unknown> },
  mapStateToSyncStateProps: (appState: AppState) => SyncStateProps
) => (appState: AppState): [{ [K in keyof AsyncStateProps]: AsyncStateProps[K] | None } & SyncStateProps, Command[]] => {
  const [asyncPart, commands] = toSyncStateProps(mapStateToAsyncStateProps(appState))
  const syncPart = mapStateToSyncStateProps(appState)
  return [{ ...asyncPart, ...syncPart }, commands]
}
