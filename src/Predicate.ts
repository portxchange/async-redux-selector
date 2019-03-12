export type Predicate<A> = (a: A) => boolean

export function not<A>(predicate: Predicate<A>): Predicate<A> {
  return (a: A) => !predicate(a)
}
