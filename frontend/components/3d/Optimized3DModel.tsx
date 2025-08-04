/**
 * Optimized 3D Model Component
 * SizeWise Suite - Phase 4: Performance Optimization
 * 
 * High-performance 3D model loading with automatic optimization
 */

'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, useFBX, Html, Center } from '@react-three/drei';
import { useOptimized3DModel } from '@/lib/hooks/useAssetOptimization';
import { cn } from '@/lib/utils';

export interface Optimized3DModelProps {
  modelPath: string;
  compression?: 'gzip' | 'brotli' | 'none';
  lodLevel?: number;
  format?: 'glb' | 'gltf' | 'obj' | 'fbx';
  preload?: boolean;
  className?: string;
  containerClassName?: string;
  showControls?: boolean;
  showLoadingProgress?: boolean;
  showCompressionInfo?: boolean;
  autoRotate?: boolean;
  enableZoom?: boolean;
  onLoadComplete?: () => void;
  onError?: (error: Error) => void;
  fallbackComponent?: React.ReactNode;
}

/**
 * Internal 3D Model Loader Component
 */
function Model3DLoader({ 
  url, 
  format, 
  onLoadComplete, 
  onError 
}: { 
  url: string; 
  format: string; 
  onLoadComplete?: () => void; 
  onError?: (error: Error) => void; 
}) {
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Load model based on format - always call hooks but conditionally use results
  const shouldLoadGLTF = format === 'glb' || format === 'gltf' || (!format || (format !== 'fbx'));
  const shouldLoadFBX = format === 'fbx';

  // Always call hooks to maintain hook order
  const gltfResult = useGLTF(url);
  const fbxResult = useFBX(url);

  // Handle load completion
  useEffect(() => {
    if ((shouldLoadGLTF && gltfResult?.scene) || (shouldLoadFBX && fbxResult)) {
      onLoadComplete?.();
    }
  }, [shouldLoadGLTF, gltfResult?.scene, shouldLoadFBX, fbxResult, onLoadComplete]);

  // Render the appropriate model
  const renderModel = useCallback(() => {
    try {
      if (shouldLoadGLTF && gltfResult?.scene) {
        return <primitive object={gltfResult.scene} />;
      } else if (shouldLoadFBX && fbxResult) {
        return <primitive object={fbxResult} />;
      }
      return null;
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to load 3D model'));
      return null;
    }
  }, [shouldLoadGLTF, gltfResult?.scene, shouldLoadFBX, fbxResult, onError]);

  return (
    <Center>
      {renderModel()}
    </Center>
  );
}

/**
 * Loading Component for 3D Models
 */
function Model3DLoading({ progress }: { progress?: number }) {
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Loading 3D Model...</p>
        {progress !== undefined && (
          <div className="w-32 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}
      </div>
    </Html>
  );
}

/**
 * Error Component for 3D Models
 */
function Model3DError({ error, fallback }: { error?: Error; fallback?: React.ReactNode }) {
  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <Html center>
      <div className="flex flex-col items-center justify-center p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
        <svg className="h-12 w-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <p className="text-sm text-red-600 dark:text-red-400 text-center">
          Failed to load 3D model
          {error && (
            <span className="block text-xs mt-1 opacity-75">
              {error.message}
            </span>
          )}
        </p>
      </div>
    </Html>
  );
}

/**
 * Main Optimized 3D Model Component
 */
function Optimized3DModelComponent({
  modelPath,
  compression = 'gzip',
  lodLevel = 1,
  format = 'glb',
  preload = false,
  className,
  containerClassName,
  showControls = true,
  showLoadingProgress = true,
  showCompressionInfo = false,
  autoRotate = false,
  enableZoom = true,
  onLoadComplete,
  onError,
  fallbackComponent
}: Optimized3DModelProps) {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [modelError, setModelError] = useState<Error | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    url: optimizedUrl,
    metadata,
    optimizationResult,
    isLoading: isOptimizing,
    error: optimizationError,
    compressionRatio
  } = useOptimized3DModel(modelPath, {
    compression,
    lodLevel,
    format,
    preload
  });

  const handleModelLoad = useCallback(() => {
    setIsModelLoaded(true);
    setModelError(null);
    onLoadComplete?.();
  }, [onLoadComplete]);

  const handleModelError = useCallback((error: Error) => {
    setModelError(error);
    setIsModelLoaded(false);
    onError?.(error);
  }, [onError]);

  // Handle optimization errors
  useEffect(() => {
    if (optimizationError) {
      handleModelError(optimizationError);
    }
  }, [optimizationError, handleModelError]);

  return (
    <div className={cn('relative w-full h-full', containerClassName)}>
      {/* Compression Info */}
      {showCompressionInfo && optimizationResult && isModelLoaded && (
        <div className="absolute top-4 right-4 z-10 bg-black bg-opacity-75 text-white text-xs px-3 py-2 rounded">
          <div>LOD: {metadata?.quality || lodLevel}</div>
          <div>{(compressionRatio * 100).toFixed(1)}% saved</div>
          <div>{compression.toUpperCase()}</div>
        </div>
      )}

      {/* 3D Canvas */}
      <Canvas
        ref={canvasRef}
        className={cn('w-full h-full', className)}
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl }) => {
          gl.setClearColor('#f8fafc', 0);
        }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />

        {/* Controls */}
        {showControls && (
          <OrbitControls
            enablePan={true}
            enableZoom={enableZoom}
            enableRotate={true}
            autoRotate={autoRotate}
            autoRotateSpeed={2}
            dampingFactor={0.05}
            enableDamping={true}
          />
        )}

        {/* 3D Model */}
        <Suspense 
          fallback={showLoadingProgress ? <Model3DLoading /> : null}
        >
          {optimizedUrl && !modelError ? (
            <Model3DLoader
              url={optimizedUrl}
              format={format}
              onLoadComplete={handleModelLoad}
              onError={handleModelError}
            />
          ) : modelError ? (
            <Model3DError error={modelError} fallback={fallbackComponent} />
          ) : null}
        </Suspense>
      </Canvas>

      {/* Loading Overlay */}
      {(isOptimizing || !isModelLoaded) && !modelError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 bg-opacity-90">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {isOptimizing ? 'Optimizing 3D model...' : 'Loading 3D model...'}
            </p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {modelError && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 dark:bg-red-900/20">
          <div className="text-center p-6">
            <svg className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-2">
              Failed to load 3D model
            </h3>
            <p className="text-sm text-red-500 dark:text-red-300">
              {modelError.message}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * HVAC 3D Model Component with predefined optimizations
 */
export interface HVAC3DModelProps extends Omit<Optimized3DModelProps, 'modelPath'> {
  modelType: 'duct-elbow' | 'duct-tee' | 'duct-reducer' | 'duct-transition' | 'damper' | 'fan';
  size?: 'sm' | 'md' | 'lg';
}

export function HVAC3DModel({ 
  modelType, 
  size = 'md',
  className,
  ...props 
}: HVAC3DModelProps) {
  const modelPaths = {
    'duct-elbow': '/models/hvac/duct-elbow.glb',
    'duct-tee': '/models/hvac/duct-tee.glb',
    'duct-reducer': '/models/hvac/duct-reducer.glb',
    'duct-transition': '/models/hvac/duct-transition.glb',
    'damper': '/models/hvac/damper.glb',
    'fan': '/models/hvac/fan.glb'
  };

  const sizeClasses = {
    sm: 'h-32',
    md: 'h-48',
    lg: 'h-64'
  };

  return (
    <Optimized3DModelComponent
      modelPath={modelPaths[modelType]}
      compression="gzip"
      lodLevel={size === 'sm' ? 1 : size === 'md' ? 2 : 3}
      format="glb"
      preload={true}
      className={cn(sizeClasses[size], className)}
      showCompressionInfo={true}
      autoRotate={true}
      {...props}
    />
  );
}

// Export the main component as default
export default Optimized3DModelComponent;
