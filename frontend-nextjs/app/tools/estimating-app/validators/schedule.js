import Ajv from 'ajv'
import scheduleSchema from '../schemas/schedule.schema.json' assert { type: 'json' }

const ajv = new Ajv({ allErrors: true })
const validate = ajv.compile(scheduleSchema)

export function validateSchedule(data) {
  const valid = validate(data)
  return { valid, errors: validate.errors || [] }
}
