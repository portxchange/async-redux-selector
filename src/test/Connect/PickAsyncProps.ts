import { AsyncSelectorResults } from '../../AsyncSelectorResult'
import { None } from '../../None'

type ExcludeNone<A> = A extends None ? never : A
export type PickAsyncProps<AppState, Command, Props, Key extends keyof Props> = AsyncSelectorResults<AppState, Command, { [K in Key]: ExcludeNone<Props[K]> }>
