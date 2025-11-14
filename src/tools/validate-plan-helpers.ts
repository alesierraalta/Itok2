/**
 * Helper functions for plan validation and compression
 * @module tools/validate-plan-helpers
 * 
 * Provides reusable utilities for validating and compressing TaskPlans:
 * - StepKind → expectedLevel mapping
 * - Step merging for dynamic chunking
 * - Plan statistics calculation
 */

import { StepKind, PlanLevel, type TaskPlan, type PlanStep, type PlanStats } from "../types/index.js";

/**
 * Gets the expected HRM level for a step kind based on the phase level.
 * 
 * This implements the level policy table:
 * - clarify_goal → Level 0 (Abstract)
 * - gather_context, scan_code, design_solution → Level 1 (Planning)
 * - edit_code, run_tests → Level 2 (Execution)
 * - refine → Same level as phase
 * 
 * @param kind - The step kind
 * @param phaseLevel - The HRM level of the phase this step belongs to
 * @returns The expected PlanLevel for this step kind
 */
export function getExpectedLevelForStepKind(kind: StepKind, phaseLevel: PlanLevel): PlanLevel {
  switch (kind) {
    case StepKind.ClarifyGoal:
      return PlanLevel.Abstract;
    
    case StepKind.GatherContext:
    case StepKind.ScanCode:
    case StepKind.DesignSolution:
      return PlanLevel.Planning;
    
    case StepKind.EditCode:
    case StepKind.RunTests:
      return PlanLevel.Execution;
    
    case StepKind.Refine:
      // Refine steps match the phase level
      return phaseLevel;
    
    default:
      // Default to phase level
      return phaseLevel;
  }
}

/**
 * Merges multiple steps into a single chunked step (H-Net-style compression).
 * 
 * The merged step:
 * - Uses the first step as the base (preserves id, phaseId, order, etc.)
 * - Combines summaries with semicolon separator
 * - Merges suggestedTools arrays (removes duplicates)
 * - Combines dependencies (removes duplicates)
 * - Uses the minimum order from the merged steps
 * 
 * @param steps - Array of steps to merge (must be non-empty)
 * @returns A single merged step
 */
export function mergeSteps(steps: PlanStep[]): PlanStep {
  if (steps.length === 0) {
    throw new Error("Cannot merge empty array of steps");
  }

  if (steps.length === 1) {
    return steps[0];
  }

  // Use first step as base
  const baseStep = steps[0];

  // Combine summaries
  const summaries = steps.map((s) => s.summary).filter((s) => s.length > 0);
  const mergedSummary = summaries.join("; ");

  // Merge suggestedTools (remove duplicates, preserve order)
  const allTools = steps.flatMap((s) => s.suggestedTools);
  const uniqueTools = Array.from(new Set(allTools));

  // Merge dependencies (remove duplicates)
  const allDeps = steps.flatMap((s) => s.dependencies);
  const uniqueDeps = Array.from(new Set(allDeps));

  // Use minimum order
  const minOrder = Math.min(...steps.map((s) => s.order));

  return {
    ...baseStep,
    summary: mergedSummary,
    suggestedTools: uniqueTools,
    dependencies: uniqueDeps,
    order: minOrder,
    title: `${baseStep.title} (merged ${steps.length} steps)`,
  };
}

/**
 * Calculates statistics about a plan.
 * 
 * @param plan - The plan to analyze
 * @returns Statistics object
 */
export function calculatePlanStats(plan: TaskPlan): PlanStats {
  return {
    phasesBefore: plan.phases.length,
    phasesAfter: plan.phases.length,
    stepsBefore: plan.steps.length,
    stepsAfter: plan.steps.length,
    chunksCreated: 0,
    stepsMerged: 0,
    levelsCorrected: 0,
    scopesReassigned: 0,
  };
}

/**
 * Creates an initial PlanStats object with before/after values.
 * 
 * @param planBefore - The plan before validation
 * @param planAfter - The plan after validation
 * @param chunksCreated - Number of chunks created
 * @param stepsMerged - Number of steps merged
 * @param levelsCorrected - Number of levels corrected
 * @param scopesReassigned - Number of scopes reassigned
 * @returns Complete PlanStats object
 */
export function createPlanStats(
  planBefore: TaskPlan,
  planAfter: TaskPlan,
  chunksCreated: number = 0,
  stepsMerged: number = 0,
  levelsCorrected: number = 0,
  scopesReassigned: number = 0
): PlanStats {
  return {
    phasesBefore: planBefore.phases.length,
    phasesAfter: planAfter.phases.length,
    stepsBefore: planBefore.steps.length,
    stepsAfter: planAfter.steps.length,
    chunksCreated,
    stepsMerged,
    levelsCorrected,
    scopesReassigned,
  };
}

