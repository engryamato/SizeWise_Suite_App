/**
 * Asset Optimization Test Suite
 * SizeWise Suite - Phase 4: Performance Optimization
 * 
 * Comprehensive tests for asset optimization functionality
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AssetOptimizer } from '@/lib/optimization/asset-optimizer';
import { 
  useAssetOptimization, 
  useOptimizedImage, 
  useOptimized3DModel,
  useResponsiveImages,
  useAssetMetrics 
} from '@/lib/hooks/useAssetOptimization';
import { OptimizedImage, ResponsiveImage, HVACIcon, AssetMetricsDisplay } from '@/components/ui/OptimizedImage';

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, onLoad, onError, ...props }: any) {
    return (
      <img
        src={src}
        alt={alt}
        onLoad={onLoad}
        onError={onError}
        data-testid="mock-image"
        {...props}
      />
    );
  };
});

// Mock Three.js components
jest.mock('@react-three/fiber', () => ({
  Canvas: ({ children, ...props }: any) => (
    <div data-testid="mock-canvas" {...props}>
      {children}
    </div>
  )
}));

jest.mock('@react-three/drei', () => ({
  OrbitControls: () => <div data-testid="mock-orbit-controls" />,
  useGLTF: jest.fn(() => ({ scene: {} })),
  useFBX: jest.fn(() => ({})),
  Html: ({ children }: any) => <div data-testid="mock-html">{children}</div>,
  Center: ({ children }: any) => <div data-testid="mock-center">{children}</div>
}));

describe('Asset Optimization', () => {
  describe('AssetOptimizer Class', () => {
    let optimizer: AssetOptimizer;

    beforeEach(() => {
      optimizer = new AssetOptimizer();
    });

    test('should initialize with default configuration', () => {
      expect(optimizer).toBeDefined();
      const metrics = optimizer.getMetrics();
      expect(metrics.totalAssets).toBe(0);
      expect(metrics.totalOriginalSize).toBe(0);
      expect(metrics.totalOptimizedSize).toBe(0);
    });

    test('should optimize image with default settings', async () => {
      const result = await optimizer.optimizeImage('/test/image.jpg');
      
      expect(result).toHaveProperty('originalSize');
      expect(result).toHaveProperty('optimizedSize');
      expect(result).toHaveProperty('compressionRatio');
      expect(result).toHaveProperty('format', 'webp');
      expect(result).toHaveProperty('optimizedUrl');
      expect(result.optimizedSize).toBeLessThan(result.originalSize);
    });

    test('should optimize image with custom options', async () => {
      const options = {
        quality: 70,
        format: 'avif',
        width: 800,
        height: 600,
        progressive: true
      };

      const result = await optimizer.optimizeImage('/test/image.jpg', options);
      
      expect(result.format).toBe('avif');
      expect(result.metadata.quality).toBe(70);
      expect(result.metadata.width).toBe(800);
      expect(result.metadata.height).toBe(600);
      expect(result.metadata.progressive).toBe(true);
    });

    test('should optimize 3D model with default settings', async () => {
      const result = await optimizer.optimize3DModel('/test/model.glb');
      
      expect(result).toHaveProperty('originalSize');
      expect(result).toHaveProperty('optimizedSize');
      expect(result).toHaveProperty('compressionRatio');
      expect(result).toHaveProperty('format', 'glb');
      expect(result).toHaveProperty('optimizedUrl');
      expect(result.optimizedSize).toBeLessThan(result.originalSize);
    });

    test('should optimize 3D model with custom options', async () => {
      const options = {
        compression: 'brotli' as const,
        lodLevel: 3,
        format: 'gltf'
      };

      const result = await optimizer.optimize3DModel('/test/model.glb', options);
      
      expect(result.format).toBe('gltf');
      expect(result.metadata.compression).toBe('brotli');
      expect(result.metadata.lod_level).toBe(3);
    });

    test('should generate responsive images', async () => {
      const results = await optimizer.generateResponsiveImages('/test/image.jpg');
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      results.forEach(result => {
        expect(result).toHaveProperty('originalSize');
        expect(result).toHaveProperty('optimizedSize');
        expect(result).toHaveProperty('compressionRatio');
        expect(result).toHaveProperty('optimizedUrl');
      });
    });

    test('should update metrics after optimizations', async () => {
      await optimizer.optimizeImage('/test/image1.jpg');
      await optimizer.optimizeImage('/test/image2.jpg');
      await optimizer.optimize3DModel('/test/model.glb');

      const metrics = optimizer.getMetrics();
      
      expect(metrics.totalAssets).toBe(3);
      expect(metrics.totalOriginalSize).toBeGreaterThan(0);
      expect(metrics.totalOptimizedSize).toBeGreaterThan(0);
      expect(metrics.averageCompressionRatio).toBeGreaterThan(0);
      expect(metrics.optimizationsByType).toHaveProperty('image');
      expect(metrics.optimizationsByType).toHaveProperty('model');
    });

    test('should clear cache and reset metrics', () => {
      optimizer.clearCache();
      const metrics = optimizer.getMetrics();
      
      expect(metrics.totalAssets).toBe(0);
      expect(metrics.totalOriginalSize).toBe(0);
      expect(metrics.totalOptimizedSize).toBe(0);
    });
  });

  describe('Asset Optimization Hooks', () => {
    // Test component for hooks
    function TestComponent() {
      const { isInitialized, metrics, optimizeImage } = useAssetOptimization();
      
      return (
        <div>
          <div data-testid="initialized">{isInitialized ? 'true' : 'false'}</div>
          <div data-testid="metrics">{JSON.stringify(metrics)}</div>
          <button 
            onClick={() => optimizeImage('/test/image.jpg')}
            data-testid="optimize-button"
          >
            Optimize
          </button>
        </div>
      );
    }

    test('useAssetOptimization hook should initialize', async () => {
      render(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('initialized')).toHaveTextContent('true');
      });
    });

    test('useOptimizedImage hook should optimize image', async () => {
      function TestImageComponent() {
        const { src, isLoading, error, compressionRatio } = useOptimizedImage('/test/image.jpg');
        
        return (
          <div>
            <div data-testid="src">{src}</div>
            <div data-testid="loading">{isLoading ? 'true' : 'false'}</div>
            <div data-testid="error">{error ? error.message : 'none'}</div>
            <div data-testid="compression">{compressionRatio}</div>
          </div>
        );
      }

      render(<TestImageComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });
      
      expect(screen.getByTestId('src')).toHaveTextContent('https://cdn.sizewise.app/optimized/test/image.jpg');
      expect(screen.getByTestId('error')).toHaveTextContent('none');
    });

    test('useOptimized3DModel hook should optimize model', async () => {
      function TestModelComponent() {
        const { url, isLoading, error, compressionRatio } = useOptimized3DModel('/test/model.glb');
        
        return (
          <div>
            <div data-testid="url">{url}</div>
            <div data-testid="loading">{isLoading ? 'true' : 'false'}</div>
            <div data-testid="error">{error ? error.message : 'none'}</div>
            <div data-testid="compression">{compressionRatio}</div>
          </div>
        );
      }

      render(<TestModelComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });
      
      expect(screen.getByTestId('url')).toHaveTextContent('https://cdn.sizewise.app/optimized/test/model.glb');
      expect(screen.getByTestId('error')).toHaveTextContent('none');
    });

    test('useResponsiveImages hook should generate responsive images', async () => {
      function TestResponsiveComponent() {
        const { responsiveImages, srcSet, isLoading } = useResponsiveImages('/test/image.jpg');
        
        return (
          <div>
            <div data-testid="count">{responsiveImages.length}</div>
            <div data-testid="srcset">{srcSet}</div>
            <div data-testid="loading">{isLoading ? 'true' : 'false'}</div>
          </div>
        );
      }

      render(<TestResponsiveComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });
      
      expect(parseInt(screen.getByTestId('count').textContent || '0')).toBeGreaterThan(0);
      expect(screen.getByTestId('srcset')).toHaveTextContent('cdn.sizewise.app');
    });
  });

  describe('Optimized Image Components', () => {
    test('OptimizedImage should render with optimization', async () => {
      render(
        <OptimizedImage
          src="/test/image.jpg"
          alt="Test image"
          width={800}
          height={600}
          quality={85}
          format="webp"
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('mock-image')).toBeInTheDocument();
      });

      const image = screen.getByTestId('mock-image');
      expect(image).toHaveAttribute('alt', 'Test image');
    });

    test('ResponsiveImage should render with responsive optimization', async () => {
      render(
        <ResponsiveImage
          src="/test/image.jpg"
          alt="Test responsive image"
          width={800}
          height={600}
          responsive={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('mock-image')).toBeInTheDocument();
      });

      const image = screen.getByTestId('mock-image');
      expect(image).toHaveAttribute('alt', 'Test responsive image');
    });

    test('HVACIcon should render optimized icon', () => {
      render(
        <HVACIcon
          icon="duct"
          size="md"
          optimized={true}
        />
      );

      expect(screen.getByTestId('mock-image')).toBeInTheDocument();
      const image = screen.getByTestId('mock-image');
      expect(image).toHaveAttribute('alt', 'HVAC duct icon');
    });

    test('AssetMetricsDisplay should show optimization metrics', async () => {
      render(<AssetMetricsDisplay showDetails={true} />);

      await waitFor(() => {
        expect(screen.getByText('Asset Optimization')).toBeInTheDocument();
      });

      expect(screen.getByText('Assets')).toBeInTheDocument();
      expect(screen.getByText('Saved')).toBeInTheDocument();
      expect(screen.getByText('Original')).toBeInTheDocument();
      expect(screen.getByText('Optimized')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('should handle image optimization errors gracefully', async () => {
      const optimizer = new AssetOptimizer();
      
      // Mock an error scenario
      jest.spyOn(optimizer, 'optimizeImage').mockRejectedValueOnce(new Error('Optimization failed'));
      
      await expect(optimizer.optimizeImage('/invalid/path.jpg')).rejects.toThrow('Optimization failed');
    });

    test('OptimizedImage should show error state', async () => {
      render(
        <OptimizedImage
          src="/invalid/image.jpg"
          alt="Invalid image"
          width={800}
          height={600}
          showErrorState={true}
        />
      );

      const image = screen.getByTestId('mock-image');
      fireEvent.error(image);

      await waitFor(() => {
        expect(screen.getByText('Failed to load image')).toBeInTheDocument();
      });
    });
  });

  describe('Performance Metrics', () => {
    test('should track compression ratios accurately', async () => {
      const optimizer = new AssetOptimizer();
      
      await optimizer.optimizeImage('/test/image1.jpg', { quality: 50 });
      await optimizer.optimizeImage('/test/image2.jpg', { quality: 90 });
      
      const metrics = optimizer.getMetrics();
      
      expect(metrics.averageCompressionRatio).toBeGreaterThan(0);
      expect(metrics.optimizationsByType.image.count).toBe(2);
    });

    test('should calculate size savings correctly', async () => {
      const optimizer = new AssetOptimizer();
      
      const result = await optimizer.optimizeImage('/test/large-image.jpg');
      
      expect(result.compressionRatio).toBeGreaterThan(0);
      expect(result.compressionRatio).toBeLessThan(1);
      expect(result.optimizedSize).toBeLessThan(result.originalSize);
    });
  });
});
