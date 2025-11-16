/**
 * Configuration for project discovery and indexing
 * @module config/project-config
 */

import path from "node:path";
import type { ProjectDetectionPattern } from "../types/project.js";

/**
 * Default maximum depth for recursive project discovery
 */
export const DEFAULT_MAX_DEPTH = 2;

/**
 * File extensions to include in file indexing
 * Organized by language/type
 */
export const INDEXABLE_EXTENSIONS = {
  typescript: [".ts", ".tsx"],
  javascript: [".js", ".jsx", ".mjs", ".cjs"],
  python: [".py", ".pyw"],
  java: [".java"],
  rust: [".rs"],
  go: [".go"],
  cpp: [".cpp", ".cc", ".cxx", ".hpp", ".h"],
  c: [".c", ".h"],
  // Config files
  config: [".json", ".yaml", ".yml", ".toml", ".ini", ".conf"],
  // Documentation
  docs: [".md", ".txt", ".rst"],
} as const;

/**
 * All indexable extensions as a flat array
 */
export const ALL_INDEXABLE_EXTENSIONS = Object.values(INDEXABLE_EXTENSIONS).flat();

/**
 * Directories to exclude from indexing
 */
export const EXCLUDED_DIRECTORIES = [
  "node_modules",
  ".git",
  "build",
  "dist",
  ".next",
  ".nuxt",
  ".cache",
  "coverage",
  ".nyc_output",
  ".vscode",
  ".idea",
  "__pycache__",
  ".pytest_cache",
  ".mypy_cache",
  "venv",
  "env",
  ".venv",
  ".env",
  "target", // Rust
  "bin",
  "obj",
] as const;

/**
 * Project detection patterns
 * Each pattern defines what files/directories indicate a project type
 */
export const PROJECT_DETECTION_PATTERNS: ProjectDetectionPattern[] = [
  {
    name: "git",
    requiredDirs: [".git"],
    language: undefined,
    framework: undefined,
  },
  {
    name: "nodejs",
    requiredFiles: ["package.json"],
    language: "javascript",
    framework: undefined,
  },
  {
    name: "typescript",
    requiredFiles: ["tsconfig.json"],
    language: "typescript",
    framework: undefined,
  },
  {
    name: "python",
    requiredFiles: ["requirements.txt"],
    language: "python",
    framework: undefined,
  },
  {
    name: "python-pyproject",
    requiredFiles: ["pyproject.toml"],
    language: "python",
    framework: undefined,
  },
  {
    name: "django",
    requiredFiles: ["manage.py"],
    language: "python",
    framework: "django",
  },
  {
    name: "flask",
    requiredFiles: ["app.py", "requirements.txt"],
    language: "python",
    framework: "flask",
  },
  {
    name: "java-maven",
    requiredFiles: ["pom.xml"],
    language: "java",
    framework: "maven",
  },
  {
    name: "java-gradle",
    requiredFiles: ["build.gradle"],
    language: "java",
    framework: "gradle",
  },
  {
    name: "rust",
    requiredFiles: ["Cargo.toml"],
    language: "rust",
    framework: undefined,
  },
];

/**
 * Get default discovery roots
 * Includes repos/ directory and current workspace (ITok)
 * 
 * @returns Array of absolute paths to discovery roots
 */
export function getDefaultDiscoveryRoots(): string[] {
  const workspaceRoot = process.cwd();
  const reposPath = path.join(workspaceRoot, "repos");
  
  return [
    reposPath,
    workspaceRoot, // ITok project itself
  ];
}

/**
 * Project discovery configuration
 */
export interface ProjectDiscoveryConfig {
  /** Absolute paths where projects should be discovered */
  discoveryRoots: string[];
  /** Maximum depth for recursive discovery */
  maxDepth: number;
  /** Patterns for detecting project types */
  detectionPatterns: ProjectDetectionPattern[];
}

/**
 * File indexing configuration
 */
export interface FileIndexingConfig {
  /** File extensions to include in indexing */
  allowedExtensions: readonly string[];
  /** Directory names to exclude from indexing */
  excludedDirectories: readonly string[];
  /** Whether to index symbols in code files */
  indexSymbols: boolean;
}

/**
 * Default project discovery configuration
 */
export function getDefaultDiscoveryConfig(): ProjectDiscoveryConfig {
  return {
    discoveryRoots: getDefaultDiscoveryRoots(),
    maxDepth: DEFAULT_MAX_DEPTH,
    detectionPatterns: PROJECT_DETECTION_PATTERNS,
  };
}

/**
 * Default file indexing configuration
 */
export function getDefaultIndexingConfig(): FileIndexingConfig {
  return {
    allowedExtensions: ALL_INDEXABLE_EXTENSIONS,
    excludedDirectories: EXCLUDED_DIRECTORIES,
    indexSymbols: true,
  };
}

