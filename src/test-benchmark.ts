/**
 * Test script for benchmark tools validation
 * 
 * Tests benchmark helper functions, scenario definitions, execution tools,
 * and comparison functionality.
 */

import { smallBugfixScenario } from "./scenarios/small-bugfix.js";
import { mediumFeatureScenario } from "./scenarios/medium-feature.js";
import { structuralRefactorScenario } from "./scenarios/structural-refactor.js";
import { allScenarios, getScenarioById, getScenariosByTaskKind } from "./scenarios/index.js";
import { TaskKind } from "./types/index.js";
import {
  calculateTokenReduction,
  calculateTokenReductionAbsolute,
  analyzeResults,
  generateComparisonTable,
  validateBenchmarkResult,
  createBenchmarkResult,
  generateExecutionId,
} from "./tools/benchmark-helpers.js";
import { createBaselineExecution } from "./tools/run-baseline-scenario.js";
import { createExperimentalExecution } from "./tools/run-experimental-scenario.js";
import { compareBenchmarkResults, generateSummaryReport } from "./tools/compare-results.js";
import type { TokenMetrics, ScenarioExecution, BenchmarkResult } from "./types/index.js";

console.log("=".repeat(80));
console.log("Phase 7: Benchmark Tools Test");
console.log("=".repeat(80));
console.log("");

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`   ✓ ${message}`);
    testsPassed++;
  } else {
    console.log(`   ✗ ${message}`);
    testsFailed++;
  }
}

// Test 1: Scenario definitions
console.log("Test 1: Scenario Definitions");
console.log("-".repeat(80));
assert(smallBugfixScenario.id === "small-bugfix-001", "Small bugfix scenario has correct ID");
assert(smallBugfixScenario.taskKind === TaskKind.Bugfix, "Small bugfix scenario has correct taskKind");
assert(smallBugfixScenario.complexity === "low", "Small bugfix scenario has low complexity");
assert(mediumFeatureScenario.id === "medium-feature-001", "Medium feature scenario has correct ID");
assert(mediumFeatureScenario.taskKind === TaskKind.Feature, "Medium feature scenario has correct taskKind");
assert(structuralRefactorScenario.id === "structural-refactor-001", "Structural refactor scenario has correct ID");
assert(structuralRefactorScenario.taskKind === TaskKind.Refactor, "Structural refactor scenario has correct taskKind");
assert(allScenarios.length === 3, "All scenarios array contains 3 scenarios");
console.log("");

// Test 2: Scenario helpers
console.log("Test 2: Scenario Helpers");
console.log("-".repeat(80));
const foundScenario = getScenarioById("small-bugfix-001");
assert(foundScenario !== undefined, "getScenarioById finds scenario by ID");
assert(foundScenario?.id === "small-bugfix-001", "getScenarioById returns correct scenario");
const bugfixScenarios = getScenariosByTaskKind(TaskKind.Bugfix);
assert(bugfixScenarios.length === 1, "getScenariosByTaskKind returns correct count for bugfix");
const featureScenarios = getScenariosByTaskKind(TaskKind.Feature);
assert(featureScenarios.length === 1, "getScenariosByTaskKind returns correct count for feature");
console.log("");

// Test 3: Token reduction calculation
console.log("Test 3: Token Reduction Calculation");
console.log("-".repeat(80));
const baselineMetrics: TokenMetrics = {
  inputTokens: 20000,
  outputTokens: 10000,
  totalTokens: 30000,
  timestamp: new Date().toISOString(),
};
const experimentalMetrics: TokenMetrics = {
  inputTokens: 12000,
  outputTokens: 8000,
  totalTokens: 20000,
  timestamp: new Date().toISOString(),
};
const reduction = calculateTokenReduction(baselineMetrics, experimentalMetrics);
assert(reduction === 33.33, `Token reduction calculation correct: ${reduction}%`);
const absoluteReduction = calculateTokenReductionAbsolute(baselineMetrics, experimentalMetrics);
assert(absoluteReduction === 10000, `Absolute token reduction correct: ${absoluteReduction}`);
console.log("");

// Test 4: Execution ID generation
console.log("Test 4: Execution ID Generation");
console.log("-".repeat(80));
const execId1 = generateExecutionId("test-scenario", "baseline");
// Wait a bit to ensure different timestamp
await new Promise((resolve) => setTimeout(resolve, 10));
const execId2 = generateExecutionId("test-scenario", "baseline");
assert(execId1.startsWith("test-scenario-baseline-"), "Execution ID has correct prefix");
assert(execId1 !== execId2, "Execution IDs are unique");
console.log("");

// Test 5: Baseline execution creation
console.log("Test 5: Baseline Execution Creation");
console.log("-".repeat(80));
const baselineStart = new Date().toISOString();
const baselineEnd = new Date(Date.now() + 8 * 60 * 1000).toISOString();
const baselineExec = createBaselineExecution(
  smallBugfixScenario,
  baselineStart,
  baselineEnd,
  baselineMetrics,
  { keyOperations: ["searched for calculatePrice", "edited pricing.ts"] }
);
assert(baselineExec.executionType === "baseline", "Baseline execution has correct type");
assert(baselineExec.scenarioId === smallBugfixScenario.id, "Baseline execution has correct scenario ID");
assert(baselineExec.tokenMetrics.totalTokens === 30000, "Baseline execution has correct token metrics");
assert(baselineExec.metadata.keyOperations?.length === 2, "Baseline execution has key operations");
console.log("");

// Test 6: Experimental execution creation
console.log("Test 6: Experimental Execution Creation");
console.log("-".repeat(80));
const experimentalStart = new Date().toISOString();
const experimentalEnd = new Date(Date.now() + 6 * 60 * 1000).toISOString();
const experimentalExec = createExperimentalExecution(
  smallBugfixScenario,
  experimentalStart,
  experimentalEnd,
  experimentalMetrics,
  {
    planId: "plan-123",
    stepsExecuted: 8,
    chunksUsed: 12,
    metadata: { keyOperations: ["plan_task", "validate_plan", "execute_step"] },
  }
);
assert(experimentalExec.executionType === "experimental", "Experimental execution has correct type");
assert(experimentalExec.metadata.planId === "plan-123", "Experimental execution has plan ID");
assert(experimentalExec.metadata.stepsExecuted === 8, "Experimental execution has steps executed");
assert(experimentalExec.metadata.chunksUsed === 12, "Experimental execution has chunks used");
console.log("");

// Test 7: Benchmark result creation
console.log("Test 7: Benchmark Result Creation");
console.log("-".repeat(80));
const benchmarkResult = createBenchmarkResult(smallBugfixScenario, baselineExec, experimentalExec);
assert(benchmarkResult.scenario.id === smallBugfixScenario.id, "Benchmark result has correct scenario");
assert(benchmarkResult.tokenReductionPercent === 33.33, "Benchmark result has correct reduction percentage");
assert(benchmarkResult.tokenReductionAbsolute === 10000, "Benchmark result has correct absolute reduction");
assert(benchmarkResult.analysis.meetsSuccessCriteria === true, "Benchmark result meets success criteria (≥30%)");
assert(benchmarkResult.analysis.observations.length > 0, "Benchmark result has observations");
console.log("");

// Test 8: Result analysis
console.log("Test 8: Result Analysis");
console.log("-".repeat(80));
const analysis = analyzeResults(benchmarkResult);
assert(analysis.observations.length > 0, "Analysis generates observations");
assert(analysis.recommendations !== undefined, "Analysis generates recommendations");
assert(
  analysis.observations.some((obs) => obs.includes("Excellent") || obs.includes("Good")),
  "Analysis includes positive observation for ≥30% reduction"
);
console.log("");

// Test 9: Comparison table generation
console.log("Test 9: Comparison Table Generation");
console.log("-".repeat(80));
const comparisonTable = generateComparisonTable(benchmarkResult);
assert(comparisonTable.includes("Benchmark Comparison"), "Comparison table includes title");
assert(comparisonTable.includes("Token Metrics"), "Comparison table includes token metrics");
assert(comparisonTable.includes("33.33"), "Comparison table includes reduction percentage");
assert(comparisonTable.includes("✓ YES"), "Comparison table shows success criteria met");
console.log("");

// Test 10: Result validation
console.log("Test 10: Result Validation");
console.log("-".repeat(80));
const validation = validateBenchmarkResult(benchmarkResult);
assert(validation.valid === true, "Valid benchmark result passes validation");
assert(validation.errors.length === 0, "Valid benchmark result has no errors");
console.log("");

// Test 11: Compare results
console.log("Test 11: Compare Results");
console.log("-".repeat(80));
const comparedResult = compareBenchmarkResults(
  smallBugfixScenario,
  baselineExec,
  experimentalExec,
  {
    validate: true,
    generateReport: false, // Don't print in test
    reportFormat: "json",
  }
);
assert(comparedResult.tokenReductionPercent === 33.33, "Compare results returns correct reduction");
assert(comparedResult.analysis.meetsSuccessCriteria === true, "Compare results correctly identifies success");
console.log("");

// Test 12: Summary report generation
console.log("Test 12: Summary Report Generation");
console.log("-".repeat(80));
const results: BenchmarkResult[] = [benchmarkResult];
const summary = generateSummaryReport(results);
assert(summary.includes("Benchmark Summary Report"), "Summary report includes title");
assert(summary.includes("Overall Statistics"), "Summary report includes overall statistics");
assert(summary.includes("33.33"), "Summary report includes reduction percentage");
console.log("");

// Test 13: Edge cases
console.log("Test 13: Edge Cases");
console.log("-".repeat(80));
// Zero baseline tokens
const zeroBaseline: TokenMetrics = {
  inputTokens: 0,
  outputTokens: 0,
  totalTokens: 0,
  timestamp: new Date().toISOString(),
};
const zeroReduction = calculateTokenReduction(zeroBaseline, experimentalMetrics);
assert(zeroReduction === 0, "Zero baseline tokens returns 0% reduction");
// Negative reduction (experimental uses more)
const negativeReduction = calculateTokenReduction(experimentalMetrics, baselineMetrics);
assert(negativeReduction < 0, "Negative reduction when experimental uses more tokens");
console.log("");

// Final summary
console.log("=".repeat(80));
console.log("Test Summary");
console.log("=".repeat(80));
console.log(`Tests Passed: ${testsPassed}`);
console.log(`Tests Failed: ${testsFailed}`);
console.log(`Total Tests: ${testsPassed + testsFailed}`);
console.log("");

if (testsFailed === 0) {
  console.log("✓ All tests passed!");
  process.exit(0);
} else {
  console.log("✗ Some tests failed!");
  process.exit(1);
}

