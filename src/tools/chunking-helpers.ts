/**
 * Helper functions for code chunking
 * @module tools/chunking-helpers
 * 
 * Provides utilities for:
 * - Detecting logical blocks in code
 * - Finding comment boundaries
 * - Estimating token counts
 * - Generating chunk summaries
 */

import { type BlockInfo } from "../types/index.js";

/**
 * Detects logical blocks in code (if/for/switch/while/try-catch).
 * 
 * Uses simple pattern matching to find block boundaries.
 * This is a heuristic approach - for more accuracy, use AST parsing.
 * 
 * @param code - The code to analyze
 * @param startLine - Starting line number (1-based) for offset calculation
 * @returns Array of BlockInfo objects describing logical blocks
 */
export function detectLogicalBlocks(code: string, startLine: number = 1): BlockInfo[] {
  const blocks: BlockInfo[] = [];
  const lines = code.split("\n");
  const stack: Array<{ type: string; startLine: number; depth: number }> = [];
  let currentDepth = 0;

  // Patterns for block starts
  const blockPatterns = [
    { pattern: /\bif\s*\(/, type: "if" },
    { pattern: /\bfor\s*\(/, type: "for" },
    { pattern: /\bwhile\s*\(/, type: "while" },
    { pattern: /\bswitch\s*\(/, type: "switch" },
    { pattern: /\btry\s*\{/, type: "try" },
    { pattern: /\bcatch\s*\(/, type: "catch" },
    { pattern: /\belse\s*\{/, type: "else" },
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = startLine + i;

    // Check for block starts
    for (const { pattern, type } of blockPatterns) {
      if (pattern.test(line)) {
        stack.push({ type, startLine: lineNum, depth: currentDepth });
        currentDepth++;
        break;
      }
    }

    // Check for block end (closing brace)
    const openBraces = (line.match(/\{/g) || []).length;
    const closeBraces = (line.match(/\}/g) || []).length;
    const netBraces = openBraces - closeBraces;

    if (netBraces < 0 && stack.length > 0) {
      // Closing more braces than opening - end of block
      const block = stack.pop();
      if (block) {
        blocks.push({
          type: block.type,
          startLine: block.startLine,
          endLine: lineNum,
          depth: block.depth,
        });
        currentDepth = Math.max(0, currentDepth - 1);
      }
    }
  }

  return blocks;
}

/**
 * Finds comment boundaries in code.
 * 
 * Comments can serve as natural boundaries for chunking.
 * 
 * @param code - The code to analyze
 * @param startLine - Starting line number (1-based) for offset calculation
 * @returns Array of line numbers where comments are found
 */
export function findCommentBoundaries(code: string, startLine: number = 1): number[] {
  const boundaries: number[] = [];
  const lines = code.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineNum = startLine + i;

    // Single-line comments
    if (line.startsWith("//") || line.startsWith("#")) {
      boundaries.push(lineNum);
    }

    // Multi-line comment start
    if (line.includes("/*")) {
      boundaries.push(lineNum);
    }

    // Multi-line comment end
    if (line.includes("*/")) {
      boundaries.push(lineNum);
    }
  }

  return boundaries;
}

/**
 * Estimates token count for a code string.
 * 
 * Uses a simple heuristic: ~4 characters per token for code.
 * This is approximate - actual tokenization depends on the model.
 * 
 * @param code - The code to estimate tokens for
 * @returns Estimated token count
 */
export function estimateTokenCount(code: string): number {
  // Simple heuristic: ~4 characters per token for code
  // More accurate would require actual tokenization
  const charCount = code.length;
  return Math.ceil(charCount / 4);
}

/**
 * Generates a summary for merged chunks (dechunking).
 * 
 * Creates a human-readable summary that describes what chunks were merged
 * and what they contain, without including the full code.
 * 
 * @param chunks - Array of chunks that were merged
 * @returns Summary string describing the merged chunks
 */
export function generateChunkSummary(chunks: Array<{ filePath: string; startLine: number; endLine: number; metadata?: { symbolName?: string; summary?: string } }>): string {
  const summaries: string[] = [];
  
  // Group by file
  const byFile = new Map<string, typeof chunks>();
  for (const chunk of chunks) {
    if (!byFile.has(chunk.filePath)) {
      byFile.set(chunk.filePath, []);
    }
    byFile.get(chunk.filePath)!.push(chunk);
  }

  for (const [filePath, fileChunks] of byFile.entries()) {
    const chunkDescriptions: string[] = [];
    
    for (const chunk of fileChunks) {
      const lineCount = chunk.endLine - chunk.startLine + 1;
      const symbolName = chunk.metadata?.symbolName;
      const summary = chunk.metadata?.summary;
      
      if (symbolName) {
        chunkDescriptions.push(`${symbolName} (lines ${chunk.startLine}-${chunk.endLine}, ${lineCount} lines)`);
      } else if (summary) {
        chunkDescriptions.push(`${summary} (lines ${chunk.startLine}-${chunk.endLine}, ${lineCount} lines)`);
      } else {
        chunkDescriptions.push(`lines ${chunk.startLine}-${chunk.endLine} (${lineCount} lines)`);
      }
    }
    
    summaries.push(`${filePath}: ${chunkDescriptions.join(", ")}`);
  }

  return `Merged chunks: ${summaries.join("; ")}`;
}

/**
 * Generates a unique chunk ID.
 * 
 * @param prefix - Prefix for the ID
 * @param index - Optional index to make ID unique
 * @returns Unique chunk ID
 */
export function generateChunkId(prefix: string = "chunk", index?: number): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const indexPart = index !== undefined ? `-${index}` : "";
  return `${prefix}-${timestamp}-${random}${indexPart}`;
}

