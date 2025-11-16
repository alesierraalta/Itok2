/**
 * Utilities for setting up project directories and configuration files
 * @module tools/project-setup
 */

import fs from "node:fs/promises";
import path from "node:path";
import type { ProjectMetadata } from "../types/project.js";

/**
 * Name of the project metadata directory
 */
const MCP_PROJ_DIR = ".mcp_proj";

/**
 * Name of the project metadata file
 */
const PROJECT_YML_FILE = "project.yml";

/**
 * Name of the index directory
 */
const INDEX_DIR = "index";

/**
 * Creates the .mcp_proj directory if it doesn't exist
 * 
 * @param projectPath - Absolute path to the project root
 * @returns Promise that resolves to the path of the created directory
 * @throws Error if directory creation fails
 */
export async function createProjectDirectory(projectPath: string): Promise<string> {
  const mcpProjPath = path.join(projectPath, MCP_PROJ_DIR);
  
  try {
    await fs.mkdir(mcpProjPath, { recursive: true });
    return mcpProjPath;
  } catch (error) {
    throw new Error(`Failed to create .mcp_proj directory at ${mcpProjPath}: ${error}`);
  }
}

/**
 * Creates the .mcp_proj/index directory if it doesn't exist
 * 
 * @param projectPath - Absolute path to the project root
 * @returns Promise that resolves to the path of the created index directory
 * @throws Error if directory creation fails
 */
export async function ensureIndexDirectory(projectPath: string): Promise<string> {
  const mcpProjPath = path.join(projectPath, MCP_PROJ_DIR);
  const indexPath = path.join(mcpProjPath, INDEX_DIR);
  
  try {
    await fs.mkdir(indexPath, { recursive: true });
    return indexPath;
  } catch (error) {
    throw new Error(`Failed to create index directory at ${indexPath}: ${error}`);
  }
}

/**
 * Converts a ProjectMetadata object to YAML format
 * 
 * @param metadata - Project metadata to convert
 * @returns YAML string representation
 */
function metadataToYaml(metadata: ProjectMetadata): string {
  const lines: string[] = [];
  
  lines.push(`id: ${metadata.id}`);
  lines.push(`name: ${metadata.name}`);
  lines.push(`path: ${metadata.path}`);
  lines.push(`status: ${metadata.status}`);
  lines.push(`discoveredAt: ${metadata.discoveredAt}`);
  
  if (metadata.lastIndexedAt) {
    lines.push(`lastIndexedAt: ${metadata.lastIndexedAt}`);
  }
  
  if (metadata.language) {
    lines.push(`language: ${metadata.language}`);
  }
  
  if (metadata.framework) {
    lines.push(`framework: ${metadata.framework}`);
  }
  
  return lines.join("\n") + "\n";
}

/**
 * Creates or updates the project.yml file with project metadata
 * 
 * @param projectPath - Absolute path to the project root
 * @param metadata - Project metadata to write
 * @returns Promise that resolves when the file is written
 * @throws Error if file writing fails
 */
export async function createProjectYml(
  projectPath: string,
  metadata: ProjectMetadata
): Promise<void> {
  // Ensure .mcp_proj directory exists
  await createProjectDirectory(projectPath);
  
  const mcpProjPath = path.join(projectPath, MCP_PROJ_DIR);
  const ymlPath = path.join(mcpProjPath, PROJECT_YML_FILE);
  
  const yamlContent = metadataToYaml(metadata);
  
  try {
    await fs.writeFile(ymlPath, yamlContent, "utf-8");
  } catch (error) {
    throw new Error(`Failed to write project.yml at ${ymlPath}: ${error}`);
  }
}

/**
 * Reads and parses the project.yml file
 * 
 * @param projectPath - Absolute path to the project root
 * @returns Promise that resolves to the parsed ProjectMetadata, or null if file doesn't exist
 * @throws Error if file reading or parsing fails
 */
export async function readProjectYml(projectPath: string): Promise<ProjectMetadata | null> {
  const mcpProjPath = path.join(projectPath, MCP_PROJ_DIR);
  const ymlPath = path.join(mcpProjPath, PROJECT_YML_FILE);
  
  try {
    const content = await fs.readFile(ymlPath, "utf-8");
    return parseYamlMetadata(content);
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw new Error(`Failed to read project.yml at ${ymlPath}: ${error}`);
  }
}

/**
 * Parses YAML content into ProjectMetadata
 * Simple YAML parser for basic key-value pairs
 * 
 * @param yamlContent - YAML string content
 * @returns Parsed ProjectMetadata
 * @throws Error if parsing fails
 */
function parseYamlMetadata(yamlContent: string): ProjectMetadata {
  const metadata: Partial<ProjectMetadata> = {};
  const lines = yamlContent.split("\n");
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    
    const colonIndex = trimmed.indexOf(":");
    if (colonIndex === -1) {
      continue;
    }
    
    const key = trimmed.substring(0, colonIndex).trim();
    const value = trimmed.substring(colonIndex + 1).trim();
    
    switch (key) {
      case "id":
        metadata.id = value;
        break;
      case "name":
        metadata.name = value;
        break;
      case "path":
        metadata.path = value;
        break;
      case "status":
        metadata.status = value as ProjectMetadata["status"];
        break;
      case "discoveredAt":
        metadata.discoveredAt = value;
        break;
      case "lastIndexedAt":
        metadata.lastIndexedAt = value;
        break;
      case "language":
        metadata.language = value;
        break;
      case "framework":
        metadata.framework = value;
        break;
    }
  }
  
  // Validate required fields
  if (!metadata.id || !metadata.name || !metadata.path || !metadata.status || !metadata.discoveredAt) {
    throw new Error("Invalid project.yml: missing required fields");
  }
  
  return metadata as ProjectMetadata;
}

