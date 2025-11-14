/**
 * Tool for generating hierarchical TaskPlans based on goals
 * @module tools/plan-task
 * 
 * Implements deterministic plan generation using HRM-inspired rules.
 * Generates phases, scopes, and steps organized by abstraction level.
 */

import { z } from "zod";
import {
  TaskKind,
  PlanLevel,
  StepKind,
  ScopeKind,
  type TaskPlan,
  type PlanPhase,
  type PlanScope,
  type PlanStep,
} from "../types/index.js";
import { validateTaskPlan } from "../types/schemas.js";
import {
  getSuggestedToolsForStepKind,
  getStepLevel,
  generatePlanId,
  generateComponentId,
} from "./plan-task-helpers.js";

/**
 * Input arguments for the plan_task tool
 */
export interface PlanTaskArgs {
  goal: string;
  context?: string;
  taskKind?: TaskKind;
  maxPhases?: number;
  maxSteps?: number;
}

/**
 * Zod schema for plan_task tool inputs
 */
export const planTaskInputSchema = {
  goal: z.string().min(1, "Goal cannot be empty").describe("The main goal/objective for the task"),
  context: z.string().optional().describe("Optional context about the current situation or codebase state"),
  taskKind: z.nativeEnum(TaskKind).optional().describe("Type of task (bugfix, feature, refactor, other). If not provided, will be inferred from goal."),
  maxPhases: z.number().int().positive().optional().describe("Maximum number of phases to generate (default: 3)"),
  maxSteps: z.number().int().positive().optional().describe("Maximum number of steps to generate per phase (default: unlimited)"),
};

/**
 * Infers the TaskKind from a goal string using deterministic heuristics.
 * 
 * Heuristics (case-insensitive):
 * - Bugfix: contains "bugfix", "fix", "bug", "error", "issue"
 * - Feature: contains "add", "implement", "create", "feature", "new"
 * - Refactor: contains "refactor", "restructure", "redesign", "improve"
 * - Default: Other
 * 
 * @param goal - The goal string to analyze
 * @returns The inferred TaskKind
 */
export function inferTaskKind(goal: string): TaskKind {
  const lowerGoal = goal.toLowerCase();

  // Check for bugfix keywords (order matters: more specific first)
  const bugfixKeywords = ["bugfix", "fix", "bug", "error", "issue", "broken", "crash", "fail"];
  if (bugfixKeywords.some((keyword) => lowerGoal.includes(keyword))) {
    return TaskKind.Bugfix;
  }

  // Check for feature keywords
  const featureKeywords = ["add", "implement", "create", "feature", "new", "build"];
  if (featureKeywords.some((keyword) => lowerGoal.includes(keyword))) {
    return TaskKind.Feature;
  }

  // Check for refactor keywords
  const refactorKeywords = ["refactor", "restructure", "redesign", "improve", "optimize", "cleanup"];
  if (refactorKeywords.some((keyword) => lowerGoal.includes(keyword))) {
    return TaskKind.Refactor;
  }

  // Default to Other
  return TaskKind.Other;
}

/**
 * Generates phases for a task plan based on the task kind.
 * 
 * Each task kind has a specific phase structure:
 * - Bugfix: Localize Bug → Fix Bug → Validate Fix
 * - Feature: Understand Requirements → Implement Feature → Validate Feature
 * - Refactor: Analyze Current Design → Design Target → Apply Refactor
 * - Other: Plan → Execute → Validate
 * 
 * @param taskKind - The type of task
 * @param planId - The parent plan ID
 * @returns Array of PlanPhase objects
 */
export function generatePhases(taskKind: TaskKind, planId: string): PlanPhase[] {
  switch (taskKind) {
    case TaskKind.Bugfix:
      return [
        {
          id: generateComponentId(planId, "phase", 1),
          name: "Localize Bug",
          level: PlanLevel.Abstract,
          order: 1,
          summary: "Identify the root cause of the bug",
        },
        {
          id: generateComponentId(planId, "phase", 2),
          name: "Fix Bug",
          level: PlanLevel.Planning,
          order: 2,
          summary: "Implement the fix for the identified bug",
        },
        {
          id: generateComponentId(planId, "phase", 3),
          name: "Validate Fix",
          level: PlanLevel.Execution,
          order: 3,
          summary: "Test and verify that the fix works correctly",
        },
      ];

    case TaskKind.Feature:
      return [
        {
          id: generateComponentId(planId, "phase", 1),
          name: "Understand Requirements",
          level: PlanLevel.Abstract,
          order: 1,
          summary: "Analyze what needs to be built and understand the requirements",
        },
        {
          id: generateComponentId(planId, "phase", 2),
          name: "Implement Feature",
          level: PlanLevel.Planning,
          order: 2,
          summary: "Build the feature according to the requirements",
        },
        {
          id: generateComponentId(planId, "phase", 3),
          name: "Validate Feature",
          level: PlanLevel.Execution,
          order: 3,
          summary: "Test the feature to ensure it works correctly",
        },
      ];

    case TaskKind.Refactor:
      return [
        {
          id: generateComponentId(planId, "phase", 1),
          name: "Analyze Current Design",
          level: PlanLevel.Abstract,
          order: 1,
          summary: "Understand the existing structure and identify areas to refactor",
        },
        {
          id: generateComponentId(planId, "phase", 2),
          name: "Design Target",
          level: PlanLevel.Planning,
          order: 2,
          summary: "Plan the refactored structure and design the target architecture",
        },
        {
          id: generateComponentId(planId, "phase", 3),
          name: "Apply Refactor",
          level: PlanLevel.Execution,
          order: 3,
          summary: "Implement the refactoring changes",
        },
      ];

    default: // TaskKind.Other
      return [
        {
          id: generateComponentId(planId, "phase", 1),
          name: "Plan",
          level: PlanLevel.Abstract,
          order: 1,
          summary: "Plan the task",
        },
        {
          id: generateComponentId(planId, "phase", 2),
          name: "Execute",
          level: PlanLevel.Planning,
          order: 2,
          summary: "Execute the task",
        },
        {
          id: generateComponentId(planId, "phase", 3),
          name: "Validate",
          level: PlanLevel.Execution,
          order: 3,
          summary: "Validate the result",
        },
      ];
  }
}

/**
 * Generates base scopes for a task plan.
 * 
 * Always creates three scopes:
 * 1. Global scope (workspace root)
 * 2. Target module scope (related to the goal)
 * 3. Tests/QA scope
 * 
 * @param goal - The goal string (used to describe target scope)
 * @param planId - The parent plan ID
 * @returns Array of PlanScope objects
 */
export function generateBaseScopes(goal: string, planId: string): PlanScope[] {
  return [
    {
      id: generateComponentId(planId, "scope", 1),
      kind: ScopeKind.Global,
      label: "Workspace",
      selector: "workspace root",
      description: "Entire workspace",
    },
    {
      id: generateComponentId(planId, "scope", 2),
      kind: ScopeKind.Module,
      label: "Target Module",
      selector: `module related to: ${goal}`,
      description: `Code area related to the goal: ${goal}`,
    },
    {
      id: generateComponentId(planId, "scope", 3),
      kind: ScopeKind.Module,
      label: "Tests/QA",
      selector: "test files and QA related to the goal",
      description: "Test files and quality assurance related to the goal",
    },
  ];
}

/**
 * Generates steps for a specific phase based on the phase level and task kind.
 * 
 * Step generation follows HRM principles:
 * - Abstract phase (Level 0): clarify_goal, gather_context
 * - Planning phase (Level 1): scan_code, design_solution
 * - Execution phase (Level 2): edit_code, run_tests
 * 
 * Steps are assigned appropriate HRM levels and suggested tools.
 * 
 * @param phase - The phase to generate steps for
 * @param taskKind - The type of task (affects step details)
 * @param scopes - Available scopes for step assignment
 * @param planId - The parent plan ID
 * @param previousStepIds - IDs of steps from previous phases (for dependencies)
 * @returns Array of PlanStep objects for this phase
 */
export function generateStepsForPhase(
  phase: PlanPhase,
  taskKind: TaskKind,
  scopes: PlanScope[],
  planId: string,
  previousStepIds: string[]
): PlanStep[] {
  const steps: PlanStep[] = [];
  const workspaceScope = scopes.find((s) => s.kind === ScopeKind.Global);
  const targetScope = scopes.find((s) => s.kind === ScopeKind.Module && s.label === "Target Module");
  const testScope = scopes.find((s) => s.label === "Tests/QA");

  // Determine steps based on phase level
  if (phase.level === PlanLevel.Abstract) {
    // Abstract phase: clarify goal, gather context
    const step1Id = generateComponentId(planId, "step", steps.length + 1);
    steps.push({
      id: step1Id,
      phaseId: phase.id,
      level: getStepLevel(StepKind.ClarifyGoal, phase.level),
      order: 1,
      kind: StepKind.ClarifyGoal,
      title: `Clarify: ${phase.name}`,
      summary: `Clarify and understand the goal: ${phase.summary || phase.name}`,
      scopeId: workspaceScope?.id || null,
      dependencies: [],
      suggestedTools: getSuggestedToolsForStepKind(StepKind.ClarifyGoal),
    });

    const step2Id = generateComponentId(planId, "step", steps.length + 1);
    steps.push({
      id: step2Id,
      phaseId: phase.id,
      level: getStepLevel(StepKind.GatherContext, phase.level),
      order: 2,
      kind: StepKind.GatherContext,
      title: "Gather Context",
      summary: "Collect information about the current state and context",
      scopeId: targetScope?.id || null,
      dependencies: [step1Id],
      suggestedTools: getSuggestedToolsForStepKind(StepKind.GatherContext),
    });
  } else if (phase.level === PlanLevel.Planning) {
    // Planning phase: scan code, design solution
    const step1Id = generateComponentId(planId, "step", steps.length + 1);
    const lastPreviousStepId = previousStepIds[previousStepIds.length - 1] || null;
    steps.push({
      id: step1Id,
      phaseId: phase.id,
      level: getStepLevel(StepKind.ScanCode, phase.level),
      order: 1,
      kind: StepKind.ScanCode,
      title: "Scan Code",
      summary: `Scan relevant code to understand structure: ${phase.summary || phase.name}`,
      scopeId: targetScope?.id || null,
      dependencies: lastPreviousStepId ? [lastPreviousStepId] : [],
      suggestedTools: getSuggestedToolsForStepKind(StepKind.ScanCode),
    });

    const step2Id = generateComponentId(planId, "step", steps.length + 1);
    steps.push({
      id: step2Id,
      phaseId: phase.id,
      level: getStepLevel(StepKind.DesignSolution, phase.level),
      order: 2,
      kind: StepKind.DesignSolution,
      title: "Design Solution",
      summary: `Design the solution approach: ${phase.summary || phase.name}`,
      scopeId: targetScope?.id || null,
      dependencies: [step1Id],
      suggestedTools: getSuggestedToolsForStepKind(StepKind.DesignSolution),
    });
  } else if (phase.level === PlanLevel.Execution) {
    // Execution phase: edit code, run tests
    const step1Id = generateComponentId(planId, "step", steps.length + 1);
    const lastPreviousStepId = previousStepIds[previousStepIds.length - 1] || null;
    steps.push({
      id: step1Id,
      phaseId: phase.id,
      level: getStepLevel(StepKind.EditCode, phase.level),
      order: 1,
      kind: StepKind.EditCode,
      title: "Edit Code",
      summary: `Implement changes: ${phase.summary || phase.name}`,
      scopeId: targetScope?.id || null,
      dependencies: lastPreviousStepId ? [lastPreviousStepId] : [],
      suggestedTools: getSuggestedToolsForStepKind(StepKind.EditCode),
    });

    const step2Id = generateComponentId(planId, "step", steps.length + 1);
    steps.push({
      id: step2Id,
      phaseId: phase.id,
      level: getStepLevel(StepKind.RunTests, phase.level),
      order: 2,
      kind: StepKind.RunTests,
      title: "Run Tests",
      summary: "Validate that changes work correctly",
      scopeId: testScope?.id || null,
      dependencies: [step1Id],
      suggestedTools: getSuggestedToolsForStepKind(StepKind.RunTests),
    });
  }

  return steps;
}

/**
 * Builds a complete TaskPlan from the provided arguments.
 * 
 * This is the main orchestration function that:
 * 1. Infers or uses provided taskKind
 * 2. Generates phases based on taskKind
 * 3. Creates base scopes
 * 4. Generates steps for each phase
 * 5. Applies limits (maxPhases, maxSteps)
 * 6. Validates the final plan
 * 
 * @param args - Arguments for plan generation
 * @returns A complete, validated TaskPlan
 */
export function buildTaskPlan(args: PlanTaskArgs): TaskPlan {
  const planId = generatePlanId("plan");
  const taskKind = args.taskKind || inferTaskKind(args.goal);
  const maxPhases = args.maxPhases || 3;
  const maxSteps = args.maxSteps;

  // Generate phases
  let phases = generatePhases(taskKind, planId);
  if (phases.length > maxPhases) {
    phases = phases.slice(0, maxPhases);
  }

  // Generate scopes
  const scopes = generateBaseScopes(args.goal, planId);

  // Generate steps for each phase
  const allSteps: PlanStep[] = [];
  const previousStepIds: string[] = [];

  for (const phase of phases) {
    const phaseSteps = generateStepsForPhase(phase, taskKind, scopes, planId, previousStepIds);
    
    // Apply maxSteps limit if specified
    const limitedSteps = maxSteps ? phaseSteps.slice(0, maxSteps) : phaseSteps;
    allSteps.push(...limitedSteps);
    previousStepIds.push(...limitedSteps.map((s) => s.id));
  }

  // Build the plan
  const plan: TaskPlan = {
    goal: args.goal,
    taskKind,
    contextSummary: args.context,
    phases,
    scopes,
    steps: allSteps,
    metadata: {
      createdAt: new Date().toISOString(),
      version: "0.1.0",
    },
  };

  // Validate and return
  return validateTaskPlan(plan);
}

/**
 * Converts a TaskPlan to a TOON-friendly string representation.
 * 
 * TOON (Token-Oriented Object Notation) is a compact format for LLMs.
 * This function creates a tabular, token-efficient representation.
 * 
 * @param plan - The TaskPlan to convert
 * @returns TOON-friendly string representation
 */
export function toToonFriendly(plan: TaskPlan): string {
  const lines: string[] = [];

  // Header
  lines.push(`Goal: ${plan.goal}`);
  lines.push(`TaskKind: ${plan.taskKind}`);
  if (plan.contextSummary) {
    lines.push(`Context: ${plan.contextSummary}`);
  }
  lines.push("");

  // Phases (tabular)
  lines.push("Phases:");
  lines.push("ID|Name|Level|Order|Summary");
  lines.push("---|----|-----|-----|------");
  for (const phase of plan.phases) {
    lines.push(`${phase.id}|${phase.name}|${phase.level}|${phase.order}|${phase.summary || ""}`);
  }
  lines.push("");

  // Scopes (tabular)
  lines.push("Scopes:");
  lines.push("ID|Kind|Label|Selector");
  lines.push("---|----|-----|--------");
  for (const scope of plan.scopes) {
    lines.push(`${scope.id}|${scope.kind}|${scope.label}|${scope.selector}`);
  }
  lines.push("");

  // Steps (tabular)
  lines.push("Steps:");
  lines.push("ID|Phase|Level|Order|Kind|Title|Dependencies");
  lines.push("---|-----|-----|-----|----|-----|------------");
  for (const step of plan.steps) {
    const deps = step.dependencies.join(",");
    lines.push(`${step.id}|${step.phaseId}|${step.level}|${step.order}|${step.kind}|${step.title}|${deps}`);
  }

  return lines.join("\n");
}

/**
 * Handler for the plan_task MCP tool.
 * 
 * Generates a hierarchical TaskPlan based on the provided goal and optional parameters.
 * Returns both the full JSON plan and a TOON-friendly representation.
 * 
 * @param args - Tool arguments
 * @returns MCP tool response with TaskPlan JSON and TOON representation
 */
export async function handlePlanTask(
  args: PlanTaskArgs
): Promise<{
  content: Array<{ type: "text"; text: string }>;
}> {
  const plan = buildTaskPlan(args);
  const toonRepresentation = toToonFriendly(plan);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            plan: plan,
            toon: toonRepresentation,
          },
          null,
          2
        ),
      },
    ],
  };
}

