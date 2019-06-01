import * as React from 'react'
import { QueryString, AppState } from './AppState'
import { queryStringSelector } from './queryStringSelector'
import { Dispatch } from 'redux'
import { Action, setQueryString } from './actions'
import { connect } from 'react-redux'

type PresentationalComponentProps = Readonly<{
  queryString: QueryString
  onChangeQueryString: (queryString: QueryString) => void
}>

export class PresentationalComponent extends React.Component<PresentationalComponentProps> {
  public render() {
    return (
      <div>
        <div>Query string</div>
        <div>
          <input type="text" value={this.props.queryString} onChange={this.handleChangeQueryString} />
        </div>
      </div>
    )
  }

  private handleChangeQueryString = (ev: React.ChangeEvent<HTMLInputElement>) => {
    this.props.onChangeQueryString(ev.target.value)
  }
}

function mapStateToProps(appState: AppState): Pick<PresentationalComponentProps, 'queryString'> {
  return {
    queryString: queryStringSelector(appState)
  }
}

function mapDispatchToProps(dispatch: Dispatch<Action>): Pick<PresentationalComponentProps, 'onChangeQueryString'> {
  return {
    onChangeQueryString: (queryString: QueryString) => {
      dispatch(setQueryString(queryString))
    }
  }
}

export const Filter = connect(
  mapStateToProps,
  mapDispatchToProps
)(PresentationalComponent)
