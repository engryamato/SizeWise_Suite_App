import TakeoffInput from '../components/TakeoffInput'
import { render } from '@testing-library/react'

test('TakeoffInput renders', () => {
  const { container } = render(<TakeoffInput />)
  expect(container).toBeTruthy()
})
