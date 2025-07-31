import { createRectangularElbowGeometry } from '../../utils/geometry';
import { BufferGeometry } from 'three';

describe('createRectangularElbowGeometry', () => {
  test('creates radial throat geometry within expected bounds', () => {
    const geom = createRectangularElbowGeometry(2, 2, 5, 90, 'radius');
    geom.computeBoundingBox();
    const bbox = geom.boundingBox!;
    expect(Math.round(bbox.max.x)).toBe(5);
    expect(Math.round(bbox.max.z)).toBe(5);
    expect(geom).toBeInstanceOf(BufferGeometry);
  });

  test('creates square throat geometry with corner', () => {
    const geom = createRectangularElbowGeometry(2, 2, 5, 90, 'square');
    geom.computeBoundingBox();
    const bbox = geom.boundingBox!;
    expect(Math.round(bbox.max.x)).toBe(5);
    expect(Math.round(bbox.max.z)).toBe(5);
  });
});

