import { Equality } from '../Equality'
import { SelectorWithProps } from './SelectorWithProps'

export type Tracked<AppState, Props> = Readonly<{
  source: SelectorWithProps<AppState, Props, unknown>
  hasChanged: (appState: AppState, props: Props) => boolean
}>

export function createTracked<AppState, Props, A>(
  source: SelectorWithProps<AppState, Props, A>,
  currentAppState: AppState,
  currentProps: Props,
  equality: Equality<A>
): Tracked<AppState, Props> {
  const currentValue = source(currentAppState, currentProps)
  const hasChanged = (newAppState: AppState, props: Props): boolean => {
    const newValue = source(newAppState, props)
    return !equality(currentValue, newValue)
  }
  return {
    source,
    hasChanged
  }
}

function addTracked<AppState, Props>(toAdd: Tracked<AppState, Props>, toAddTo: Array<Tracked<AppState, Props>>): Array<Tracked<AppState, Props>> {
  const hasBeenAdded = toAddTo.some(tracked => tracked.source === toAdd.source)
  return hasBeenAdded ? toAddTo : [toAdd, ...toAddTo]
}

export function combineTracked<AppState, Props>(left: Array<Tracked<AppState, Props>>, right: Array<Tracked<AppState, Props>>): Array<Tracked<AppState, Props>> {
  return right.reduce((acc, curr) => addTracked(curr, acc), left)
}

export function someHasChanged<AppState, Props>(trackeds: Array<Tracked<AppState, Props>>, appState: AppState, props: Props): boolean {
  return trackeds.some(tracked => tracked.hasChanged(appState, props))
}
