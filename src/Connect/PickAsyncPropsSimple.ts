import { AsyncSelectorResults } from '../Select/AsyncSelectorResult'
import { FetchCommand } from '../FetchCommand'
import { ExcludeNone } from './ExcludeNone'

export type PickAsyncPropsSimple<AppState, OwnProps, Props, Key extends keyof Props> = AsyncSelectorResults<AppState, OwnProps, FetchCommand, { [K in Key]: ExcludeNone<Props[K]> }>
