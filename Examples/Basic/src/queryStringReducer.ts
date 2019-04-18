import { SET_QUERY_STRING, Action } from './actions'
import { QueryString } from './AppState'

export function queryStringReducer(queryString: QueryString = '', action: Action): QueryString {
  switch (action.type) {
    case SET_QUERY_STRING:
      return action.queryString
    default:
      return queryString
  }
}
