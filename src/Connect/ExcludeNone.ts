import { None } from '../None'
export type ExcludeNone<A> = A extends None ? never : A
