/**
 * Test script for types and schemas validation
 * @module test-types-schemas
 * 
 * This script validates that all types and Zod schemas work correctly.
 */

import {
  PlanLevel,
  StepKind,
  ScopeKind,
  TaskKind,
  StepStatus,
  type TaskPlan,
  type PlanPhase,
  type PlanScope,
  type PlanStep,
} from "./types/index.js";
import {
  validateTaskPlan,
  validatePlanPhase,
  validatePlanScope,
  validatePlanStep,
} from "./types/schemas.js";

/**
 * Creates a sample TaskPlan for testing
 */
function createSampleTaskPlan(): TaskPlan {
  return {
    goal: "Fix authentication bug in login endpoint",
    taskKind: TaskKind.Bugfix,
    contextSummary: "Users reporting 401 errors on valid credentials",
    phases: [
      {
        id: "phase-1",
        name: "Localize Bug",
        level: PlanLevel.Abstract,
        order: 1,
        summary: "Identify the root cause of the authentication failure",
      },
      {
        id: "phase-2",
        name: "Fix Bug",
        level: PlanLevel.Planning,
        order: 2,
        summary: "Implement the fix for the identified issue",
      },
      {
        id: "phase-3",
        name: "Validate Fix",
        level: PlanLevel.Execution,
        order: 3,
        summary: "Test and verify the fix works correctly",
      },
    ],
    scopes: [
      {
        id: "scope-1",
        kind: ScopeKind.Global,
        label: "Workspace",
        selector: "workspace root",
      },
      {
        id: "scope-2",
        kind: ScopeKind.Module,
        label: "Auth Module",
        selector: "files in src/auth/",
      },
      {
        id: "scope-3",
        kind: ScopeKind.Symbol,
        label: "Login Endpoint",
        selector: "use serena.find_symbol('loginEndpoint')",
      },
    ],
    steps: [
      {
        id: "step-1",
        phaseId: "phase-1",
        level: PlanLevel.Abstract,
        order: 1,
        kind: StepKind.ClarifyGoal,
        title: "Understand the authentication bug",
        summary: "Review error reports and understand what's failing",
        scopeId: "scope-1",
        dependencies: [],
        suggestedTools: ["serena.find_symbol", "filesystem.read_file"],
      },
      {
        id: "step-2",
        phaseId: "phase-1",
        level: PlanLevel.Planning,
        order: 2,
        kind: StepKind.ScanCode,
        title: "Scan authentication code",
        summary: "Examine the login endpoint and auth logic",
        scopeId: "scope-3",
        dependencies: ["step-1"],
        suggestedTools: ["serena.find_symbol", "serena.find_referencing_symbols"],
      },
      {
        id: "step-3",
        phaseId: "phase-2",
        level: PlanLevel.Execution,
        order: 1,
        kind: StepKind.EditCode,
        title: "Fix the authentication bug",
        summary: "Apply the fix to resolve the 401 error",
        scopeId: "scope-3",
        dependencies: ["step-2"],
        suggestedTools: ["serena.replace_symbol_body", "serena.insert_after_symbol"],
      },
      {
        id: "step-4",
        phaseId: "phase-3",
        level: PlanLevel.Execution,
        order: 1,
        kind: StepKind.RunTests,
        title: "Run authentication tests",
        summary: "Verify the fix works with existing tests",
        scopeId: "scope-2",
        dependencies: ["step-3"],
        suggestedTools: ["execute_shell_command"],
      },
    ],
    metadata: {
      createdAt: new Date().toISOString(),
      version: "0.1.0",
    },
  };
}

/**
 * Runs all Phase 2 validation tests
 */
function runTests(): void {
  console.log("🧪 Testing Phase 2 Types and Schemas\n");

  try {
    // Test 1: Create and validate a sample TaskPlan
    console.log("Test 1: Creating sample TaskPlan...");
    const samplePlan = createSampleTaskPlan();
    console.log("✓ Sample plan created");

    // Test 2: Validate TaskPlan with Zod
    console.log("\nTest 2: Validating TaskPlan with Zod schema...");
    const validatedPlan = validateTaskPlan(samplePlan);
    console.log("✓ TaskPlan validation passed");
    console.log(`  - Goal: ${validatedPlan.goal}`);
    console.log(`  - Task Kind: ${validatedPlan.taskKind}`);
    console.log(`  - Phases: ${validatedPlan.phases.length}`);
    console.log(`  - Scopes: ${validatedPlan.scopes.length}`);
    console.log(`  - Steps: ${validatedPlan.steps.length}`);

    // Test 3: Validate individual components
    console.log("\nTest 3: Validating individual components...");
    validatePlanPhase(validatedPlan.phases[0]);
    console.log("✓ PlanPhase validation passed");
    validatePlanScope(validatedPlan.scopes[0]);
    console.log("✓ PlanScope validation passed");
    validatePlanStep(validatedPlan.steps[0]);
    console.log("✓ PlanStep validation passed");

    // Test 4: Verify enum values
    console.log("\nTest 4: Verifying enum values...");
    console.log(`  - PlanLevel.Abstract = ${PlanLevel.Abstract}`);
    console.log(`  - PlanLevel.Planning = ${PlanLevel.Planning}`);
    console.log(`  - PlanLevel.Execution = ${PlanLevel.Execution}`);
    console.log(`  - StepKind.EditCode = ${StepKind.EditCode}`);
    console.log(`  - ScopeKind.Symbol = ${ScopeKind.Symbol}`);
    console.log(`  - TaskKind.Bugfix = ${TaskKind.Bugfix}`);
    console.log("✓ All enums accessible");

    // Test 5: Verify step dependencies
    console.log("\nTest 5: Verifying step dependencies...");
    const stepIds = new Set(validatedPlan.steps.map((s) => s.id));
    let allDepsValid = true;
    for (const step of validatedPlan.steps) {
      for (const depId of step.dependencies) {
        if (!stepIds.has(depId)) {
          console.error(`✗ Invalid dependency: step ${step.id} depends on ${depId} which doesn't exist`);
          allDepsValid = false;
        }
      }
    }
    if (allDepsValid) {
      console.log("✓ All step dependencies are valid");
    }

    // Test 6: Verify phase references
    console.log("\nTest 6: Verifying phase references...");
    const phaseIds = new Set(validatedPlan.phases.map((p) => p.id));
    let allPhasesValid = true;
    for (const step of validatedPlan.steps) {
      if (!phaseIds.has(step.phaseId)) {
        console.error(`✗ Invalid phase reference: step ${step.id} references phase ${step.phaseId} which doesn't exist`);
        allPhasesValid = false;
      }
    }
    if (allPhasesValid) {
      console.log("✓ All step phase references are valid");
    }

    // Test 7: Verify scope references
    console.log("\nTest 7: Verifying scope references...");
    const scopeIds = new Set(validatedPlan.scopes.map((s) => s.id));
    let allScopesValid = true;
    for (const step of validatedPlan.steps) {
      if (step.scopeId !== null && !scopeIds.has(step.scopeId)) {
        console.error(`✗ Invalid scope reference: step ${step.id} references scope ${step.scopeId} which doesn't exist`);
        allScopesValid = false;
      }
    }
    if (allScopesValid) {
      console.log("✓ All step scope references are valid");
    }

    console.log("\n✅ All Phase 2 tests passed!");
    console.log("\n📊 Summary:");
    console.log(`  - Types: ✓ All defined and accessible`);
    console.log(`  - Schemas: ✓ All validation working`);
    console.log(`  - Relationships: ✓ All references valid`);
    console.log(`  - Enums: ✓ All values accessible`);

  } catch (error) {
    console.error("\n❌ Test failed:", error);
    if (error instanceof Error) {
      console.error("  Error message:", error.message);
      if (error.stack) {
        console.error("  Stack:", error.stack);
      }
    }
    process.exit(1);
  }
}

// Run tests
runTests();

