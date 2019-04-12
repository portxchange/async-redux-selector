import { AsyncSelectorResults } from '../AsyncSelectorResult'
import { NonePartial, none } from '../None'
import { keys } from '../utils'
import { ASYNC_VALUE_RECEIVED } from '../const'

export function getAsyncProps<AppState, Command, O>(asyncSelectorResults: AsyncSelectorResults<AppState, Command, O>): NonePartial<O> {
  const result: Partial<NonePartial<O>> = {}
  keys(asyncSelectorResults).forEach(key => {
    const { asyncValue } = asyncSelectorResults[key]
    result[key] = asyncValue.type === ASYNC_VALUE_RECEIVED ? asyncValue.value : none
  })
  return result as NonePartial<O>
}
