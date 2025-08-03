/**
 * Memory Monitor Component
 * SizeWise Suite - Phase 4: Performance Optimization
 * 
 * Development tool for monitoring memory usage in 3D components
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { memoryManager } from '@/lib/3d/memory-manager';
import { hvacMemoryProfiler } from '@/lib/3d/hvac-memory-profiler';
import { useMemoryDebugger } from '@/lib/hooks/useMemoryManager';

interface MemoryMonitorProps {
  className?: string;
  showDetailed?: boolean;
}

export function MemoryMonitor({ className = '', showDetailed = false }: MemoryMonitorProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [memoryStats, setMemoryStats] = useState<any>(null);
  const [hvacProfile, setHvacProfile] = useState<any>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  const debugInfo = useMemoryDebugger();

  // Toggle visibility (only show in development)
  useEffect(() => {
    setIsVisible(process.env.NODE_ENV === 'development');
  }, []);

  // Update memory stats
  useEffect(() => {
    if (!isVisible) return;

    const updateStats = () => {
      const stats = memoryManager.getMemoryReport();
      const profile = hvacMemoryProfiler.getReport();
      setMemoryStats(stats);
      setHvacProfile(profile);
    };

    updateStats();
    const interval = setInterval(updateStats, 2000);
    return () => clearInterval(interval);
  }, [isVisible]);

  const handleStartMonitoring = () => {
    memoryManager.startMonitoring(5000);
    hvacMemoryProfiler.startProfiling(10000);
    setIsMonitoring(true);
  };

  const handleStopMonitoring = () => {
    memoryManager.stopMonitoring();
    hvacMemoryProfiler.stopProfiling();
    setIsMonitoring(false);
  };

  const handleForceCleanup = () => {
    memoryManager.forceCleanup();
  };

  const handleDisposeAll = () => {
    memoryManager.disposeAll();
  };

  const formatMemory = (mb: number) => {
    if (mb < 1) return `${(mb * 1024).toFixed(1)} KB`;
    return `${mb.toFixed(1)} MB`;
  };

  const getMemoryStatus = (currentMB: number, maxMB: number = 500) => {
    const percentage = (currentMB / maxMB) * 100;
    if (percentage > 90) return { status: 'critical', color: 'destructive', icon: XCircle };
    if (percentage > 70) return { status: 'warning', color: 'warning', icon: AlertTriangle };
    return { status: 'good', color: 'success', icon: CheckCircle };
  };

  const getTrendIcon = (growthRate: number) => {
    if (growthRate > 5) return TrendingUp;
    if (growthRate < -5) return TrendingDown;
    return Minus;
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <Card className="w-80 bg-white/95 backdrop-blur-sm border shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Memory Monitor
            <Badge variant="outline" className="ml-auto">
              DEV
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* Current Memory Usage */}
          {memoryStats && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span>Memory Usage</span>
                <span className="font-mono">
                  {formatMemory(memoryStats.current.totalMemoryMB)}
                </span>
              </div>
              
              <Progress 
                value={(memoryStats.current.totalMemoryMB / 500) * 100} 
                className="h-2"
              />
              
              <div className="flex items-center gap-2 text-xs">
                {(() => {
                  const { status, color, icon: Icon } = getMemoryStatus(memoryStats.current.totalMemoryMB);
                  return (
                    <>
                      <Icon className="h-3 w-3" />
                      <span className={`text-${color}`}>
                        {status.toUpperCase()}
                      </span>
                    </>
                  );
                })()}
                
                {memoryStats.growthRate !== 0 && (
                  <>
                    <Separator orientation="vertical" className="h-3" />
                    {(() => {
                      const TrendIcon = getTrendIcon(memoryStats.growthRate);
                      return (
                        <div className="flex items-center gap-1">
                          <TrendIcon className="h-3 w-3" />
                          <span className="font-mono">
                            {memoryStats.growthRate > 0 ? '+' : ''}
                            {memoryStats.growthRate.toFixed(1)} MB/h
                          </span>
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
            </div>
          )}

          {/* HVAC Components */}
          {hvacProfile?.currentProfile && (
            <div className="space-y-2">
              <div className="text-xs font-medium">HVAC Components</div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-mono text-sm">
                    {hvacProfile.currentProfile.ductSegments}
                  </div>
                  <div className="text-muted-foreground">Ducts</div>
                </div>
                <div className="text-center">
                  <div className="font-mono text-sm">
                    {hvacProfile.currentProfile.fittings}
                  </div>
                  <div className="text-muted-foreground">Fittings</div>
                </div>
                <div className="text-center">
                  <div className="font-mono text-sm">
                    {hvacProfile.currentProfile.equipment}
                  </div>
                  <div className="text-muted-foreground">Equipment</div>
                </div>
              </div>
            </div>
          )}

          {/* Three.js Resources */}
          {memoryStats && (
            <div className="space-y-2">
              <div className="text-xs font-medium">Three.js Resources</div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-mono text-sm">
                    {memoryStats.current.geometries}
                  </div>
                  <div className="text-muted-foreground">Geometries</div>
                </div>
                <div className="text-center">
                  <div className="font-mono text-sm">
                    {memoryStats.current.materials}
                  </div>
                  <div className="text-muted-foreground">Materials</div>
                </div>
                <div className="text-center">
                  <div className="font-mono text-sm">
                    {memoryStats.current.textures}
                  </div>
                  <div className="text-muted-foreground">Textures</div>
                </div>
              </div>
            </div>
          )}

          {/* Memory Leak Alert */}
          {hvacProfile?.leakReport?.isLeakDetected && (
            <div className="p-2 bg-destructive/10 border border-destructive/20 rounded text-xs">
              <div className="flex items-center gap-2 font-medium text-destructive">
                <AlertTriangle className="h-3 w-3" />
                Memory Leak Detected
              </div>
              <div className="mt-1 text-muted-foreground">
                Growth: {hvacProfile.leakReport.growthRateMBPerHour.toFixed(1)} MB/h
              </div>
              {hvacProfile.leakReport.problematicComponents.length > 0 && (
                <div className="mt-1">
                  <div className="text-muted-foreground">Components:</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {hvacProfile.leakReport.problematicComponents.map((component: string) => (
                      <Badge key={component} variant="destructive" className="text-xs">
                        {component}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={isMonitoring ? "destructive" : "default"}
              onClick={isMonitoring ? handleStopMonitoring : handleStartMonitoring}
              className="flex-1 text-xs"
            >
              {isMonitoring ? (
                <>
                  <XCircle className="h-3 w-3 mr-1" />
                  Stop
                </>
              ) : (
                <>
                  <Activity className="h-3 w-3 mr-1" />
                  Monitor
                </>
              )}
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={handleForceCleanup}
              className="text-xs"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={handleDisposeAll}
              className="text-xs"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>

          {/* Detailed Info */}
          {showDetailed && debugInfo && (
            <div className="space-y-2 pt-2 border-t">
              <div className="text-xs font-medium">Debug Info</div>
              <div className="text-xs font-mono bg-muted p-2 rounded max-h-32 overflow-y-auto">
                <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
