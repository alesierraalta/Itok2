/**
 * MCP tool for discovering and registering projects
 * @module tools/discover-projects
 * 
 * Scans discovery roots recursively to find projects based on detection patterns,
 * creates project metadata, and registers them in the ProjectRegistry.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { ProjectMetadata, ProjectRegistry, ProjectDetectionPattern } from "../types/project.js";
import { ProjectStatus } from "../types/project.js";
import {
  getDefaultDiscoveryConfig,
  PROJECT_DETECTION_PATTERNS,
  type ProjectDiscoveryConfig,
} from "../config/project-config.js";
import { createProjectYml } from "./project-setup.js";
import { validateProjectMetadata, validateProjectRegistry } from "../types/project-schemas.js";

/**
 * Checks if a file exists
 * 
 * @param filePath - Absolute path to file
 * @returns Promise that resolves to true if file exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if a directory exists
 * 
 * @param dirPath - Absolute path to directory
 * @returns Promise that resolves to true if directory exists
 */
async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Checks if a directory matches a project detection pattern
 * 
 * @param dirPath - Absolute path to directory to check
 * @param pattern - Detection pattern to match against
 * @returns Promise that resolves to the matched pattern with language/framework, or null if no match
 */
async function matchesPattern(
  dirPath: string,
  pattern: ProjectDetectionPattern
): Promise<{ language?: string; framework?: string } | null> {
  // Check required files
  if (pattern.requiredFiles) {
    for (const file of pattern.requiredFiles) {
      const filePath = path.join(dirPath, file);
      if (!(await fileExists(filePath))) {
        return null; // Required file missing
      }
    }
  }
  
  // Check required directories
  if (pattern.requiredDirs) {
    for (const dir of pattern.requiredDirs) {
      const dirPathFull = path.join(dirPath, dir);
      if (!(await directoryExists(dirPathFull))) {
        return null; // Required directory missing
      }
    }
  }
  
  // Pattern matches
  return {
    language: pattern.language,
    framework: pattern.framework,
  };
}

/**
 * Detects project type by checking against all patterns
 * Returns the most specific match (framework > language > generic)
 * 
 * @param dirPath - Absolute path to directory to check
 * @returns Promise that resolves to detected language and framework, or null if no project detected
 */
async function detectProjectType(dirPath: string): Promise<{ language?: string; framework?: string } | null> {
  let bestMatch: { language?: string; framework?: string } | null = null;
  let bestSpecificity = 0; // Higher = more specific
  
  for (const pattern of PROJECT_DETECTION_PATTERNS) {
    const match = await matchesPattern(dirPath, pattern);
    if (match) {
      // Calculate specificity: framework = 2, language = 1, generic = 0
      const specificity = (match.framework ? 2 : 0) + (match.language ? 1 : 0);
      if (specificity > bestSpecificity) {
        bestMatch = match;
        bestSpecificity = specificity;
      }
    }
  }
  
  return bestMatch;
}

/**
 * Recursively discovers projects in a directory
 * 
 * @param dirPath - Absolute path to directory to scan
 * @param currentDepth - Current recursion depth
 * @param maxDepth - Maximum recursion depth
 * @param discoveredProjects - Map to collect discovered projects (path -> metadata)
 * @param forceReindex - Whether to reindex already discovered projects
 * @returns Promise that resolves when scanning is complete
 */
async function discoverInDirectory(
  dirPath: string,
  currentDepth: number,
  maxDepth: number,
  discoveredProjects: Map<string, ProjectMetadata>,
  forceReindex: boolean
): Promise<void> {
  // Stop if max depth reached
  if (currentDepth > maxDepth) {
    return;
  }
  
  try {
    // Check if this directory is a project
    const projectType = await detectProjectType(dirPath);
    
    if (projectType !== null) {
      // This is a project
      const projectName = path.basename(dirPath);
      const existingProject = discoveredProjects.get(dirPath);
      
      // Skip if already discovered and not forcing reindex
      if (existingProject && !forceReindex) {
        return;
      }
      
      // Generate or reuse project ID
      const projectId = existingProject?.id || randomUUID();
      
      // Create project metadata
      const metadata: ProjectMetadata = {
        id: projectId,
        name: projectName,
        path: dirPath,
        status: ProjectStatus.Active,
        discoveredAt: existingProject?.discoveredAt || new Date().toISOString(),
        lastIndexedAt: existingProject?.lastIndexedAt,
        language: projectType.language,
        framework: projectType.framework,
      };
      
      // Validate metadata
      const validatedMetadata = validateProjectMetadata(metadata);
      
      // Create .mcp_proj/ and project.yml
      await createProjectYml(dirPath, validatedMetadata);
      
      // Register project
      discoveredProjects.set(dirPath, validatedMetadata);
      
      // Don't scan subdirectories of a discovered project
      return;
    }
    
    // Not a project, continue scanning subdirectories
    if (currentDepth < maxDepth) {
      const items = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const item of items) {
        if (item.isDirectory()) {
          const subDirPath = path.join(dirPath, item.name);
          await discoverInDirectory(
            subDirPath,
            currentDepth + 1,
            maxDepth,
            discoveredProjects,
            forceReindex
          );
        }
      }
    }
  } catch (error) {
    // Log error but continue with other directories
    console.warn(`Error discovering in directory ${dirPath}:`, error);
  }
}

/**
 * Discovers projects in discovery roots
 * 
 * @param config - Discovery configuration
 * @param forceReindex - Whether to reindex already discovered projects
 * @returns Promise that resolves to array of discovered project metadata
 */
async function discoverProjects(
  config: ProjectDiscoveryConfig,
  forceReindex: boolean
): Promise<ProjectMetadata[]> {
  const discoveredProjects = new Map<string, ProjectMetadata>();
  
  // Discover in each root
  for (const rootPath of config.discoveryRoots) {
    // Check if root exists
    if (await directoryExists(rootPath)) {
      await discoverInDirectory(
        rootPath,
        0, // Start at depth 0
        config.maxDepth,
        discoveredProjects,
        forceReindex
      );
    }
  }
  
  return Array.from(discoveredProjects.values());
}

/**
 * Handler for the discover_projects MCP tool
 * 
 * @param args - Tool arguments
 * @returns MCP tool response with discovered projects
 */
export async function handleDiscoverProjects(args: {
  rootPath?: string;
  maxDepth?: number;
  forceReindex?: boolean;
}): Promise<{
  content: Array<{ type: "text"; text: string }>;
}> {
  const startTime = Date.now();
  
  // Get configuration
  const defaultConfig = getDefaultDiscoveryConfig();
  const config: ProjectDiscoveryConfig = {
    discoveryRoots: args.rootPath 
      ? [path.isAbsolute(args.rootPath) ? args.rootPath : path.resolve(args.rootPath)]
      : defaultConfig.discoveryRoots,
    maxDepth: args.maxDepth ?? defaultConfig.maxDepth,
    detectionPatterns: defaultConfig.detectionPatterns,
  };
  
  // Discover projects
  const discoveredProjects = await discoverProjects(config, args.forceReindex ?? false);
  
  // Create ProjectRegistry
  const registry: ProjectRegistry = {
    projects: discoveredProjects.map((metadata) => ({ metadata })),
    discoveryRoots: config.discoveryRoots,
    maxDepth: config.maxDepth,
    updatedAt: new Date().toISOString(),
  };
  
  // Validate registry
  const validatedRegistry = validateProjectRegistry(registry);
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  // Return response
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          success: true,
          discovered: discoveredProjects.length,
          total: validatedRegistry.projects.length,
          projects: discoveredProjects.map((p) => ({
            id: p.id,
            name: p.name,
            path: p.path,
            language: p.language,
            framework: p.framework,
          })),
          durationMs: duration,
        }, null, 2),
      },
    ],
  };
}

/**
 * Input schema for discover_projects tool
 */
export const discoverProjectsInputSchema = {
  rootPath: {
    type: "string" as const,
    description: "Optional root path to discover projects in. If not provided, uses discoveryRoots from config.",
  },
  maxDepth: {
    type: "number" as const,
    description: "Optional maximum depth for recursive discovery. If not provided, uses maxDepth from config.",
  },
  forceReindex: {
    type: "boolean" as const,
    description: "Whether to force reindexing of already discovered projects. Default: false.",
  },
};

