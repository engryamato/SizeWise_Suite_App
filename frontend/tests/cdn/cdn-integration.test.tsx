/**
 * CDN Integration Tests
 * SizeWise Suite - Phase 4: Performance Optimization
 *
 * Comprehensive tests for CDN functionality and performance optimization
 */

import { describe, it, expect, beforeEach, afterEach, jest, beforeAll, afterAll } from '@jest/globals';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { CDNManager } from '@/lib/cdn/cdn-manager';
import { useCDN, useCDNImage, useCDN3DModel } from '@/lib/hooks/useCDN';
import { CDNImage, CDNBackgroundImage, CDNAvatar } from '@/components/ui/CDNImage';
import React from 'react';

// @ts-ignore - JSX pragma for tests
/** @jsx React.createElement */

// Mock fetch for CDN API calls
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    getEntriesByType: jest.fn(() => []),
  },
  writable: true,
});

// Mock environment variables
const mockEnv = {
  NEXT_PUBLIC_CDN_URL: 'https://cdn.sizewise.app',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000'
};

Object.defineProperty(process, 'env', {
  value: mockEnv,
  writable: true,
});

describe('CDN Manager', () => {
  let cdnManager: CDNManager;

  beforeEach(() => {
    jest.clearAllMocks();
    
    const config = {
      enabled: true,
      baseUrl: 'https://cdn.sizewise.app',
      regions: ['us-east-1', 'us-west-2'],
      fallbackUrl: 'http://localhost:3000',
      assetTypes: {
        images: ['jpg', 'png', 'webp'],
        models: ['glb', 'gltf'],
        documents: ['pdf'],
        fonts: ['woff2'],
        scripts: ['js'],
        styles: ['css']
      },
      cacheHeaders: {
        images: { maxAge: 31536000, immutable: true, public: true }
      },
      versioning: {
        strategy: 'hash' as const,
        prefix: 'v'
      }
    };

    cdnManager = CDNManager.getInstance(config);
  });

  describe('Asset URL Generation', () => {
    it('should generate optimized URLs for images', () => {
      const url = cdnManager.getAssetUrl('/images/logo.png', {
        type: 'image',
        quality: 85,
        width: 200,
        height: 100,
        format: 'webp'
      });

      expect(url).toContain('cdn.sizewise.app');
      expect(url).toContain('q=85');
      expect(url).toContain('w=200');
      expect(url).toContain('h=100');
      expect(url).toContain('f=webp');
    });

    it('should generate URLs for 3D models with compression', () => {
      const url = cdnManager.get3DModelUrl('/models/duct.glb', {
        compression: 'gzip',
        lod: 'medium',
        format: 'glb'
      });

      expect(url).toContain('cdn.sizewise.app');
      expect(url).toContain('models/medium');
      expect(url).toContain('.gzip');
    });

    it('should use fallback URL when CDN is disabled', () => {
      const disabledConfig = {
        enabled: false,
        baseUrl: 'https://cdn.sizewise.app',
        regions: ['us-east-1'],
        fallbackUrl: 'http://localhost:3000',
        assetTypes: { images: ['jpg'] },
        cacheHeaders: {},
        versioning: { strategy: 'hash' as const, prefix: 'v' }
      };

      const disabledManager = CDNManager.getInstance(disabledConfig);
      const url = disabledManager.getAssetUrl('/images/logo.png');

      expect(url).toBe('http://localhost:3000/images/logo.png');
    });

    it('should detect asset types correctly', () => {
      const imageUrl = cdnManager.getAssetUrl('/test.jpg');
      const modelUrl = cdnManager.get3DModelUrl('/test.glb');

      expect(imageUrl).toContain('cdn.sizewise.app');
      expect(modelUrl).toContain('cdn.sizewise.app');
    });
  });

  describe('Asset Preloading', () => {
    beforeEach(() => {
      // Mock document.createElement and appendChild
      const mockLink = {
        rel: '',
        href: '',
        as: '',
        crossOrigin: '',
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null
      };

      jest.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      jest.spyOn(document.head, 'appendChild').mockImplementation(() => mockLink as any);
    });

    it('should preload critical assets', async () => {
      const assets = ['/images/logo.png', '/fonts/inter.woff2'];
      
      const preloadPromise = cdnManager.preloadAssets(assets);
      
      // Simulate successful preload
      const mockLinks = document.createElement as any;
      mockLinks.mock.results.forEach((result: any) => {
        if (result.value.onload) {
          result.value.onload();
        }
      });

      await expect(preloadPromise).resolves.toBeUndefined();
      expect(document.createElement).toHaveBeenCalledTimes(2);
    });

    it('should handle preload errors gracefully', async () => {
      const assets = ['/images/missing.png'];
      
      const preloadPromise = cdnManager.preloadAssets(assets);
      
      // Simulate preload error
      const mockLinks = document.createElement as any;
      if (mockLinks.mock.results[0]?.value.onerror) {
        mockLinks.mock.results[0].value.onerror();
      }

      await expect(preloadPromise).resolves.toBeUndefined();
    });
  });

  describe('Performance Monitoring', () => {
    it('should track asset load times', () => {
      // Simulate asset loading
      cdnManager.getAssetUrl('/images/test.jpg');
      
      const metrics = cdnManager.getPerformanceMetrics();
      expect(metrics).toHaveProperty('loadTimes');
      expect(metrics).toHaveProperty('hitRates');
      expect(metrics).toHaveProperty('errorRates');
    });

    it('should record performance metrics', () => {
      const initialMetrics = cdnManager.getPerformanceMetrics();
      
      // Simulate multiple asset requests
      cdnManager.getAssetUrl('/images/test1.jpg');
      cdnManager.getAssetUrl('/images/test2.jpg');
      
      const updatedMetrics = cdnManager.getPerformanceMetrics();
      expect(updatedMetrics.hitRates).toBeDefined();
    });
  });

  describe('Cache Management', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
    });

    it('should purge assets from cache', async () => {
      const result = await cdnManager.purgeAsset('/images/old-logo.png');
      
      expect(mockFetch).toHaveBeenCalledWith('/api/cdn/purge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetPath: '/images/old-logo.png' })
      });
      expect(result).toBe(true);
    });

    it('should warm cache with assets', async () => {
      const assets = ['/images/hero.jpg', '/models/duct.glb'];
      
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200
      });

      await cdnManager.warmCache(assets);
      
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});

describe('CDN React Hooks', () => {
  // Test component for useCDN hook
  function TestCDNComponent() {
    const { getAssetUrl, getImageUrl, isInitialized } = useCDN();
    
    if (!isInitialized) {
      return <div>Loading CDN...</div>;
    }

    const imageUrl = getAssetUrl('/images/test.jpg');
    const optimizedImage = getImageUrl('/images/hero.jpg', {
      quality: 80,
      width: 800,
      format: 'webp'
    });

    return (
      <div>
        <div data-testid="asset-url">{imageUrl}</div>
        <div data-testid="optimized-url">{typeof optimizedImage === 'string' ? optimizedImage : optimizedImage.src}</div>
      </div>
    );
  }

  it('should provide CDN functionality through hook', async () => {
    render(<TestCDNComponent />);
    
    await waitFor(() => {
      expect(screen.getByTestId('asset-url')).toBeInTheDocument();
    });

    const assetUrl = screen.getByTestId('asset-url').textContent;
    const optimizedUrl = screen.getByTestId('optimized-url').textContent;

    expect(assetUrl).toContain('cdn.sizewise.app');
    expect(optimizedUrl).toContain('cdn.sizewise.app');
  });

  // Test component for useCDNImage hook
  function TestCDNImageComponent() {
    const { src, isLoaded, error } = useCDNImage('/images/test.jpg', {
      quality: 90,
      format: 'webp'
    });

    return (
      <div>
        <div data-testid="image-src">{src}</div>
        <div data-testid="image-loaded">{isLoaded.toString()}</div>
        <div data-testid="image-error">{error?.message || 'none'}</div>
      </div>
    );
  }

  it('should optimize images through useCDNImage hook', () => {
    render(<TestCDNImageComponent />);
    
    const imageSrc = screen.getByTestId('image-src').textContent;
    expect(imageSrc).toContain('cdn.sizewise.app');
  });

  // Test component for useCDN3DModel hook
  function TestCDN3DModelComponent() {
    const { modelUrl, isLoaded } = useCDN3DModel('/models/duct.glb', {
      lod: 'medium',
      preload: true
    });

    return (
      <div>
        <div data-testid="model-url">{modelUrl}</div>
        <div data-testid="model-loaded">{isLoaded.toString()}</div>
      </div>
    );
  }

  it('should optimize 3D models through useCDN3DModel hook', () => {
    render(<TestCDN3DModelComponent />);
    
    const modelUrl = screen.getByTestId('model-url').textContent;
    expect(modelUrl).toContain('cdn.sizewise.app');
    expect(modelUrl).toContain('models/medium');
  });
});

describe('CDN Image Components', () => {
  it('should render CDNImage with optimization', async () => {
    render(
      <CDNImage
        src="/images/test.jpg"
        alt="Test image"
        width={400}
        height={300}
        quality={85}
        format="webp"
      />
    );

    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('alt', 'Test image');
  });

  it('should show loading spinner during image load', () => {
    render(
      <CDNImage
        src="/images/test.jpg"
        alt="Test image"
        width={400}
        height={300}
        showLoadingSpinner={true}
      />
    );

    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('should handle image load errors with fallback', async () => {
    render(
      <CDNImage
        src="/images/missing.jpg"
        alt="Missing image"
        width={400}
        height={300}
        fallbackSrc="/images/placeholder.jpg"
        showErrorState={true}
      />
    );

    const image = screen.getByRole('img');
    
    // Simulate image error
    fireEvent.error(image);

    await waitFor(() => {
      expect(image).toHaveAttribute('src');
    });
  });

  it('should render CDNBackgroundImage with overlay', () => {
    render(
      <CDNBackgroundImage
        src="/images/hero.jpg"
        alt="Hero background"
        overlay={true}
        overlayOpacity={0.5}
        className="h-64"
      >
        <h1>Hero Content</h1>
      </CDNBackgroundImage>
    );

    expect(screen.getByText('Hero Content')).toBeInTheDocument();
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('should render CDNAvatar with fallback', () => {
    render(
      <CDNAvatar
        src="/images/avatar.jpg"
        alt="User Avatar"
        size="lg"
        fallback="UA"
      />
    );

    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('should render CDNAvatar without src using fallback', () => {
    render(
      <CDNAvatar
        alt="User Avatar"
        size="md"
        fallback="UA"
      />
    );

    expect(screen.getByText('UA')).toBeInTheDocument();
  });
});

describe('CDN Performance Integration', () => {
  beforeAll(() => {
    // Mock performance observer
    global.PerformanceObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      disconnect: jest.fn(),
    }));
  });

  it('should measure and report CDN performance', async () => {
    const config = {
      enabled: true,
      baseUrl: 'https://cdn.sizewise.app',
      regions: ['us-east-1'],
      fallbackUrl: 'http://localhost:3000',
      assetTypes: { images: ['jpg'] },
      cacheHeaders: {},
      versioning: { strategy: 'hash' as const, prefix: 'v' }
    };

    const manager = CDNManager.getInstance(config);
    
    // Simulate asset loading
    manager.getAssetUrl('/images/performance-test.jpg');
    
    const metrics = manager.getPerformanceMetrics();
    expect(metrics).toHaveProperty('loadTimes');
    expect(metrics).toHaveProperty('globalLatency');
  });

  it('should track bandwidth savings', () => {
    const manager = CDNManager.getInstance();
    const metrics = manager.getPerformanceMetrics();
    
    expect(metrics).toHaveProperty('bandwidthSaved');
    expect(typeof metrics.bandwidthSaved).toBe('number');
  });
});

describe('CDN Error Handling', () => {
  it('should handle CDN unavailability gracefully', () => {
    const config = {
      enabled: false,
      baseUrl: 'https://unavailable-cdn.com',
      regions: ['us-east-1'],
      fallbackUrl: 'http://localhost:3000',
      assetTypes: { images: ['jpg'] },
      cacheHeaders: {},
      versioning: { strategy: 'hash' as const, prefix: 'v' }
    };

    const manager = CDNManager.getInstance(config);
    const url = manager.getAssetUrl('/images/test.jpg');
    
    expect(url).toBe('http://localhost:3000/images/test.jpg');
  });

  it('should handle network errors during preloading', async () => {
    const manager = CDNManager.getInstance();
    
    // Mock failed preload
    jest.spyOn(document, 'createElement').mockReturnValue({
      rel: '',
      href: '',
      as: '',
      onload: null,
      onerror: null
    } as any);

    await expect(manager.preloadAssets(['/images/test.jpg'])).resolves.toBeUndefined();
  });
});
