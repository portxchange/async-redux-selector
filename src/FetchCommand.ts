import * as Redux from 'redux'
import { awaitValue, receiveValue } from './Store/Action'
import { CommandExecutor } from './CommandExecutor'

export const FETCH_COMMAND: 'FETCH_COMMAND' = 'FETCH_COMMAND'

export type FetchCommand = Readonly<{
  type: typeof FETCH_COMMAND
  run(dispatch: Redux.Dispatch<Redux.Action>): void
}>

let nextRequestId = 0
export function fetchCommand<Key, Value, Meta>(cacheId: string, key: Key, promise: () => Promise<Value>, meta: Meta): FetchCommand {
  return {
    type: FETCH_COMMAND,
    run(dispatch: Redux.Dispatch<Redux.Action>): void {
      const requestId = 'fetchCommand-' + String(nextRequestId++)
      dispatch(awaitValue<Key, Meta>(cacheId, key, requestId, meta))
      promise().then(value => {
        dispatch(receiveValue(cacheId, requestId, value))
      })
    }
  }
}

export const createFetchCommandExecutor = (dispatch: Redux.Dispatch<Redux.Action>): CommandExecutor<FetchCommand> => (command: FetchCommand) => {
  command.run(dispatch)
}
