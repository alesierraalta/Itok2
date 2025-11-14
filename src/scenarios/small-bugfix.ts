/**
 * Small bugfix scenario definition.
 * 
 * Represents a simple error correction task with low complexity.
 */

import { type BenchmarkScenario, TaskKind } from "../types/index.js";

export const smallBugfixScenario: BenchmarkScenario = {
  id: "small-bugfix-001",
  name: "Fix Null Pointer Exception in calculatePrice",
  taskKind: TaskKind.Bugfix,
  description: "Fix a null pointer exception that occurs when calculating price for items without a discount. The error happens in the calculatePrice function when accessing discount.amount without checking if discount is null.",
  goal: "Fix null pointer exception in calculatePrice function when discount is null",
  context: "The calculatePrice function in the pricing module throws a null pointer exception when processing items that don't have a discount applied. The function needs to handle null discount values gracefully.",
  filesInvolved: [
    "src/utils/pricing.ts",
    "src/utils/pricing.test.ts",
  ],
  complexity: "low",
  estimatedTimeMinutes: 8,
  completionCriteria: [
    "calculatePrice function handles null discount values without throwing",
    "Unit tests pass for both discounted and non-discounted items",
    "No null pointer exceptions occur in pricing calculations",
    "Code follows existing error handling patterns",
  ],
};

