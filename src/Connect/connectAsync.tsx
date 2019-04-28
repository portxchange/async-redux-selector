import * as React from 'react'
import * as ReactRedux from 'react-redux'
import * as Redux from 'redux'
import { NonePartial } from '../None'
import { AsyncSelectorResults } from '../Select/AsyncSelectorResult'
import { CommandExecutor } from '../CommandExecutor'
import { getInnerComponentProps } from './getInnerComponentProps'
import { shouldComponentUpdate } from './shouldComponentUpdate'
import { OuterComponentState } from './OuterComponentState'
import { createAppStateSubscriber } from './createAppStateSubscriber'

export function connectAsync<AppState, AsyncStateProps, SyncStateProps, DispatchProps, OwnProps, Command>(
  Component: React.ComponentType<NonePartial<AsyncStateProps> & SyncStateProps & DispatchProps>,
  mapStateToAsyncStateProps: (appState: AppState, ownProps: OwnProps) => AsyncSelectorResults<AppState, Command, AsyncStateProps>,
  mapStateToSyncStateProps: (appState: AppState, ownProps: OwnProps) => SyncStateProps,
  mapDispatchToProps: (dispatch: Redux.Dispatch<Redux.Action>) => DispatchProps,
  createCommandExecutor: (dispatch: Redux.Dispatch<Redux.Action>, getState: () => AppState) => CommandExecutor<Command>
): React.ComponentType<OwnProps> {
  type OuterComponentProps = Readonly<{
    store: Redux.Store<AppState, Redux.AnyAction>
    ownProps: OwnProps
  }>

  class OuterComponent extends React.Component<OuterComponentProps, OuterComponentState<AppState, Command, AsyncStateProps, SyncStateProps>> {
    private unsubscribeToStore: Redux.Unsubscribe = (): void => undefined
    private readonly dispatchProps: DispatchProps
    private readonly commandExecutor: CommandExecutor<Command>

    constructor(props: OuterComponentProps) {
      super(props)
      const initialAppState: AppState = props.store.getState()
      this.dispatchProps = mapDispatchToProps(props.store.dispatch)
      this.state = {
        asyncStateProps: mapStateToAsyncStateProps(initialAppState, props.ownProps),
        syncStateProps: mapStateToSyncStateProps(initialAppState, props.ownProps)
      }
      this.commandExecutor = createCommandExecutor(props.store.dispatch, props.store.getState)
    }

    private subscribeToStore() {
      this.unsubscribeToStore()
      const subscriber = createAppStateSubscriber(
        mapStateToAsyncStateProps,
        mapStateToSyncStateProps,
        this.commandExecutor,
        this.props.store.getState,
        () => this.props.ownProps,
        () => this.state,
        state => this.setState(state)
      )
      this.unsubscribeToStore = this.props.store.subscribe(subscriber)
      subscriber()
    }

    public componentDidMount() {
      this.subscribeToStore()
    }

    public componentWillUnmount() {
      this.unsubscribeToStore()
    }

    public shouldComponentUpdate(_nextProps: OuterComponentProps, nextState: OuterComponentState<AppState, Command, AsyncStateProps, SyncStateProps>) {
      return shouldComponentUpdate(this.state, nextState)
    }

    public render() {
      return React.createElement<NonePartial<AsyncStateProps> & SyncStateProps & DispatchProps>(
        Component,
        getInnerComponentProps(this.state.asyncStateProps, this.state.syncStateProps, this.dispatchProps)
      )
    }
  }

  return (ownProps: OwnProps) => (
    <ReactRedux.ReactReduxContext.Consumer>{({ store }) => <OuterComponent ownProps={ownProps} store={store} />}</ReactRedux.ReactReduxContext.Consumer>
  )
}
