import { AsyncSelectorResults } from '../Select/AsyncSelectorResult'

export type OuterComponentState<AppState, Command, AsyncStateProps, SyncStateProps> = Readonly<{
  asyncStateProps: AsyncSelectorResults<AppState, Command, AsyncStateProps>
  syncStateProps: SyncStateProps
}>
