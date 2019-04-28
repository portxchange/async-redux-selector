import { AsyncValue, asyncValueReceived } from '../AsyncValue'
import { Tracked } from './Tracked'

type AsyncSelectorResultType = 'async-selector-result' & { 'async-selector-result': void } | void & { 'async-selector-result': void }
const type = 'async-selector-result' as AsyncSelectorResultType

export type AsyncSelectorResult<AppState, Command, Value> = Readonly<{
  // This `type` (which is impossible to construct) is added to discourage constructing
  // an equivalent anonymous object. This is because we want to determine if a value is
  // of type `AsyncSelectorResult` by using testing the type.
  type: AsyncSelectorResultType
  asyncValue: AsyncValue<Command, Value>
  trackedUserInput: Tracked<AppState>[]
}>

export function asyncSelectorResult<AppState, Command, Value>(asyncValue: AsyncValue<Command, Value>, trackedUserInput: Tracked<AppState>[]) {
  return { type, asyncValue, trackedUserInput }
}

export type AsyncSelectorResults<AppState, Command, O> = Readonly<{ [K in keyof O]: AsyncSelectorResult<AppState, Command, O[K]> }>

function isAsyncSelectorResult<AppState, Command, Value>(value: Value | AsyncSelectorResult<AppState, Command, Value>): value is AsyncSelectorResult<AppState, Command, Value> {
  return typeof value === 'object' && 'type' in value && value.type === type
}

export function ensureAsyncSelectorResult<AppState, Command, Value>(value: Value | AsyncSelectorResult<AppState, Command, Value>): AsyncSelectorResult<AppState, Command, Value> {
  if (isAsyncSelectorResult(value)) {
    return value
  } else {
    return asyncSelectorResult<AppState, Command, Value>(asyncValueReceived(value), [])
  }
}
