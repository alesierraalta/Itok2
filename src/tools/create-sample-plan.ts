/**
 * Tool to create a sample TaskPlan for testing Phase 2 types
 * @module tools/create-sample-plan
 */

import { z } from "zod";
import {
  PlanLevel,
  StepKind,
  ScopeKind,
  TaskKind,
  type TaskPlan,
} from "../types/index.js";
import { validateTaskPlan } from "../types/schemas.js";

/**
 * Creates a sample TaskPlan based on the provided goal and task kind
 * @param goal - The goal for the task
 * @param taskKind - The type of task (bugfix, feature, refactor, other)
 * @returns A valid TaskPlan instance
 */
function createSamplePlan(goal: string, taskKind: TaskKind): TaskPlan {
  const planId = `plan-${Date.now()}`;
  
  // Define phases based on task kind
  let phases: Array<{ id: string; name: string; level: PlanLevel; order: number; summary: string }>;
  
  switch (taskKind) {
    case TaskKind.Bugfix:
      phases = [
        { id: `${planId}-phase-1`, name: "Localize Bug", level: PlanLevel.Abstract, order: 1, summary: "Identify the root cause" },
        { id: `${planId}-phase-2`, name: "Fix Bug", level: PlanLevel.Planning, order: 2, summary: "Implement the fix" },
        { id: `${planId}-phase-3`, name: "Validate Fix", level: PlanLevel.Execution, order: 3, summary: "Test and verify the fix" },
      ];
      break;
    case TaskKind.Feature:
      phases = [
        { id: `${planId}-phase-1`, name: "Understand Requirements", level: PlanLevel.Abstract, order: 1, summary: "Analyze what needs to be built" },
        { id: `${planId}-phase-2`, name: "Implement Feature", level: PlanLevel.Planning, order: 2, summary: "Build the feature" },
        { id: `${planId}-phase-3`, name: "Validate Feature", level: PlanLevel.Execution, order: 3, summary: "Test the feature" },
      ];
      break;
    case TaskKind.Refactor:
      phases = [
        { id: `${planId}-phase-1`, name: "Analyze Current Design", level: PlanLevel.Abstract, order: 1, summary: "Understand existing structure" },
        { id: `${planId}-phase-2`, name: "Design Target", level: PlanLevel.Planning, order: 2, summary: "Plan the refactored structure" },
        { id: `${planId}-phase-3`, name: "Apply Refactor", level: PlanLevel.Execution, order: 3, summary: "Implement the refactoring" },
      ];
      break;
    default:
      phases = [
        { id: `${planId}-phase-1`, name: "Plan", level: PlanLevel.Abstract, order: 1, summary: "Plan the task" },
        { id: `${planId}-phase-2`, name: "Execute", level: PlanLevel.Planning, order: 2, summary: "Execute the task" },
        { id: `${planId}-phase-3`, name: "Validate", level: PlanLevel.Execution, order: 3, summary: "Validate the result" },
      ];
  }

  // Define scopes
  const scopes = [
    {
      id: `${planId}-scope-1`,
      kind: ScopeKind.Global,
      label: "Workspace",
      selector: "workspace root",
    },
    {
      id: `${planId}-scope-2`,
      kind: ScopeKind.Module,
      label: "Target Module",
      selector: "module related to the goal",
    },
  ];

  // Define steps for each phase
  const steps = [
    {
      id: `${planId}-step-1`,
      phaseId: phases[0].id,
      level: PlanLevel.Abstract,
      order: 1,
      kind: StepKind.ClarifyGoal,
      title: `Clarify: ${goal}`,
      summary: `Understand and clarify the goal: ${goal}`,
      scopeId: `${planId}-scope-1`,
      dependencies: [],
      suggestedTools: ["serena.find_symbol", "filesystem.read_file"],
    },
    {
      id: `${planId}-step-2`,
      phaseId: phases[0].id,
      level: PlanLevel.Planning,
      order: 2,
      kind: StepKind.GatherContext,
      title: "Gather context",
      summary: "Collect information about the current state",
      scopeId: `${planId}-scope-2`,
      dependencies: [`${planId}-step-1`],
      suggestedTools: ["serena.scan_code", "serena.find_referencing_symbols"],
    },
    {
      id: `${planId}-step-3`,
      phaseId: phases[1].id,
      level: PlanLevel.Execution,
      order: 1,
      kind: taskKind === TaskKind.Bugfix ? StepKind.EditCode : StepKind.DesignSolution,
      title: taskKind === TaskKind.Bugfix ? "Fix the issue" : "Design solution",
      summary: taskKind === TaskKind.Bugfix ? "Apply the fix" : "Design the solution approach",
      scopeId: `${planId}-scope-2`,
      dependencies: [`${planId}-step-2`],
      suggestedTools: ["serena.replace_symbol_body", "serena.insert_after_symbol"],
    },
    {
      id: `${planId}-step-4`,
      phaseId: phases[2].id,
      level: PlanLevel.Execution,
      order: 1,
      kind: StepKind.RunTests,
      title: "Run tests",
      summary: "Validate the changes work correctly",
      scopeId: `${planId}-scope-2`,
      dependencies: [`${planId}-step-3`],
      suggestedTools: ["execute_shell_command"],
    },
  ];

  const plan: TaskPlan = {
    goal,
    taskKind,
    phases,
    scopes,
    steps,
    metadata: {
      createdAt: new Date().toISOString(),
      version: "0.1.0",
    },
  };

  // Validate the plan
  return validateTaskPlan(plan);
}

/**
 * Tool handler for create_sample_plan
 */
export async function handleCreateSamplePlan(args: {
  goal: string;
  taskKind?: TaskKind;
}): Promise<{
  content: Array<{ type: "text"; text: string }>;
}> {
  const taskKind = args.taskKind || TaskKind.Other;
  const plan = createSamplePlan(args.goal, taskKind);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(plan, null, 2),
      },
    ],
  };
}

