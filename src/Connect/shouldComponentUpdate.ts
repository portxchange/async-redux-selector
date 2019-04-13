import { keys } from '../utils'

export function shouldComponentUpdate<O extends object>(prevState: O, nextState: O): boolean {
  let prevStateKeysIterator = keys(prevState)[Symbol.iterator]()
  let prevStateKeysIteratorResult = prevStateKeysIterator.next()
  while (!prevStateKeysIteratorResult.done) {
    const prevStateKey = prevStateKeysIteratorResult.value
    if (prevState[prevStateKey] !== nextState[prevStateKey]) {
      return true
    }
    prevStateKeysIteratorResult = prevStateKeysIterator.next()
  }

  return false
}
