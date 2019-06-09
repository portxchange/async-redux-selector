import { AsyncSelectorResults } from '../Select/AsyncSelectorResult'
import { FetchCommand } from '../FetchCommand'
import { ExcludeNone } from './ExcludeNone'

export type PickAsyncPropsSimple<AppState, Props, Key extends keyof Props> = AsyncSelectorResults<AppState, {}, FetchCommand, { [K in Key]: ExcludeNone<Props[K]> }>
export type PickAsyncPropsWithOwnPropsSimple<AppState, OwnProps, Props, Key extends keyof Props> = AsyncSelectorResults<
  AppState,
  OwnProps,
  FetchCommand,
  { [K in Key]: ExcludeNone<Props[K]> }
>
