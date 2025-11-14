/**
 * Tool for validating and compressing TaskPlans (H-Net-style)
 * @module tools/validate-plan
 * 
 * Implements plan validation and dynamic chunking inspired by H-Net.
 * Validates levels, scopes, applies compression, and enforces limits.
 */

import { z } from "zod";
import {
  type TaskPlan,
  type PlanStep,
  type PlanPhase,
  type PlanScope,
  PlanLevel,
  ScopeKind,
  type ValidatePlanOptions,
  type ValidatePlanResult,
  type PlanChange,
  type PlanWarning,
  type PlanStats,
} from "../types/index.js";
import { validateTaskPlan } from "../types/schemas.js";
import {
  getExpectedLevelForStepKind,
  mergeSteps,
  createPlanStats,
} from "./validate-plan-helpers.js";
import { toToonFriendly } from "./plan-task.js";

/**
 * Input arguments for the validate_plan tool
 */
export interface ValidatePlanArgs {
  plan: TaskPlan;
  targetMaxPhases?: number;
  targetMaxSteps?: number;
  maxMicroStepsPerPhase?: number;
}

/**
 * Zod schema for validate_plan tool inputs
 */
export const validatePlanInputSchema = {
  plan: z.any().describe("The TaskPlan to validate and compress"),
  targetMaxPhases: z.number().int().positive().optional().describe("Maximum number of phases to keep (truncate if exceeded)"),
  targetMaxSteps: z.number().int().positive().optional().describe("Maximum number of steps per phase (truncate if exceeded)"),
  maxMicroStepsPerPhase: z.number().int().positive().optional().describe("Maximum micro-steps per phase before chunking (H-Net-style compression)"),
};

/**
 * Validates and corrects HRM levels for all steps in a plan.
 * 
 * Uses the level policy table to ensure each step has the correct level
 * based on its StepKind and phase level.
 * 
 * @param plan - The plan to validate
 * @returns Plan with corrected levels and list of changes
 */
export function validatePlanLevels(plan: TaskPlan): { plan: TaskPlan; changes: PlanChange[] } {
  const changes: PlanChange[] = [];
  const updatedSteps = plan.steps.map((step) => {
    // Find the phase this step belongs to
    const phase = plan.phases.find((p) => p.id === step.phaseId);
    if (!phase) {
      return step; // Skip if phase not found (will be caught by other validation)
    }

    // Get expected level for this step kind
    const expectedLevel = getExpectedLevelForStepKind(step.kind, phase.level);

    // If level is incorrect, correct it
    if (step.level !== expectedLevel) {
      changes.push({
        type: "level_corrected",
        description: `Changed step "${step.title}" level from ${step.level} to ${expectedLevel}`,
        componentId: step.id,
      });

      return {
        ...step,
        level: expectedLevel,
      };
    }

    return step;
  });

  return {
    plan: {
      ...plan,
      steps: updatedSteps,
    },
    changes,
  };
}

/**
 * Validates and corrects scopes in a plan.
 * 
 * Ensures:
 * - At least one global scope exists (creates one if missing)
 * - All scopeIds in steps reference existing scopes
 * - Invalid scopeIds are reassigned to the global scope
 * 
 * @param plan - The plan to validate
 * @returns Plan with corrected scopes and list of changes
 */
export function validatePlanScopes(plan: TaskPlan): { plan: TaskPlan; changes: PlanChange[] } {
  const changes: PlanChange[] = [];
  let updatedScopes = [...plan.scopes];
  let globalScopeId: string | null = null;

  // Find or create global scope
  const existingGlobalScope = updatedScopes.find((s) => s.kind === ScopeKind.Global);
  if (!existingGlobalScope) {
    // Create a global scope
    globalScopeId = `scope-global-${Date.now()}`;
    updatedScopes.push({
      id: globalScopeId,
      kind: ScopeKind.Global,
      label: "Workspace",
      selector: "workspace root",
      description: "Entire workspace (auto-created)",
    });
    changes.push({
      type: "scope_created",
      description: "Created missing global scope",
      componentId: globalScopeId,
    });
  } else {
    globalScopeId = existingGlobalScope.id;
  }

  // Build set of valid scope IDs
  const validScopeIds = new Set(updatedScopes.map((s) => s.id));

  // Validate and fix step scope references
  const updatedSteps = plan.steps.map((step) => {
    if (step.scopeId === null) {
      return step; // null is valid (means global)
    }

    if (!validScopeIds.has(step.scopeId)) {
      changes.push({
        type: "scope_reassigned",
        description: `Reassigned step "${step.title}" from invalid scope to global scope`,
        componentId: step.id,
      });

      return {
        ...step,
        scopeId: globalScopeId,
      };
    }

    return step;
  });

  return {
    plan: {
      ...plan,
      scopes: updatedScopes,
      steps: updatedSteps,
    },
    changes,
  };
}

/**
 * Applies dynamic chunking (H-Net-style) to compress steps.
 * 
 * Groups steps of level 2 (Execution) by (phaseId, scopeId, kind) and merges
 * them if they exceed maxMicroStepsPerPhase.
 * 
 * @param plan - The plan to compress
 * @param maxMicroStepsPerPhase - Maximum steps per group before merging
 * @returns Plan with chunked steps and list of changes
 */
export function applyDynamicChunking(
  plan: TaskPlan,
  maxMicroStepsPerPhase?: number
): { plan: TaskPlan; changes: PlanChange[] } {
  if (!maxMicroStepsPerPhase) {
    // No chunking if limit not specified
    return { plan, changes: [] };
  }

  const changes: PlanChange[] = [];
  const stepMap = new Map<string, PlanStep>();
  const stepsToRemove = new Set<string>();

  // Build step map for quick lookup
  plan.steps.forEach((step) => {
    stepMap.set(step.id, step);
  });

  // Group steps by (phaseId, scopeId, kind) for level 2 steps
  const groups = new Map<string, PlanStep[]>();

  plan.steps.forEach((step) => {
    // Only chunk level 2 (Execution) steps
    if (step.level !== PlanLevel.Execution) {
      return;
    }

    // Create group key: phaseId|scopeId|kind
    const scopeKey = step.scopeId || "null";
    const groupKey = `${step.phaseId}|${scopeKey}|${step.kind}`;

    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)!.push(step);
  });

  // Merge groups that exceed the limit
  const mergedSteps: PlanStep[] = [];
  const processedStepIds = new Set<string>();

  groups.forEach((groupSteps, groupKey) => {
    if (groupSteps.length <= maxMicroStepsPerPhase) {
      // No merging needed
      groupSteps.forEach((step) => {
        if (!processedStepIds.has(step.id)) {
          mergedSteps.push(step);
          processedStepIds.add(step.id);
        }
      });
      return;
    }

    // Merge steps in this group
    const mergedStep = mergeSteps(groupSteps);
    mergedSteps.push(mergedStep);
    groupSteps.forEach((step) => {
      processedStepIds.add(step.id);
      if (step.id !== mergedStep.id) {
        stepsToRemove.add(step.id);
      }
    });

    changes.push({
      type: "steps_merged",
      description: `Merged ${groupSteps.length} steps into chunk: ${mergedStep.title}`,
      componentId: mergedStep.id,
    });
  });

  // Add non-level-2 steps that weren't processed
  plan.steps.forEach((step) => {
    if (!processedStepIds.has(step.id)) {
      mergedSteps.push(step);
    }
  });

  // Update dependencies: replace references to removed steps with the merged step
  const mergedStepIds = new Map<string, string>(); // oldId -> mergedId
  groups.forEach((groupSteps, groupKey) => {
    if (groupSteps.length > maxMicroStepsPerPhase) {
      const mergedStep = mergedSteps.find((s) => s.id === groupSteps[0].id);
      if (mergedStep) {
        groupSteps.forEach((oldStep) => {
          if (oldStep.id !== mergedStep.id) {
            mergedStepIds.set(oldStep.id, mergedStep.id);
          }
        });
      }
    }
  });

  // Update step dependencies
  const finalSteps = mergedSteps.map((step) => {
    const updatedDeps = step.dependencies.map((depId) => {
      return mergedStepIds.get(depId) || depId;
    });
    // Remove duplicates and self-references
    const uniqueDeps = Array.from(new Set(updatedDeps)).filter((id) => id !== step.id);

    return {
      ...step,
      dependencies: uniqueDeps,
    };
  });

  // Remove steps that were merged
  const finalStepsFiltered = finalSteps.filter((step) => !stepsToRemove.has(step.id));

  return {
    plan: {
      ...plan,
      steps: finalStepsFiltered,
    },
    changes,
  };
}

/**
 * Applies global limits to a plan (truncates phases and steps).
 * 
 * @param plan - The plan to limit
 * @param targetMaxPhases - Maximum number of phases
 * @param targetMaxSteps - Maximum number of steps per phase
 * @returns Plan with limits applied and list of changes
 */
export function applyGlobalLimits(
  plan: TaskPlan,
  targetMaxPhases?: number,
  targetMaxSteps?: number
): { plan: TaskPlan; changes: PlanChange[] } {
  const changes: PlanChange[] = [];
  let updatedPhases = [...plan.phases];
  let updatedSteps = [...plan.steps];

  // Apply phase limit
  if (targetMaxPhases && updatedPhases.length > targetMaxPhases) {
    const removedPhases = updatedPhases.slice(targetMaxPhases);
    updatedPhases = updatedPhases.slice(0, targetMaxPhases);

    // Remove steps from removed phases
    const keptPhaseIds = new Set(updatedPhases.map((p) => p.id));
    updatedSteps = updatedSteps.filter((step) => keptPhaseIds.has(step.phaseId));

    changes.push({
      type: "phases_truncated",
      description: `Truncated plan from ${plan.phases.length} to ${targetMaxPhases} phases`,
    });
  }

  // Apply step limit per phase
  if (targetMaxSteps) {
    const stepsByPhase = new Map<string, PlanStep[]>();

    updatedSteps.forEach((step) => {
      if (!stepsByPhase.has(step.phaseId)) {
        stepsByPhase.set(step.phaseId, []);
      }
      stepsByPhase.get(step.phaseId)!.push(step);
    });

    const finalSteps: PlanStep[] = [];
    let totalRemoved = 0;

    stepsByPhase.forEach((phaseSteps, phaseId) => {
      if (phaseSteps.length > targetMaxSteps) {
        // Sort by order and keep first N
        const sortedSteps = [...phaseSteps].sort((a, b) => a.order - b.order);
        const keptSteps = sortedSteps.slice(0, targetMaxSteps);
        const removedSteps = sortedSteps.slice(targetMaxSteps);

        finalSteps.push(...keptSteps);
        totalRemoved += removedSteps.length;

        // Update dependencies: remove references to removed steps
        const removedStepIds = new Set(removedSteps.map((s) => s.id));
        keptSteps.forEach((step) => {
          step.dependencies = step.dependencies.filter((depId) => !removedStepIds.has(depId));
        });
      } else {
        finalSteps.push(...phaseSteps);
      }
    });

    // Ensure at least one step remains (Zod validation requirement)
    if (finalSteps.length === 0 && updatedSteps.length > 0) {
      // Keep at least the first step
      finalSteps.push(updatedSteps[0]);
      totalRemoved = updatedSteps.length - 1;
    }

    if (totalRemoved > 0) {
      changes.push({
        type: "steps_truncated",
        description: `Truncated ${totalRemoved} steps to respect maxSteps per phase limit`,
      });
    }

    updatedSteps = finalSteps;
  }

  return {
    plan: {
      ...plan,
      phases: updatedPhases,
      steps: updatedSteps,
    },
    changes,
  };
}

/**
 * Main function that orchestrates plan validation and compression.
 * 
 * Applies all validation and compression steps in order:
 * 1. Validate levels
 * 2. Validate scopes
 * 3. Apply dynamic chunking
 * 4. Apply global limits
 * 5. Final validation
 * 
 * @param plan - The plan to validate
 * @param options - Validation options
 * @returns Complete validation result with optimized plan and metadata
 */
export function validatePlan(
  plan: TaskPlan,
  options: ValidatePlanOptions = {}
): ValidatePlanResult {
  const planBefore = { ...plan };
  const allChanges: PlanChange[] = [];
  const allWarnings: PlanWarning[] = [];
  let currentPlan = plan;

  // Step 1: Validate levels
  const levelResult = validatePlanLevels(currentPlan);
  currentPlan = levelResult.plan;
  allChanges.push(...levelResult.changes);

  // Step 2: Validate scopes
  const scopeResult = validatePlanScopes(currentPlan);
  currentPlan = scopeResult.plan;
  allChanges.push(...scopeResult.changes);

  // Step 3: Apply dynamic chunking
  const chunkingResult = applyDynamicChunking(currentPlan, options.maxMicroStepsPerPhase);
  currentPlan = chunkingResult.plan;
  allChanges.push(...chunkingResult.changes);

  // Step 4: Apply global limits
  const limitsResult = applyGlobalLimits(
    currentPlan,
    options.targetMaxPhases,
    options.targetMaxSteps
  );
  currentPlan = limitsResult.plan;
  allChanges.push(...limitsResult.changes);

  // Step 5: Ensure at least one step remains (Zod validation requirement)
  if (currentPlan.steps.length === 0 && planBefore.steps.length > 0) {
    // Keep the first step from the original plan
    const firstStep = planBefore.steps[0];
    const firstPhase = currentPlan.phases.find((p) => p.id === firstStep.phaseId);
    if (firstPhase || currentPlan.phases.length > 0) {
      // Ensure the phase exists
      if (!firstPhase && currentPlan.phases.length > 0) {
        firstStep.phaseId = currentPlan.phases[0].id;
      }
      currentPlan.steps = [firstStep];
      allWarnings.push({
        type: "steps_preserved",
        message: "Preserved at least one step to meet validation requirements",
        componentId: firstStep.id,
      });
    }
  }

  // Step 6: Final validation
  try {
    currentPlan = validateTaskPlan(currentPlan);
  } catch (error) {
    allWarnings.push({
      type: "validation_error",
      message: `Plan validation failed: ${error instanceof Error ? error.message : String(error)}`,
    });
  }

  // Calculate statistics
  const chunksCreated = allChanges.filter((c) => c.type === "steps_merged").length;
  const stepsMerged = allChanges
    .filter((c) => c.type === "steps_merged")
    .reduce((sum, c) => {
      // Extract number from description like "Merged 3 steps..."
      const match = c.description.match(/Merged (\d+) steps/);
      return sum + (match ? parseInt(match[1], 10) - 1 : 0); // -1 because one step remains
    }, 0);
  const levelsCorrected = allChanges.filter((c) => c.type === "level_corrected").length;
  const scopesReassigned = allChanges.filter((c) => c.type === "scope_reassigned").length;

  const stats = createPlanStats(
    planBefore,
    currentPlan,
    chunksCreated,
    stepsMerged,
    levelsCorrected,
    scopesReassigned
  );

  // Generate TOON representation
  const toon = toToonFriendly(currentPlan);

  return {
    plan: currentPlan,
    warnings: allWarnings,
    changes: allChanges,
    stats,
    toon,
  };
}

/**
 * Handler for the validate_plan MCP tool.
 * 
 * Validates and compresses a TaskPlan using H-Net-style dynamic chunking.
 * Returns optimized plan with metadata (warnings, changes, stats) and TOON.
 * 
 * @param args - Tool arguments
 * @returns MCP tool response with validation result
 */
export async function handleValidatePlan(
  args: ValidatePlanArgs
): Promise<{
  content: Array<{ type: "text"; text: string }>;
}> {
  const result = validatePlan(args.plan, {
    targetMaxPhases: args.targetMaxPhases,
    targetMaxSteps: args.targetMaxSteps,
    maxMicroStepsPerPhase: args.maxMicroStepsPerPhase,
  });

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

