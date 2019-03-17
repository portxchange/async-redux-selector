import { Selector } from 'react-redux'
import { AsyncValue } from './AsyncValue'

export type AsyncSelector<AppState, Command, Value> = Selector<AppState, AsyncValue<Command, Value>>
