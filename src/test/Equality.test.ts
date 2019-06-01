import { objectsAreEqual } from '../Equality'

describe('objectsAreEqual', () => {
  type O = Readonly<{
    n: number
    s: string
    b: boolean
  }>

  it('should return true when the two objects are equal', () => {
    const left: O = {
      n: 4,
      s: 'four',
      b: true
    }
    const right: O = {
      n: 4,
      s: 'four',
      b: true
    }
    expect(objectsAreEqual(left, right)).toEqual(true)
  })

  it('should return false when the objects are not equal', () => {
    const left: O = {
      n: 4,
      s: 'four',
      b: true
    }
    const right: O = {
      n: 4,
      s: 'four',
      b: false
    }
    expect(objectsAreEqual(left, right)).toEqual(false)
  })
})
