/**
 * Helper functions for plan task generation
 * @module tools/plan-task-helpers
 * 
 * Provides reusable utilities for building TaskPlans:
 * - StepKind → suggestedTools mapping
 * - HRM level assignment rules
 * - ID generation utilities
 */

import { StepKind, PlanLevel } from "../types/index.js";

/**
 * Maps StepKind to suggested MCP tools for that step type.
 * 
 * This mapping ensures each step has appropriate tools suggested based on its purpose.
 * Tools are ordered by relevance (most relevant first).
 * 
 * @param kind - The step kind to get tools for
 * @returns Array of suggested tool names (e.g., "serena.find_symbol")
 */
export function getSuggestedToolsForStepKind(kind: StepKind): string[] {
  const toolMap: Record<StepKind, string[]> = {
    [StepKind.ClarifyGoal]: [
      "serena.find_symbol",
      "filesystem.read_file",
    ],
    [StepKind.GatherContext]: [
      "serena.get_symbols_overview",
      "serena.find_referencing_symbols",
    ],
    [StepKind.ScanCode]: [
      "serena.search_for_pattern",
      "serena.find_symbol",
    ],
    [StepKind.DesignSolution]: [
      "serena.get_symbols_overview",
    ],
    [StepKind.EditCode]: [
      "serena.replace_symbol_body",
      "serena.insert_after_symbol",
      "serena.rename_symbol",
    ],
    [StepKind.RunTests]: [
      "execute_shell_command",
    ],
    [StepKind.Refine]: [
      "serena.read_file",
      "serena.find_referencing_symbols",
    ],
  };

  return toolMap[kind] || [];
}

/**
 * Determines the appropriate HRM level for a step based on its kind and phase level.
 * 
 * HRM levels:
 * - Level 0 (Abstract): Goal definition, high-level strategy
 * - Level 1 (Planning): Concrete planning, specific areas
 * - Level 2 (Execution): Direct execution, edits, tests
 * 
 * Steps should generally match or be one level more concrete than their phase.
 * 
 * @param stepKind - The type of step
 * @param phaseLevel - The HRM level of the phase this step belongs to
 * @returns The appropriate PlanLevel for this step
 */
export function getStepLevel(stepKind: StepKind, phaseLevel: PlanLevel): PlanLevel {
  // Steps that are inherently abstract (goal clarification)
  if (stepKind === StepKind.ClarifyGoal) {
    return PlanLevel.Abstract;
  }

  // Steps that are inherently execution-level (code edits, tests)
  if (stepKind === StepKind.EditCode || stepKind === StepKind.RunTests) {
    return PlanLevel.Execution;
  }

  // Steps that are planning-level (gathering context, scanning, designing)
  if (
    stepKind === StepKind.GatherContext ||
    stepKind === StepKind.ScanCode ||
    stepKind === StepKind.DesignSolution
  ) {
    return PlanLevel.Planning;
  }

  // Refine can be at any level, default to phase level
  if (stepKind === StepKind.Refine) {
    return phaseLevel;
  }

  // Default: match phase level
  return phaseLevel;
}

/**
 * Generates a unique ID for a plan component.
 * 
 * Format: `{prefix}-{timestamp}-{random}`
 * This ensures uniqueness even when multiple plans are generated quickly.
 * 
 * @param prefix - Prefix for the ID (e.g., "plan", "phase", "step", "scope")
 * @returns A unique identifier string
 */
export function generatePlanId(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Generates a sequential ID for a plan component within a plan.
 * 
 * Format: `{planId}-{prefix}-{order}`
 * This creates predictable, readable IDs that show the relationship to the parent plan.
 * 
 * @param planId - The parent plan ID
 * @param prefix - Prefix for the component (e.g., "phase", "step", "scope")
 * @param order - Sequential order number (1-based)
 * @returns A unique identifier string within the plan
 */
export function generateComponentId(planId: string, prefix: string, order: number): string {
  return `${planId}-${prefix}-${order}`;
}

