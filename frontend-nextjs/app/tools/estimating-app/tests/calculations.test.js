import { calculateLabor } from '../calculations/labor'

test('calculateLabor', () => {
  expect(calculateLabor(2, 50)).toBe(100)
})
