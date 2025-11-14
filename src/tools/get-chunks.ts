/**
 * Tool for getting code chunks via MCP
 * @module tools/get-chunks
 * 
 * Provides MCP tool to get code chunks for a scope or step.
 */

import { z } from "zod";
import {
  type PlanScope,
  type TaskPlan,
  type PlanStep,
  type ChunkingOptions,
  type ChunkingResult,
} from "../types/index.js";
import { chunkScope, getChunksForStep } from "./code-chunking.js";

/**
 * Input arguments for the get_chunks tool
 */
export interface GetChunksArgs {
  scope?: PlanScope;
  step?: PlanStep;
  plan?: TaskPlan;
  options?: ChunkingOptions;
}

/**
 * Zod schema for get_chunks tool inputs
 */
export const getChunksInputSchema = {
  scope: z.any().optional().describe("PlanScope to chunk. Required if step is not provided."),
  step: z.any().optional().describe("PlanStep to get chunks for. Required if scope is not provided."),
  plan: z.any().optional().describe("TaskPlan containing scopes. Required if using step."),
  options: z.any().optional().describe("Chunking options (maxChunksPerStep, maxLinesPerChunk, etc.)"),
};

/**
 * Gets code chunks for a scope or step.
 * 
 * @param args - Tool arguments
 * @returns ChunkingResult with chunks and metadata
 */
export async function getChunks(args: GetChunksArgs): Promise<ChunkingResult> {
  if (args.step && args.plan) {
    // Get chunks for a step
    return await getChunksForStep(args.step, args.plan, args.options);
  } else if (args.scope && args.plan) {
    // Get chunks for a scope
    return await chunkScope(args.scope, args.plan, args.options);
  } else {
    throw new Error("Either (step + plan) or (scope + plan) must be provided");
  }
}

/**
 * Handler for the get_chunks MCP tool.
 * 
 * Gets code chunks for a scope or step, applying H-Net-inspired chunking
 * with configurable limits and dechunking.
 * 
 * @param args - Tool arguments
 * @returns MCP tool response with chunking result
 */
export async function handleGetChunks(
  args: GetChunksArgs
): Promise<{
  content: Array<{ type: "text"; text: string }>;
}> {
  try {
    const result = await getChunks(args);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            chunks: [],
            stats: {
              totalChunks: 0,
              chunksMerged: 0,
              totalLines: 0,
              estimatedTokens: 0,
            },
            warnings: [error instanceof Error ? error.message : String(error)],
          }, null, 2),
        },
      ],
    };
  }
}

