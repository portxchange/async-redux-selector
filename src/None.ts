export type None = false
export const none = false

export type NonePartial<O> = { [K in keyof O]: O[K] | None }
