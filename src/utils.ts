import { None, none } from './None'
import { Equality, areSameReference } from './Equality'
import { Maybe } from './Maybe'

export function keys<O>(o: O): Array<keyof O> {
  return Object.keys(o) as Array<keyof O>
}

export function arraysAreEqual<Elem>(left: Elem[], right: Elem[], elemEquality: Equality<Elem> = areSameReference): boolean {
  if (left.length !== right.length) {
    return false
  }
  return left.every((leftElem, index) => {
    const rightElem = right[index]
    return elemEquality(leftElem, rightElem)
  })
}

export type MemoizeEquality<Params extends any[], Result> = Partial<
  Readonly<{
    paramsAreEqual: Equality<Params>
    resultsAreEqual: Equality<Result>
  }>
>

export function memoize<Params extends any[], Result>(fn: (...params: Params) => Result, memoizeEquality: MemoizeEquality<Params, Result> = {}): (...params: Params) => Result {
  const paramsAreEqual: Equality<Params> = memoizeEquality.paramsAreEqual || arraysAreEqual
  const resultsAreEqual: Equality<Result> = memoizeEquality.resultsAreEqual || areSameReference
  type LastCall = Readonly<{
    params: Params
    result: Result
  }>
  let lastCall: LastCall | None = none
  return (...params: Params): Result => {
    if (lastCall !== none && paramsAreEqual(lastCall.params, params)) {
      return lastCall.result
    } else {
      const result = fn(...params)
      if (lastCall !== none && resultsAreEqual(lastCall.result, result)) {
        // If the results are the same, return the *exact* same result
        // to make sure that all other memoized functions work as efficiently
        // as possible:
        lastCall = { params, result: lastCall.result }
        return lastCall.result
      } else {
        lastCall = { params, result }
        return result
      }
    }
  }
}

export function identity<A>(a: A): A {
  return a
}

export function singleton<A>(a: A): A[] {
  return [a]
}

export function head<A>(arr: A[]): Maybe<A> {
  if (arr.length > 0) {
    return { value: arr[0] }
  } else {
    return none
  }
}
