import { keys } from './utils'

export type Equality<A> = (left: A, right: A) => boolean

export function areSameReference<A>(left: A, right: A): boolean {
  return left === right
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

export function objectsAreEqual<O extends object>(left: O, right: O, elemEquality: Equality<O[keyof O]> = areSameReference): boolean {
  let leftKeysIterator = keys(left)[Symbol.iterator]()
  let leftKeysIteratorResult = leftKeysIterator.next()
  while (!leftKeysIteratorResult.done) {
    const leftKey = leftKeysIteratorResult.value
    if (!elemEquality(left[leftKey], right[leftKey])) {
      return false
    }
    leftKeysIteratorResult = leftKeysIterator.next()
  }

  return true
}
