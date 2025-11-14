/**
 * Benchmark scenario definitions.
 * 
 * Exports all available benchmark scenarios for use in benchmark tools.
 */

export { smallBugfixScenario } from "./small-bugfix.js";
export { mediumFeatureScenario } from "./medium-feature.js";
export { structuralRefactorScenario } from "./structural-refactor.js";

import { type BenchmarkScenario } from "../types/index.js";
import { smallBugfixScenario } from "./small-bugfix.js";
import { mediumFeatureScenario } from "./medium-feature.js";
import { structuralRefactorScenario } from "./structural-refactor.js";

/**
 * All available benchmark scenarios.
 */
export const allScenarios: BenchmarkScenario[] = [
  smallBugfixScenario,
  mediumFeatureScenario,
  structuralRefactorScenario,
];

/**
 * Get a scenario by ID.
 * 
 * @param id - Scenario identifier
 * @returns Scenario if found, undefined otherwise
 */
export function getScenarioById(id: string): BenchmarkScenario | undefined {
  return allScenarios.find((s) => s.id === id);
}

/**
 * Get scenarios by task kind.
 * 
 * @param taskKind - Task kind to filter by
 * @returns Array of scenarios matching the task kind
 */
export function getScenariosByTaskKind(
  taskKind: BenchmarkScenario["taskKind"]
): BenchmarkScenario[] {
  return allScenarios.filter((s) => s.taskKind === taskKind);
}

