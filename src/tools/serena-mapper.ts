/**
 * Serena action mapping utilities
 * @module tools/serena-mapper
 * 
 * Maps StepKind to concrete Serena tool actions for plan execution.
 */

import {
  type PlanStep,
  StepKind,
  type SerenaAction,
  type PlanScope,
} from "../types/index.js";
import { translateScopeSelector } from "./scope-resolver.js";

/**
 * Gets Serena actions for a step based on its StepKind and scope.
 * 
 * Maps each StepKind to appropriate Serena tool calls with arguments
 * derived from the step's scope and context.
 * 
 * @param step - The step to get actions for
 * @param scope - The scope for this step (optional, will be derived if not provided)
 * @param plan - The plan (for context)
 * @returns Array of SerenaAction objects to execute
 */
export function getSerenaActionsForStep(
  step: PlanStep,
  scope: PlanScope | null,
  plan: { goal: string }
): SerenaAction[] {
  const actions: SerenaAction[] = [];

  // Resolve scope if provided
  let scopeResolution = null;
  if (scope) {
    scopeResolution = translateScopeSelector(scope);
  }

  switch (step.kind) {
    case StepKind.ClarifyGoal:
      // Clarify goal: find relevant symbols and read key files
      actions.push({
        tool: "serena.find_symbol",
        args: {
          name: plan.goal.split(" ")[0], // Use first word of goal as search term
        },
        description: `Find symbols related to goal: ${plan.goal}`,
        priority: 1,
      });
      actions.push({
        tool: "filesystem.read_file",
        args: {
          path: "README.md", // Common entry point
        },
        description: "Read project documentation to understand context",
        priority: 2,
      });
      break;

    case StepKind.GatherContext:
      // Gather context: get overview and find references
      if (scopeResolution?.parsedInfo.symbolName) {
        actions.push({
          tool: "serena.find_symbol",
          args: {
            name: scopeResolution.parsedInfo.symbolName,
          },
          description: `Find symbol: ${scopeResolution.parsedInfo.symbolName}`,
          priority: 1,
        });
      }
      actions.push({
        tool: "serena.get_symbols_overview",
        args: {
          relative_path: scopeResolution?.parsedInfo.pathPattern || ".",
        },
        description: "Get overview of symbols in scope",
        priority: 2,
      });
      actions.push({
        tool: "serena.find_referencing_symbols",
        args: scopeResolution?.parsedInfo.symbolName
          ? { name: scopeResolution.parsedInfo.symbolName }
          : {},
        description: "Find symbols that reference the target scope",
        priority: 3,
      });
      break;

    case StepKind.ScanCode:
      // Scan code: search for patterns and find symbols
      if (scopeResolution?.parsedInfo.symbolName) {
        actions.push({
          tool: "serena.find_symbol",
          args: {
            name: scopeResolution.parsedInfo.symbolName,
          },
          description: `Find symbol: ${scopeResolution.parsedInfo.symbolName}`,
          priority: 1,
        });
      }
      actions.push({
        tool: "serena.search_for_pattern",
        args: {
          pattern: step.summary, // Use step summary as search pattern
          relative_path: scopeResolution?.parsedInfo.pathPattern,
        },
        description: `Search for patterns related to: ${step.summary}`,
        priority: 2,
      });
      break;

    case StepKind.DesignSolution:
      // Design solution: get overview to understand structure
      actions.push({
        tool: "serena.get_symbols_overview",
        args: {
          relative_path: scopeResolution?.parsedInfo.pathPattern || ".",
        },
        description: "Get overview of code structure for design",
        priority: 1,
      });
      break;

    case StepKind.EditCode:
      // Edit code: prepare for code modifications
      if (scopeResolution?.parsedInfo.symbolName) {
        actions.push({
          tool: "serena.find_symbol",
          args: {
            name: scopeResolution.parsedInfo.symbolName,
          },
          description: `Locate symbol to edit: ${scopeResolution.parsedInfo.symbolName}`,
          priority: 1,
        });
      }
      // Note: Actual editing tools (replace_symbol_body, insert_after_symbol, rename_symbol)
      // would be called after locating the symbol
      actions.push({
        tool: "serena.get_symbols_overview",
        args: {
          relative_path: scopeResolution?.parsedInfo.pathPattern || ".",
        },
        description: "Get context before editing",
        priority: 2,
      });
      break;

    case StepKind.RunTests:
      // Run tests: execute test command
      actions.push({
        tool: "execute_shell_command",
        args: {
          command: "npm test",
          description: "Run test suite",
        },
        description: "Execute tests to validate changes",
        priority: 1,
      });
      break;

    case StepKind.Refine:
      // Refine: read and check references
      if (scopeResolution?.parsedInfo.symbolName) {
        actions.push({
          tool: "serena.find_symbol",
          args: {
            name: scopeResolution.parsedInfo.symbolName,
          },
          description: `Find symbol to refine: ${scopeResolution.parsedInfo.symbolName}`,
          priority: 1,
        });
      }
      actions.push({
        tool: "serena.find_referencing_symbols",
        args: scopeResolution?.parsedInfo.symbolName
          ? { name: scopeResolution.parsedInfo.symbolName }
          : {},
        description: "Check references to ensure refinement doesn't break anything",
        priority: 2,
      });
      break;

    default:
      // Unknown step kind: use suggested tools from step
      for (const toolName of step.suggestedTools) {
        actions.push({
          tool: toolName,
          args: {},
          description: `Execute ${toolName} for step: ${step.title}`,
          priority: actions.length + 1,
        });
      }
  }

  return actions;
}

/**
 * Executes a step using Serena (simulated/documentation purpose).
 * 
 * This function documents the execution protocol but doesn't actually
 * call Serena MCP tools. It's meant as a guide for how to execute steps.
 * 
 * Future implementation would:
 * 1. Get Serena actions for the step
 * 2. Resolve the scope
 * 3. Call Serena tools in sequence
 * 4. Collect results
 * 5. Return execution result
 * 
 * @param step - The step to execute
 * @param scope - The scope for the step
 * @param plan - The plan (for context)
 * @returns ExecutionResult with execution status
 */
export function executeStepWithSerena(
  step: PlanStep,
  scope: PlanScope | null,
  plan: { goal: string }
): {
  step: PlanStep;
  actions: SerenaAction[];
  instructions: string[];
} {
  const actions = getSerenaActionsForStep(step, scope, plan);

  const instructions: string[] = [
    `Step: ${step.title}`,
    `Summary: ${step.summary}`,
    `Scope: ${scope ? scope.selector : "global"}`,
    "",
    "Execution Protocol:",
    "1. Read scope and translate selector",
    "2. Use semantic tools (Serena) to locate entities",
    "3. Request chunks (not full files) if content needed",
    "4. Execute suggested tools in priority order",
    "5. Update step status based on result",
    "",
    "Serena Actions to execute:",
  ];

  actions.forEach((action, index) => {
    instructions.push(
      `${index + 1}. ${action.tool}(${JSON.stringify(action.args)}) - ${action.description}`
    );
  });

  return {
    step,
    actions,
    instructions,
  };
}

