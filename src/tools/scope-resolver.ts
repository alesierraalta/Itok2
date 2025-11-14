/**
 * Scope resolution utilities
 * @module tools/scope-resolver
 * 
 * Provides utilities for translating scope selectors to actionable information
 * and resolving scopes to concrete entities using Serena.
 */

import {
  type PlanScope,
  type ScopeResolution,
  ScopeKind,
  type TaskPlan,
} from "../types/index.js";

/**
 * Translates a scope selector string to structured resolution information.
 * 
 * Parses different selector formats:
 * - "workspace root" → global resolution
 * - "module related to: {description}" → module resolution
 * - "use serena.find_symbol('SymbolName')" → serena_action resolution
 * - "files in src/server/" → pattern resolution
 * - Symbol names → symbol resolution
 * 
 * @param scope - The scope to translate
 * @returns ScopeResolution with parsed information
 */
export function translateScopeSelector(scope: PlanScope): ScopeResolution {
  const selector = scope.selector.toLowerCase().trim();

  // Global scope
  if (selector === "workspace root" || scope.kind === ScopeKind.Global) {
    return {
      scope,
      resolutionType: "global",
      parsedInfo: {},
      instructions: "Use the entire workspace as the scope",
    };
  }

  // Serena action pattern: "use serena.find_symbol('SymbolName')"
  const serenaActionMatch = selector.match(/use\s+serena\.(\w+)\(['"]([^'"]+)['"]\)/);
  if (serenaActionMatch) {
    const toolName = `serena.${serenaActionMatch[1]}`;
    const symbolName = serenaActionMatch[2];
    return {
      scope,
      resolutionType: "serena_action",
      parsedInfo: {
        toolName,
        toolArgs: { name: symbolName },
        symbolName,
      },
      instructions: `Call ${toolName} with symbol name "${symbolName}"`,
    };
  }

  // Module pattern: "module related to: {description}"
  const moduleMatch = selector.match(/module\s+related\s+to:\s*(.+)/);
  if (moduleMatch || scope.kind === ScopeKind.Module) {
    const description = moduleMatch ? moduleMatch[1] : scope.selector;
    return {
      scope,
      resolutionType: "module",
      parsedInfo: {
        moduleDescription: description,
      },
      instructions: `Find module related to: ${description}. Use semantic search to locate relevant code areas.`,
    };
  }

  // File pattern: "files in {path}" or path-like patterns
  const filePatternMatch = selector.match(/(?:files?\s+in\s+)?([\w/.*-]+(?:\*\*?)?[\w/.*-]*)/);
  if (filePatternMatch || scope.kind === ScopeKind.File) {
    const pathPattern = filePatternMatch ? filePatternMatch[1] : scope.selector;
    return {
      scope,
      resolutionType: "pattern",
      parsedInfo: {
        pathPattern,
      },
      instructions: `Search for files matching pattern: ${pathPattern}`,
    };
  }

  // Symbol pattern: looks like a symbol name (single word, PascalCase or camelCase)
  const symbolNameMatch = selector.match(/^[a-zA-Z][a-zA-Z0-9]*$/);
  if (symbolNameMatch || scope.kind === ScopeKind.Symbol) {
    const symbolName = scope.selector;
    return {
      scope,
      resolutionType: "symbol",
      parsedInfo: {
        symbolName,
      },
      instructions: `Find symbol named "${symbolName}" using serena.find_symbol`,
    };
  }

  // Default: treat as module description
  return {
    scope,
    resolutionType: "module",
    parsedInfo: {
      moduleDescription: scope.selector,
    },
    instructions: `Resolve scope using description: ${scope.selector}. Use semantic search to find relevant code.`,
  };
}

/**
 * Resolves a scope to concrete entities using Serena (prepared for future integration).
 * 
 * This function is a placeholder for future integration with Serena MCP.
 * Currently returns the translated selector information.
 * 
 * Future implementation would:
 * 1. Use translateScopeSelector to get resolution type
 * 2. Call appropriate Serena tools based on resolution type
 * 3. Return concrete entities (symbols, files, etc.)
 * 
 * @param scope - The scope to resolve
 * @param plan - The plan (for context, e.g., goal)
 * @returns ScopeResolution with resolved information
 */
export function resolveScope(scope: PlanScope, plan: TaskPlan): ScopeResolution {
  // For now, just translate the selector
  // Future: integrate with Serena MCP to actually resolve to concrete entities
  const resolution = translateScopeSelector(scope);

  // Enhance instructions with plan context if available
  if (plan.goal && resolution.resolutionType === "module") {
    resolution.instructions = `${resolution.instructions} (Goal: ${plan.goal})`;
  }

  return resolution;
}

/**
 * Gets the scope for a step.
 * 
 * @param step - The step
 * @param plan - The plan containing scopes
 * @returns The scope for the step, or null if scopeId is null
 */
export function getStepScope(
  step: { scopeId: string | null },
  plan: TaskPlan
): PlanScope | null {
  if (step.scopeId === null) {
    return null;
  }

  return plan.scopes.find((s) => s.id === step.scopeId) || null;
}

