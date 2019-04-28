import { AsyncSelectorResults } from '../Select/AsyncSelectorResult'
import { ExcludeNone } from './ExcludeNone'

export type PickAsyncProps<AppState, Command, Props, Key extends keyof Props> = AsyncSelectorResults<AppState, Command, { [K in Key]: ExcludeNone<Props[K]> }>
