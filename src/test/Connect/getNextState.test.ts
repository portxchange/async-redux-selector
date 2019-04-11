import { AsyncSelectorResult } from '../../AsyncSelectorResult'
import { CommandExecutor } from '../../CommandExecutor'
import { asyncCommand, asyncAwaitingValue } from '../../AsyncValue'
import { getNextState } from '../../Connect/getNextState'
import { Cache } from '../../Cache'
import { None, none } from '../../None'
import { GenericAction, CacheAction, awaitValue } from '../../Action'
import { createCacheDefinition } from '../../CacheDefinition'
import { areSameReference } from '../../Equality'
import { defaultLimiter } from '../../defaultLimiter'

describe('getNextState', () => {
  type QueryString = string
  type Result = string
  type UserDetails = string

  type AppState = Readonly<{
    queryString: QueryString
    resultsCache: Cache<QueryString, Result[], None>
    userDetailsCache: Cache<None, UserDetails, None>
  }>

  type SetQueryString = Readonly<{ type: 'SET_QUERY_STRING'; queryString: QueryString }>
  type Action = CacheAction<any, any, any> | SetQueryString

  type FetchResultsCommand = { type: 'FETCH_RESULTS'; queryString: string }
  type FetchUserDetailsCommand = { type: 'FETCH_USER_DETAILS' }
  type Command = FetchResultsCommand | FetchUserDetailsCommand

  const resultsCacheDefinition = createCacheDefinition<AppState, QueryString, Result[], None>('results', appState => appState.resultsCache, areSameReference, defaultLimiter(5))
  const userDetailsCacheDefinition = createCacheDefinition<AppState, None, UserDetails, None>(
    'userDetails',
    appState => appState.userDetailsCache,
    areSameReference,
    defaultLimiter(5)
  )

  function queryStringReducer(queryString: QueryString = '', action: Action): QueryString {
    switch (action.type) {
      case 'SET_QUERY_STRING':
        return action.queryString
      default:
        return queryString
    }
  }

  function appStateReducer(appState: Partial<AppState> = {}, action: Action): AppState {
    return {
      queryString: queryStringReducer(appState.queryString, action),
      resultsCache: resultsCacheDefinition.reducer(appState.resultsCache, action),
      userDetailsCache: userDetailsCacheDefinition.reducer(appState.userDetailsCache, action)
    }
  }

  it('should execute all commands', () => {
    let appState: AppState = {
      queryString: '',
      resultsCache: [],
      userDetailsCache: []
    }

    function dispatch(action: Action): void {
      appState = appStateReducer(appState, action)
    }

    function getState(): AppState {
      return appState
    }

    const commandExecutor: CommandExecutor<Command> = (command: Command) => {
      commandsExecuted.push(command)
      switch (command.type) {
        case 'FETCH_RESULTS':
          dispatch(resultsCacheDefinition.awaitValue(command.queryString, 'request-results', none))
          break
        case 'FETCH_USER_DETAILS':
          dispatch(userDetailsCacheDefinition.awaitValue(none, 'fetch-user-details', none))
          break
      }
    }

    let commandsExecuted: Command[] = []

    const getAppState = () => appState

    getNextState(commandExecutor, getAppState, mapStateToAsyncProps, {})

    expect(commandsExecuted).toContain(Command.FetchStr)
    expect(commandsExecuted).toContain(Command.FetchNum)
    expect(commandsExecuted).toHaveLength(2)

    const expected: AppState = {
      str: {
        asyncValue: asyncAwaitingValue(),
        trackedCaches: [],
        trackedUserInput: []
      },
      num: {
        asyncValue: asyncAwaitingValue(),
        trackedCaches: [],
        trackedUserInput: []
      }
    }
    expect(appState).toEqual(expected)
  })
})
