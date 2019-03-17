import { AsyncValue } from './AsyncValue'
import { None, none } from './None'
import { keys } from './utils'
import { ASYNC_COMMAND, ASYNC_AWAITING_VALUE, ASYNC_VALUE_RECEIVED } from './const'

export function toSyncStateProps<Command, AsyncStateProps>(
  asyncValues: { [K in keyof AsyncStateProps]: AsyncValue<Command, AsyncStateProps[K]> }
): [{ [K in keyof AsyncStateProps]: AsyncStateProps[K] | None }, Command[]] {
  const commands: Command[] = []
  const acc: Partial<{ [K in keyof AsyncStateProps]: AsyncStateProps[K] | None }> = {}
  keys(asyncValues).forEach(key => {
    const asyncValue: AsyncValue<Command, AsyncStateProps[keyof AsyncStateProps]> = asyncValues[key]
    if (asyncValue.type === ASYNC_COMMAND) {
      acc[key] = none
      commands.push(...asyncValue.commands)
    } else if (asyncValue.type === ASYNC_AWAITING_VALUE) {
      acc[key] = none
    } else if (asyncValue.type === ASYNC_VALUE_RECEIVED) {
      acc[key] = asyncValue.value
    } else {
      const exhaustive: never = asyncValue
      throw new Error(exhaustive)
    }
  })
  return [acc as { [K in keyof AsyncStateProps]: AsyncStateProps[K] | None }, commands]
}
