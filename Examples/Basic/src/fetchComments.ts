import { Comment, CommentId } from './AppState'

const comment1: Comment = { id: 1, body: 'Excellent stuff!' }
const comment2: Comment = { id: 2, body: 'Very interesting!' }
const comment3: Comment = { id: 3, body: 'A worthy read!' }
const comment4: Comment = { id: 4, body: 'I like it a lot!' }
const comment5: Comment = { id: 5, body: 'Bestseller of the year!' }
const commentsOnServer: Comment[] = [comment1, comment2, comment3, comment4, comment5]

export function fetchComments(commentIds: CommentId[]): Promise<Comment[]> {
  return new Promise<Comment[]>(resolve => {
    setTimeout(() => {
      resolve(commentsOnServer.filter(comment => commentIds.indexOf(comment.id) > -1))
    }, 1000)
  })
}
