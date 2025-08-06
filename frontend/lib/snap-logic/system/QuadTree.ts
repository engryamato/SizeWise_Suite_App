/**
 * QuadTree Data Structure
 * SizeWise Suite - Centerline Drawing and Magnetic Snapping System
 * 
 * High-performance QuadTree implementation for spatial indexing of snap points.
 * Provides O(log n) spatial queries for efficient snap point detection in
 * large-scale HVAC projects with thousands of snap points.
 * 
 * @fileoverview QuadTree spatial data structure for snap point indexing
 * @version 1.1.0
 * @author SizeWise Suite Development Team
 * 
 * @example Basic Usage
 * ```typescript
 * const quadTree = new QuadTree(bounds, { maxPoints: 10, maxDepth: 8 });
 * 
 * // Insert points
 * quadTree.insert(snapPoint);
 * 
 * // Query region
 * const nearbyPoints = quadTree.query(queryBounds);
 * 
 * // Query radius
 * const pointsInRadius = quadTree.queryRadius(center, radius);
 * ```
 */

/**
 * 2D point interface
 */
export interface Point2D {
  x: number;
  y: number;
}

/**
 * 2D rectangular bounds
 */
export interface Bounds2D {
  x: number;      // Left edge
  y: number;      // Top edge
  width: number;  // Width
  height: number; // Height
}

/**
 * Spatial object interface for QuadTree storage
 */
export interface SpatialObject {
  id: string;
  position: Point2D;
  bounds?: Bounds2D; // Optional bounds for non-point objects
  data?: any;        // Additional data payload
}

/**
 * QuadTree configuration options
 */
export interface QuadTreeOptions {
  maxPoints: number;    // Maximum points per node before subdivision
  maxDepth: number;     // Maximum tree depth
  minNodeSize: number;  // Minimum node size (prevents infinite subdivision)
}

/**
 * Default QuadTree configuration
 */
const DEFAULT_QUADTREE_OPTIONS: QuadTreeOptions = {
  maxPoints: 10,
  maxDepth: 8,
  minNodeSize: 1.0
};

/**
 * QuadTree node class
 */
class QuadTreeNode {
  public bounds: Bounds2D;
  public objects: SpatialObject[] = [];
  public children: QuadTreeNode[] | null = null;
  public depth: number;
  public options: QuadTreeOptions;

  constructor(bounds: Bounds2D, depth: number, options: QuadTreeOptions) {
    this.bounds = bounds;
    this.depth = depth;
    this.options = options;
  }

  /**
   * Check if this node is a leaf (has no children)
   */
  isLeaf(): boolean {
    return this.children === null;
  }

  /**
   * Check if this node should subdivide
   */
  shouldSubdivide(): boolean {
    return (
      this.isLeaf() &&
      this.objects.length > this.options.maxPoints &&
      this.depth < this.options.maxDepth &&
      this.bounds.width > this.options.minNodeSize &&
      this.bounds.height > this.options.minNodeSize
    );
  }

  /**
   * Subdivide this node into four children
   */
  subdivide(): void {
    if (!this.isLeaf()) return;

    const halfWidth = this.bounds.width / 2;
    const halfHeight = this.bounds.height / 2;
    const x = this.bounds.x;
    const y = this.bounds.y;

    // Create four child nodes
    this.children = [
      // Top-left
      new QuadTreeNode(
        { x, y, width: halfWidth, height: halfHeight },
        this.depth + 1,
        this.options
      ),
      // Top-right
      new QuadTreeNode(
        { x: x + halfWidth, y, width: halfWidth, height: halfHeight },
        this.depth + 1,
        this.options
      ),
      // Bottom-left
      new QuadTreeNode(
        { x, y: y + halfHeight, width: halfWidth, height: halfHeight },
        this.depth + 1,
        this.options
      ),
      // Bottom-right
      new QuadTreeNode(
        { x: x + halfWidth, y: y + halfHeight, width: halfWidth, height: halfHeight },
        this.depth + 1,
        this.options
      )
    ];

    // Redistribute objects to children
    const objectsToRedistribute = [...this.objects];
    this.objects = [];

    for (const obj of objectsToRedistribute) {
      this.insert(obj);
    }
  }

  /**
   * Insert an object into this node
   */
  insert(obj: SpatialObject): boolean {
    // Check if object is within bounds
    if (!this.containsPoint(obj.position)) {
      return false;
    }

    // If this is a leaf and we haven't exceeded capacity, add here
    if (this.isLeaf()) {
      this.objects.push(obj);

      // Check if we should subdivide
      if (this.shouldSubdivide()) {
        this.subdivide();
      }

      return true;
    }

    // Try to insert into children
    if (this.children) {
      for (const child of this.children) {
        if (child.insert(obj)) {
          return true;
        }
      }
    }

    // If no child could contain it, add to this node
    this.objects.push(obj);
    return true;
  }

  /**
   * Remove an object from this node
   */
  remove(objId: string): boolean {
    // Remove from this node's objects
    const initialLength = this.objects.length;
    this.objects = this.objects.filter(obj => obj.id !== objId);
    
    if (this.objects.length < initialLength) {
      return true; // Found and removed
    }

    // Try to remove from children
    if (this.children) {
      for (const child of this.children) {
        if (child.remove(objId)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Query objects within bounds
   */
  query(bounds: Bounds2D, result: SpatialObject[] = []): SpatialObject[] {
    // Check if this node intersects with query bounds
    if (!this.intersectsBounds(bounds)) {
      return result;
    }

    // Add objects from this node that intersect with query bounds
    for (const obj of this.objects) {
      if (this.pointInBounds(obj.position, bounds)) {
        result.push(obj);
      }
    }

    // Query children
    if (this.children) {
      for (const child of this.children) {
        child.query(bounds, result);
      }
    }

    return result;
  }

  /**
   * Query objects within radius of a point
   */
  queryRadius(center: Point2D, radius: number, result: SpatialObject[] = []): SpatialObject[] {
    // Create bounding box for radius query
    const bounds: Bounds2D = {
      x: center.x - radius,
      y: center.y - radius,
      width: radius * 2,
      height: radius * 2
    };

    // Check if this node intersects with query bounds
    if (!this.intersectsBounds(bounds)) {
      return result;
    }

    // Check objects in this node
    for (const obj of this.objects) {
      const distance = Math.sqrt(
        Math.pow(obj.position.x - center.x, 2) + 
        Math.pow(obj.position.y - center.y, 2)
      );
      
      if (distance <= radius) {
        result.push(obj);
      }
    }

    // Query children
    if (this.children) {
      for (const child of this.children) {
        child.queryRadius(center, radius, result);
      }
    }

    return result;
  }

  /**
   * Check if a point is within this node's bounds
   */
  containsPoint(point: Point2D): boolean {
    return (
      point.x >= this.bounds.x &&
      point.x < this.bounds.x + this.bounds.width &&
      point.y >= this.bounds.y &&
      point.y < this.bounds.y + this.bounds.height
    );
  }

  /**
   * Check if this node's bounds intersect with given bounds
   */
  intersectsBounds(bounds: Bounds2D): boolean {
    return !(
      bounds.x >= this.bounds.x + this.bounds.width ||
      bounds.x + bounds.width <= this.bounds.x ||
      bounds.y >= this.bounds.y + this.bounds.height ||
      bounds.y + bounds.height <= this.bounds.y
    );
  }

  /**
   * Check if a point is within given bounds
   */
  pointInBounds(point: Point2D, bounds: Bounds2D): boolean {
    return (
      point.x >= bounds.x &&
      point.x <= bounds.x + bounds.width &&
      point.y >= bounds.y &&
      point.y <= bounds.y + bounds.height
    );
  }

  /**
   * Get total number of objects in this subtree
   */
  getObjectCount(): number {
    let count = this.objects.length;
    
    if (this.children) {
      for (const child of this.children) {
        count += child.getObjectCount();
      }
    }
    
    return count;
  }

  /**
   * Get all objects in this subtree
   */
  getAllObjects(result: SpatialObject[] = []): SpatialObject[] {
    result.push(...this.objects);
    
    if (this.children) {
      for (const child of this.children) {
        child.getAllObjects(result);
      }
    }
    
    return result;
  }

  /**
   * Clear all objects from this subtree
   */
  clear(): void {
    this.objects = [];
    this.children = null;
  }
}

/**
 * QuadTree spatial index implementation
 */
export class QuadTree {
  private root: QuadTreeNode;
  private bounds: Bounds2D;
  private options: QuadTreeOptions;
  private objectCount: number = 0;

  constructor(bounds: Bounds2D, options?: Partial<QuadTreeOptions>) {
    this.bounds = { ...bounds };
    this.options = { ...DEFAULT_QUADTREE_OPTIONS, ...options };
    this.root = new QuadTreeNode(this.bounds, 0, this.options);
  }

  /**
   * Insert an object into the QuadTree
   */
  insert(obj: SpatialObject): boolean {
    const success = this.root.insert(obj);
    if (success) {
      this.objectCount++;
    }
    return success;
  }

  /**
   * Remove an object from the QuadTree
   */
  remove(objId: string): boolean {
    const success = this.root.remove(objId);
    if (success) {
      this.objectCount--;
    }
    return success;
  }

  /**
   * Query objects within bounds
   */
  query(bounds: Bounds2D): SpatialObject[] {
    return this.root.query(bounds);
  }

  /**
   * Query objects within radius of a point
   */
  queryRadius(center: Point2D, radius: number): SpatialObject[] {
    return this.root.queryRadius(center, radius);
  }

  /**
   * Find the nearest object to a point
   */
  findNearest(point: Point2D, maxDistance?: number): SpatialObject | null {
    const searchRadius = maxDistance || Math.max(this.bounds.width, this.bounds.height);
    const candidates = this.queryRadius(point, searchRadius);
    
    if (candidates.length === 0) {
      return null;
    }

    let nearest: SpatialObject | null = null;
    let nearestDistance = Infinity;

    for (const candidate of candidates) {
      const distance = Math.sqrt(
        Math.pow(candidate.position.x - point.x, 2) + 
        Math.pow(candidate.position.y - point.y, 2)
      );

      if (distance < nearestDistance && (!maxDistance || distance <= maxDistance)) {
        nearest = candidate;
        nearestDistance = distance;
      }
    }

    return nearest;
  }

  /**
   * Get all objects in the QuadTree
   */
  getAllObjects(): SpatialObject[] {
    return this.root.getAllObjects();
  }

  /**
   * Get the number of objects in the QuadTree
   */
  getObjectCount(): number {
    return this.objectCount;
  }

  /**
   * Get the bounds of the QuadTree
   */
  getBounds(): Bounds2D {
    return { ...this.bounds };
  }

  /**
   * Clear all objects from the QuadTree
   */
  clear(): void {
    this.root.clear();
    this.objectCount = 0;
  }

  /**
   * Rebuild the QuadTree with current objects
   */
  rebuild(): void {
    const objects = this.getAllObjects();
    this.clear();
    this.root = new QuadTreeNode(this.bounds, 0, this.options);
    
    for (const obj of objects) {
      this.insert(obj);
    }
  }

  /**
   * Update the bounds of the QuadTree and rebuild
   */
  updateBounds(newBounds: Bounds2D): void {
    this.bounds = { ...newBounds };
    this.rebuild();
  }

  /**
   * Get QuadTree statistics for debugging
   */
  getStatistics(): {
    totalObjects: number;
    maxDepth: number;
    nodeCount: number;
    averageObjectsPerLeaf: number;
  } {
    const stats = {
      totalObjects: this.objectCount,
      maxDepth: 0,
      nodeCount: 0,
      leafNodes: 0,
      totalLeafObjects: 0
    };

    const traverse = (node: QuadTreeNode, depth: number) => {
      stats.nodeCount++;
      stats.maxDepth = Math.max(stats.maxDepth, depth);

      if (node.isLeaf()) {
        stats.leafNodes++;
        stats.totalLeafObjects += node.objects.length;
      } else if (node.children) {
        for (const child of node.children) {
          traverse(child, depth + 1);
        }
      }
    };

    traverse(this.root, 0);

    return {
      totalObjects: stats.totalObjects,
      maxDepth: stats.maxDepth,
      nodeCount: stats.nodeCount,
      averageObjectsPerLeaf: stats.leafNodes > 0 ? stats.totalLeafObjects / stats.leafNodes : 0
    };
  }
}
