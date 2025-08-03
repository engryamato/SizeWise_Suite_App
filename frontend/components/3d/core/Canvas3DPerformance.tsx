/**
 * Canvas3D Performance Component
 * SizeWise Suite - Phase 5: Architecture Modernization
 * 
 * Performance optimization and monitoring extracted from Canvas3D.tsx
 */

"use client";

import React, { useRef, useCallback, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { PerformanceConfig } from '../types/Canvas3DTypes';

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  renderTime: number;
}

interface Canvas3DPerformanceProps {
  config: PerformanceConfig;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  enableMonitoring?: boolean;
  adaptiveQuality?: boolean;
  targetFPS?: number;
  children?: React.ReactNode;
}

// Performance monitor component
const PerformanceMonitor: React.FC<{
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  enableMonitoring: boolean;
  targetFPS: number;
}> = ({ onMetricsUpdate, enableMonitoring, targetFPS }) => {
  const { gl, scene } = useThree();
  const metricsRef = useRef<PerformanceMetrics>({
    fps: 0,
    frameTime: 0,
    memoryUsage: 0,
    drawCalls: 0,
    triangles: 0,
    geometries: 0,
    textures: 0,
    renderTime: 0
  });
  
  const frameTimeHistory = useRef<number[]>([]);
  const lastTime = useRef(performance.now());
  const frameCount = useRef(0);
  const updateInterval = useRef<NodeJS.Timeout | null>(null);

  // Calculate performance metrics
  const calculateMetrics = useCallback(() => {
    const now = performance.now();
    const deltaTime = now - lastTime.current;
    lastTime.current = now;

    // Update frame time history
    frameTimeHistory.current.push(deltaTime);
    if (frameTimeHistory.current.length > 60) {
      frameTimeHistory.current.shift();
    }

    // Calculate FPS
    const avgFrameTime = frameTimeHistory.current.reduce((a, b) => a + b, 0) / frameTimeHistory.current.length;
    const fps = 1000 / avgFrameTime;

    // Get WebGL info
    const info = gl.info;
    const memory = (gl as any).info?.memory || {};

    const metrics: PerformanceMetrics = {
      fps: Math.round(fps),
      frameTime: Math.round(avgFrameTime * 100) / 100,
      memoryUsage: memory.geometries || 0,
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      geometries: memory.geometries || 0,
      textures: memory.textures || 0,
      renderTime: deltaTime
    };

    metricsRef.current = metrics;

    if (onMetricsUpdate) {
      onMetricsUpdate(metrics);
    }
  }, [gl, onMetricsUpdate]);

  // Frame update
  useFrame(() => {
    if (!enableMonitoring) return;
    
    frameCount.current++;
    
    // Update metrics every 30 frames
    if (frameCount.current % 30 === 0) {
      calculateMetrics();
    }
  });

  // Setup monitoring interval
  useEffect(() => {
    if (enableMonitoring) {
      updateInterval.current = setInterval(calculateMetrics, 1000);
    } else if (updateInterval.current) {
      clearInterval(updateInterval.current);
      updateInterval.current = null;
    }

    return () => {
      if (updateInterval.current) {
        clearInterval(updateInterval.current);
      }
    };
  }, [enableMonitoring, calculateMetrics]);

  return null;
};

// Adaptive quality controller
const AdaptiveQualityController: React.FC<{
  config: PerformanceConfig;
  targetFPS: number;
  currentFPS: number;
  onConfigUpdate: (config: Partial<PerformanceConfig>) => void;
}> = ({ config, targetFPS, currentFPS, onConfigUpdate }) => {
  const adjustmentHistory = useRef<number[]>([]);
  const lastAdjustment = useRef(0);

  // Adjust quality based on performance
  const adjustQuality = useCallback(() => {
    const now = Date.now();
    
    // Don't adjust too frequently
    if (now - lastAdjustment.current < 2000) return;
    
    const fpsRatio = currentFPS / targetFPS;
    adjustmentHistory.current.push(fpsRatio);
    
    // Keep only recent history
    if (adjustmentHistory.current.length > 10) {
      adjustmentHistory.current.shift();
    }
    
    // Calculate average performance over time
    const avgRatio = adjustmentHistory.current.reduce((a, b) => a + b, 0) / adjustmentHistory.current.length;
    
    let newConfig: Partial<PerformanceConfig> = {};
    
    if (avgRatio < 0.8) {
      // Performance is poor, reduce quality
      if (config.enableShadows) {
        newConfig.enableShadows = false;
      } else if (config.enableAntialiasing) {
        newConfig.enableAntialiasing = false;
      } else if (config.pixelRatio > 1) {
        newConfig.pixelRatio = Math.max(1, config.pixelRatio - 0.25);
      } else if (config.frameloop === 'always') {
        newConfig.frameloop = 'demand';
      }
    } else if (avgRatio > 1.2) {
      // Performance is good, increase quality
      if (config.frameloop === 'demand') {
        newConfig.frameloop = 'always';
      } else if (config.pixelRatio < 2) {
        newConfig.pixelRatio = Math.min(2, config.pixelRatio + 0.25);
      } else if (!config.enableAntialiasing) {
        newConfig.enableAntialiasing = true;
      } else if (!config.enableShadows) {
        newConfig.enableShadows = true;
      }
    }
    
    if (Object.keys(newConfig).length > 0) {
      onConfigUpdate(newConfig);
      lastAdjustment.current = now;
    }
  }, [config, targetFPS, currentFPS, onConfigUpdate]);

  // Monitor performance and adjust
  useEffect(() => {
    const interval = setInterval(adjustQuality, 3000);
    return () => clearInterval(interval);
  }, [adjustQuality]);

  return null;
};

// Level of Detail (LOD) controller
const LODController: React.FC<{
  cameraPosition: Vector3;
  objects: Array<{ id: string; position: Vector3; lodLevels?: number[] }>;
  onLODChange: (objectId: string, lodLevel: number) => void;
}> = ({ cameraPosition, objects, onLODChange }) => {
  const lodDistances = useMemo(() => [10, 25, 50, 100], []);

  // Calculate LOD levels based on distance
  const calculateLOD = useCallback(() => {
    objects.forEach(obj => {
      const distance = cameraPosition.distanceTo(obj.position);
      
      let lodLevel = 0;
      for (let i = 0; i < lodDistances.length; i++) {
        if (distance > lodDistances[i]) {
          lodLevel = i + 1;
        } else {
          break;
        }
      }
      
      // Clamp to available LOD levels
      const maxLOD = obj.lodLevels?.length || 4;
      lodLevel = Math.min(lodLevel, maxLOD - 1);
      
      onLODChange(obj.id, lodLevel);
    });
  }, [cameraPosition, objects, lodDistances, onLODChange]);

  // Update LOD on camera movement
  useFrame(() => {
    calculateLOD();
  });

  return null;
};

// Memory manager
const MemoryManager: React.FC<{
  maxMemoryUsage: number;
  onMemoryWarning: (usage: number) => void;
}> = ({ maxMemoryUsage, onMemoryWarning }) => {
  const { gl } = useThree();
  const lastCleanup = useRef(0);

  // Monitor memory usage
  const checkMemoryUsage = useCallback(() => {
    const info = gl.info;
    const memory = (info as any).memory;
    
    if (memory) {
      const totalUsage = memory.geometries + memory.textures;
      
      if (totalUsage > maxMemoryUsage) {
        onMemoryWarning(totalUsage);
        
        // Trigger cleanup if needed
        const now = Date.now();
        if (now - lastCleanup.current > 5000) {
          gl.dispose();
          lastCleanup.current = now;
        }
      }
    }
  }, [gl, maxMemoryUsage, onMemoryWarning]);

  useFrame(() => {
    checkMemoryUsage();
  });

  return null;
};

// Main Canvas3D Performance component
export const Canvas3DPerformance: React.FC<Canvas3DPerformanceProps> = ({
  config,
  onMetricsUpdate,
  enableMonitoring = true,
  adaptiveQuality = true,
  targetFPS = 60,
  children
}) => {
  const [currentConfig, setCurrentConfig] = React.useState(config);
  const [currentMetrics, setCurrentMetrics] = React.useState<PerformanceMetrics>({
    fps: 0,
    frameTime: 0,
    memoryUsage: 0,
    drawCalls: 0,
    triangles: 0,
    geometries: 0,
    textures: 0,
    renderTime: 0
  });

  // Handle config updates
  const handleConfigUpdate = useCallback((newConfig: Partial<PerformanceConfig>) => {
    setCurrentConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  // Handle metrics updates
  const handleMetricsUpdate = useCallback((metrics: PerformanceMetrics) => {
    setCurrentMetrics(metrics);
    if (onMetricsUpdate) {
      onMetricsUpdate(metrics);
    }
  }, [onMetricsUpdate]);

  // Handle memory warnings
  const handleMemoryWarning = useCallback((usage: number) => {
    console.warn(`High memory usage detected: ${usage} MB`);
    // Could trigger additional cleanup or quality reduction
  }, []);

  return (
    <>
      {/* Performance Monitor */}
      <PerformanceMonitor
        onMetricsUpdate={handleMetricsUpdate}
        enableMonitoring={enableMonitoring}
        targetFPS={targetFPS}
      />

      {/* Adaptive Quality Controller */}
      {adaptiveQuality && (
        <AdaptiveQualityController
          config={currentConfig}
          targetFPS={targetFPS}
          currentFPS={currentMetrics.fps}
          onConfigUpdate={handleConfigUpdate}
        />
      )}

      {/* Memory Manager */}
      <MemoryManager
        maxMemoryUsage={500} // 500 MB limit
        onMemoryWarning={handleMemoryWarning}
      />

      {children}
    </>
  );
};

// Performance utilities
export const PerformanceUtils = {
  /**
   * Get optimal performance config for device
   */
  getOptimalConfig: (): PerformanceConfig => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isLowEnd = navigator.hardwareConcurrency <= 4;
    
    return {
      enableShadows: !isMobile && !isLowEnd,
      enableAntialiasing: !isMobile,
      pixelRatio: isMobile ? 1 : Math.min(window.devicePixelRatio, 2),
      frameloop: isMobile ? 'demand' : 'always',
      powerPreference: isMobile ? 'low-power' : 'high-performance'
    };
  },

  /**
   * Calculate performance score
   */
  calculatePerformanceScore: (metrics: PerformanceMetrics, targetFPS: number = 60): number => {
    const fpsScore = Math.min(metrics.fps / targetFPS, 1) * 40;
    const frameTimeScore = Math.max(0, (50 - metrics.frameTime) / 50) * 30;
    const memoryScore = Math.max(0, (1000 - metrics.memoryUsage) / 1000) * 20;
    const drawCallScore = Math.max(0, (1000 - metrics.drawCalls) / 1000) * 10;
    
    return Math.round(fpsScore + frameTimeScore + memoryScore + drawCallScore);
  },

  /**
   * Get performance recommendations
   */
  getPerformanceRecommendations: (metrics: PerformanceMetrics, config: PerformanceConfig): string[] => {
    const recommendations: string[] = [];
    
    if (metrics.fps < 30) {
      recommendations.push('Consider reducing quality settings for better performance');
    }
    
    if (metrics.frameTime > 33) {
      recommendations.push('Frame time is high, consider optimizing geometry or reducing complexity');
    }
    
    if (metrics.drawCalls > 500) {
      recommendations.push('High draw call count, consider batching geometry');
    }
    
    if (metrics.triangles > 100000) {
      recommendations.push('High triangle count, consider using LOD or simplifying models');
    }
    
    if (config.enableShadows && metrics.fps < 45) {
      recommendations.push('Disable shadows to improve performance');
    }
    
    if (config.enableAntialiasing && metrics.fps < 40) {
      recommendations.push('Disable antialiasing to improve performance');
    }
    
    return recommendations;
  }
};
