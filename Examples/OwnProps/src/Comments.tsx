import * as React from 'react'
import { Comment, AppState } from './AppState'
import { None, none, PickAsyncPropsSimple, connectAsyncSimple } from 'selectorbeak'
import { asyncCommentsForSelectedBookSelector } from './asyncCommentsForSelectedBookSelector'
import { CommentsProps } from './CommentsProps'

type PresentationalComponentProps = Readonly<{
  comments: Comment[] | null | None
}>

export const PresentationalComponent = (props: PresentationalComponentProps) => {
  if (props.comments === none) {
    return <>Loading...</>
  }

  if (props.comments === null) {
    return <>No book selected</>
  }

  return (
    <ul>
      {props.comments.map((comment, index) => (
        <li key={index}>{comment.body}</li>
      ))}
    </ul>
  )
}

function mapStateToAsyncProps(appState: AppState, ownProps: CommentsProps): PickAsyncPropsSimple<AppState, PresentationalComponentProps, 'comments'> {
  return {
    comments: asyncCommentsForSelectedBookSelector(appState, ownProps)
  }
}

function mapStateToSyncProps(): Pick<PresentationalComponentProps, never> {
  return {}
}

function mapDispatchToProps(): Pick<PresentationalComponentProps, never> {
  return []
}

export const Comments = connectAsyncSimple(PresentationalComponent, mapStateToAsyncProps, mapStateToSyncProps, mapDispatchToProps)
