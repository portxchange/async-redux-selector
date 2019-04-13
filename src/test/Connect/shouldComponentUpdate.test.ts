import { NonePartial, none } from '../../None'
import { shouldComponentUpdate } from '../../Connect/shouldComponentUpdate'

describe('shouldComponentUpdate', () => {
  type AsyncStateProps = Readonly<{
    asyncPropertyNum: number
    asyncPropertyStr: string
  }>

  type SyncStateProps = Readonly<{
    syncPropertyStr: string
    syncPropertyBool: boolean
  }>

  it('should return false when the two states are equal', () => {
    const prevState: NonePartial<AsyncStateProps> & SyncStateProps = {
      asyncPropertyNum: none,
      asyncPropertyStr: 'four',
      syncPropertyStr: 'five',
      syncPropertyBool: false
    }
    const nextState: NonePartial<AsyncStateProps> & SyncStateProps = {
      asyncPropertyNum: none,
      asyncPropertyStr: 'four',
      syncPropertyStr: 'five',
      syncPropertyBool: false
    }
    expect(shouldComponentUpdate(prevState, nextState)).toEqual(false)
  })

  it('should return true when the two states are not equal', () => {
    const prevState: NonePartial<AsyncStateProps> & SyncStateProps = {
      asyncPropertyNum: none,
      asyncPropertyStr: 'four',
      syncPropertyStr: 'five',
      syncPropertyBool: false
    }
    const nextState: NonePartial<AsyncStateProps> & SyncStateProps = {
      asyncPropertyNum: 3,
      asyncPropertyStr: 'four',
      syncPropertyStr: 'five',
      syncPropertyBool: false
    }
    expect(shouldComponentUpdate(prevState, nextState)).toEqual(true)
  })
})
