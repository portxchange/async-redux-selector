import { None, none } from './None'

export function keys<O>(o: O): Array<keyof O> {
  return Object.keys(o) as Array<keyof O>
}

export function arraysAreEqual<Elem>(left: Elem[], right: Elem[]): boolean {
  if (left.length !== right.length) {
    return false
  }
  return left.every((leftElem, index) => {
    const rightElem = right[index]
    return leftElem === rightElem
  })
}

export function memoize<Params extends any[], Result>(fn: (...params: Params) => Result): (...params: Params) => Result {
  type LastCall = Readonly<{
    params: Params
    result: Result
  }>
  let lastCall: LastCall | None = none
  return (...params: Params): Result => {
    if (lastCall !== none && arraysAreEqual(lastCall.params, params)) {
      return lastCall.result
    } else {
      const result = fn(...params)
      lastCall = { params, result }
      return result
    }
  }
}
