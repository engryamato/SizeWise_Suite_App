"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createPerformanceMonitor, GPUPerformanceMonitor } from '@/lib/utils/performance';

interface PerformanceMonitorProps {
  enabled?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showDetails?: boolean;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  enabled = process.env.NODE_ENV === 'development',
  position = 'top-right',
  showDetails = false
}) => {
  const [metrics, setMetrics] = useState({
    fps: 0,
    quality: 1.0,
    recommendations: [] as string[]
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const monitorRef = useRef<GPUPerformanceMonitor | null>(null);
  const frameCountRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    monitorRef.current = createPerformanceMonitor();
    
    const updateMetrics = () => {
      if (monitorRef.current) {
        frameCountRef.current++;
        
        // Record metrics every frame
        monitorRef.current.recordMetrics(1, 100); // 1 render call, 100 particles (example)
        
        // Update UI every 30 frames (roughly once per second at 30fps)
        if (frameCountRef.current % 30 === 0) {
          const summary = monitorRef.current.getPerformanceSummary();
          setMetrics({
            fps: Math.round(summary.averageFPS),
            quality: Math.round(summary.currentQuality * 100) / 100,
            recommendations: summary.recommendations
          });
        }
      }
      
      requestAnimationFrame(updateMetrics);
    };

    requestAnimationFrame(updateMetrics);

    return () => {
      // Cleanup is handled by the monitor itself
    };
  }, [enabled]);

  if (!enabled) return null;

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  const getFPSColor = (fps: number) => {
    if (fps >= 25) return 'text-green-500';
    if (fps >= 15) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getQualityColor = (quality: number) => {
    if (quality >= 0.8) return 'text-green-500';
    if (quality >= 0.5) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div 
      className={`fixed ${positionClasses[position]} z-50 bg-black/80 backdrop-blur-sm text-white rounded-lg p-3 font-mono text-sm transition-all duration-200 ${
        isExpanded ? 'w-80' : 'w-auto'
      }`}
    >
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <span className="text-gray-300">FPS:</span>
            <span className={getFPSColor(metrics.fps)}>{metrics.fps}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-gray-300">Q:</span>
            <span className={getQualityColor(metrics.quality)}>{metrics.quality}</span>
          </div>
        </div>
        <div className="text-gray-400 text-xs">
          {isExpanded ? '−' : '+'}
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 space-y-2">
          <div className="border-t border-gray-600 pt-2">
            <div className="text-xs text-gray-300 mb-1">Performance Status:</div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-400">Frame Rate:</span>
                <span className={getFPSColor(metrics.fps)}>{metrics.fps} FPS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Quality Level:</span>
                <span className={getQualityColor(metrics.quality)}>{(metrics.quality * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {metrics.recommendations.length > 0 && (
            <div className="border-t border-gray-600 pt-2">
              <div className="text-xs text-gray-300 mb-1">Recommendations:</div>
              <div className="space-y-1">
                {metrics.recommendations.map((rec, index) => (
                  <div key={index} className="text-xs text-yellow-400">
                    • {rec}
                  </div>
                ))}
              </div>
            </div>
          )}

          {showDetails && (
            <div className="border-t border-gray-600 pt-2">
              <div className="text-xs text-gray-300 mb-1">GPU Optimizations:</div>
              <div className="space-y-1 text-xs">
                <div className="text-gray-400">
                  • Frame rate limiting: {process.env.NODE_ENV === 'development' ? '30fps' : '60fps'}
                </div>
                <div className="text-gray-400">
                  • Adaptive quality: {metrics.quality < 1.0 ? 'Active' : 'Disabled'}
                </div>
                <div className="text-gray-400">
                  • Particle count: {metrics.quality < 1.0 ? 'Reduced' : 'Normal'}
                </div>
                <div className="text-gray-400">
                  • Blur effects: {process.env.NODE_ENV === 'development' ? 'Reduced' : 'Full'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor;
