/**
 * MCP Server configuration and initialization
 * @module server/mcp-server
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SERVER_NAME, SERVER_VERSION } from "../config/constants.js";
import { z } from "zod";
import { TaskKind } from "../types/index.js";
import { handleCreateSamplePlan } from "../tools/create-sample-plan.js";
import { handlePlanTask, planTaskInputSchema } from "../tools/plan-task.js";
import { handleValidatePlan, validatePlanInputSchema } from "../tools/validate-plan.js";
import { handleExecuteStep, executeStepInputSchema } from "../tools/execute-step.js";
import { handleGetChunks, getChunksInputSchema } from "../tools/get-chunks.js";

/**
 * Creates and configures the MCP server instance
 * @returns Configured MCP server with tools registered
 */
export function createMcpServer(): McpServer {
  // Create server instance with identity
  const server = new McpServer(
    {
      name: SERVER_NAME,
      version: SERVER_VERSION,
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register ping tool
  server.registerTool(
    "ping",
    {
      description: "Health check tool that returns pong and current timestamp",
      inputSchema: {},
    },
    async () => {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              pong: true,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      };
    }
  );

  // Register echo tool
  server.registerTool(
    "echo",
    {
      description: "Echoes back the provided message",
      inputSchema: {
        message: z.string().describe("The message to echo back"),
      },
    },
    async ({ message }) => {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              echo: message,
            }),
          },
        ],
      };
    }
  );

  // Register create_sample_plan tool (Phase 2)
  server.registerTool(
    "create_sample_plan",
    {
      description: "Creates a sample hierarchical TaskPlan for testing Phase 2 types. Demonstrates the HRM-inspired structure with phases, scopes, and steps.",
      inputSchema: {
        goal: z.string().describe("The main goal for the task plan"),
        taskKind: z.nativeEnum(TaskKind).optional().describe("Type of task (bugfix, feature, refactor, other). Defaults to 'other'."),
      },
    },
    async (args) => {
      return await handleCreateSamplePlan({
        goal: args.goal,
        taskKind: args.taskKind,
      });
    }
  );

  // Register plan_task tool (Phase 3)
  server.registerTool(
    "plan_task",
    {
      description: "Generates a hierarchical TaskPlan based on a goal. Uses deterministic rules-based planning inspired by HRM (Hierarchical Reasoning Model). The plan includes phases, scopes, and steps organized by abstraction level. Returns both JSON and TOON-friendly representation.",
      inputSchema: planTaskInputSchema,
    },
    async (args) => {
      return await handlePlanTask({
        goal: args.goal,
        context: args.context,
        taskKind: args.taskKind,
        maxPhases: args.maxPhases,
        maxSteps: args.maxSteps,
      });
    }
  );

  // Register validate_plan tool (Phase 4)
  server.registerTool(
    "validate_plan",
    {
      description: "Validates and compresses a TaskPlan using H-Net-style dynamic chunking. Validates HRM levels, corrects scopes, applies compression by merging steps, and enforces global limits. Returns optimized plan with metadata (warnings, changes, stats) and compressed TOON representation.",
      inputSchema: validatePlanInputSchema,
    },
    async (args) => {
      return await handleValidatePlan({
        plan: args.plan,
        targetMaxPhases: args.targetMaxPhases,
        targetMaxSteps: args.targetMaxSteps,
        maxMicroStepsPerPhase: args.maxMicroStepsPerPhase,
      });
    }
  );

  // Register execute_step tool (Phase 5)
  server.registerTool(
    "execute_step",
    {
      description: "Executes a step from a TaskPlan. Finds the next executable step (or uses provided stepId), marks it as in_progress, resolves scope, gets Serena actions, and updates plan status. By default simulates execution (simulate=true) for safety. Returns execution result with updated plan and next steps.",
      inputSchema: executeStepInputSchema,
    },
    async (args) => {
      return await handleExecuteStep({
        plan: args.plan,
        stepId: args.stepId,
        simulate: args.simulate,
      });
    }
  );

  // Register get_chunks tool (Phase 6)
  server.registerTool(
    "get_chunks",
    {
      description: "Gets code chunks for a scope or step using H-Net-inspired semantic chunking. Divides files and symbols into chunks optimized for token usage. Supports symbol-based chunking (via Serena LSP), sub-chunking for large symbols, and dechunking (merging) when limits are exceeded. Returns chunks with metadata and statistics.",
      inputSchema: getChunksInputSchema,
    },
    async (args) => {
      return await handleGetChunks({
        scope: args.scope,
        step: args.step,
        plan: args.plan,
        options: args.options,
      });
    }
  );

  // Error handling
  server.server.onerror = (error) => {
    console.error("[MCP Server Error]", error);
  };

  return server;
}

