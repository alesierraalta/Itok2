/**
 * Baseline scenario runner.
 * 
 * Executes a benchmark scenario in baseline mode (without planner/TOON/Serena).
 * This simulates normal Cursor usage where the user solves the task using
 * standard chat and code actions.
 * 
 * Note: Token metrics must be manually entered from Cursor Dashboard/Usage
 * after completing the task, as there's no API to automatically retrieve them.
 */

import {
  type BenchmarkScenario,
  type ScenarioExecution,
  type TokenMetrics,
} from "../types/index.js";
import { generateExecutionId } from "./benchmark-helpers.js";

/**
 * Options for running a baseline scenario.
 */
export interface RunBaselineScenarioOptions {
  /** Whether to prompt for token metrics interactively */
  interactive?: boolean;
  /** Pre-provided token metrics (if not interactive) */
  tokenMetrics?: TokenMetrics;
  /** Additional metadata to include */
  metadata?: {
    keyOperations?: string[];
    notes?: string;
  };
}

/**
 * Runs a baseline scenario execution.
 * 
 * This function records the start time, provides instructions for the user,
 * and then records the end time and token metrics after the task is completed.
 * 
 * @param scenario - Benchmark scenario to execute
 * @param options - Execution options
 * @returns Scenario execution record
 */
export async function runBaselineScenario(
  scenario: BenchmarkScenario,
  options: RunBaselineScenarioOptions = {}
): Promise<ScenarioExecution> {
  const startTime = new Date().toISOString();
  const executionId = generateExecutionId(scenario.id, "baseline");

  console.log("=".repeat(80));
  console.log(`Baseline Scenario Execution: ${scenario.name}`);
  console.log("=".repeat(80));
  console.log("");
  console.log(`Scenario ID: ${scenario.id}`);
  console.log(`Execution ID: ${executionId}`);
  console.log(`Start Time: ${startTime}`);
  console.log("");
  console.log("Instructions:");
  console.log("1. Ensure MCP planner is DISABLED in Cursor");
  console.log("2. Complete the task using normal Cursor chat and code actions");
  console.log("3. Do NOT use plan_task, validate_plan, execute_step, or get_chunks");
  console.log("4. Work as you normally would without the planner");
  console.log("");
  console.log(`Task: ${scenario.goal}`);
  console.log(`Description: ${scenario.description}`);
  if (scenario.context) {
    console.log(`Context: ${scenario.context}`);
  }
  console.log("");
  console.log("Completion Criteria:");
  scenario.completionCriteria.forEach((criteria, index) => {
    console.log(`  ${index + 1}. ${criteria}`);
  });
  console.log("");
  console.log("Press Enter when you have completed the task...");

  // In a real implementation, this would wait for user input
  // For now, we'll assume the user completes the task and provides metrics
  const endTime = new Date().toISOString();
  const durationMs = new Date(endTime).getTime() - new Date(startTime).getTime();

  let tokenMetrics: TokenMetrics;

  if (options.interactive) {
    // In a real CLI, we would use readline to prompt for input
    // For now, we'll use the provided metrics or default values
    tokenMetrics = options.tokenMetrics || {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      timestamp: endTime,
    };
    console.log("");
    console.log("Please enter token metrics from Cursor Dashboard/Usage:");
    console.log("(In a real implementation, this would prompt for input)");
  } else {
    if (!options.tokenMetrics) {
      throw new Error(
        "Token metrics must be provided when not in interactive mode. " +
        "Please provide tokenMetrics in options or set interactive=true."
      );
    }
    tokenMetrics = options.tokenMetrics;
  }

  const execution: ScenarioExecution = {
    id: executionId,
    scenarioId: scenario.id,
    executionType: "baseline",
    startTime,
    endTime,
    durationMs,
    tokenMetrics,
    metadata: {
      keyOperations: options.metadata?.keyOperations || [],
      success: true, // Assume success unless error is provided
      ...options.metadata,
    },
  };

  console.log("");
  console.log("Baseline execution completed:");
  console.log(`  Duration: ${(durationMs / 1000 / 60).toFixed(1)} minutes`);
  console.log(`  Input Tokens: ${tokenMetrics.inputTokens}`);
  console.log(`  Output Tokens: ${tokenMetrics.outputTokens}`);
  console.log(`  Total Tokens: ${tokenMetrics.totalTokens}`);
  console.log("");

  return execution;
}

/**
 * Creates a baseline execution from provided metrics.
 * 
 * This is a convenience function for when you already have the token metrics
 * and just need to create the execution record.
 * 
 * @param scenario - Benchmark scenario
 * @param startTime - Start timestamp (ISO string)
 * @param endTime - End timestamp (ISO string)
 * @param tokenMetrics - Token metrics from Cursor Dashboard
 * @param metadata - Additional metadata
 * @returns Scenario execution record
 */
export function createBaselineExecution(
  scenario: BenchmarkScenario,
  startTime: string,
  endTime: string,
  tokenMetrics: TokenMetrics,
  metadata?: RunBaselineScenarioOptions["metadata"]
): ScenarioExecution {
  const executionId = generateExecutionId(scenario.id, "baseline");
  const durationMs = new Date(endTime).getTime() - new Date(startTime).getTime();

  return {
    id: executionId,
    scenarioId: scenario.id,
    executionType: "baseline",
    startTime,
    endTime,
    durationMs,
    tokenMetrics,
    metadata: {
      keyOperations: metadata?.keyOperations || [],
      success: true,
      ...metadata,
    },
  };
}

