/**
 * Zod schemas for validating hierarchical task planning types
 * @module types/schemas
 * 
 * These schemas provide runtime validation for TaskPlan, PlanPhase, PlanScope, and PlanStep.
 * Used in MCP tools to validate inputs and outputs.
 */

import { z } from "zod";
import {
  PlanLevel,
  StepKind,
  ScopeKind,
  TaskKind,
  StepStatus,
  type PlanStep,
  type PlanScope,
  type PlanPhase,
  type TaskPlan,
  type TaskPlanMetadata,
} from "./index.js";

/**
 * Schema for PlanLevel enum
 */
export const planLevelSchema = z.nativeEnum(PlanLevel);

/**
 * Schema for StepKind enum
 */
export const stepKindSchema = z.nativeEnum(StepKind);

/**
 * Schema for ScopeKind enum
 */
export const scopeKindSchema = z.nativeEnum(ScopeKind);

/**
 * Schema for TaskKind enum
 */
export const taskKindSchema = z.nativeEnum(TaskKind);

/**
 * Schema for StepStatus enum
 */
export const stepStatusSchema = z.nativeEnum(StepStatus);

/**
 * Schema for TaskPlanMetadata
 */
export const taskPlanMetadataSchema: z.ZodType<TaskPlanMetadata> = z.object({
  createdAt: z.string().optional(),
  version: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * Schema for PlanStep
 */
export const planStepSchema = z.object({
  id: z.string().min(1, "Step ID cannot be empty"),
  phaseId: z.string().min(1, "Phase ID cannot be empty"),
  level: planLevelSchema,
  order: z.number().int().min(0),
  kind: stepKindSchema,
  title: z.string().min(1, "Title cannot be empty"),
  summary: z.string().min(1, "Summary cannot be empty"),
  scopeId: z.string().nullable(),
  dependencies: z.array(z.string()),
  suggestedTools: z.array(z.string()),
  status: stepStatusSchema.optional(),
}) satisfies z.ZodType<PlanStep>;

/**
 * Schema for PlanScope
 */
export const planScopeSchema = z.object({
  id: z.string().min(1, "Scope ID cannot be empty"),
  kind: scopeKindSchema,
  label: z.string().min(1, "Label cannot be empty"),
  selector: z.string().min(1, "Selector cannot be empty"),
  description: z.string().optional(),
}) satisfies z.ZodType<PlanScope>;

/**
 * Schema for PlanPhase
 */
export const planPhaseSchema = z.object({
  id: z.string().min(1, "Phase ID cannot be empty"),
  name: z.string().min(1, "Name cannot be empty"),
  level: planLevelSchema,
  order: z.number().int().min(0),
  summary: z.string().optional(),
}) satisfies z.ZodType<PlanPhase>;

/**
 * Schema for TaskPlan
 */
export const taskPlanSchema = z.object({
  goal: z.string().min(1, "Goal cannot be empty"),
  taskKind: taskKindSchema,
  contextSummary: z.string().optional(),
  phases: z.array(planPhaseSchema).min(1, "At least one phase is required"),
  scopes: z.array(planScopeSchema),
  steps: z.array(planStepSchema).min(1, "At least one step is required"),
  metadata: taskPlanMetadataSchema.optional(),
}).refine(
  (data) => {
    // Validate that all step phaseIds reference existing phases
    const phaseIds = new Set(data.phases.map((p) => p.id));
    return data.steps.every((step) => phaseIds.has(step.phaseId));
  },
  {
    message: "All steps must reference existing phases",
  }
).refine(
  (data) => {
    // Validate that all step scopeIds (if not null) reference existing scopes
    const scopeIds = new Set(data.scopes.map((s) => s.id));
    return data.steps.every(
      (step) => step.scopeId === null || scopeIds.has(step.scopeId)
    );
  },
  {
    message: "All step scopeIds must reference existing scopes or be null",
  }
).refine(
  (data) => {
    // Validate that all step dependencies reference existing steps
    const stepIds = new Set(data.steps.map((s) => s.id));
    return data.steps.every((step) =>
      step.dependencies.every((depId) => stepIds.has(depId))
    );
  },
  {
    message: "All step dependencies must reference existing steps",
  }
) satisfies z.ZodType<TaskPlan>;

/**
 * Validates a PlanStep object
 * @param data - The data to validate
 * @returns Validated PlanStep
 * @throws ZodError if validation fails
 */
export function validatePlanStep(data: unknown): PlanStep {
  return planStepSchema.parse(data);
}

/**
 * Validates a PlanScope object
 * @param data - The data to validate
 * @returns Validated PlanScope
 * @throws ZodError if validation fails
 */
export function validatePlanScope(data: unknown): PlanScope {
  return planScopeSchema.parse(data);
}

/**
 * Validates a PlanPhase object
 * @param data - The data to validate
 * @returns Validated PlanPhase
 * @throws ZodError if validation fails
 */
export function validatePlanPhase(data: unknown): PlanPhase {
  return planPhaseSchema.parse(data);
}

/**
 * Validates a TaskPlan object
 * @param data - The data to validate
 * @returns Validated TaskPlan
 * @throws ZodError if validation fails
 */
export function validateTaskPlan(data: unknown): TaskPlan {
  return taskPlanSchema.parse(data);
}

