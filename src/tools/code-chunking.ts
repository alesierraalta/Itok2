/**
 * Code chunking module (H-Net-inspired)
 * @module tools/code-chunking
 * 
 * Provides semantic code chunking that divides files and symbols into
 * chunks optimized for token usage. Uses Serena LSP for symbol-based chunking
 * and heuristics for sub-chunking large symbols.
 */

import {
  type CodeChunk,
  type ChunkingOptions,
  type ChunkingResult,
  type ScopeResolution,
  type PlanScope,
  type PlanStep,
  type TaskPlan,
  ChunkType,
  type BlockInfo,
} from "../types/index.js";
import { translateScopeSelector, getStepScope } from "./scope-resolver.js";
import {
  detectLogicalBlocks,
  findCommentBoundaries,
  estimateTokenCount,
  generateChunkSummary,
  generateChunkId,
} from "./chunking-helpers.js";
// Note: chunkLargeSymbol is imported from code-chunking-impl.ts
// but is not used directly in this file - it would be called from chunkBySymbol
// when a symbol exceeds maxLinesPerChunk

/**
 * Default chunking options.
 */
const DEFAULT_OPTIONS: {
  maxChunksPerStep: number;
  maxLinesPerChunk: number;
  includeContent: boolean;
  applyDechunking: boolean;
} = {
  maxChunksPerStep: 5,
  maxLinesPerChunk: 100,
  includeContent: true,
  applyDechunking: true,
};

/**
 * Merges default options with provided options.
 */
function mergeOptions(options?: ChunkingOptions): ChunkingOptions & {
  maxChunksPerStep: number;
  maxLinesPerChunk: number;
  includeContent: boolean;
  applyDechunking: boolean;
} {
  return {
    maxChunksPerStep: options?.maxChunksPerStep ?? DEFAULT_OPTIONS.maxChunksPerStep,
    maxLinesPerChunk: options?.maxLinesPerChunk ?? DEFAULT_OPTIONS.maxLinesPerChunk,
    maxTokensPerChunk: options?.maxTokensPerChunk,
    includeContent: options?.includeContent ?? DEFAULT_OPTIONS.includeContent,
    applyDechunking: options?.applyDechunking ?? DEFAULT_OPTIONS.applyDechunking,
  };
}

/**
 * Creates a code chunk from symbol information.
 * 
 * This is a helper that creates a chunk structure from symbol data.
 * The actual symbol retrieval would be done via Serena MCP.
 * 
 * @param filePath - Path to the file containing the symbol
 * @param symbolName - Name of the symbol
 * @param symbolKind - Kind of symbol (function, class, method, etc.)
 * @param startLine - Starting line number (1-based)
 * @param endLine - Ending line number (1-based, inclusive)
 * @param content - Optional code content
 * @param options - Chunking options
 * @returns CodeChunk object
 */
function createSymbolChunk(
  filePath: string,
  symbolName: string,
  symbolKind: string,
  startLine: number,
  endLine: number,
  content?: string,
  options?: ChunkingOptions
): CodeChunk {
  const lineCount = endLine - startLine + 1;
  const codeContent = content || "";
  const estimatedTokens = estimateTokenCount(codeContent);

  return {
    id: generateChunkId("symbol"),
    filePath,
    startLine,
    endLine,
    type: ChunkType.Symbol,
    metadata: {
      type: ChunkType.Symbol,
      lineCount,
      estimatedTokens,
      symbolName,
      symbolKind,
      summary: `${symbolKind} ${symbolName} (${lineCount} lines)`,
    },
    content: options?.includeContent !== false ? codeContent : undefined,
  };
}

/**
 * Chunks code by symbol using Serena LSP (prepared for integration).
 * 
 * This function is a placeholder for future integration with Serena MCP.
 * Currently simulates symbol-based chunking.
 * 
 * Future implementation would:
 * 1. Use serena.get_symbols_overview to get all symbols in scope
 * 2. For each symbol, create a chunk
 * 3. If symbol is too large, call chunkLargeSymbol
 * 4. Apply limits and dechunking
 * 
 * @param scope - The scope resolution containing symbol information
 * @param options - Chunking options
 * @returns Promise resolving to ChunkingResult
 */
export async function chunkBySymbol(
  scope: ScopeResolution,
  options?: ChunkingOptions
): Promise<ChunkingResult> {
  const opts = mergeOptions(options);
  const chunks: CodeChunk[] = [];
  const warnings: string[] = [];

  // For now, this is a placeholder
  // Future: integrate with Serena MCP to get actual symbols
  if (scope.parsedInfo.symbolName) {
    // Simulated symbol chunk
    const chunk = createSymbolChunk(
      "unknown.ts", // Would come from Serena
      scope.parsedInfo.symbolName,
      "function", // Would come from Serena
      1,
      50, // Would come from Serena LSP
      undefined,
      opts
    );
    chunks.push(chunk);
  } else {
    warnings.push("No symbol information available in scope resolution");
  }

  // Apply dechunking if needed
  let finalChunks = chunks;
  if (opts.applyDechunking && chunks.length > opts.maxChunksPerStep) {
    const dechunkResult = applyDechunking(chunks, opts);
    finalChunks = dechunkResult.chunks;
    warnings.push(...dechunkResult.warnings);
  }

  // Calculate statistics
  const totalLines = finalChunks.reduce((sum, chunk) => sum + chunk.metadata.lineCount, 0);
  const estimatedTokens = finalChunks.reduce(
    (sum, chunk) => sum + (chunk.metadata.estimatedTokens || 0),
    0
  );

  return {
    chunks: finalChunks,
    stats: {
      totalChunks: finalChunks.length,
      chunksMerged: chunks.length - finalChunks.length,
      totalLines,
      estimatedTokens,
    },
    warnings,
  };
}

/**
 * Chunks code by file range.
 * 
 * Creates chunks from a range of lines in a file.
 * Useful when symbol information is not available.
 * 
 * @param filePath - Path to the file
 * @param startLine - Starting line number (1-based)
 * @param endLine - Ending line number (1-based, inclusive)
 * @param options - Chunking options
 * @returns Array of CodeChunk objects
 */
export function chunkByFileRange(
  filePath: string,
  startLine: number,
  endLine: number,
  options?: ChunkingOptions
): CodeChunk[] {
  const opts = mergeOptions(options);
  const chunks: CodeChunk[] = [];
  const lineCount = endLine - startLine + 1;

  if (lineCount <= opts.maxLinesPerChunk) {
    // Single chunk
    chunks.push({
      id: generateChunkId("file"),
      filePath,
      startLine,
      endLine,
      type: ChunkType.FileRange,
      metadata: {
        type: ChunkType.FileRange,
        lineCount,
        estimatedTokens: 0, // Would need file content to estimate
        summary: `File range: lines ${startLine}-${endLine} (${lineCount} lines)`,
      },
    });
  } else {
    // Split into multiple chunks
    let currentStart = startLine;
    let chunkIndex = 0;

    while (currentStart <= endLine) {
      const currentEnd = Math.min(currentStart + opts.maxLinesPerChunk - 1, endLine);
      const chunkLineCount = currentEnd - currentStart + 1;

      chunks.push({
        id: generateChunkId("file", chunkIndex),
        filePath,
        startLine: currentStart,
        endLine: currentEnd,
        type: ChunkType.FileRange,
        metadata: {
          type: ChunkType.FileRange,
          lineCount: chunkLineCount,
          estimatedTokens: 0,
          summary: `File range: lines ${currentStart}-${currentEnd} (${chunkLineCount} lines)`,
        },
      });

      currentStart = currentEnd + 1;
      chunkIndex++;
    }
  }

  return chunks;
}

/**
 * Applies dechunking (merges chunks if limits exceeded).
 * 
 * If the number of chunks exceeds maxChunksPerStep, merges adjacent chunks
 * and generates summaries instead of full code content.
 * 
 * @param chunks - Array of chunks to potentially merge
 * @param options - Chunking options
 * @returns Object with merged chunks and warnings
 */
export function applyDechunking(
  chunks: CodeChunk[],
  options: ChunkingOptions & {
    maxChunksPerStep: number;
    maxLinesPerChunk: number;
    includeContent: boolean;
    applyDechunking: boolean;
  }
): { chunks: CodeChunk[]; warnings: string[] } {
  const warnings: string[] = [];

  if (chunks.length <= options.maxChunksPerStep) {
    return { chunks, warnings };
  }

  // Group chunks by file
  const byFile = new Map<string, CodeChunk[]>();
  for (const chunk of chunks) {
    if (!byFile.has(chunk.filePath)) {
      byFile.set(chunk.filePath, []);
    }
    byFile.get(chunk.filePath)!.push(chunk);
  }

  const mergedChunks: CodeChunk[] = [];

  for (const [filePath, fileChunks] of byFile.entries()) {
    // Sort chunks by start line
    fileChunks.sort((a, b) => a.startLine - b.startLine);

    // Merge chunks until we're under the limit
    let i = 0;
    while (i < fileChunks.length) {
      const chunksToMerge: CodeChunk[] = [];
      let mergeStart = i;

      // Collect chunks to merge (up to limit)
      while (
        chunksToMerge.length < options.maxChunksPerStep &&
        mergeStart < fileChunks.length
      ) {
        chunksToMerge.push(fileChunks[mergeStart]);
        mergeStart++;
      }

      if (chunksToMerge.length === 1) {
        // Single chunk, no merging needed
        mergedChunks.push(chunksToMerge[0]);
        i++;
      } else {
        // Merge multiple chunks
        const firstChunk = chunksToMerge[0];
        const lastChunk = chunksToMerge[chunksToMerge.length - 1];
        const totalLines = lastChunk.endLine - firstChunk.startLine + 1;

        const summary = generateChunkSummary(chunksToMerge);

        mergedChunks.push({
          id: generateChunkId("merged"),
          filePath,
          startLine: firstChunk.startLine,
          endLine: lastChunk.endLine,
          type: ChunkType.Summary,
          metadata: {
            type: ChunkType.Summary,
            lineCount: totalLines,
            estimatedTokens: chunksToMerge.reduce(
              (sum, c) => sum + (c.metadata.estimatedTokens || 0),
              0
            ),
            summary,
            mergedFrom: chunksToMerge.map((c) => c.id),
          },
        });

        warnings.push(
          `Merged ${chunksToMerge.length} chunks into summary (lines ${firstChunk.startLine}-${lastChunk.endLine})`
        );
        i = mergeStart;
      }
    }
  }

  return { chunks: mergedChunks, warnings };
}

/**
 * Chunks code based on a scope.
 * 
 * Integrates with scope resolution to determine the appropriate chunking strategy
 * based on the scope type (symbol, module, file, etc.).
 * 
 * @param scope - The plan scope to chunk
 * @param plan - The plan (for context)
 * @param options - Chunking options
 * @returns Promise resolving to ChunkingResult
 */
export async function chunkScope(
  scope: PlanScope,
  plan: TaskPlan,
  options?: ChunkingOptions
): Promise<ChunkingResult> {
  const scopeResolution = translateScopeSelector(scope);

  // Choose chunking strategy based on resolution type
  switch (scopeResolution.resolutionType) {
    case "symbol":
    case "serena_action":
      // Chunk by symbol
      return await chunkBySymbol(scopeResolution, options);

    case "pattern":
    case "file":
      // Chunk by file range (would need file path from pattern)
      const filePath = scopeResolution.parsedInfo.pathPattern || "unknown.ts";
      return {
        chunks: chunkByFileRange(filePath, 1, 100, options), // Placeholder
        stats: {
          totalChunks: 1,
          chunksMerged: 0,
          totalLines: 100,
          estimatedTokens: 0,
        },
        warnings: ["File range chunking: file path needs to be resolved"],
      };

    case "module":
    case "global":
    default:
      // For module/global, would need to get symbols via Serena
      // For now, return empty result with warning
      return {
        chunks: [],
        stats: {
          totalChunks: 0,
          chunksMerged: 0,
          totalLines: 0,
          estimatedTokens: 0,
        },
        warnings: [
          `Chunking for scope type "${scopeResolution.resolutionType}" requires Serena integration`,
        ],
      };
  }
}

/**
 * Gets chunks relevant for a step execution.
 * 
 * Uses the step's scope and Serena mapping to determine what chunks are needed.
 * 
 * @param step - The plan step
 * @param plan - The plan containing scopes
 * @param options - Chunking options
 * @returns Promise resolving to ChunkingResult
 */
export async function getChunksForStep(
  step: PlanStep,
  plan: TaskPlan,
  options?: ChunkingOptions
): Promise<ChunkingResult> {
  const scope = getStepScope(step, plan);

  if (!scope) {
    return {
      chunks: [],
      stats: {
        totalChunks: 0,
        chunksMerged: 0,
        totalLines: 0,
        estimatedTokens: 0,
      },
      warnings: ["Step has no scope assigned"],
    };
  }

  return await chunkScope(scope, plan, options);
}

