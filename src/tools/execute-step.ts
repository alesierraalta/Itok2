/**
 * Tool for executing individual plan steps
 * @module tools/execute-step
 * 
 * Provides MCP tool to execute a single step from a TaskPlan,
 * updating the plan status accordingly.
 */

import { z } from "zod";
import {
  type TaskPlan,
  type ExecutionResult,
} from "../types/index.js";
import {
  getNextExecutableStep,
  isStepExecutable,
  markStepInProgress,
  markStepDone,
  markStepBlocked,
} from "./execute-plan-helpers.js";
import { getStepScope } from "./scope-resolver.js";
import {
  getSerenaActionsForStep,
  executeStepWithSerena,
} from "./serena-mapper.js";

/**
 * Input arguments for the execute_step tool
 */
export interface ExecuteStepArgs {
  plan: TaskPlan;
  stepId?: string;
  simulate?: boolean;
}

/**
 * Zod schema for execute_step tool inputs
 */
export const executeStepInputSchema = {
  plan: z.any().describe("The TaskPlan containing the step to execute"),
  stepId: z.string().optional().describe("ID of the step to execute. If not provided, executes the next executable step."),
  simulate: z.boolean().optional().describe("If true, simulates execution without actually calling Serena tools"),
};

/**
 * Executes a step from a plan.
 * 
 * This function:
 * 1. Validates that the step can be executed
 * 2. Marks the step as in_progress
 * 3. Resolves the scope
 * 4. Gets Serena actions for the step
 * 5. (If not simulating) Would execute the actions
 * 6. Marks the step as done or blocked
 * 
 * @param plan - The plan containing the step
 * @param stepId - ID of the step to execute (optional, uses next executable if not provided)
 * @param simulate - If true, simulates execution without calling tools
 * @returns ExecutionResult with execution status and updated plan
 */
export async function executeStep(
  plan: TaskPlan,
  stepId?: string,
  simulate: boolean = true
): Promise<ExecutionResult> {
  // Find the step to execute
  let step: typeof plan.steps[0] | null = null;
  
  if (stepId) {
    step = plan.steps.find((s) => s.id === stepId) || null;
    if (!step) {
      throw new Error(`Step with id "${stepId}" not found in plan`);
    }
  } else {
    step = getNextExecutableStep(plan);
    if (!step) {
      throw new Error("No executable step found in plan");
    }
  }

  // Verify step is executable
  if (!isStepExecutable(step, plan)) {
    const reason = step.status === "blocked" 
      ? "Step is blocked" 
      : "Step dependencies not satisfied";
    throw new Error(`Step "${step.id}" is not executable: ${reason}`);
  }

  // Mark as in_progress
  let updatedPlan = markStepInProgress(plan, step.id);

  // Resolve scope
  const scope = getStepScope(step, updatedPlan);
  const { translateScopeSelector } = await import("./scope-resolver.js");
  const scopeResolution = scope ? translateScopeSelector(scope) : null;

  // Get Serena actions
  const actions = getSerenaActionsForStep(step, scope, updatedPlan);

  // Execute (or simulate)
  let success = true;
  let error: string | undefined;
  let output: unknown;

  if (simulate) {
    // Simulation mode: just document what would be executed
    const executionInfo = executeStepWithSerena(step, scope, updatedPlan);
    output = {
      simulated: true,
      actions: executionInfo.actions,
      instructions: executionInfo.instructions,
      scopeResolution,
    };
  } else {
    // Real execution mode (future: actually call Serena tools)
    // For now, this is a placeholder
    try {
      // TODO: Actually execute Serena actions
      // for (const action of actions) {
      //   await callSerenaTool(action.tool, action.args);
      // }
      output = {
        executed: true,
        actionsCount: actions.length,
        note: "Real execution not yet implemented - use simulate=true",
      };
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : String(err);
      updatedPlan = markStepBlocked(updatedPlan, step.id, error);
    }
  }

  // Mark as done if successful
  if (success && !simulate) {
    updatedPlan = markStepDone(updatedPlan, step.id);
  }

  // Get next steps
  const nextSteps: string[] = [];
  const nextExecutable = getNextExecutableStep(updatedPlan);
  if (nextExecutable) {
    nextSteps.push(`Next step: ${nextExecutable.title} (${nextExecutable.id})`);
  } else {
    const { getPlanProgress } = await import("./execute-plan-helpers.js");
    const progress = getPlanProgress(updatedPlan);
    if (progress.done === progress.total) {
      nextSteps.push("Plan completed!");
    } else {
      nextSteps.push("No executable steps remaining. Plan may be blocked.");
    }
  }

  return {
    success,
    step,
    updatedPlan,
    error,
    output,
    nextSteps,
  };
}

/**
 * Handler for the execute_step MCP tool.
 * 
 * Executes a step from a TaskPlan, updating its status.
 * Returns execution result with updated plan.
 * 
 * @param args - Tool arguments
 * @returns MCP tool response with execution result
 */
export async function handleExecuteStep(
  args: ExecuteStepArgs
): Promise<{
  content: Array<{ type: "text"; text: string }>;
}> {
  try {
    const result = await executeStep(
      args.plan,
      args.stepId,
      args.simulate !== false // Default to simulate=true for safety
    );

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
            success: false,
            error: error instanceof Error ? error.message : String(error),
          }, null, 2),
        },
      ],
    };
  }
}

