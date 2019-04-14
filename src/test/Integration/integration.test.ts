import { Cache } from '../../Cache'
import { None, none, NonePartial } from '../../None'
import { CacheAction } from '../../Action'
import { createCacheDefinition } from '../../CacheDefinition'
import { areSameReference } from '../../Equality'
import { defaultLimiter } from '../../defaultLimiter'
import { CommandExecutor } from '../../CommandExecutor'
import { createAsyncSelector } from '../../createAsyncSelector'
import { AsyncSelectorResults } from '../../AsyncSelectorResult'
import { OuterComponentState } from '../../Connect/OuterComponentState'
import { createAppStateSubscriber } from '../../Connect/createAppStateSubscriber'
import { withPrevious } from '../../utils'
import { shouldComponentUpdate } from '../../Connect/shouldComponentUpdate'
import { getInnerComponentProps } from '../../Connect/getInnerComponentProps'
import { createTrackedSelector } from '../../createTrackedSelector'
import { PickAsyncProps } from '../Connect/PickAsyncProps'

describe('integration', () => {
  ////////////////////////////////////
  // Define the shape of the store. //
  ////////////////////////////////////
  type QueryString = string
  type Article = Readonly<{ title: string }>
  type UserDetails = string

  type AppState = Readonly<{
    queryString: QueryString
    articlesCache: Cache<QueryString, Article[], None>
    userDetailsCache: Cache<None, UserDetails, None>
  }>

  let appState: AppState

  function getState(): AppState {
    return appState
  }

  ////////////////////////////////////
  // Server state.                  //
  ////////////////////////////////////
  const howToPlayTheGuitarArticle: Article = { title: 'How to play the guitar' }
  const twentyIntermediateGuitarSongsArticle: Article = { title: '20 intermediate guitar songs' }
  const pianoStarterArticle: Article = { title: 'Piano starter' }
  const articlesOnServer: Article[] = [howToPlayTheGuitarArticle, twentyIntermediateGuitarSongsArticle, pianoStarterArticle]
  const userDetails: UserDetails = 'Hank'

  ////////////////////////////////////
  // Cache definitions.             //
  ////////////////////////////////////
  const articlesCacheDefinition = createCacheDefinition<AppState, QueryString, Article[], None>('articles', appState => appState.articlesCache, areSameReference, defaultLimiter(5))
  const userDetailsCacheDefinition = createCacheDefinition<AppState, None, UserDetails, None>(
    'userDetails',
    appState => appState.userDetailsCache,
    areSameReference,
    defaultLimiter(5)
  )

  ////////////////////////////////////
  // Actions.                       //
  ////////////////////////////////////
  type SetQueryString = Readonly<{ type: 'SET_QUERY_STRING'; queryString: QueryString }>
  type ClearResults = Readonly<{ type: 'CLEAR_RESULTS' }>
  type Action = CacheAction<any, any, any> | SetQueryString | ClearResults

  ////////////////////////////////////
  // Reducers.                      //
  ////////////////////////////////////
  function queryStringReducer(queryString: QueryString = '', action: Action): QueryString {
    switch (action.type) {
      case 'SET_QUERY_STRING':
        return action.queryString
      default:
        return queryString
    }
  }

  function resultsCacheReducer(resultsCache: Cache<QueryString, Article[], None> = [], action: Action): Cache<QueryString, Article[], None> {
    const afterCacheActions = articlesCacheDefinition.reducer(resultsCache, action)
    switch (action.type) {
      case 'CLEAR_RESULTS':
        return []
      default:
        return afterCacheActions
    }
  }

  function appStateReducer(appState: Partial<AppState> = {}, action: Action): AppState {
    return {
      queryString: queryStringReducer(appState.queryString, action),
      articlesCache: resultsCacheReducer(appState.articlesCache, action),
      userDetailsCache: userDetailsCacheDefinition.reducer(appState.userDetailsCache, action)
    }
  }

  function dispatch(action: Action): void {
    appState = appStateReducer(appState, action)
  }

  let actionsToFlush: Action[]
  function addActionToFlush(action: Action) {
    actionsToFlush.push(action)
  }
  function flush() {
    actionsToFlush.forEach(dispatch)
    actionsToFlush = []
  }

  ////////////////////////////////////
  // Commands that cause the caches //
  // to grow.                       //
  ////////////////////////////////////
  type FetchResultsCommand = { type: 'FETCH_RESULTS'; queryString: string }
  type FetchUserDetailsCommand = { type: 'FETCH_USER_DETAILS' }
  type Command = FetchResultsCommand | FetchUserDetailsCommand

  let commandsExecuted: Command[]

  const commandExecutor: CommandExecutor<Command> = (command: Command) => {
    commandsExecuted.push(command)
    switch (command.type) {
      case 'FETCH_RESULTS':
        dispatch(articlesCacheDefinition.awaitValue(command.queryString, 'request-results', none))
        addActionToFlush(articlesCacheDefinition.receiveValue('request-results', articlesOnServer.filter(article => article.title.indexOf(command.queryString) > -1)))
        break
      case 'FETCH_USER_DETAILS':
        dispatch(userDetailsCacheDefinition.awaitValue(none, 'fetch-user-details', none))
        addActionToFlush(userDetailsCacheDefinition.receiveValue('fetch-user-details', userDetails))
        break
    }
  }

  ////////////////////////////////////
  // Selectors.                     //
  ////////////////////////////////////
  function queryStringSelector(appState: AppState) {
    return appState.queryString
  }

  const asyncResultsSelector = createAsyncSelector(createTrackedSelector(queryStringSelector, areSameReference), articlesCacheDefinition.selector, (queryString, resultsCache) => {
    return resultsCache.getFor(queryString).orElse<FetchResultsCommand>({ type: 'FETCH_RESULTS', queryString })
  })

  const asyncUserDetailsSelector = createAsyncSelector(userDetailsCacheDefinition.selector, userDetailsCache => {
    return userDetailsCache.getFor(none).orElse<FetchUserDetailsCommand>({ type: 'FETCH_USER_DETAILS' })
  })

  ////////////////////////////////////
  // Helper functions to help       //
  // determine the props to the     //
  // inner component.               //
  ////////////////////////////////////
  const getInnerComponentStates = <AsyncProps, SyncProps>(outerComponentStates: OuterComponentState<AppState, Command, AsyncProps, SyncProps>[]) => {
    const allInnerComponentStates = outerComponentStates.map(s => getInnerComponentProps<AppState, Command, AsyncProps, SyncProps, {}>(s.asyncStateProps, s.syncStateProps, {}))
    const renderedInnerComponentStates = withPrevious(allInnerComponentStates)
      .filter(({ current, previous }) => previous === none || shouldComponentUpdate(previous, current))
      .map(({ current }) => current)
    return renderedInnerComponentStates
  }

  const getInnerComponentState = <AsyncProps, SyncProps>(outerComponentStates: OuterComponentState<AppState, Command, AsyncProps, SyncProps>[]) => {
    const innerComponentStates = getInnerComponentStates(outerComponentStates)
    return innerComponentStates[innerComponentStates.length - 1]
  }

  beforeEach(() => {
    appState = {
      queryString: '',
      articlesCache: [],
      userDetailsCache: []
    }
    commandsExecuted = []
    actionsToFlush = []
  })

  it('should execute all commands', () => {
    type AsyncProps = Readonly<{
      articles: Article[]
      userDetails: UserDetails
    }>

    type SyncProps = Readonly<{
      queryString: QueryString
    }>

    type Props = NonePartial<AsyncProps> & SyncProps

    function mapStateToSyncProps(appState: AppState): Pick<Props, 'queryString'> {
      return {
        queryString: queryStringSelector(appState)
      }
    }

    function mapStateToAsyncProps(appState: AppState): PickAsyncProps<AppState, Command, Props, 'articles' | 'userDetails'> {
      return {
        articles: asyncResultsSelector(appState),
        userDetails: asyncUserDetailsSelector(appState)
      }
    }

    let outerComponentState: OuterComponentState<AppState, Command, AsyncProps, SyncProps> = {
      asyncStateProps: mapStateToAsyncProps(appState),
      syncStateProps: mapStateToSyncProps(appState)
    }
    const outerComponentStates = [outerComponentState]

    const subscriber = createAppStateSubscriber(
      mapStateToAsyncProps,
      mapStateToSyncProps,
      commandExecutor,
      getState,
      () => outerComponentState,
      nextOuterComponentState => {
        outerComponentState = nextOuterComponentState
        outerComponentStates.push(outerComponentState)
      }
    )
    subscriber()
    expect(getInnerComponentState(outerComponentStates)).toEqual({
      queryString: '',
      results: none,
      userDetails: none
    })
    flush()
    subscriber()
    expect(getInnerComponentState(outerComponentStates)).toEqual({
      queryString: '',
      results: [howToPlayTheGuitarArticle, twentyIntermediateGuitarSongsArticle, pianoStarterArticle],
      userDetails
    })
    dispatch({ type: 'CLEAR_RESULTS' })
    subscriber()
    expect(getInnerComponentState(outerComponentStates)).toEqual({
      queryString: '',
      results: [howToPlayTheGuitarArticle, twentyIntermediateGuitarSongsArticle, pianoStarterArticle],
      userDetails
    })
    flush()
    subscriber()
    expect(getInnerComponentState(outerComponentStates)).toEqual({
      queryString: '',
      results: [howToPlayTheGuitarArticle, twentyIntermediateGuitarSongsArticle, pianoStarterArticle],
      userDetails
    })
    dispatch({ type: 'SET_QUERY_STRING', queryString: 'guitar' })
    subscriber()
    expect(getInnerComponentState(outerComponentStates)).toEqual({
      queryString: 'guitar',
      results: none,
      userDetails
    })
    flush()
    subscriber()
    expect(getInnerComponentState(outerComponentStates)).toEqual({
      queryString: 'guitar',
      results: [howToPlayTheGuitarArticle, twentyIntermediateGuitarSongsArticle],
      userDetails
    })
  })
})
