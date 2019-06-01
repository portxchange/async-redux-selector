import { AsyncSelectorResults } from '../Select/AsyncSelectorResult'

export type OuterComponentState<AppState, OwnProps, Command, AsyncStateProps, SyncStateProps> = Readonly<{
  asyncStateProps: AsyncSelectorResults<AppState, OwnProps, Command, AsyncStateProps>
  syncStateProps: SyncStateProps
}>
