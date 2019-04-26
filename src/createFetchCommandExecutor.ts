import * as Redux from 'redux'
import { FetchCommand } from './FetchCommand'
import { awaitValue, receiveValue } from './Action'
import { None, none } from './None'
import { CommandExecutor } from './CommandExecutor'

let nextRequestId = 0
export const createFetchCommandExecutor = <Key, Value>(dispatch: Redux.Dispatch<Redux.Action>): CommandExecutor<FetchCommand<Key, Value>> => (
  command: FetchCommand<Key, Value>
) => {
  const requestId = 'createFetchCommandExecutor-' + String(nextRequestId++)
  dispatch(awaitValue<Key, None>(command.cacheId, command.key, requestId, none))
  command.promise().then(value => {
    dispatch(receiveValue(command.cacheId, requestId, value))
  })
}
