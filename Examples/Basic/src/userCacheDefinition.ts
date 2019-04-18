import { createCacheDefinition, defaultLimiter } from 'selectorbeak'
import { AppState, User, None } from './AppState'

export const userCacheDefinition = createCacheDefinition<AppState, None, User, None>('user', appState => appState.userCache, (left, right) => left === right, defaultLimiter(5))
