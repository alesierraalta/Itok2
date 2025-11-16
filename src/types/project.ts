/**
 * TypeScript types for project discovery and management
 * @module types/project
 * 
 * This module contains type definitions for project discovery, registration,
 * and file indexing in the Itok MCP server.
 */

/**
 * Status of a project in the registry.
 * 
 * @enum {string}
 */
export enum ProjectStatus {
  /** Project is active and being used */
  Active = "active",
  /** Project is inactive but still registered */
  Inactive = "inactive",
  /** Project is archived and no longer actively managed */
  Archived = "archived",
}

/**
 * Kind of file in a project.
 * 
 * Used to categorize files for better search and filtering.
 * 
 * @enum {string}
 */
export enum FileKind {
  /** Source code files */
  Source = "source",
  /** Test files */
  Test = "test",
  /** Configuration files */
  Config = "config",
  /** Documentation files */
  Documentation = "documentation",
  /** Other files */
  Other = "other",
}

/**
 * Metadata about a discovered project.
 * 
 * Contains essential information about a project without including
 * the full file index (which can be large).
 * 
 * @interface
 */
export interface ProjectMetadata {
  /** Unique identifier for the project (UUID v4) */
  id: string;
  /** Name of the project (derived from directory name) */
  name: string;
  /** Absolute path to the project root directory */
  path: string;
  /** Current status of the project */
  status: ProjectStatus;
  /** Timestamp when the project was first discovered (ISO 8601) */
  discoveredAt: string;
  /** Timestamp when the project was last indexed (ISO 8601, optional) */
  lastIndexedAt?: string;
  /** Detected programming language (e.g., "python", "typescript", "javascript") */
  language?: string;
  /** Detected framework or technology (e.g., "flask", "django", "nestjs") */
  framework?: string;
}

/**
 * Entry in a file index representing a single file.
 * 
 * @interface
 */
export interface FileIndexEntry {
  /** Relative path from project root to the file */
  path: string;
  /** Kind/category of the file */
  kind: FileKind;
  /** Size of the file in bytes */
  size: number;
  /** Last modification timestamp (ISO 8601) */
  lastModified: string;
  /** Names of symbols found in the file (if it's a code file) */
  symbols?: string[];
}

/**
 * Complete file index for a project.
 * 
 * Contains all indexed files and metadata about the index itself.
 * 
 * @interface
 */
export interface FileIndex {
  /** ID of the project this index belongs to */
  projectId: string;
  /** Array of file entries */
  entries: FileIndexEntry[];
  /** Timestamp when the index was created/updated (ISO 8601) */
  indexedAt: string;
  /** Total number of files indexed */
  totalFiles: number;
  /** Total size of all indexed files in bytes */
  totalSize: number;
}

/**
 * Complete project information.
 * 
 * Combines metadata with optional file index.
 * 
 * @interface
 */
export interface Project {
  /** Project metadata */
  metadata: ProjectMetadata;
  /** Optional file index (generated when indexing is performed) */
  fileIndex?: FileIndex;
}

/**
 * Registry of all discovered projects.
 * 
 * Maintains global state of all projects and discovery configuration.
 * 
 * @interface
 */
export interface ProjectRegistry {
  /** Array of all registered projects */
  projects: Project[];
  /** Absolute paths where projects should be discovered */
  discoveryRoots: string[];
  /** Maximum depth for recursive discovery (default: 2) */
  maxDepth: number;
  /** Timestamp when the registry was last updated (ISO 8601) */
  updatedAt: string;
}

/**
 * Project detection patterns.
 * 
 * Defines what files/directories indicate a project of a certain type.
 * 
 * @interface
 */
export interface ProjectDetectionPattern {
  /** Name/identifier of the pattern */
  name: string;
  /** Files that must exist (relative to project root) */
  requiredFiles?: string[];
  /** Directories that must exist */
  requiredDirs?: string[];
  /** Detected language when this pattern matches */
  language?: string;
  /** Detected framework when this pattern matches */
  framework?: string;
}

