/**
 * Test script for plan_task tool
 * @module test-plan-task
 * 
 * Tests the plan_task functionality with various goals and taskKinds
 * to verify deterministic plan generation and validation.
 */

import {
  TaskKind,
  type TaskPlan,
} from "./types/index.js";
import { validateTaskPlan } from "./types/schemas.js";
import {
  inferTaskKind,
  buildTaskPlan,
  toToonFriendly,
} from "./tools/plan-task.js";

/**
 * Test cases for plan generation
 */
const testCases = [
  {
    name: "Bugfix goal (inferred)",
    args: {
      goal: "Fix the authentication bug that causes login failures",
    },
  },
  {
    name: "Feature goal (inferred)",
    args: {
      goal: "Add a new user dashboard feature with analytics",
    },
  },
  {
    name: "Refactor goal (inferred)",
    args: {
      goal: "Refactor the database connection code to improve performance",
    },
  },
  {
    name: "Explicit Bugfix",
    args: {
      goal: "Fix error handling",
      taskKind: TaskKind.Bugfix,
    },
  },
  {
    name: "Explicit Feature",
    args: {
      goal: "Create new API endpoint",
      taskKind: TaskKind.Feature,
    },
  },
  {
    name: "Explicit Refactor",
    args: {
      goal: "Improve code structure",
      taskKind: TaskKind.Refactor,
    },
  },
  {
    name: "Other task (inferred)",
    args: {
      goal: "Review and document the codebase",
    },
  },
  {
    name: "With context",
    args: {
      goal: "Fix the memory leak in the server",
      context: "The server is experiencing memory leaks after running for several hours",
      taskKind: TaskKind.Bugfix,
    },
  },
  {
    name: "With limits",
    args: {
      goal: "Implement user authentication",
      taskKind: TaskKind.Feature,
      maxPhases: 2,
      maxSteps: 1,
    },
  },
];

/**
 * Runs all test cases
 */
async function runTests() {
  console.log("🧪 Testing Phase 3: plan_task Tool\n");

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    console.log(`\n📋 Test: ${testCase.name}`);
    console.log(`   Goal: "${testCase.args.goal}"`);

    try {
      // Test 1: Infer taskKind if not provided
      if (!testCase.args.taskKind) {
        const inferred = inferTaskKind(testCase.args.goal);
        console.log(`   ✓ Inferred taskKind: ${inferred}`);
      }

      // Test 2: Generate plan
      const plan = buildTaskPlan(testCase.args);
      console.log(`   ✓ Plan generated successfully`);

      // Test 3: Validate plan
      const validatedPlan = validateTaskPlan(plan);
      console.log(`   ✓ Plan validation passed`);

      // Test 4: Verify structure
      console.log(`   - Phases: ${validatedPlan.phases.length}`);
      console.log(`   - Scopes: ${validatedPlan.scopes.length}`);
      console.log(`   - Steps: ${validatedPlan.steps.length}`);

      // Test 5: Verify taskKind
      if (testCase.args.taskKind) {
        if (validatedPlan.taskKind !== testCase.args.taskKind) {
          throw new Error(
            `Expected taskKind ${testCase.args.taskKind}, got ${validatedPlan.taskKind}`
          );
        }
      }
      console.log(`   ✓ TaskKind: ${validatedPlan.taskKind}`);

      // Test 6: Verify phase references
      const phaseIds = new Set(validatedPlan.phases.map((p) => p.id));
      const invalidPhaseRefs = validatedPlan.steps.filter(
        (s) => !phaseIds.has(s.phaseId)
      );
      if (invalidPhaseRefs.length > 0) {
        throw new Error(`Found ${invalidPhaseRefs.length} steps with invalid phase references`);
      }
      console.log(`   ✓ All step phase references are valid`);

      // Test 7: Verify scope references
      const scopeIds = new Set(validatedPlan.scopes.map((s) => s.id));
      const invalidScopeRefs = validatedPlan.steps.filter(
        (s) => s.scopeId !== null && !scopeIds.has(s.scopeId)
      );
      if (invalidScopeRefs.length > 0) {
        throw new Error(`Found ${invalidScopeRefs.length} steps with invalid scope references`);
      }
      console.log(`   ✓ All step scope references are valid`);

      // Test 8: Verify dependencies
      const stepIds = new Set(validatedPlan.steps.map((s) => s.id));
      const invalidDeps: string[] = [];
      for (const step of validatedPlan.steps) {
        for (const depId of step.dependencies) {
          if (!stepIds.has(depId)) {
            invalidDeps.push(`${step.id} → ${depId}`);
          }
        }
      }
      if (invalidDeps.length > 0) {
        throw new Error(`Found invalid dependencies: ${invalidDeps.join(", ")}`);
      }
      console.log(`   ✓ All step dependencies are valid`);

      // Test 9: Verify limits (if specified)
      if (testCase.args.maxPhases) {
        if (validatedPlan.phases.length > testCase.args.maxPhases) {
          throw new Error(
            `Expected max ${testCase.args.maxPhases} phases, got ${validatedPlan.phases.length}`
          );
        }
        console.log(`   ✓ Phase limit respected: ${validatedPlan.phases.length} <= ${testCase.args.maxPhases}`);
      }

      // Test 10: Generate TOON representation
      const toon = toToonFriendly(validatedPlan);
      if (!toon || toon.length === 0) {
        throw new Error("TOON representation is empty");
      }
      console.log(`   ✓ TOON representation generated (${toon.length} chars)`);

      // Test 11: Determinism check (same goal should produce same plan structure)
      const plan2 = buildTaskPlan(testCase.args);
      if (plan.phases.length !== plan2.phases.length) {
        throw new Error("Plan generation is not deterministic (phase count differs)");
      }
      if (plan.steps.length !== plan2.steps.length) {
        throw new Error("Plan generation is not deterministic (step count differs)");
      }
      console.log(`   ✓ Determinism verified (same goal → same structure)`);

      passed++;
      console.log(`   ✅ Test passed`);
    } catch (error) {
      failed++;
      console.error(`   ❌ Test failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log(`📊 Test Summary:`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Total:  ${passed + failed}`);

  if (failed > 0) {
    console.log("\n❌ Some tests failed!");
    process.exit(1);
  } else {
    console.log("\n✅ All Phase 3 tests passed!");
  }
}

// Run tests
runTests().catch((error) => {
  console.error("Fatal error running tests:", error);
  process.exit(1);
});

