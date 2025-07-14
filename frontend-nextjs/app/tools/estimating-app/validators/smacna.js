import { z } from 'zod'

export const smacnaSchema = z.object({
  gauge: z.number().min(16).max(26),
  jointType: z.string(),
})

export function validateSmacna(data) {
  try {
    smacnaSchema.parse(data)
    return { valid: true, errors: [] }
  } catch (err) {
    return { valid: false, errors: err.errors }
  }
}
