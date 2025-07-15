import { validateSchedule } from '../validators/schedule'
import { validateSmacna } from '../validators/smacna'

const validSchedule = { activity: 'Install duct', hours: 8, crewSize: 3 }

const invalidSchedule = { activity: 'Install duct', hours: -1, crewSize: 0 }

test('validateSchedule passes valid data', () => {
  const result = validateSchedule(validSchedule)
  expect(result.valid).toBe(true)
})

test('validateSchedule fails invalid data', () => {
  const result = validateSchedule(invalidSchedule)
  expect(result.valid).toBe(false)
})

test('validateSmacna', () => {
  const result = validateSmacna({ gauge: 20, jointType: 'S-slip' })
  expect(result.valid).toBe(true)
})
