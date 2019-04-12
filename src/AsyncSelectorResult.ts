import { AsyncValue } from './AsyncValue'
import { Tracked } from './Tracked'

export type AsyncSelectorResult<AppState, Command, Value> = Readonly<{
  asyncValue: AsyncValue<Command, Value>
  trackedUserInput: Tracked<AppState>[]
}>

export function asyncSelectorResult<AppState, Command, Value>(asyncValue: AsyncValue<Command, Value>, trackedUserInput: Tracked<AppState>[]) {
  return { asyncValue, trackedUserInput }
}

export type AsyncSelectorResults<AppState, Command, O> = Readonly<{ [K in keyof O]: AsyncSelectorResult<AppState, Command, O[K]> }>
