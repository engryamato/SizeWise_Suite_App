// Mock canvas for Jest environment - Node Canvas compatibility only
// DOM canvas mocking is handled in jest.setup.js to avoid conflicts

const mockCanvas = {
  getContext: jest.fn(() => ({
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    getImageData: jest.fn(() => ({
      data: new Uint8ClampedArray(4)
    })),
    putImageData: jest.fn(),
    createImageData: jest.fn(() => ({
      data: new Uint8ClampedArray(4)
    })),
    setTransform: jest.fn(),
    drawImage: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    closePath: jest.fn(),
    stroke: jest.fn(),
    fill: jest.fn(),
    measureText: jest.fn(() => ({ width: 0 })),
    arc: jest.fn(),
    scale: jest.fn(),
    rotate: jest.fn(),
    translate: jest.fn(),
  })),
  toDataURL: jest.fn(() => 'data:image/png;base64,mock'),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  width: 800,
  height: 600,
  style: {},
};

// Mock createCanvas for node-canvas compatibility only
const createCanvas = jest.fn(() => mockCanvas);

module.exports = {
  createCanvas,
  Canvas: jest.fn(() => mockCanvas),
  Image: jest.fn(() => ({
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    src: '',
    width: 0,
    height: 0,
    onload: null,
    onerror: null,
  })),
  ImageData: jest.fn(),
  loadImage: jest.fn(() => Promise.resolve({
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    src: '',
    width: 0,
    height: 0,
    onload: null,
    onerror: null,
  })),
};
