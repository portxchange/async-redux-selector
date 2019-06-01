import * as React from 'react'
import { Filter } from './Filter'
import { Provider } from 'react-redux'
import { createStore } from 'redux'
import { appStateReducer } from './appStateReducer'
import { Books } from './Books'

export const App = () => (
  <Provider store={createStore(appStateReducer)}>
    <Filter />
    <Books />
  </Provider>
)
