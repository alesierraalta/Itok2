/**
 * Experimental scenario runner.
 * 
 * Executes a benchmark scenario in experimental mode (with planner/TOON/Serena).
 * This uses the MCP planner tools (plan_task, validate_plan, execute_step, get_chunks)
 * to solve the task in a token-optimized way.
 * 
 * Note: Token metrics must be manually entered from Cursor Dashboard/Usage
 * after completing the task, as there's no API to automatically retrieve them.
 */

import {
  type BenchmarkScenario,
  type ScenarioExecution,
  type TokenMetrics,
  type TaskPlan,
} from "../types/index.js";
import { generateExecutionId } from "./benchmark-helpers.js";

/**
 * Options for running an experimental scenario.
 */
export interface RunExperimentalScenarioOptions {
  /** Whether to prompt for token metrics interactively */
  interactive?: boolean;
  /** Pre-provided token metrics (if not interactive) */
  tokenMetrics?: TokenMetrics;
  /** Plan used for execution (if already generated) */
  plan?: TaskPlan;
  /** Number of steps executed */
  stepsExecuted?: number;
  /** Number of chunks used */
  chunksUsed?: number;
  /** Additional metadata to include */
  metadata?: {
    keyOperations?: string[];
    notes?: string;
  };
}

/**
 * Runs an experimental scenario execution.
 * 
 * This function provides instructions for using the MCP planner tools,
 * records the execution process, and then records token metrics after completion.
 * 
 * @param scenario - Benchmark scenario to execute
 * @param options - Execution options
 * @returns Scenario execution record
 */
export async function runExperimentalScenario(
  scenario: BenchmarkScenario,
  options: RunExperimentalScenarioOptions = {}
): Promise<ScenarioExecution> {
  const startTime = new Date().toISOString();
  const executionId = generateExecutionId(scenario.id, "experimental");

  console.log("=".repeat(80));
  console.log(`Experimental Scenario Execution: ${scenario.name}`);
  console.log("=".repeat(80));
  console.log("");
  console.log(`Scenario ID: ${scenario.id}`);
  console.log(`Execution ID: ${executionId}`);
  console.log(`Start Time: ${startTime}`);
  console.log("");
  console.log("Instructions:");
  console.log("1. Ensure MCP planner and Serena are ENABLED in Cursor");
  console.log("2. Follow these steps:");
  console.log("");
  console.log("   Step 1: Generate Plan");
  console.log("   - Use itok::plan_task with:");
  console.log(`     goal: "${scenario.goal}"`);
  if (scenario.context) {
    console.log(`     context: "${scenario.context}"`);
  }
  console.log(`     taskKind: "${scenario.taskKind}"`);
  console.log("");
  console.log("   Step 2: Validate and Compress Plan");
  console.log("   - Use itok::validate_plan with the generated plan");
  console.log("   - Apply compression settings (targetMaxSteps, targetMaxPhases, maxMicroStepsPerPhase)");
  console.log("");
  console.log("   Step 3: Execute Steps");
  console.log("   - Use itok::execute_step to execute each step in the plan");
  console.log("   - Use itok::get_chunks to get code chunks for each step");
  console.log("   - Use Serena tools to read/edit code (minimize tokens)");
  console.log("   - Follow the plan sequentially");
  console.log("");
  console.log("   Step 4: Complete Task");
  console.log("   - Ensure all completion criteria are met");
  console.log("   - Verify the task is fully completed");
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
    executionType: "experimental",
    startTime,
    endTime,
    durationMs,
    tokenMetrics,
    metadata: {
      planId: options.plan ? `plan-${options.plan.goal.substring(0, 20)}` : undefined,
      stepsExecuted: options.stepsExecuted,
      chunksUsed: options.chunksUsed,
      keyOperations: options.metadata?.keyOperations || [],
      success: true, // Assume success unless error is provided
      ...options.metadata,
    },
  };

  console.log("");
  console.log("Experimental execution completed:");
  console.log(`  Duration: ${(durationMs / 1000 / 60).toFixed(1)} minutes`);
  console.log(`  Input Tokens: ${tokenMetrics.inputTokens}`);
  console.log(`  Output Tokens: ${tokenMetrics.outputTokens}`);
  console.log(`  Total Tokens: ${tokenMetrics.totalTokens}`);
  if (options.stepsExecuted !== undefined) {
    console.log(`  Steps Executed: ${options.stepsExecuted}`);
  }
  if (options.chunksUsed !== undefined) {
    console.log(`  Chunks Used: ${options.chunksUsed}`);
  }
  console.log("");

  return execution;
}

/**
 * Creates an experimental execution from provided metrics.
 * 
 * This is a convenience function for when you already have the token metrics
 * and execution details, and just need to create the execution record.
 * 
 * @param scenario - Benchmark scenario
 * @param startTime - Start timestamp (ISO string)
 * @param endTime - End timestamp (ISO string)
 * @param tokenMetrics - Token metrics from Cursor Dashboard
 * @param options - Additional execution options
 * @returns Scenario execution record
 */
export function createExperimentalExecution(
  scenario: BenchmarkScenario,
  startTime: string,
  endTime: string,
  tokenMetrics: TokenMetrics,
  options?: {
    planId?: string;
    stepsExecuted?: number;
    chunksUsed?: number;
    metadata?: RunExperimentalScenarioOptions["metadata"];
  }
): ScenarioExecution {
  const executionId = generateExecutionId(scenario.id, "experimental");
  const durationMs = new Date(endTime).getTime() - new Date(startTime).getTime();

  return {
    id: executionId,
    scenarioId: scenario.id,
    executionType: "experimental",
    startTime,
    endTime,
    durationMs,
    tokenMetrics,
    metadata: {
      planId: options?.planId,
      stepsExecuted: options?.stepsExecuted,
      chunksUsed: options?.chunksUsed,
      keyOperations: options?.metadata?.keyOperations || [],
      success: true,
      ...options?.metadata,
    },
  };
}

