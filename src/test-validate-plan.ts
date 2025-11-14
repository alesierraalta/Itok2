/**
 * Test script for validate_plan tool
 * @module test-validate-plan
 * 
 * Tests the validate_plan functionality with various plans
 * to verify validation, chunking, limits, and metadata generation.
 */

import {
  TaskKind,
  PlanLevel,
  type TaskPlan,
} from "./types/index.js";
import { validateTaskPlan } from "./types/schemas.js";
import { buildTaskPlan } from "./tools/plan-task.js";
import {
  validatePlan,
  validatePlanLevels,
  validatePlanScopes,
  applyDynamicChunking,
  applyGlobalLimits,
} from "./tools/validate-plan.js";

/**
 * Test cases for plan validation
 */
const testCases = [
  {
    name: "Basic validation (no options)",
    goal: "Fix the authentication bug",
    options: {},
  },
  {
    name: "Level correction",
    goal: "Add user dashboard",
    options: {},
    modifyPlan: (plan: TaskPlan) => {
      // Intentionally set wrong level for a step
      const step = plan.steps.find((s) => s.kind === "edit_code");
      if (step) {
        step.level = PlanLevel.Abstract; // Should be Execution
      }
      return plan;
    },
  },
  {
    name: "Scope validation (missing global)",
    goal: "Refactor database code",
    options: {},
    modifyPlan: (plan: TaskPlan) => {
      // Remove global scope
      plan.scopes = plan.scopes.filter((s) => s.kind !== "global");
      return plan;
    },
  },
  {
    name: "Dynamic chunking",
    goal: "Implement authentication system",
    options: {
      maxMicroStepsPerPhase: 2,
    },
  },
  {
    name: "Global limits (phases)",
    goal: "Build complete application",
    options: {
      targetMaxPhases: 2,
    },
  },
  {
    name: "Global limits (steps)",
    goal: "Add multiple features",
    options: {
      targetMaxSteps: 1,
    },
  },
  {
    name: "All options combined",
    goal: "Create complex system",
    options: {
      targetMaxPhases: 2,
      targetMaxSteps: 2,
      maxMicroStepsPerPhase: 1,
    },
  },
];

/**
 * Runs all test cases
 */
async function runTests() {
  console.log("🧪 Testing Phase 4: validate_plan Tool\n");

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    console.log(`\n📋 Test: ${testCase.name}`);
    console.log(`   Goal: "${testCase.goal}"`);

    try {
      // Generate initial plan
      const initialPlan = buildTaskPlan({ goal: testCase.goal });
      let planToValidate = testCase.modifyPlan
        ? testCase.modifyPlan({ ...initialPlan })
        : initialPlan;

      console.log(`   ✓ Initial plan generated (${planToValidate.phases.length} phases, ${planToValidate.steps.length} steps)`);

      // Validate plan
      const result = validatePlan(planToValidate, testCase.options);
      console.log(`   ✓ Plan validated successfully`);

      // Test 1: Result structure
      if (!result.plan || !result.warnings || !result.changes || !result.stats || !result.toon) {
        throw new Error("Result missing required fields");
      }
      console.log(`   ✓ Result structure valid`);

      // Test 2: Optimized plan validation
      const validatedPlan = validateTaskPlan(result.plan);
      console.log(`   ✓ Optimized plan passes Zod validation`);

      // Test 3: Statistics
      console.log(`   - Phases: ${result.stats.phasesBefore} → ${result.stats.phasesAfter}`);
      console.log(`   - Steps: ${result.stats.stepsBefore} → ${result.stats.stepsAfter}`);
      console.log(`   - Chunks created: ${result.stats.chunksCreated}`);
      console.log(`   - Steps merged: ${result.stats.stepsMerged}`);
      console.log(`   - Levels corrected: ${result.stats.levelsCorrected}`);
      console.log(`   - Scopes reassigned: ${result.stats.scopesReassigned}`);

      // Test 4: Changes tracking
      if (result.changes.length > 0) {
        console.log(`   ✓ Changes tracked: ${result.changes.length} changes`);
        result.changes.slice(0, 3).forEach((change) => {
          console.log(`     - ${change.type}: ${change.description}`);
        });
      }

      // Test 5: Warnings
      if (result.warnings.length > 0) {
        console.log(`   ⚠️  Warnings: ${result.warnings.length}`);
        result.warnings.forEach((warning) => {
          console.log(`     - ${warning.type}: ${warning.message}`);
        });
      }

      // Test 6: TOON representation
      if (!result.toon || result.toon.length === 0) {
        throw new Error("TOON representation is empty");
      }
      console.log(`   ✓ TOON representation generated (${result.toon.length} chars)`);

      // Test 7: Phase limit (if specified)
      if (testCase.options.targetMaxPhases) {
        if (result.plan.phases.length > testCase.options.targetMaxPhases) {
          throw new Error(
            `Expected max ${testCase.options.targetMaxPhases} phases, got ${result.plan.phases.length}`
          );
        }
        console.log(`   ✓ Phase limit respected: ${result.plan.phases.length} <= ${testCase.options.targetMaxPhases}`);
      }

      // Test 8: Step limit (if specified)
      if (testCase.options.targetMaxSteps) {
        const stepsPerPhase = result.plan.phases.map((phase) => {
          return result.plan.steps.filter((s) => s.phaseId === phase.id).length;
        });
        const maxSteps = Math.max(...stepsPerPhase);
        if (maxSteps > testCase.options.targetMaxSteps) {
          throw new Error(
            `Expected max ${testCase.options.targetMaxSteps} steps per phase, got ${maxSteps}`
          );
        }
        console.log(`   ✓ Step limit respected: max ${maxSteps} <= ${testCase.options.targetMaxSteps}`);
      }

      // Test 9: Global scope exists
      const hasGlobalScope = result.plan.scopes.some((s) => s.kind === "global");
      if (!hasGlobalScope) {
        throw new Error("Plan missing global scope after validation");
      }
      console.log(`   ✓ Global scope exists`);

      // Test 10: All scope references valid
      const scopeIds = new Set(result.plan.scopes.map((s) => s.id));
      const invalidScopeRefs = result.plan.steps.filter(
        (s) => s.scopeId !== null && !scopeIds.has(s.scopeId)
      );
      if (invalidScopeRefs.length > 0) {
        throw new Error(`Found ${invalidScopeRefs.length} steps with invalid scope references`);
      }
      console.log(`   ✓ All scope references valid`);

      // Test 11: All phase references valid
      const phaseIds = new Set(result.plan.phases.map((p) => p.id));
      const invalidPhaseRefs = result.plan.steps.filter((s) => !phaseIds.has(s.phaseId));
      if (invalidPhaseRefs.length > 0) {
        throw new Error(`Found ${invalidPhaseRefs.length} steps with invalid phase references`);
      }
      console.log(`   ✓ All phase references valid`);

      // Test 12: All dependencies valid
      const stepIds = new Set(result.plan.steps.map((s) => s.id));
      const invalidDeps: string[] = [];
      for (const step of result.plan.steps) {
        for (const depId of step.dependencies) {
          if (!stepIds.has(depId)) {
            invalidDeps.push(`${step.id} → ${depId}`);
          }
        }
      }
      if (invalidDeps.length > 0) {
        throw new Error(`Found invalid dependencies: ${invalidDeps.join(", ")}`);
      }
      console.log(`   ✓ All dependencies valid`);

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
    console.log("\n✅ All Phase 4 tests passed!");
  }
}

// Run tests
runTests().catch((error) => {
  console.error("Fatal error running tests:", error);
  process.exit(1);
});

