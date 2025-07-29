// Mock for @/stores/export-store
const mockExportStore = {
  isExporting: false,
  exportProgress: 0,
  lastExportResult: null,
  supportedFormats: ['pdf', 'dwg', 'svg', 'png'],
  exportSettings: {
    format: 'pdf',
    quality: 'high',
    includeMetadata: true,
    scale: 1
  },
  exportProject: jest.fn().mockResolvedValue({
    success: true,
    filePath: '/mock/export/path.pdf',
    format: 'pdf'
  }),
  validateExport: jest.fn(() => ({ 
    valid: true, 
    errors: [],
    warnings: []
  })),
  setExportFormat: jest.fn(),
  setExportSettings: jest.fn(),
  cancelExport: jest.fn(),
  clearLastResult: jest.fn()
};

const useExportStore = jest.fn(() => mockExportStore);

module.exports = {
  useExportStore,
  __esModule: true,
  default: useExportStore
};
