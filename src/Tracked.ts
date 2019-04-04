import { Equality } from './Equality'

export type Tracked<AppState> = Readonly<{
  source: (appState: AppState) => unknown
  hasChanged: (appState: AppState) => boolean
}>

export function createTracked<AppState, A>(source: (appState: AppState) => A, currentAppState: AppState, equality: Equality<A>) {
  const currentValue = source(currentAppState)
  const hasChanged = (newAppState: AppState): boolean => {
    const newValue = source(newAppState)
    return !equality(currentValue, newValue)
  }
  return {
    source,
    hasChanged
  }
}

function addTracked<AppState>(toAdd: Tracked<AppState>, toAddTo: Array<Tracked<AppState>>): Array<Tracked<AppState>> {
  const hasBeenAdded = toAddTo.some(tracked => tracked.source === toAdd.source)
  return hasBeenAdded ? toAddTo : [toAdd, ...toAddTo]
}

export function combineTracked<AppState>(left: Array<Tracked<AppState>>, right: Array<Tracked<AppState>>): Array<Tracked<AppState>> {
  return right.reduce((acc, curr) => addTracked(curr, acc), left)
}

export function someHasChanged<AppState>(trackeds: Array<Tracked<AppState>>, appState: AppState): boolean {
  return trackeds.some(tracked => tracked.hasChanged(appState))
}
