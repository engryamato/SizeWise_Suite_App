"use client";

import React, { useState, useCallback, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw,
  Download,
  Eye,
  EyeOff,
  Move,
  Maximize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/lib/hooks/useToaster';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFFile {
  file: File;
  name: string;
  size: number;
  pages: number;
  url: string;
}

interface PDFImportProps {
  onPDFLoad?: (pdf: PDFFile) => void;
  onPDFRemove?: () => void;
  maxFileSize?: number; // in MB
  className?: string;
  showAsBackground?: boolean;
  backgroundOpacity?: number;
}

interface PDFViewerProps {
  pdfFile: PDFFile;
  onRemove: () => void;
  showAsBackground?: boolean;
  backgroundOpacity?: number;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ 
  pdfFile, 
  onRemove, 
  showAsBackground = false,
  backgroundOpacity = 0.3 
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number }>({
    startX: 0,
    startY: 0,
    startPosX: 0,
    startPosY: 0,
  });

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.2));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
    setPageNumber(1);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!showAsBackground) return;
    
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y,
    };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !showAsBackground) return;

    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;

    setPosition({
      x: dragRef.current.startPosX + deltaX,
      y: dragRef.current.startPosY + deltaY,
    });
  }, [isDragging, showAsBackground]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const containerStyle = showAsBackground ? {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none' as const,
    zIndex: 1,
    opacity: isVisible ? backgroundOpacity : 0,
    transform: `translate(${position.x}px, ${position.y}px)`,
  } : {};

  const pdfStyle = {
    transform: `scale(${scale}) rotate(${rotation}deg)`,
    transformOrigin: 'center center',
    transition: isDragging ? 'none' : 'transform 0.2s ease',
    cursor: showAsBackground ? (isDragging ? 'grabbing' : 'grab') : 'default',
    pointerEvents: showAsBackground ? 'auto' : 'none',
  };

  return (
    <div 
      className={cn(
        showAsBackground ? "absolute inset-0" : "relative w-full h-full",
        "flex flex-col"
      )}
      style={containerStyle}
    >
      {/* Controls */}
      {!showAsBackground && (
        <div className="flex items-center justify-between p-4 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-md border-b border-white/20 dark:border-neutral-700/50">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <FileText size={20} className="text-blue-500" />
              <span className="font-medium text-neutral-900 dark:text-white">
                {pdfFile.name}
              </span>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-neutral-600 dark:text-neutral-300">
              <span>Page {pageNumber} of {numPages}</span>
              <span>•</span>
              <span>{(pdfFile.size / 1024 / 1024).toFixed(1)} MB</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-2 rounded-md hover:bg-white/40 dark:hover:bg-white/10 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut size={16} />
            </button>
            
            <span className="text-sm text-neutral-600 dark:text-neutral-300 min-w-[3rem] text-center">
              {Math.round(scale * 100)}%
            </span>
            
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-2 rounded-md hover:bg-white/40 dark:hover:bg-white/10 transition-colors"
              title="Zoom In"
            >
              <ZoomIn size={16} />
            </button>
            
            <button
              type="button"
              onClick={handleRotate}
              className="p-2 rounded-md hover:bg-white/40 dark:hover:bg-white/10 transition-colors"
              title="Rotate"
            >
              <RotateCw size={16} />
            </button>
            
            <button
              type="button"
              onClick={handleReset}
              className="p-2 rounded-md hover:bg-white/40 dark:hover:bg-white/10 transition-colors"
              title="Reset View"
            >
              <Maximize2 size={16} />
            </button>
            
            <button
              type="button"
              onClick={onRemove}
              className="p-2 rounded-md hover:bg-red-500/20 text-red-500 transition-colors"
              title="Remove PDF"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Background Controls (when used as background) */}
      {showAsBackground && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-md rounded-lg border border-white/20 dark:border-neutral-700/50 shadow-lg p-2">
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setIsVisible(!isVisible)}
                className={cn(
                  "p-2 rounded-md transition-colors",
                  "hover:bg-white/40 dark:hover:bg-white/10",
                  !isVisible && "bg-red-500/20 text-red-500"
                )}
                title={isVisible ? "Hide PDF" : "Show PDF"}
              >
                {isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
              
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-2 rounded-md hover:bg-white/40 dark:hover:bg-white/10 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut size={16} />
              </button>
              
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-2 rounded-md hover:bg-white/40 dark:hover:bg-white/10 transition-colors"
                title="Zoom In"
              >
                <ZoomIn size={16} />
              </button>
              
              <button
                type="button"
                onClick={onRemove}
                className="p-2 rounded-md hover:bg-red-500/20 text-red-500 transition-colors"
                title="Remove PDF"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Document */}
      <div 
        className={cn(
          "flex-1 flex items-center justify-center overflow-hidden",
          showAsBackground ? "absolute inset-0" : "bg-neutral-100 dark:bg-neutral-800"
        )}
        onMouseDown={handleMouseDown}
      >
        <div style={pdfStyle}>
          <Document
            file={pdfFile.url}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            }
            error={
              <div className="flex items-center justify-center p-8 text-red-500">
                <span>Failed to load PDF</span>
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="shadow-lg"
            />
          </Document>
        </div>
      </div>

      {/* Page Navigation */}
      {!showAsBackground && numPages > 1 && (
        <div className="flex items-center justify-center p-4 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-md border-t border-white/20 dark:border-neutral-700/50">
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
              disabled={pageNumber <= 1}
              className="px-3 py-1 rounded-md bg-white/40 dark:bg-white/10 hover:bg-white/60 dark:hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            
            <span className="text-sm text-neutral-600 dark:text-neutral-300">
              Page {pageNumber} of {numPages}
            </span>
            
            <button
              type="button"
              onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages))}
              disabled={pageNumber >= numPages}
              className="px-3 py-1 rounded-md bg-white/40 dark:bg-white/10 hover:bg-white/60 dark:hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const PDFImport: React.FC<PDFImportProps> = ({
  onPDFLoad,
  onPDFRemove,
  maxFileSize = 50, // 50MB default
  className,
  showAsBackground = false,
  backgroundOpacity = 0.3,
}) => {
  const [pdfFile, setPdfFile] = useState<PDFFile | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const validateFile = (file: File): boolean => {
    if (file.type !== 'application/pdf') {
      toast.error('Invalid File Type', 'Please select a PDF file.');
      return false;
    }

    if (file.size > maxFileSize * 1024 * 1024) {
      toast.error('File Too Large', `File size must be less than ${maxFileSize}MB.`);
      return false;
    }

    return true;
  };

  const handleFileLoad = async (file: File) => {
    if (!validateFile(file)) return;

    setIsLoading(true);
    try {
      const url = URL.createObjectURL(file);
      const pdf = await pdfjs.getDocument(url).promise;
      
      const pdfFile: PDFFile = {
        file,
        name: file.name,
        size: file.size,
        pages: pdf.numPages,
        url,
      };

      setPdfFile(pdfFile);
      onPDFLoad?.(pdfFile);
      toast.success('PDF Loaded', `${file.name} loaded successfully with ${pdf.numPages} pages.`);
    } catch (error) {
      console.error('Error loading PDF:', error);
      toast.error('PDF Load Error', 'Failed to load the PDF file.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileRemove = () => {
    if (pdfFile) {
      URL.revokeObjectURL(pdfFile.url);
      setPdfFile(null);
      onPDFRemove?.();
      toast.info('PDF Removed', 'PDF background has been removed.');
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileLoad(files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileLoad(files[0]);
    }
  };

  if (pdfFile) {
    return (
      <PDFViewer
        pdfFile={pdfFile}
        onRemove={handleFileRemove}
        showAsBackground={showAsBackground}
        backgroundOpacity={backgroundOpacity}
      />
    );
  }

  return (
    <div className={cn("w-full h-full", className)}>
      <div
        className={cn(
          "relative w-full h-full min-h-[400px] border-2 border-dashed rounded-lg transition-colors",
          "flex items-center justify-center cursor-pointer",
          isDragOver
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : "border-neutral-300 dark:border-neutral-600 hover:border-neutral-400 dark:hover:border-neutral-500"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="text-center p-8">
          {isLoading ? (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-neutral-600 dark:text-neutral-300">Loading PDF...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center">
                <Upload size={32} className="text-blue-500" />
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
                  Import PDF Plan
                </h3>
                <p className="text-neutral-600 dark:text-neutral-300 mb-4">
                  Drag and drop a PDF file here, or click to browse
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Maximum file size: {maxFileSize}MB • PDF format only
                </p>
              </div>
              
              <button
                type="button"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Choose File
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
