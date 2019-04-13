import * as React from 'react'
import * as ReactRedux from 'react-redux'
import * as Redux from 'redux'
import { NonePartial } from '../None'
import { AsyncSelectorResults } from '../AsyncSelectorResult'
import { CommandExecutor } from '../CommandExecutor'
import { getInnerComponentProps } from './getInnerComponentProps'
import { shouldComponentUpdate } from './shouldComponentUpdate'
import { OuterComponentState } from './OuterComponentState'
import { createAppStateSubscriber } from './createAppStateSubscriber'

export function connectAsync<AppState, AsyncStateProps, SyncStateProps, DispatchProps, Command>(
  Component: React.ComponentType<NonePartial<AsyncStateProps> & SyncStateProps & DispatchProps>,
  mapStateToAsyncStateProps: (appState: AppState) => AsyncSelectorResults<AppState, Command, AsyncStateProps>,
  mapStateToSyncStateProps: (appState: AppState) => SyncStateProps,
  mapDispatchToProps: (dispatch: Redux.Dispatch<Redux.Action>) => DispatchProps,
  commandExecutor: CommandExecutor<Command>
) {
  type OuterComponentProps = Readonly<{
    store: Redux.Store<AppState, Redux.AnyAction>
  }>

  class OuterComponent extends React.Component<OuterComponentProps, OuterComponentState<AppState, Command, AsyncStateProps, SyncStateProps>> {
    private unsubscribeToStore: Redux.Unsubscribe = (): void => undefined
    private readonly dispatchProps: DispatchProps

    constructor(props: OuterComponentProps) {
      super(props)
      const initialAppState: AppState = props.store.getState()
      this.dispatchProps = mapDispatchToProps(props.store.dispatch)
      this.state = {
        asyncStateProps: mapStateToAsyncStateProps(initialAppState),
        syncStateProps: mapStateToSyncStateProps(initialAppState)
      }
    }

    private subscribeToStore() {
      this.unsubscribeToStore()
      const subscriber = createAppStateSubscriber(mapStateToAsyncStateProps, mapStateToSyncStateProps, commandExecutor, this.props.store.getState, () => this.state, this.setState)
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

  return () => <ReactRedux.ReactReduxContext.Consumer>{({ store }) => <OuterComponent store={store} />}</ReactRedux.ReactReduxContext.Consumer>
}
