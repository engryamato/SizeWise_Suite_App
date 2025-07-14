import { calculateEstimate } from '../calculations/estimate.js';

describe('calculateEstimate', () => {
  test('returns default estimate structure', () => {
    const input = { project: 'Test' };
    const result = calculateEstimate(input);
    expect(result.input).toEqual(input);
    expect(result.results).toHaveProperty('material_cost');
    expect(result.results).toHaveProperty('labor_cost');
    expect(result.results).toHaveProperty('total_cost');
    expect(Array.isArray(result.results.line_items)).toBe(true);
  });
});
