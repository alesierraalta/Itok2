/**
 * File indexing system for projects
 * @module tools/index-files
 * 
 * Provides functionality to index files in a project, including
 * metadata extraction and symbol detection for code files.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type {
  FileIndex,
  FileIndexEntry,
} from "../types/project.js";
import { FileKind } from "../types/project.js";
import {
  ALL_INDEXABLE_EXTENSIONS,
  EXCLUDED_DIRECTORIES,
  type FileIndexingConfig,
  getDefaultIndexingConfig,
} from "../config/project-config.js";
import { ensureIndexDirectory } from "./project-setup.js";

/**
 * Determines the FileKind for a file based on its path and extension
 * 
 * @param filePath - Relative path from project root
 * @param extension - File extension (with dot)
 * @returns Detected FileKind
 */
function determineFileKind(filePath: string, extension: string): FileKind {
  const lowerPath = filePath.toLowerCase();
  const lowerExt = extension.toLowerCase();
  
  // Test files
  if (
    lowerPath.includes("/test/") ||
    lowerPath.includes("/tests/") ||
    lowerPath.includes("__tests__") ||
    lowerPath.includes(".test.") ||
    lowerPath.includes(".spec.") ||
    lowerExt === ".test.ts" ||
    lowerExt === ".test.js" ||
    lowerExt === ".spec.ts" ||
    lowerExt === ".spec.js"
  ) {
    return FileKind.Test;
  }
  
  // Config files
  if (
    lowerExt === ".json" ||
    lowerExt === ".yaml" ||
    lowerExt === ".yml" ||
    lowerExt === ".toml" ||
    lowerExt === ".ini" ||
    lowerExt === ".conf" ||
    lowerPath.includes("/config/") ||
    lowerPath === "package.json" ||
    lowerPath === "tsconfig.json" ||
    lowerPath === "pyproject.toml" ||
    lowerPath === "requirements.txt"
  ) {
    return FileKind.Config;
  }
  
  // Documentation files
  if (
    lowerExt === ".md" ||
    lowerExt === ".txt" ||
    lowerExt === ".rst" ||
    lowerPath.includes("/docs/") ||
    lowerPath.includes("/documentation/") ||
    lowerPath === "readme.md" ||
    lowerPath === "readme.txt"
  ) {
    return FileKind.Documentation;
  }
  
  // Source code files (default for code extensions)
  const codeExtensions = [
    ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
    ".py", ".java", ".rs", ".go", ".cpp", ".cc", ".cxx", ".hpp", ".c", ".h",
  ];
  if (codeExtensions.includes(lowerExt)) {
    return FileKind.Source;
  }
  
  return FileKind.Other;
}

/**
 * Checks if a directory should be excluded from indexing
 * 
 * @param dirName - Name of the directory
 * @param excludedDirs - Array of excluded directory names
 * @returns True if directory should be excluded
 */
function isExcludedDirectory(dirName: string, excludedDirs: readonly string[]): boolean {
  return excludedDirs.some((excluded) => 
    dirName.toLowerCase() === excluded.toLowerCase()
  );
}

/**
 * Checks if a file extension is indexable
 * 
 * @param extension - File extension (with dot)
 * @param allowedExtensions - Array of allowed extensions
 * @returns True if extension is allowed
 */
function isIndexableExtension(
  extension: string,
  allowedExtensions: readonly string[]
): boolean {
  return allowedExtensions.some((allowed) => 
    extension.toLowerCase() === allowed.toLowerCase()
  );
}

/**
 * Recursively scans a directory and collects file information
 * 
 * @param dirPath - Absolute path to directory to scan
 * @param projectRoot - Absolute path to project root
 * @param config - Indexing configuration
 * @param entries - Array to collect FileIndexEntry objects
 * @returns Promise that resolves when scanning is complete
 */
async function scanDirectory(
  dirPath: string,
  projectRoot: string,
  config: FileIndexingConfig,
  entries: FileIndexEntry[]
): Promise<void> {
  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item.name);
      const relativePath = path.relative(projectRoot, itemPath);
      
      if (item.isDirectory()) {
        // Skip excluded directories
        if (isExcludedDirectory(item.name, config.excludedDirectories)) {
          continue;
        }
        
        // Recursively scan subdirectory
        await scanDirectory(itemPath, projectRoot, config, entries);
      } else if (item.isFile()) {
        const extension = path.extname(item.name);
        
        // Skip if extension is not indexable
        if (!isIndexableExtension(extension, config.allowedExtensions)) {
          continue;
        }
        
        // Get file stats
        const stats = await fs.stat(itemPath);
        const fileKind = determineFileKind(relativePath, extension);
        
        const entry: FileIndexEntry = {
          path: relativePath.replace(/\\/g, "/"), // Normalize to forward slashes
          kind: fileKind,
          size: stats.size,
          lastModified: stats.mtime.toISOString(),
        };
        
        // Optionally extract symbols for code files
        // Note: Full symbol extraction would require Serena MCP integration
        // For now, we'll leave symbols as undefined
        // This can be enhanced later with actual symbol detection
        if (config.indexSymbols && fileKind === FileKind.Source) {
          // Placeholder for symbol extraction
          // entry.symbols = await extractSymbols(itemPath, projectRoot);
        }
        
        entries.push(entry);
      }
    }
  } catch (error) {
    // Log error but continue with other files
    console.warn(`Error scanning directory ${dirPath}:`, error);
  }
}

/**
 * Indexes all files in a project
 * 
 * @param projectId - UUID of the project
 * @param projectPath - Absolute path to the project root
 * @param config - Optional indexing configuration (uses default if not provided)
 * @returns Promise that resolves to the created FileIndex
 * @throws Error if indexing fails
 */
export async function indexProjectFiles(
  projectId: string,
  projectPath: string,
  config?: FileIndexingConfig
): Promise<FileIndex> {
  const indexingConfig = config || getDefaultIndexingConfig();
  const entries: FileIndexEntry[] = [];
  
  // Scan project directory
  await scanDirectory(projectPath, projectPath, indexingConfig, entries);
  
  // Calculate totals
  const totalFiles = entries.length;
  const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
  
  // Create FileIndex
  const fileIndex: FileIndex = {
    projectId,
    entries,
    indexedAt: new Date().toISOString(),
    totalFiles,
    totalSize,
  };
  
  return fileIndex;
}

/**
 * Saves a FileIndex to disk
 * 
 * @param projectPath - Absolute path to the project root
 * @param fileIndex - FileIndex to save
 * @returns Promise that resolves when file is saved
 * @throws Error if saving fails
 */
export async function saveFileIndex(
  projectPath: string,
  fileIndex: FileIndex
): Promise<void> {
  // Ensure index directory exists
  await ensureIndexDirectory(projectPath);
  
  const indexPath = path.join(projectPath, ".mcp_proj", "index", "files.json");
  const jsonContent = JSON.stringify(fileIndex, null, 2);
  
  try {
    await fs.writeFile(indexPath, jsonContent, "utf-8");
  } catch (error) {
    throw new Error(`Failed to save file index at ${indexPath}: ${error}`);
  }
}

/**
 * Loads a FileIndex from disk
 * 
 * @param projectPath - Absolute path to the project root
 * @returns Promise that resolves to the FileIndex, or null if not found
 * @throws Error if loading fails
 */
export async function loadFileIndex(
  projectPath: string
): Promise<FileIndex | null> {
  const indexPath = path.join(projectPath, ".mcp_proj", "index", "files.json");
  
  try {
    const content = await fs.readFile(indexPath, "utf-8");
    return JSON.parse(content) as FileIndex;
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw new Error(`Failed to load file index from ${indexPath}: ${error}`);
  }
}

