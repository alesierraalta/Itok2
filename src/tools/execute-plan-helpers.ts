/**
 * Helper functions for executing TaskPlans step-by-step
 * @module tools/execute-plan-helpers
 * 
 * Provides utilities for:
 * - Deciding which step to execute next
 * - Managing step execution status
 * - Checking step executability based on dependencies
 */

import {
  type TaskPlan,
  type PlanStep,
  StepStatus,
  type PlanPhase,
} from "../types/index.js";
import { validateTaskPlan } from "../types/schemas.js";

/**
 * Checks if a step is executable (can be run now).
 * 
 * A step is executable if:
 * - Its status is `todo` or `undefined` (not started)
 * - All its dependencies have status `done`
 * - It is not `blocked`
 * 
 * @param step - The step to check
 * @param plan - The plan containing the step and its dependencies
 * @returns True if the step can be executed
 */
export function isStepExecutable(step: PlanStep, plan: TaskPlan): boolean {
  // Step must be todo or undefined (not started)
  if (step.status === StepStatus.InProgress || step.status === StepStatus.Done) {
    return false;
  }

  // Step must not be blocked
  if (step.status === StepStatus.Blocked) {
    return false;
  }

  // All dependencies must be done
  if (step.dependencies.length > 0) {
    const stepMap = new Map(plan.steps.map((s) => [s.id, s]));
    for (const depId of step.dependencies) {
      const dep = stepMap.get(depId);
      if (!dep || dep.status !== StepStatus.Done) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Gets all executable steps from a plan.
 * 
 * Returns steps that can be executed now (dependencies satisfied, not blocked).
 * 
 * @param plan - The plan to analyze
 * @returns Array of executable steps, sorted by phase order and step order
 */
export function getExecutableSteps(plan: TaskPlan): PlanStep[] {
  const executableSteps = plan.steps.filter((step) => isStepExecutable(step, plan));

  // Sort by phase order, then step order
  const phaseMap = new Map(plan.phases.map((p) => [p.id, p]));
  executableSteps.sort((a, b) => {
    const phaseA = phaseMap.get(a.phaseId);
    const phaseB = phaseMap.get(b.phaseId);
    if (!phaseA || !phaseB) {
      return 0;
    }
    if (phaseA.order !== phaseB.order) {
      return phaseA.order - phaseB.order;
    }
    return a.order - b.order;
  });

  return executableSteps;
}

/**
 * Gets the next executable step from a plan.
 * 
 * Returns the first step that can be executed, based on:
 * - Phase order (earlier phases first)
 * - Step order within phase (lower order first)
 * - Dependencies satisfied
 * 
 * @param plan - The plan to analyze
 * @returns The next executable step, or null if none available
 */
export function getNextExecutableStep(plan: TaskPlan): PlanStep | null {
  const executableSteps = getExecutableSteps(plan);
  return executableSteps.length > 0 ? executableSteps[0] : null;
}

/**
 * Updates the status of a step in a plan.
 * 
 * Creates a new plan with the specified step's status updated.
 * Validates the updated plan before returning.
 * 
 * @param plan - The plan to update
 * @param stepId - ID of the step to update
 * @param status - New status for the step
 * @returns Updated plan with step status changed
 */
export function updateStepStatus(
  plan: TaskPlan,
  stepId: string,
  status: StepStatus
): TaskPlan {
  const stepIndex = plan.steps.findIndex((s) => s.id === stepId);
  if (stepIndex === -1) {
    throw new Error(`Step with id "${stepId}" not found in plan`);
  }

  const updatedSteps = [...plan.steps];
  updatedSteps[stepIndex] = {
    ...updatedSteps[stepIndex],
    status,
  };

  const updatedPlan: TaskPlan = {
    ...plan,
    steps: updatedSteps,
  };

  // Validate the updated plan
  return validateTaskPlan(updatedPlan);
}

/**
 * Marks a step as in progress.
 * 
 * @param plan - The plan to update
 * @param stepId - ID of the step to mark
 * @returns Updated plan with step marked as in_progress
 */
export function markStepInProgress(plan: TaskPlan, stepId: string): TaskPlan {
  return updateStepStatus(plan, stepId, StepStatus.InProgress);
}

/**
 * Marks a step as done (completed successfully).
 * 
 * @param plan - The plan to update
 * @param stepId - ID of the step to mark
 * @returns Updated plan with step marked as done
 */
export function markStepDone(plan: TaskPlan, stepId: string): TaskPlan {
  return updateStepStatus(plan, stepId, StepStatus.Done);
}

/**
 * Marks a step as blocked (cannot proceed).
 * 
 * @param plan - The plan to update
 * @param stepId - ID of the step to mark
 * @param reason - Optional reason why the step is blocked
 * @returns Updated plan with step marked as blocked
 */
export function markStepBlocked(plan: TaskPlan, stepId: string, reason?: string): TaskPlan {
  const updatedPlan = updateStepStatus(plan, stepId, StepStatus.Blocked);
  
  // Optionally store the reason in step summary or metadata
  // For now, we just update the status
  // Future: could extend PlanStep to include blockReason field
  
  return updatedPlan;
}

/**
 * Gets the execution progress of a plan.
 * 
 * @param plan - The plan to analyze
 * @returns Object with progress statistics
 */
export function getPlanProgress(plan: TaskPlan): {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  blocked: number;
  percentage: number;
} {
  const total = plan.steps.length;
  let todo = 0;
  let inProgress = 0;
  let done = 0;
  let blocked = 0;

  for (const step of plan.steps) {
    switch (step.status) {
      case StepStatus.Todo:
      case undefined:
        todo++;
        break;
      case StepStatus.InProgress:
        inProgress++;
        break;
      case StepStatus.Done:
        done++;
        break;
      case StepStatus.Blocked:
        blocked++;
        break;
    }
  }

  const percentage = total > 0 ? Math.round((done / total) * 100) : 0;

  return {
    total,
    todo,
    inProgress,
    done,
    blocked,
    percentage,
  };
}

