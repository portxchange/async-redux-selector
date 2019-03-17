export type Ord<A> = (left: A, right: A) => number

export function fromRecord<A extends string | number | symbol>(record: Record<A, number>): Ord<A> {
  return (left, right) => record[left] - record[right]
}

export const min = <A>(ord: Ord<A>) => (left: A, right: A): A => {
  const n = ord(left, right)
  if (n <= 0) {
    return left
  } else {
    return right
  }
}
