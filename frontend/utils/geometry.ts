import { Curve, Vector3, Shape, ExtrudeGeometry } from 'three';

/** Curve representing a smooth radius elbow path */
class RadialElbowCurve extends Curve<Vector3> {
  constructor(private radius: number, private angle: number) {
    super();
  }

  override getPoint(t: number, target = new Vector3()): Vector3 {
    const theta = this.angle * t;
    target.set(
      this.radius * Math.sin(theta),
      0,
      this.radius * (1 - Math.cos(theta))
    );
    return target;
  }
}

/** Curve representing a square-throat elbow path */
class SquareElbowCurve extends Curve<Vector3> {
  constructor(private length: number) {
    super();
  }

  override getPoint(t: number, target = new Vector3()): Vector3 {
    if (t < 0.5) {
      return target.set(0, 0, this.length * 2 * t);
    }
    return target.set(this.length * 2 * (t - 0.5), 0, this.length);
  }
}

/**
 * Create a rectangular elbow geometry.
 * @param width duct width
 * @param height duct height
 * @param radius centerline radius
 * @param angle elbow angle in degrees
 * @param throatType throat style ('radius' | 'square')
 */
export function createRectangularElbowGeometry(
  width: number,
  height: number,
  radius: number,
  angle: number,
  throatType: 'radius' | 'square' = 'radius'
): ExtrudeGeometry {
  const shape = new Shape();
  shape.moveTo(-width / 2, -height / 2);
  shape.lineTo(width / 2, -height / 2);
  shape.lineTo(width / 2, height / 2);
  shape.lineTo(-width / 2, height / 2);
  shape.closePath();

  const path =
    throatType === 'square'
      ? new SquareElbowCurve(radius)
      : new RadialElbowCurve(radius, (angle * Math.PI) / 180);

  return new ExtrudeGeometry(shape, { steps: 20, extrudePath: path });
}

