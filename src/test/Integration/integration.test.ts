import { Cache } from '../../Store/Cache'
import { None, none, NonePartial } from '../../None'
import { CacheAction } from '../../Store/Action'
import { createCacheDefinition } from '../../Store/CacheDefinition'
import { areSameReference, arraysAreEqual } from '../../Equality'
import { defaultLimiter } from '../../Store/defaultLimiter'
import { CommandExecutor } from '../../CommandExecutor'
import { createAsyncSelector } from '../../Select/createAsyncSelector'
import { OuterComponentState } from '../../Connect/OuterComponentState'
import { createAppStateSubscriber } from '../../Connect/createAppStateSubscriber'
import { withPrevious, flatMap } from '../../utils'
import { shouldComponentUpdate } from '../../Connect/shouldComponentUpdate'
import { getInnerComponentProps } from '../../Connect/getInnerComponentProps'
import { createTrackedSelector } from '../../Select/createTrackedSelector'
import { PickAsyncProps } from '../../Connect/PickAsyncProps'

describe('integration', () => {
  ////////////////////////////////////
  // Define the shape of the store. //
  ////////////////////////////////////
  type QueryString = string
  type CommentId = number
  type Comment = Readonly<{ id: CommentId; body: string }>
  type Book = Readonly<{ title: string; comments: CommentId[] }>
  type User = string

  type AppState = Readonly<{
    queryString: QueryString
    commentsCache: Cache<CommentId[], Comment[], None>
    booksCache: Cache<QueryString, Book[], None>
    userCache: Cache<None, User, None>
  }>

  let appState: AppState

  function getState(): AppState {
    return appState
  }

  ////////////////////////////////////
  // Server state.                  //
  ////////////////////////////////////
  const purelyFunctionalDataStructuresBook: Book = { title: 'Purely Functional Data Structures', comments: [1, 3] }
  const pearlsOfFunctionalAlgorithmDesignBook: Book = { title: 'Pearls of Functional Algorithm Design', comments: [2, 5] }
  const algebraicSemanticsOfImperativeProgramsBook: Book = { title: 'Algebraic Semantics of Imperative Programs', comments: [4] }

  const comment1: Comment = { id: 1, body: 'Excellent stuff!' }
  const comment2: Comment = { id: 2, body: 'Very interesting!' }
  const comment3: Comment = { id: 3, body: 'A worthy read!' }
  const comment4: Comment = { id: 4, body: 'I like it a lot!' }
  const comment5: Comment = { id: 5, body: 'Bestseller of the year!' }
  const commentsOnServer: Comment[] = [comment1, comment2, comment3, comment4, comment5]
  const booksOnServer: Book[] = [purelyFunctionalDataStructuresBook, pearlsOfFunctionalAlgorithmDesignBook, algebraicSemanticsOfImperativeProgramsBook]
  const userOnServer: User = 'Hank'

  ////////////////////////////////////
  // Cache definitions.             //
  ////////////////////////////////////
  const commentsCacheDefinition = createCacheDefinition<AppState, CommentId[], Comment[], None>('comments', appState => appState.commentsCache, arraysAreEqual, defaultLimiter(5))
  const booksCacheDefinition = createCacheDefinition<AppState, QueryString, Book[], None>('books', appState => appState.booksCache, areSameReference, defaultLimiter(5))
  const userCacheDefinition = createCacheDefinition<AppState, None, User, None>('user', appState => appState.userCache, areSameReference, defaultLimiter(5))

  ////////////////////////////////////
  // Actions.                       //
  ////////////////////////////////////
  type SetQueryString = Readonly<{ type: 'SET_QUERY_STRING'; queryString: QueryString }>
  type ClearBooks = Readonly<{ type: 'CLEAR_BOOKS' }>
  type Action = CacheAction<any, any, any> | SetQueryString | ClearBooks

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

  function booksCacheReducer(booksCache: Cache<QueryString, Book[], None> = [], action: Action): Cache<QueryString, Book[], None> {
    const afterCacheActions = booksCacheDefinition.reducer(booksCache, action)
    switch (action.type) {
      case 'CLEAR_BOOKS':
        return []
      default:
        return afterCacheActions
    }
  }

  function appStateReducer(appState: Partial<AppState> = {}, action: Action): AppState {
    return {
      queryString: queryStringReducer(appState.queryString, action),
      commentsCache: commentsCacheDefinition.reducer(appState.commentsCache, action),
      booksCache: booksCacheReducer(appState.booksCache, action),
      userCache: userCacheDefinition.reducer(appState.userCache, action)
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
  type FetchBooksCommand = { type: 'FETCH_BOOKS'; queryString: string }
  type FetchCommentsCommand = { type: 'FETCH_COMMENTS'; commentIds: CommentId[] }
  type FetchUserCommand = { type: 'FETCH_USER' }
  type Command = FetchBooksCommand | FetchUserCommand | FetchCommentsCommand

  let commandsExecuted: Command[]

  const commandExecutor: CommandExecutor<Command> = (command: Command) => {
    commandsExecuted.push(command)
    switch (command.type) {
      case 'FETCH_BOOKS':
        dispatch(booksCacheDefinition.awaitValue(command.queryString, 'request-books', none))
        addActionToFlush(booksCacheDefinition.receiveValue('request-books', booksOnServer.filter(book => book.title.indexOf(command.queryString) > -1)))
        break
      case 'FETCH_USER':
        dispatch(userCacheDefinition.awaitValue(none, 'fetch-user', none))
        addActionToFlush(userCacheDefinition.receiveValue('fetch-user', userOnServer))
        break
      case 'FETCH_COMMENTS':
        dispatch(commentsCacheDefinition.awaitValue(command.commentIds, 'fetch-comments', none))
        const comments = commentsOnServer.filter(comment => command.commentIds.indexOf(comment.id) > -1)
        addActionToFlush(commentsCacheDefinition.receiveValue('fetch-comments', comments))
        break
    }
  }

  ////////////////////////////////////
  // Selectors.                     //
  ////////////////////////////////////
  function queryStringSelector(appState: AppState) {
    return appState.queryString
  }

  const asyncBooksSelector = createAsyncSelector(createTrackedSelector(queryStringSelector, areSameReference), booksCacheDefinition.selector, (queryString, booksCache) => {
    return booksCache.getFor(queryString).orElse<Command>({ type: 'FETCH_BOOKS', queryString })
  })

  const asyncUserSelector = createAsyncSelector(userCacheDefinition.selector, userCache => {
    return userCache.getFor(none).orElse<Command>({ type: 'FETCH_USER' })
  })

  const asyncCommentsSelector = createAsyncSelector(asyncBooksSelector, commentsCacheDefinition.selector, (books, commentsCache) => {
    const commentIds = flatMap(books, book => book.comments)
    return commentsCache.getFor(commentIds).orElse<Command>({ type: 'FETCH_COMMENTS', commentIds })
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
      commentsCache: [],
      booksCache: [],
      userCache: []
    }
    commandsExecuted = []
    actionsToFlush = []
  })

  it('should work correctly when the cache is cleared or input changes', () => {
    type AsyncProps = Readonly<{
      books: Book[]
      user: User
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

    function mapStateToAsyncProps(appState: AppState): PickAsyncProps<AppState, Command, Props, 'books' | 'user'> {
      return {
        books: asyncBooksSelector(appState),
        user: asyncUserSelector(appState)
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
      books: none,
      user: none
    })
    flush()
    subscriber()
    expect(getInnerComponentState(outerComponentStates)).toEqual({
      queryString: '',
      books: [purelyFunctionalDataStructuresBook, pearlsOfFunctionalAlgorithmDesignBook, algebraicSemanticsOfImperativeProgramsBook],
      user: userOnServer
    })
    dispatch({ type: 'CLEAR_BOOKS' })
    subscriber()
    expect(getInnerComponentState(outerComponentStates)).toEqual({
      queryString: '',
      books: [purelyFunctionalDataStructuresBook, pearlsOfFunctionalAlgorithmDesignBook, algebraicSemanticsOfImperativeProgramsBook],
      user: userOnServer
    })
    flush()
    subscriber()
    expect(getInnerComponentState(outerComponentStates)).toEqual({
      queryString: '',
      books: [purelyFunctionalDataStructuresBook, pearlsOfFunctionalAlgorithmDesignBook, algebraicSemanticsOfImperativeProgramsBook],
      user: userOnServer
    })
    dispatch({ type: 'SET_QUERY_STRING', queryString: 'Functional' })
    subscriber()
    expect(getInnerComponentState(outerComponentStates)).toEqual({
      queryString: 'Functional',
      books: none,
      user: userOnServer
    })
    flush()
    subscriber()
    expect(getInnerComponentState(outerComponentStates)).toEqual({
      queryString: 'Functional',
      books: [purelyFunctionalDataStructuresBook, pearlsOfFunctionalAlgorithmDesignBook],
      user: userOnServer
    })
  })

  it('should work with async selectors that depend on other async selectors', () => {
    type AsyncProps = Readonly<{
      comments: Comment[]
    }>

    type SyncProps = Readonly<{}>

    type Props = NonePartial<AsyncProps> & SyncProps

    function mapStateToSyncProps(_appState: AppState): Pick<Props, never> {
      return {}
    }

    function mapStateToAsyncProps(appState: AppState): PickAsyncProps<AppState, Command, Props, 'comments'> {
      return {
        comments: asyncCommentsSelector(appState)
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
    dispatch({ type: 'SET_QUERY_STRING', queryString: 'Functional' })
    subscriber()
    expect(getInnerComponentState(outerComponentStates)).toEqual({
      comments: none
    })
    flush()
    subscriber()
    expect(getInnerComponentState(outerComponentStates)).toEqual({
      comments: none
    })
    flush()
    subscriber()
    expect(getInnerComponentState(outerComponentStates)).toEqual({
      comments: [comment1, comment2, comment3, comment5]
    })
  })

  it('should dispatch only one command when a component depends on the same selector in two differnt ways', () => {
    type AsyncProps = Readonly<{
      booksOnce: Book[]
      booksTwice: Book[]
    }>

    type SyncProps = Readonly<{}>

    type Props = NonePartial<AsyncProps> & SyncProps

    function mapStateToSyncProps(_appState: AppState): Pick<Props, never> {
      return {}
    }

    function mapStateToAsyncProps(appState: AppState): PickAsyncProps<AppState, Command, Props, 'booksOnce' | 'booksTwice'> {
      return {
        booksOnce: asyncBooksSelector(appState),
        booksTwice: asyncBooksSelector(appState)
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
    flush()
    subscriber()
    expect(getInnerComponentState(outerComponentStates)).toEqual({
      booksOnce: booksOnServer,
      booksTwice: booksOnServer
    })
    expect(commandsExecuted).toHaveLength(1)
  })
})
