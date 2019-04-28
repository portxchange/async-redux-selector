import { createTracked, someHasChanged, combineTracked } from '../../Select/Tracked'
import { areSameReference } from '../../Equality'

describe('Tracked', () => {
  type AppState = Readonly<{
    str: string
    num: number
  }>

  const strSelector = (appState: AppState): string => appState.str
  const numSelector = (appState: AppState): number => appState.num

  it('should be able to tell that the `AppState` did not change', () => {
    const appState1 = {
      str: 'four',
      num: 4
    }

    const appState2 = {
      str: 'four',
      num: 5
    }

    const trackedStr = createTracked(strSelector, appState1, areSameReference)
    expect(someHasChanged([trackedStr], appState2)).toEqual(false)
  })

  it('should be able to tell that the `AppState` did change', () => {
    const appState1 = {
      str: 'four',
      num: 4
    }

    const appState2 = {
      str: 'five',
      num: 4
    }

    const trackedStr = createTracked(strSelector, appState1, areSameReference)
    expect(someHasChanged([trackedStr], appState2)).toEqual(true)
  })

  it('should be able to combine multiple tracked selectors', () => {
    const appState1 = {
      str: 'four',
      num: 4
    }

    const appState2 = {
      str: 'five',
      num: 4
    }

    const appState3 = {
      str: 'four',
      num: 5
    }

    const trackedStr = createTracked(strSelector, appState1, areSameReference)
    const trackedNum = createTracked(numSelector, appState1, areSameReference)
    const combined = combineTracked([trackedStr], [trackedNum])
    expect(someHasChanged(combined, appState1)).toEqual(false)
    expect(someHasChanged(combined, appState2)).toEqual(true)
    expect(someHasChanged(combined, appState3)).toEqual(true)
  })

  it('should prevent adding the same tracked selector multiple times', () => {
    const appState1 = {
      str: 'four',
      num: 4
    }
    const trackedStr = createTracked(strSelector, appState1, areSameReference)
    const trackedNum = createTracked(numSelector, appState1, areSameReference)
    const combined = combineTracked([trackedStr], [trackedStr, trackedNum])
    expect(combined.length).toEqual(2)
  })
})
