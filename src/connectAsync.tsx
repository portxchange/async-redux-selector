import * as React from 'react'
import { AsyncResult } from './AsyncResult'
import { None } from './None'
import { createGetStatePropsAndCommands } from './createGetStatePropsAndCommands'
import { memoize } from './utils'
import * as ReactRedux from 'react-redux'
import * as Redux from 'redux'

type StateProps<AsyncStateProps, SyncStateProps> = { [K in keyof AsyncStateProps]: AsyncStateProps[K] | None } & SyncStateProps

export function connectAsync<AppState, AsyncStateProps, SyncStateProps, DispatchProps, Command>(
  Component: React.ComponentType<StateProps<AsyncStateProps, SyncStateProps> & DispatchProps>,
  mapStateToAsyncStateProps: (appState: AppState) => { [K in keyof AsyncStateProps]: AsyncResult<Command, unknown, AsyncStateProps[K], unknown> },
  mapStateToSyncStateProps: (appState: AppState) => SyncStateProps,
  mapDispatchToProps: (dispatch: Redux.Dispatch<Redux.Action>) => DispatchProps,
  commandHandler: (dispatch: Redux.Dispatch<Redux.Action>, command: Command) => void
) {
  type ComponentProps = Readonly<{
    appState: AppState
    dispatch: Redux.Dispatch<Redux.Action>
  }>

  class ToConnect extends React.Component<ComponentProps> {
    public readonly dispatchProps: DispatchProps
    public readonly getStatePropsAndCommands = memoize(createGetStatePropsAndCommands(mapStateToAsyncStateProps, mapStateToSyncStateProps))

    constructor(props: ComponentProps) {
      super(props)
      this.dispatchProps = mapDispatchToProps(props.dispatch)
    }

    public componentDidMount() {
      const [, commands] = this.getStatePropsAndCommands(this.props.appState)
      commands.forEach(command => commandHandler(this.props.dispatch, command))
    }

    public render() {
      const [stateProps] = this.getStatePropsAndCommands(this.props.appState)
      const props: StateProps<AsyncStateProps, SyncStateProps> & DispatchProps = { ...stateProps, ...this.dispatchProps }
      return React.createElement<StateProps<AsyncStateProps, SyncStateProps> & DispatchProps>(Component, props)
    }

    public componendDidUpdate() {
      const [, commands] = this.getStatePropsAndCommands(this.props.appState)
      commands.forEach(command => commandHandler(this.props.dispatch, command))
    }
  }

  return ReactRedux.connect<{ appState: AppState }, { dispatch: Redux.Dispatch<Redux.Action> }, {}, AppState>(
    (appState: AppState) => ({ appState }),
    (dispatch: Redux.Dispatch<Redux.Action>) => ({ dispatch })
  )(props => React.createElement(ToConnect, props))
}
