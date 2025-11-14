/**
 * Test script for plan execution utilities
 * @module test-plan-execution
 * 
 * Tests the execution utilities: step decision logic, scope translation,
 * status management, and Serena action mapping.
 */

import {
  TaskKind,
  StepStatus,
  type TaskPlan,
} from "./types/index.js";
import { validateTaskPlan } from "./types/schemas.js";
import { buildTaskPlan } from "./tools/plan-task.js";
import {
  getNextExecutableStep,
  getExecutableSteps,
  isStepExecutable,
  markStepInProgress,
  markStepDone,
  markStepBlocked,
  getPlanProgress,
  updateStepStatus,
} from "./tools/execute-plan-helpers.js";
import {
  translateScopeSelector,
  getStepScope,
} from "./tools/scope-resolver.js";
import {
  getSerenaActionsForStep,
} from "./tools/serena-mapper.js";

/**
 * Test cases for execution utilities
 */
const testCases = [
  {
    name: "Get next executable step",
    goal: "Fix authentication bug",
  },
  {
    name: "Step executability check",
    goal: "Add user dashboard",
  },
  {
    name: "Status management",
    goal: "Refactor database code",
  },
  {
    name: "Scope translation",
    goal: "Implement feature",
  },
  {
    name: "Serena action mapping",
    goal: "Create API endpoint",
  },
  {
    name: "Full execution flow",
    goal: "Build complete system",
  },
];

/**
 * Runs all test cases
 */
async function runTests() {
  console.log("🧪 Testing Phase 5: Plan Execution Utilities\n");

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    console.log(`\n📋 Test: ${testCase.name}`);
    console.log(`   Goal: "${testCase.goal}"`);

    try {
      // Generate plan
      const plan = buildTaskPlan({ goal: testCase.name });
      console.log(`   ✓ Plan generated (${plan.phases.length} phases, ${plan.steps.length} steps)`);

      // Test based on test case name
      if (testCase.name === "Get next executable step") {
        // Test 1: Get next executable step
        const nextStep = getNextExecutableStep(plan);
        if (!nextStep) {
          throw new Error("No executable step found");
        }
        console.log(`   ✓ Next executable step: ${nextStep.title} (${nextStep.id})`);
        
        // Verify it's actually executable
        if (!isStepExecutable(nextStep, plan)) {
          throw new Error("Next step is not executable");
        }
        console.log(`   ✓ Step is executable`);

        // Test 2: Get all executable steps
        const executable = getExecutableSteps(plan);
        console.log(`   ✓ Executable steps: ${executable.length}`);
        if (executable.length === 0) {
          throw new Error("No executable steps found");
        }

      } else if (testCase.name === "Step executability check") {
        // Test: Check executability
        const step = plan.steps[0];
        const isExec = isStepExecutable(step, plan);
        console.log(`   ✓ Step "${step.title}" executable: ${isExec}`);
        
        // Mark first step as done, check if second becomes executable
        if (plan.steps.length > 1) {
          let updatedPlan = markStepDone(plan, step.id);
          const secondStep = plan.steps[1];
          const isExecAfter = isStepExecutable(secondStep, updatedPlan);
          console.log(`   ✓ After marking first step done, second step executable: ${isExecAfter}`);
        }

      } else if (testCase.name === "Status management") {
        // Test: Status management
        const step = plan.steps[0];
        
        // Mark as in_progress
        let updatedPlan = markStepInProgress(plan, step.id);
        const inProgressStep = updatedPlan.steps.find((s) => s.id === step.id);
        if (inProgressStep?.status !== StepStatus.InProgress) {
          throw new Error("Step not marked as in_progress");
        }
        console.log(`   ✓ Step marked as in_progress`);

        // Mark as done
        updatedPlan = markStepDone(updatedPlan, step.id);
        const doneStep = updatedPlan.steps.find((s) => s.id === step.id);
        if (doneStep?.status !== StepStatus.Done) {
          throw new Error("Step not marked as done");
        }
        console.log(`   ✓ Step marked as done`);

        // Mark as blocked
        updatedPlan = markStepBlocked(updatedPlan, step.id, "Test block reason");
        const blockedStep = updatedPlan.steps.find((s) => s.id === step.id);
        if (blockedStep?.status !== StepStatus.Blocked) {
          throw new Error("Step not marked as blocked");
        }
        console.log(`   ✓ Step marked as blocked`);

        // Test updateStepStatus directly
        updatedPlan = updateStepStatus(updatedPlan, step.id, StepStatus.Todo);
        const todoStep = updatedPlan.steps.find((s) => s.id === step.id);
        if (todoStep?.status !== StepStatus.Todo) {
          throw new Error("Step not marked as todo");
        }
        console.log(`   ✓ Step status updated directly`);

      } else if (testCase.name === "Scope translation") {
        // Test: Scope translation
        for (const scope of plan.scopes) {
          const resolution = translateScopeSelector(scope);
          console.log(`   ✓ Scope "${scope.label}": ${resolution.resolutionType}`);
          console.log(`     Instructions: ${resolution.instructions}`);
          
          // Verify resolution structure
          if (!resolution.scope || !resolution.resolutionType || !resolution.instructions) {
            throw new Error("Invalid scope resolution structure");
          }
        }

        // Test getStepScope
        const step = plan.steps[0];
        const stepScope = getStepScope(step, plan);
        if (step.scopeId && !stepScope) {
          throw new Error("Step scope not found");
        }
        console.log(`   ✓ Step scope resolved: ${stepScope ? stepScope.label : "null"}`);

      } else if (testCase.name === "Serena action mapping") {
        // Test: Serena action mapping
        for (const step of plan.steps.slice(0, 3)) {
          const scope = getStepScope(step, plan);
          const actions = getSerenaActionsForStep(step, scope, plan);
          console.log(`   ✓ Step "${step.title}": ${actions.length} Serena actions`);
          
          if (actions.length === 0) {
            throw new Error(`No Serena actions for step ${step.kind}`);
          }
          
          // Verify action structure
          for (const action of actions) {
            if (!action.tool || !action.description) {
              throw new Error("Invalid Serena action structure");
            }
          }
        }

      } else if (testCase.name === "Full execution flow") {
        // Test: Full execution flow
        let currentPlan = plan;
        const progressBefore = getPlanProgress(currentPlan);
        console.log(`   ✓ Initial progress: ${progressBefore.done}/${progressBefore.total} (${progressBefore.percentage}%)`);

        // Execute first step
        const firstStep = getNextExecutableStep(currentPlan);
        if (!firstStep) {
          throw new Error("No executable step found");
        }

        currentPlan = markStepInProgress(currentPlan, firstStep.id);
        const scope = getStepScope(firstStep, currentPlan);
        const actions = getSerenaActionsForStep(firstStep, scope, currentPlan);
        console.log(`   ✓ Executing step: ${firstStep.title}`);
        console.log(`     Actions: ${actions.length}`);
        
        // Simulate execution
        currentPlan = markStepDone(currentPlan, firstStep.id);
        
        const progressAfter = getPlanProgress(currentPlan);
        console.log(`   ✓ Progress after: ${progressAfter.done}/${progressAfter.total} (${progressAfter.percentage}%)`);
        
        if (progressAfter.done !== progressBefore.done + 1) {
          throw new Error("Progress not updated correctly");
        }

        // Check if next step is now executable
        const nextStep = getNextExecutableStep(currentPlan);
        if (nextStep) {
          console.log(`   ✓ Next step available: ${nextStep.title}`);
        }
      }

      // Validate plan after operations
      const validatedPlan = validateTaskPlan(plan);
      console.log(`   ✓ Plan validation passed`);

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
    console.log("\n✅ All Phase 5 tests passed!");
  }
}

// Run tests
runTests().catch((error) => {
  console.error("Fatal error running tests:", error);
  process.exit(1);
});

