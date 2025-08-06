/**
 * Documentation React Hook
 * SizeWise Suite - Enhanced Implementation Priority Group
 * 
 * React hook for automated documentation generation, API documentation updates,
 * integration guide maintenance, and documentation validation.
 * 
 * @fileoverview Documentation React hook
 * @version 2.0.0
 * @author SizeWise Suite Development Team
 */

import { useState, useEffect, useCallback, useContext, createContext } from 'react';
import {
  IDocumentationService,
  DocumentationContent,
  DocumentationMetadata,
  DocumentationType,
  DocumentationFormat,
  GenerationJob,
  GenerationConfig,
  ValidationResult,
  DocumentationTemplate,
  DocumentationServiceConfig
} from '../core/interfaces/IDocumentationService';

/**
 * Documentation context interface
 */
interface DocumentationContextValue {
  documentationService: IDocumentationService;
}

/**
 * Documentation context
 */
const DocumentationContext = createContext<DocumentationContextValue | null>(null);

/**
 * Documentation provider component
 */
export const DocumentationProvider: React.FC<{
  children: React.ReactNode;
  documentationService: IDocumentationService;
  config?: DocumentationServiceConfig;
}> = ({ children, documentationService, config }) => {
  useEffect(() => {
    documentationService.initialize(config);
  }, [documentationService, config]);

  return (
    <DocumentationContext.Provider value={{ documentationService }}>
      {children}
    </DocumentationContext.Provider>
  );
};

/**
 * Hook return type
 */
export interface UseDocumentationReturn {
  // Service access
  service: IDocumentationService;

  // Documentation management
  documentation: DocumentationMetadata[];
  getDocumentation: (id: string) => Promise<DocumentationContent>;
  updateDocumentation: (id: string, content: Partial<DocumentationContent>) => Promise<void>;
  searchDocumentation: (query: string) => Promise<DocumentationContent[]>;

  // Generation
  generateAPIDocumentation: (sourceFiles: string[], config?: GenerationConfig) => Promise<GenerationJob>;
  generateIntegrationGuide: (services: string[], config?: GenerationConfig) => Promise<GenerationJob>;
  generateChangelog: (fromVersion: string, toVersion: string) => Promise<DocumentationContent>;
  generateIndex: () => Promise<DocumentationContent>;

  // Jobs
  generationJobs: GenerationJob[];
  getGenerationJob: (jobId: string) => Promise<GenerationJob>;
  cancelGenerationJob: (jobId: string) => Promise<boolean>;

  // Validation
  validateDocumentation: (id: string) => Promise<ValidationResult>;
  validateLinks: (id: string) => Promise<ValidationResult>;

  // Templates
  templates: DocumentationTemplate[];
  createTemplate: (template: Omit<DocumentationTemplate, 'id'>) => Promise<string>;

  // Export
  exportDocumentation: (id: string, format: DocumentationFormat) => Promise<string>;

  // Sync
  syncWithCode: (sourceFiles: string[]) => Promise<string[]>;

  // State
  isLoading: boolean;
  error: string | null;
}

/**
 * Main useDocumentation hook
 */
export const useDocumentation = (): UseDocumentationReturn => {
  const context = useContext(DocumentationContext);
  
  if (!context) {
    throw new Error('useDocumentation must be used within a DocumentationProvider');
  }

  const { documentationService } = context;

  // State management
  const [documentation, setDocumentation] = useState<DocumentationMetadata[]>([]);
  const [generationJobs, setGenerationJobs] = useState<GenerationJob[]>([]);
  const [templates, setTemplates] = useState<DocumentationTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadDocumentationData();
  }, []);

  // Setup periodic refresh for jobs
  useEffect(() => {
    const interval = setInterval(() => {
      refreshGenerationJobs();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const loadDocumentationData = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const [docsData, templatesData] = await Promise.all([
        documentationService.listDocumentation(),
        documentationService.getTemplates()
      ]);

      setDocumentation(docsData);
      setTemplates(templatesData);

    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshGenerationJobs = async (): Promise<void> => {
    // In real implementation, this would fetch active jobs
    // For now, we'll just update existing jobs if any
    if (generationJobs.length > 0) {
      try {
        const updatedJobs = await Promise.all(
          generationJobs.map(job => documentationService.getGenerationJob(job.id))
        );
        setGenerationJobs(updatedJobs);
      } catch (err) {
        console.warn('Failed to refresh generation jobs:', err);
      }
    }
  };

  // Documentation management
  const getDocumentation = useCallback(async (id: string): Promise<DocumentationContent> => {
    try {
      return await documentationService.getDocumentation(id);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [documentationService]);

  const updateDocumentation = useCallback(async (
    id: string,
    content: Partial<DocumentationContent>
  ): Promise<void> => {
    try {
      await documentationService.updateDocumentation(id, content);
      const updatedDocs = await documentationService.listDocumentation();
      setDocumentation(updatedDocs);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [documentationService]);

  const searchDocumentation = useCallback(async (query: string): Promise<DocumentationContent[]> => {
    try {
      return await documentationService.searchDocumentation(query);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [documentationService]);

  // Generation
  const generateAPIDocumentation = useCallback(async (
    sourceFiles: string[],
    config?: GenerationConfig
  ): Promise<GenerationJob> => {
    try {
      const job = await documentationService.generateAPIDocumentation(sourceFiles, config);
      setGenerationJobs(prev => [...prev, job]);
      return job;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [documentationService]);

  const generateIntegrationGuide = useCallback(async (
    services: string[],
    config?: GenerationConfig
  ): Promise<GenerationJob> => {
    try {
      const job = await documentationService.generateIntegrationGuide(services, config);
      setGenerationJobs(prev => [...prev, job]);
      return job;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [documentationService]);

  const generateChangelog = useCallback(async (
    fromVersion: string,
    toVersion: string
  ): Promise<DocumentationContent> => {
    try {
      const changelog = await documentationService.generateChangelog(fromVersion, toVersion);
      const updatedDocs = await documentationService.listDocumentation();
      setDocumentation(updatedDocs);
      return changelog;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [documentationService]);

  const generateIndex = useCallback(async (): Promise<DocumentationContent> => {
    try {
      const index = await documentationService.generateIndex();
      const updatedDocs = await documentationService.listDocumentation();
      setDocumentation(updatedDocs);
      return index;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [documentationService]);

  // Jobs
  const getGenerationJob = useCallback(async (jobId: string): Promise<GenerationJob> => {
    try {
      const job = await documentationService.getGenerationJob(jobId);
      // Update job in state
      setGenerationJobs(prev => prev.map(j => j.id === jobId ? job : j));
      return job;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [documentationService]);

  const cancelGenerationJob = useCallback(async (jobId: string): Promise<boolean> => {
    try {
      const cancelled = await documentationService.cancelGenerationJob(jobId);
      if (cancelled) {
        const updatedJob = await documentationService.getGenerationJob(jobId);
        setGenerationJobs(prev => prev.map(j => j.id === jobId ? updatedJob : j));
      }
      return cancelled;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [documentationService]);

  // Validation
  const validateDocumentation = useCallback(async (id: string): Promise<ValidationResult> => {
    try {
      return await documentationService.validateDocumentation(id);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [documentationService]);

  const validateLinks = useCallback(async (id: string): Promise<ValidationResult> => {
    try {
      return await documentationService.validateLinks(id);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [documentationService]);

  // Templates
  const createTemplate = useCallback(async (
    template: Omit<DocumentationTemplate, 'id'>
  ): Promise<string> => {
    try {
      const templateId = await documentationService.createTemplate(template);
      const updatedTemplates = await documentationService.getTemplates();
      setTemplates(updatedTemplates);
      return templateId;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [documentationService]);

  // Export
  const exportDocumentation = useCallback(async (
    id: string,
    format: DocumentationFormat
  ): Promise<string> => {
    try {
      return await documentationService.exportDocumentation(id, format);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [documentationService]);

  // Sync
  const syncWithCode = useCallback(async (sourceFiles: string[]): Promise<string[]> => {
    try {
      const updatedIds = await documentationService.syncWithCode(sourceFiles);
      const updatedDocs = await documentationService.listDocumentation();
      setDocumentation(updatedDocs);
      return updatedIds;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [documentationService]);

  return {
    // Service access
    service: documentationService,

    // Documentation management
    documentation,
    getDocumentation,
    updateDocumentation,
    searchDocumentation,

    // Generation
    generateAPIDocumentation,
    generateIntegrationGuide,
    generateChangelog,
    generateIndex,

    // Jobs
    generationJobs,
    getGenerationJob,
    cancelGenerationJob,

    // Validation
    validateDocumentation,
    validateLinks,

    // Templates
    templates,
    createTemplate,

    // Export
    exportDocumentation,

    // Sync
    syncWithCode,

    // State
    isLoading,
    error
  };
};

/**
 * Hook for documentation generation
 */
export const useDocumentationGeneration = () => {
  const { generateAPIDocumentation, generateIntegrationGuide, generationJobs } = useDocumentation();

  const generateDocs = useCallback(async (
    type: 'api' | 'integration',
    sources: string[],
    config?: GenerationConfig
  ): Promise<GenerationJob> => {
    if (type === 'api') {
      return await generateAPIDocumentation(sources, config);
    } else {
      return await generateIntegrationGuide(sources, config);
    }
  }, [generateAPIDocumentation, generateIntegrationGuide]);

  const activeJobs = generationJobs.filter(job => 
    job.status === 'pending' || job.status === 'in_progress'
  );

  const completedJobs = generationJobs.filter(job => 
    job.status === 'completed'
  );

  const failedJobs = generationJobs.filter(job => 
    job.status === 'failed'
  );

  return {
    generateDocs,
    activeJobs,
    completedJobs,
    failedJobs,
    totalJobs: generationJobs.length
  };
};

/**
 * Hook for documentation validation
 */
export const useDocumentationValidation = () => {
  const { validateDocumentation, validateLinks } = useDocumentation();

  const runFullValidation = useCallback(async (documentationId: string) => {
    const [docValidation, linkValidation] = await Promise.all([
      validateDocumentation(documentationId),
      validateLinks(documentationId)
    ]);

    return {
      documentation: docValidation,
      links: linkValidation,
      overall: {
        isValid: docValidation.isValid && linkValidation.isValid,
        score: Math.round((docValidation.score + linkValidation.score) / 2),
        totalErrors: docValidation.errors.length + linkValidation.errors.length,
        totalWarnings: docValidation.warnings.length + linkValidation.warnings.length
      }
    };
  }, [validateDocumentation, validateLinks]);

  return {
    validateDocumentation,
    validateLinks,
    runFullValidation
  };
};
