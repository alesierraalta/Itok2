/**
 * Zod schemas for validating project management types
 * @module types/project-schemas
 * 
 * These schemas provide runtime validation for Project, ProjectRegistry,
 * ProjectMetadata, FileIndex, and FileIndexEntry.
 * Used in MCP tools to validate inputs and outputs.
 */

import { z } from "zod";
import path from "node:path";
import {
  ProjectStatus,
  FileKind,
  type ProjectMetadata,
  type FileIndexEntry,
  type FileIndex,
  type Project,
  type ProjectRegistry,
} from "./project.js";

/**
 * Schema for ProjectStatus enum
 */
export const projectStatusSchema = z.nativeEnum(ProjectStatus);

/**
 * Schema for FileKind enum
 */
export const fileKindSchema = z.nativeEnum(FileKind);

/**
 * UUID v4 validation regex
 */
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * ISO 8601 datetime validation regex
 * Matches: YYYY-MM-DDTHH:mm:ss.sssZ or YYYY-MM-DDTHH:mm:ssZ
 */
const ISO_8601_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;

/**
 * Schema for UUID v4 string
 */
const uuidSchema = z.string().regex(UUID_V4_REGEX, "Must be a valid UUID v4");

/**
 * Schema for ISO 8601 datetime string
 */
const iso8601Schema = z.string().regex(ISO_8601_REGEX, "Must be a valid ISO 8601 datetime");

/**
 * Schema for absolute path string
 */
const absolutePathSchema = z.string().refine(
  (val) => path.isAbsolute(val),
  { message: "Path must be absolute" }
);

/**
 * Schema for relative path string (must not be absolute)
 */
const relativePathSchema = z.string().refine(
  (val) => !path.isAbsolute(val) && !val.startsWith(".."),
  { message: "Path must be relative to project root and not contain '..'" }
);

/**
 * Schema for ProjectMetadata
 */
export const projectMetadataSchema: z.ZodType<ProjectMetadata> = z.object({
  id: uuidSchema,
  name: z.string().min(1, "Name cannot be empty"),
  path: absolutePathSchema,
  status: projectStatusSchema,
  discoveredAt: iso8601Schema,
  lastIndexedAt: iso8601Schema.optional(),
  language: z.string().optional(),
  framework: z.string().optional(),
});

/**
 * Schema for FileIndexEntry
 */
export const fileIndexEntrySchema: z.ZodType<FileIndexEntry> = z.object({
  path: relativePathSchema,
  kind: fileKindSchema,
  size: z.number().int().nonnegative("Size must be non-negative"),
  lastModified: iso8601Schema,
  symbols: z.array(z.string()).optional(),
});

/**
 * Schema for FileIndex
 */
export const fileIndexSchema: z.ZodType<FileIndex> = z.object({
  projectId: uuidSchema,
  entries: z.array(fileIndexEntrySchema),
  indexedAt: iso8601Schema,
  totalFiles: z.number().int().nonnegative("Total files must be non-negative"),
  totalSize: z.number().int().nonnegative("Total size must be non-negative"),
}).refine(
  (data) => data.entries.length === data.totalFiles,
  {
    message: "totalFiles must match the length of entries array",
    path: ["totalFiles"],
  }
).refine(
  (data) => {
    const calculatedTotalSize = data.entries.reduce((sum, entry) => sum + entry.size, 0);
    return calculatedTotalSize === data.totalSize;
  },
  {
    message: "totalSize must match the sum of all entry sizes",
    path: ["totalSize"],
  }
);

/**
 * Schema for Project
 */
export const projectSchema: z.ZodType<Project> = z.object({
  metadata: projectMetadataSchema,
  fileIndex: fileIndexSchema.optional(),
}).refine(
  (data) => {
    // If fileIndex exists, its projectId must match metadata.id
    if (data.fileIndex) {
      return data.fileIndex.projectId === data.metadata.id;
    }
    return true;
  },
  {
    message: "fileIndex.projectId must match metadata.id",
    path: ["fileIndex", "projectId"],
  }
);

/**
 * Schema for ProjectRegistry
 */
export const projectRegistrySchema: z.ZodType<ProjectRegistry> = z.object({
  projects: z.array(projectSchema),
  discoveryRoots: z.array(absolutePathSchema).min(1, "At least one discovery root is required"),
  maxDepth: z.number().int().positive("Max depth must be positive"),
  updatedAt: iso8601Schema,
}).refine(
  (data) => {
    // All project IDs must be unique
    const ids = data.projects.map((p) => p.metadata.id);
    return ids.length === new Set(ids).size;
  },
  {
    message: "All project IDs must be unique",
    path: ["projects"],
  }
).refine(
  (data) => {
    // All project paths must be unique
    const paths = data.projects.map((p) => p.metadata.path);
    return paths.length === new Set(paths).size;
  },
  {
    message: "All project paths must be unique",
    path: ["projects"],
  }
);

/**
 * Validates a ProjectMetadata object
 * @param data - The data to validate
 * @returns Validated ProjectMetadata
 * @throws ZodError if validation fails
 */
export function validateProjectMetadata(data: unknown): ProjectMetadata {
  return projectMetadataSchema.parse(data);
}

/**
 * Validates a FileIndexEntry object
 * @param data - The data to validate
 * @returns Validated FileIndexEntry
 * @throws ZodError if validation fails
 */
export function validateFileIndexEntry(data: unknown): FileIndexEntry {
  return fileIndexEntrySchema.parse(data);
}

/**
 * Validates a FileIndex object
 * @param data - The data to validate
 * @returns Validated FileIndex
 * @throws ZodError if validation fails
 */
export function validateFileIndex(data: unknown): FileIndex {
  return fileIndexSchema.parse(data);
}

/**
 * Validates a Project object
 * @param data - The data to validate
 * @returns Validated Project
 * @throws ZodError if validation fails
 */
export function validateProject(data: unknown): Project {
  return projectSchema.parse(data);
}

/**
 * Validates a ProjectRegistry object
 * @param data - The data to validate
 * @returns Validated ProjectRegistry
 * @throws ZodError if validation fails
 */
export function validateProjectRegistry(data: unknown): ProjectRegistry {
  return projectRegistrySchema.parse(data);
}

