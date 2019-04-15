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
