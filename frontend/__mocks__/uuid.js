// Mock UUID for Jest environment
// Provides consistent UUIDs for testing

let counter = 0;

const v1 = jest.fn(() => {
  counter++;
  return `mock-uuid-v1-${counter.toString().padStart(3, '0')}`;
});

const v4 = jest.fn(() => {
  counter++;
  return `mock-uuid-v4-${counter.toString().padStart(3, '0')}`;
});

const validate = jest.fn((uuid) => {
  return typeof uuid === 'string' && uuid.includes('mock-uuid');
});

const version = jest.fn((uuid) => {
  if (uuid.includes('v1')) return 1;
  if (uuid.includes('v4')) return 4;
  return null;
});

module.exports = {
  v1,
  v4,
  validate,
  version,
  default: {
    v1,
    v4,
    validate,
    version,
  }
};
