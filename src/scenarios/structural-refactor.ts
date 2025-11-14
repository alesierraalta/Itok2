/**
 * Structural refactor scenario definition.
 * 
 * Represents a significant code reorganization task with high complexity.
 */

import { type BenchmarkScenario, TaskKind } from "../types/index.js";

export const structuralRefactorScenario: BenchmarkScenario = {
  id: "structural-refactor-001",
  name: "Refactor Database Layer to Use Repository Pattern",
  taskKind: TaskKind.Refactor,
  description: "Refactor the database access layer to implement the Repository pattern. This involves extracting database queries from service classes into repository classes, creating interfaces for repositories, and updating all service classes to use repositories instead of direct database access. The refactor should maintain existing functionality while improving testability and maintainability.",
  goal: "Refactor database layer to use Repository pattern, extracting queries from services into repositories with interfaces",
  context: "The current codebase has database queries scattered across service classes, making testing difficult and coupling services directly to the database. The Repository pattern will abstract database access, making the code more testable and maintainable. All existing functionality must be preserved.",
  filesInvolved: [
    "src/repositories/user.repository.ts",
    "src/repositories/user.repository.interface.ts",
    "src/repositories/product.repository.ts",
    "src/repositories/product.repository.interface.ts",
    "src/repositories/order.repository.ts",
    "src/repositories/order.repository.interface.ts",
    "src/services/user.service.ts",
    "src/services/product.service.ts",
    "src/services/order.service.ts",
    "src/repositories/base.repository.ts",
  ],
  complexity: "high",
  estimatedTimeMinutes: 50,
  completionCriteria: [
    "All database queries moved to repository classes",
    "Repository interfaces defined for all repositories",
    "Service classes use repositories instead of direct database access",
    "All existing tests pass without modification",
    "New repository tests added for database operations",
    "Base repository class provides common functionality",
    "Code follows Repository pattern best practices",
    "No functionality is lost in the refactor",
  ],
};

