/**
 * Documentation Service Interfaces
 * SizeWise Suite - Enhanced Implementation Priority Group
 * 
 * Automated documentation generation, API documentation updates,
 * integration guide maintenance, and documentation validation systems.
 * 
 * @fileoverview Documentation service interfaces
 * @version 2.0.0
 * @author SizeWise Suite Development Team
 */

/**
 * Documentation types
 */
export enum DocumentationType {
  API_REFERENCE = 'api_reference',
  INTEGRATION_GUIDE = 'integration_guide',
  USER_MANUAL = 'user_manual',
  DEVELOPER_GUIDE = 'developer_guide',
  CHANGELOG = 'changelog',
  TROUBLESHOOTING = 'troubleshooting',
  ARCHITECTURE = 'architecture',
  DEPLOYMENT = 'deployment'
}

/**
 * Documentation formats
 */
export enum DocumentationFormat {
  MARKDOWN = 'markdown',
  HTML = 'html',
  PDF = 'pdf',
  JSON = 'json',
  YAML = 'yaml',
  OPENAPI = 'openapi'
}

/**
 * Documentation validation severity
 */
export enum ValidationSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

/**
 * Documentation generation status
 */
export enum GenerationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

/**
 * Documentation source types
 */
export enum SourceType {
  CODE_COMMENTS = 'code_comments',
  TYPE_DEFINITIONS = 'type_definitions',
  CONFIGURATION = 'configuration',
  EXAMPLES = 'examples',
  TESTS = 'tests',
  MANUAL = 'manual'
}

/**
 * Documentation metadata
 */
export interface DocumentationMetadata {
  id: string;
  title: string;
  description: string;
  type: DocumentationType;
  format: DocumentationFormat;
  version: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  dependencies: string[];
  sourceFiles: string[];
  outputPath: string;
}

/**
 * Documentation content
 */
export interface DocumentationContent {
  metadata: DocumentationMetadata;
  content: string;
  sections: DocumentationSection[];
  assets: DocumentationAsset[];
  references: DocumentationReference[];
}

/**
 * Documentation section
 */
export interface DocumentationSection {
  id: string;
  title: string;
  content: string;
  level: number;
  order: number;
  subsections: DocumentationSection[];
  codeExamples: CodeExample[];
  images: string[];
}

/**
 * Code example
 */
export interface CodeExample {
  id: string;
  title: string;
  description: string;
  language: string;
  code: string;
  output?: string;
  runnable: boolean;
  tags: string[];
}

/**
 * Documentation asset
 */
export interface DocumentationAsset {
  id: string;
  name: string;
  type: 'image' | 'video' | 'file' | 'link';
  url: string;
  description: string;
  size?: number;
  mimeType?: string;
}

/**
 * Documentation reference
 */
export interface DocumentationReference {
  id: string;
  title: string;
  url: string;
  type: 'internal' | 'external' | 'api' | 'code';
  description: string;
}

/**
 * API documentation endpoint
 */
export interface APIEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  summary: string;
  description: string;
  parameters: APIParameter[];
  requestBody?: APIRequestBody;
  responses: APIResponse[];
  examples: APIExample[];
  tags: string[];
  deprecated: boolean;
}

/**
 * API parameter
 */
export interface APIParameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  description: string;
  required: boolean;
  type: string;
  format?: string;
  example?: any;
  enum?: any[];
}

/**
 * API request body
 */
export interface APIRequestBody {
  description: string;
  required: boolean;
  content: Record<string, APIMediaType>;
}

/**
 * API media type
 */
export interface APIMediaType {
  schema: APISchema;
  examples?: Record<string, APIExample>;
}

/**
 * API schema
 */
export interface APISchema {
  type: string;
  properties?: Record<string, APISchema>;
  items?: APISchema;
  required?: string[];
  example?: any;
  description?: string;
}

/**
 * API response
 */
export interface APIResponse {
  statusCode: number;
  description: string;
  content?: Record<string, APIMediaType>;
  headers?: Record<string, APIParameter>;
}

/**
 * API example
 */
export interface APIExample {
  summary: string;
  description: string;
  value: any;
}

/**
 * Documentation validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  suggestions: ValidationIssue[];
  score: number; // 0-100
}

/**
 * Validation issue
 */
export interface ValidationIssue {
  id: string;
  severity: ValidationSeverity;
  message: string;
  location: string;
  line?: number;
  column?: number;
  rule: string;
  suggestion?: string;
}

/**
 * Documentation generation configuration
 */
export interface GenerationConfig {
  outputDirectory: string;
  formats: DocumentationFormat[];
  includePrivate: boolean;
  includeInternal: boolean;
  generateExamples: boolean;
  validateOutput: boolean;
  customTemplates?: Record<string, string>;
  plugins: string[];
}

/**
 * Documentation template
 */
export interface DocumentationTemplate {
  id: string;
  name: string;
  description: string;
  type: DocumentationType;
  format: DocumentationFormat;
  template: string;
  variables: TemplateVariable[];
  partials: Record<string, string>;
}

/**
 * Template variable
 */
export interface TemplateVariable {
  name: string;
  type: string;
  description: string;
  required: boolean;
  defaultValue?: any;
}

/**
 * Documentation generation job
 */
export interface GenerationJob {
  id: string;
  type: DocumentationType;
  status: GenerationStatus;
  config: GenerationConfig;
  startedAt: Date;
  completedAt?: Date;
  progress: number; // 0-100
  logs: string[];
  errors: string[];
  outputFiles: string[];
}

/**
 * Main Documentation Service interface
 */
export interface IDocumentationService {
  /**
   * Initialize documentation service
   */
  initialize(config?: DocumentationServiceConfig): Promise<void>;

  /**
   * Generate API documentation
   */
  generateAPIDocumentation(
    sourceFiles: string[],
    config?: GenerationConfig
  ): Promise<GenerationJob>;

  /**
   * Generate integration guide
   */
  generateIntegrationGuide(
    services: string[],
    config?: GenerationConfig
  ): Promise<GenerationJob>;

  /**
   * Update documentation
   */
  updateDocumentation(
    documentationId: string,
    content: Partial<DocumentationContent>
  ): Promise<void>;

  /**
   * Validate documentation
   */
  validateDocumentation(
    documentationId: string
  ): Promise<ValidationResult>;

  /**
   * Get documentation
   */
  getDocumentation(documentationId: string): Promise<DocumentationContent>;

  /**
   * List all documentation
   */
  listDocumentation(type?: DocumentationType): Promise<DocumentationMetadata[]>;

  /**
   * Search documentation
   */
  searchDocumentation(query: string): Promise<DocumentationContent[]>;

  /**
   * Generate changelog
   */
  generateChangelog(
    fromVersion: string,
    toVersion: string
  ): Promise<DocumentationContent>;

  /**
   * Sync documentation with code
   */
  syncWithCode(sourceFiles: string[]): Promise<string[]>;

  /**
   * Export documentation
   */
  exportDocumentation(
    documentationId: string,
    format: DocumentationFormat
  ): Promise<string>;

  /**
   * Get generation job status
   */
  getGenerationJob(jobId: string): Promise<GenerationJob>;

  /**
   * Cancel generation job
   */
  cancelGenerationJob(jobId: string): Promise<boolean>;

  /**
   * Create documentation template
   */
  createTemplate(template: Omit<DocumentationTemplate, 'id'>): Promise<string>;

  /**
   * Get documentation templates
   */
  getTemplates(type?: DocumentationType): Promise<DocumentationTemplate[]>;

  /**
   * Validate documentation links
   */
  validateLinks(documentationId: string): Promise<ValidationResult>;

  /**
   * Generate documentation index
   */
  generateIndex(): Promise<DocumentationContent>;
}

/**
 * API documentation generator interface
 */
export interface IAPIDocumentationGenerator {
  /**
   * Extract API endpoints from source files
   */
  extractEndpoints(sourceFiles: string[]): Promise<APIEndpoint[]>;

  /**
   * Generate OpenAPI specification
   */
  generateOpenAPISpec(endpoints: APIEndpoint[]): Promise<any>;

  /**
   * Generate API reference documentation
   */
  generateAPIReference(
    endpoints: APIEndpoint[],
    format: DocumentationFormat
  ): Promise<string>;

  /**
   * Validate API documentation
   */
  validateAPIDocumentation(spec: any): Promise<ValidationResult>;
}

/**
 * Code documentation extractor interface
 */
export interface ICodeDocumentationExtractor {
  /**
   * Extract documentation from TypeScript files
   */
  extractFromTypeScript(filePaths: string[]): Promise<DocumentationContent[]>;

  /**
   * Extract JSDoc comments
   */
  extractJSDoc(filePaths: string[]): Promise<CodeExample[]>;

  /**
   * Extract interface definitions
   */
  extractInterfaces(filePaths: string[]): Promise<APISchema[]>;

  /**
   * Extract function signatures
   */
  extractFunctions(filePaths: string[]): Promise<APIEndpoint[]>;
}

/**
 * Documentation validator interface
 */
export interface IDocumentationValidator {
  /**
   * Validate markdown syntax
   */
  validateMarkdown(content: string): Promise<ValidationResult>;

  /**
   * Validate links
   */
  validateLinks(content: string, baseUrl?: string): Promise<ValidationResult>;

  /**
   * Validate code examples
   */
  validateCodeExamples(examples: CodeExample[]): Promise<ValidationResult>;

  /**
   * Validate API specification
   */
  validateAPISpec(spec: any): Promise<ValidationResult>;

  /**
   * Check documentation completeness
   */
  checkCompleteness(documentation: DocumentationContent): Promise<ValidationResult>;
}

/**
 * Documentation service configuration
 */
export interface DocumentationServiceConfig {
  outputDirectory: string;
  sourceDirectories: string[];
  templateDirectory: string;
  enableAutoSync: boolean;
  syncInterval: number; // Minutes
  validationRules: ValidationRule[];
  generators: GeneratorConfig[];
  exportFormats: DocumentationFormat[];
}

/**
 * Validation rule
 */
export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  severity: ValidationSeverity;
  pattern?: string;
  enabled: boolean;
}

/**
 * Generator configuration
 */
export interface GeneratorConfig {
  type: DocumentationType;
  enabled: boolean;
  sourcePattern: string;
  outputPath: string;
  template?: string;
  options: Record<string, any>;
}
