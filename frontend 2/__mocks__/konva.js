// Mock Konva for Jest environment
// This provides all the Konva classes and methods needed for testing

const mockNode = {
  x: jest.fn().mockReturnThis(),
  y: jest.fn().mockReturnThis(),
  width: jest.fn().mockReturnThis(),
  height: jest.fn().mockReturnThis(),
  scaleX: jest.fn().mockReturnThis(),
  scaleY: jest.fn().mockReturnThis(),
  rotation: jest.fn().mockReturnThis(),
  opacity: jest.fn().mockReturnThis(),
  visible: jest.fn().mockReturnThis(),
  listening: jest.fn().mockReturnThis(),
  draggable: jest.fn().mockReturnThis(),
  add: jest.fn().mockReturnThis(),
  remove: jest.fn().mockReturnThis(),
  removeChildren: jest.fn().mockReturnThis(),
  destroy: jest.fn(),
  getStage: jest.fn(() => mockStage),
  getLayer: jest.fn(() => mockLayer),
  getParent: jest.fn(),
  getChildren: jest.fn(() => []),
  findOne: jest.fn(),
  find: jest.fn(() => []),
  on: jest.fn(),
  off: jest.fn(),
  fire: jest.fn(),
  draw: jest.fn(),
  cache: jest.fn(),
  clearCache: jest.fn(),
  filters: jest.fn().mockReturnThis(),
  to: jest.fn(),
  getAbsolutePosition: jest.fn(() => ({ x: 0, y: 0 })),
  getRelativePointerPosition: jest.fn(() => ({ x: 0, y: 0 })),
  getPointerPosition: jest.fn(() => ({ x: 0, y: 0 })),
  setAttrs: jest.fn().mockReturnThis(),
  getAttrs: jest.fn(() => ({})),
  clone: jest.fn().mockReturnThis(),
  toDataURL: jest.fn(() => 'data:image/png;base64,mock'),
};

const mockLayer = {
  ...mockNode,
  batchDraw: jest.fn(),
  draw: jest.fn(),
  clear: jest.fn(),
  getIntersection: jest.fn(),
  hitGraphEnabled: jest.fn().mockReturnThis(),
};

const mockStage = {
  ...mockNode,
  container: jest.fn().mockReturnThis(),
  content: { style: {} },
  batchDraw: jest.fn(),
  draw: jest.fn(),
  clear: jest.fn(),
  getIntersection: jest.fn(),
  getLayers: jest.fn(() => []),
  scale: jest.fn().mockReturnThis(),
  position: jest.fn().mockReturnThis(),
  size: jest.fn().mockReturnThis(),
  getPointerPosition: jest.fn(() => ({ x: 0, y: 0 })),
  setPointersPositions: jest.fn(),
  _pointerPositions: [],
};

const Konva = {
  Stage: jest.fn(() => mockStage),
  Layer: jest.fn(() => mockLayer),
  Group: jest.fn(() => mockNode),
  Rect: jest.fn(() => mockNode),
  Circle: jest.fn(() => mockNode),
  Line: jest.fn(() => mockNode),
  Text: jest.fn(() => mockNode),
  Image: jest.fn(() => mockNode),
  Path: jest.fn(() => mockNode),
  RegularPolygon: jest.fn(() => mockNode),
  Star: jest.fn(() => mockNode),
  Ring: jest.fn(() => mockNode),
  Arc: jest.fn(() => mockNode),
  Label: jest.fn(() => mockNode),
  Tag: jest.fn(() => mockNode),
  Arrow: jest.fn(() => mockNode),
  Shape: jest.fn(() => mockNode),
  Sprite: jest.fn(() => mockNode),
  Transformer: jest.fn(() => mockNode),
  
  // Animation and tweening
  Tween: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    reverse: jest.fn(),
    reset: jest.fn(),
    finish: jest.fn(),
    destroy: jest.fn(),
  })),
  
  // Filters
  Filters: {
    Blur: jest.fn(),
    Brighten: jest.fn(),
    Contrast: jest.fn(),
    Emboss: jest.fn(),
    Enhance: jest.fn(),
    Grayscale: jest.fn(),
    HSL: jest.fn(),
    HSV: jest.fn(),
    Invert: jest.fn(),
    Kaleidoscope: jest.fn(),
    Mask: jest.fn(),
    Noise: jest.fn(),
    Pixelate: jest.fn(),
    Posterize: jest.fn(),
    RGB: jest.fn(),
    RGBA: jest.fn(),
    Sepia: jest.fn(),
    Solarize: jest.fn(),
    Threshold: jest.fn(),
  },
  
  // Utilities
  Util: {
    getRandomColor: jest.fn(() => '#000000'),
    getRGB: jest.fn(() => ({ r: 0, g: 0, b: 0 })),
    colorToRGBA: jest.fn(() => ({ r: 0, g: 0, b: 0, a: 1 })),
    _isElement: jest.fn(() => false),
    _isFunction: jest.fn(() => false),
    _isPlainObject: jest.fn(() => false),
    _isArray: jest.fn(() => false),
    _isNumber: jest.fn(() => false),
    _isString: jest.fn(() => false),
    _isBoolean: jest.fn(() => false),
    _getControlPoints: jest.fn(() => []),
    _expandPoints: jest.fn(() => []),
    _getRandomColorKey: jest.fn(() => 'red'),
    degToRad: jest.fn((deg) => deg * Math.PI / 180),
    radToDeg: jest.fn((rad) => rad * 180 / Math.PI),
  },
  
  // Global settings
  pixelRatio: 1,
  dragDistance: 3,
  angleDeg: true,
  showWarnings: true,
  
  // Node types
  Node: jest.fn(() => mockNode),
  Container: jest.fn(() => mockNode),
  
  // Events
  DD: {
    isDragging: false,
    justDragged: false,
    node: null,
  },
};

// Export as both default and named export for compatibility
module.exports = Konva;
module.exports.default = Konva;
