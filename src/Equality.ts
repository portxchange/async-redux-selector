export type Equality<A> = (left: A, right: A) => boolean

export function areSameReference<A>(left: A, right: A): boolean {
  return left === right
}
