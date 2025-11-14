/**
 * Implementation details for code chunking
 * @module tools/code-chunking-impl
 * 
 * Contains implementation functions for chunking large symbols.
 */

import {
  type CodeChunk,
  type ChunkingOptions,
  ChunkType,
  type BlockInfo,
} from "../types/index.js";
import {
  detectLogicalBlocks,
  findCommentBoundaries,
  estimateTokenCount,
  generateChunkId,
} from "./chunking-helpers.js";

/**
 * Default options for chunking large symbols.
 */
const DEFAULT_LARGE_SYMBOL_OPTIONS: Required<Pick<ChunkingOptions, "maxLinesPerChunk" | "includeContent">> = {
  maxLinesPerChunk: 100,
  includeContent: true,
};

/**
 * Chunks a large symbol into sub-chunks based on logical blocks.
 * 
 * Divides a symbol that exceeds maxLinesPerChunk into smaller sub-chunks
 * by detecting logical boundaries (if/for/switch blocks, comments).
 * 
 * @param filePath - Path to the file containing the symbol
 * @param symbolName - Name of the symbol
 * @param symbolKind - Kind of symbol
 * @param startLine - Starting line number (1-based)
 * @param endLine - Ending line number (1-based, inclusive)
 * @param code - The code content of the symbol
 * @param options - Chunking options
 * @returns Array of CodeChunk objects (sub-chunks)
 */
export function chunkLargeSymbol(
  filePath: string,
  symbolName: string,
  symbolKind: string,
  startLine: number,
  endLine: number,
  code: string,
  options?: ChunkingOptions
): CodeChunk[] {
  const opts = {
    maxLinesPerChunk: options?.maxLinesPerChunk ?? DEFAULT_LARGE_SYMBOL_OPTIONS.maxLinesPerChunk,
    includeContent: options?.includeContent ?? DEFAULT_LARGE_SYMBOL_OPTIONS.includeContent,
  };

  const chunks: CodeChunk[] = [];
  const lines = code.split("\n");
  const totalLines = endLine - startLine + 1;

  // Detect logical blocks
  const blocks = detectLogicalBlocks(code, startLine);
  const commentBoundaries = findCommentBoundaries(code, startLine);

  // Combine boundaries (blocks and comments)
  const allBoundaries = new Set<number>([startLine]);
  for (const block of blocks) {
    allBoundaries.add(block.startLine);
    allBoundaries.add(block.endLine);
  }
  for (const commentLine of commentBoundaries) {
    allBoundaries.add(commentLine);
  }
  allBoundaries.add(endLine);

  const sortedBoundaries = Array.from(allBoundaries).sort((a, b) => a - b);

  // Create sub-chunks between boundaries
  let chunkIndex = 0;
  for (let i = 0; i < sortedBoundaries.length - 1; i++) {
    const chunkStart = sortedBoundaries[i];
    const chunkEnd = sortedBoundaries[i + 1];
    const chunkLineCount = chunkEnd - chunkStart + 1;

    // Skip if chunk is too small (less than 5 lines)
    if (chunkLineCount < 5 && i < sortedBoundaries.length - 2) {
      continue;
    }

    // If chunk is still too large, split it further
    if (chunkLineCount > opts.maxLinesPerChunk) {
      // Split into maxLinesPerChunk-sized chunks
      let currentStart = chunkStart;
      while (currentStart <= chunkEnd) {
        const currentEnd = Math.min(currentStart + opts.maxLinesPerChunk - 1, chunkEnd);
        const subChunkLineCount = currentEnd - currentStart + 1;
        const subChunkCode = lines.slice(currentStart - startLine, currentEnd - startLine + 1).join("\n");

        chunks.push({
          id: generateChunkId("sub-symbol", chunkIndex),
          filePath,
          startLine: currentStart,
          endLine: currentEnd,
          type: ChunkType.SubSymbol,
          metadata: {
            type: ChunkType.SubSymbol,
            lineCount: subChunkLineCount,
            estimatedTokens: estimateTokenCount(subChunkCode),
            symbolName: `${symbolName} (part ${chunkIndex + 1})`,
            symbolKind,
            parentSymbolName: symbolName,
            summary: `Sub-chunk of ${symbolKind} ${symbolName}: lines ${currentStart}-${currentEnd}`,
          },
          content: opts.includeContent ? subChunkCode : undefined,
          blocks: blocks.filter(
            (b) => b.startLine >= currentStart && b.endLine <= currentEnd
          ),
        });

        currentStart = currentEnd + 1;
        chunkIndex++;
      }
    } else {
      // Chunk fits within limit
      const chunkCode = lines.slice(chunkStart - startLine, chunkEnd - startLine + 1).join("\n");

      chunks.push({
        id: generateChunkId("sub-symbol", chunkIndex),
        filePath,
        startLine: chunkStart,
        endLine: chunkEnd,
        type: ChunkType.SubSymbol,
        metadata: {
          type: ChunkType.SubSymbol,
          lineCount: chunkLineCount,
          estimatedTokens: estimateTokenCount(chunkCode),
          symbolName: `${symbolName} (part ${chunkIndex + 1})`,
          symbolKind,
          parentSymbolName: symbolName,
          summary: `Sub-chunk of ${symbolKind} ${symbolName}: lines ${chunkStart}-${chunkEnd}`,
        },
        content: opts.includeContent ? chunkCode : undefined,
        blocks: blocks.filter(
          (b) => b.startLine >= chunkStart && b.endLine <= chunkEnd
        ),
      });

      chunkIndex++;
    }
  }

  return chunks;
}

