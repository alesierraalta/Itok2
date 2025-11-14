/**
 * Helper functions for benchmark analysis and comparison.
 * 
 * Provides utilities for calculating token reduction, analyzing results,
 * generating comparison tables, and validating benchmark results.
 */

import {
  type BenchmarkResult,
  type ScenarioExecution,
  type TokenMetrics,
} from "../types/index.js";

/**
 * Calculates token reduction percentage between baseline and experimental executions.
 * 
 * Formula: (TotalBASE - TotalItok) / TotalBASE × 100
 * 
 * @param baseline - Baseline execution token metrics
 * @param experimental - Experimental execution token metrics
 * @returns Token reduction percentage (positive = reduction, negative = increase)
 */
export function calculateTokenReduction(
  baseline: TokenMetrics,
  experimental: TokenMetrics
): number {
  if (baseline.totalTokens === 0) {
    return 0;
  }
  const reduction = ((baseline.totalTokens - experimental.totalTokens) / baseline.totalTokens) * 100;
  return Math.round(reduction * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculates absolute token reduction.
 * 
 * @param baseline - Baseline execution token metrics
 * @param experimental - Experimental execution token metrics
 * @returns Absolute token reduction (positive = reduction, negative = increase)
 */
export function calculateTokenReductionAbsolute(
  baseline: TokenMetrics,
  experimental: TokenMetrics
): number {
  return baseline.totalTokens - experimental.totalTokens;
}

/**
 * Analyzes benchmark results and generates observations and recommendations.
 * 
 * @param result - Benchmark result to analyze
 * @returns Analysis with observations and recommendations
 */
export function analyzeResults(result: BenchmarkResult): {
  observations: string[];
  recommendations: string[];
} {
  const observations: string[] = [];
  const recommendations: string[] = [];

  const reduction = result.tokenReductionPercent;
  const meetsCriteria = result.analysis.meetsSuccessCriteria;

  // Token reduction analysis
  if (reduction >= 30) {
    observations.push(`Excellent token reduction: ${reduction.toFixed(2)}% (meets ≥30% criteria)`);
  } else if (reduction >= 20) {
    observations.push(`Good token reduction: ${reduction.toFixed(2)}% (close to 30% target)`);
    recommendations.push("Consider adjusting targetMaxSteps or targetMaxPhases to further reduce tokens");
  } else if (reduction >= 10) {
    observations.push(`Moderate token reduction: ${reduction.toFixed(2)}% (below 30% target)`);
    recommendations.push("Review plan compression settings (targetMaxSteps, targetMaxPhases, maxMicroStepsPerPhase)");
    recommendations.push("Consider reducing chunk limits to minimize context");
  } else if (reduction > 0) {
    observations.push(`Minimal token reduction: ${reduction.toFixed(2)}% (significantly below 30% target)`);
    recommendations.push("Significantly reduce targetMaxSteps and targetMaxPhases for more aggressive compression");
    recommendations.push("Reduce maxChunksPerStep to limit context per step");
    recommendations.push("Review plan generation to ensure steps are properly chunked");
  } else {
    observations.push(`Token increase: ${Math.abs(reduction).toFixed(2)}% (experimental used more tokens than baseline)`);
    recommendations.push("Critical: Experimental approach is using more tokens. Review plan structure and chunking strategy");
    recommendations.push("Consider if plan is too granular or if chunking is not effective");
    recommendations.push("Verify that Serena tools are being used correctly to minimize token usage");
  }

  // Time analysis
  const timeDiffMinutes = result.timeDifferenceMs / (1000 * 60);
  if (timeDiffMinutes > 10) {
    observations.push(`Experimental took ${timeDiffMinutes.toFixed(1)} minutes longer than baseline`);
    recommendations.push("Consider if additional time is acceptable trade-off for token reduction");
  } else if (timeDiffMinutes < -5) {
    observations.push(`Experimental was ${Math.abs(timeDiffMinutes).toFixed(1)} minutes faster than baseline`);
  }

  // Success rate analysis
  if (result.experimental.metadata.success && !result.baseline.metadata.success) {
    observations.push("Experimental execution succeeded while baseline failed");
  } else if (!result.experimental.metadata.success && result.baseline.metadata.success) {
    observations.push("Warning: Experimental execution failed while baseline succeeded");
    recommendations.push("Review experimental execution process and error handling");
  }

  // Steps and chunks analysis (if available)
  if (result.experimental.metadata.stepsExecuted !== undefined) {
    observations.push(`Experimental used ${result.experimental.metadata.stepsExecuted} steps`);
  }
  if (result.experimental.metadata.chunksUsed !== undefined) {
    observations.push(`Experimental used ${result.experimental.metadata.chunksUsed} chunks`);
  }

  // Task type specific observations
  const taskKind = result.scenario.taskKind;
  if (taskKind === "bugfix" && reduction < 20) {
    recommendations.push("For bugfix tasks, consider more aggressive scope limiting");
  } else if (taskKind === "refactor" && reduction < 30) {
    recommendations.push("For refactor tasks, ensure proper chunking of large code sections");
  } else if (taskKind === "feature" && reduction < 25) {
    recommendations.push("For feature tasks, review if plan phases are optimally structured");
  }

  return { observations, recommendations };
}

/**
 * Generates a comparison table as a formatted string.
 * 
 * @param result - Benchmark result to generate table for
 * @returns Formatted comparison table string
 */
export function generateComparisonTable(result: BenchmarkResult): string {
  const lines: string[] = [];

  lines.push("=".repeat(80));
  lines.push(`Benchmark Comparison: ${result.scenario.name}`);
  lines.push("=".repeat(80));
  lines.push("");

  // Scenario info
  lines.push(`Scenario: ${result.scenario.description}`);
  lines.push(`Task Type: ${result.scenario.taskKind}`);
  lines.push(`Complexity: ${result.scenario.complexity}`);
  lines.push("");

  // Token metrics comparison
  lines.push("Token Metrics:");
  lines.push("-".repeat(80));
  lines.push(
    `  Input Tokens:  ${result.baseline.tokenMetrics.inputTokens.toString().padStart(10)} → ${result.experimental.tokenMetrics.inputTokens.toString().padStart(10)} (${((result.experimental.tokenMetrics.inputTokens - result.baseline.tokenMetrics.inputTokens) / result.baseline.tokenMetrics.inputTokens * 100).toFixed(2)}%)`
  );
  lines.push(
    `  Output Tokens: ${result.baseline.tokenMetrics.outputTokens.toString().padStart(10)} → ${result.experimental.tokenMetrics.outputTokens.toString().padStart(10)} (${((result.experimental.tokenMetrics.outputTokens - result.baseline.tokenMetrics.outputTokens) / result.baseline.tokenMetrics.outputTokens * 100).toFixed(2)}%)`
  );
  lines.push(
    `  Total Tokens:  ${result.baseline.tokenMetrics.totalTokens.toString().padStart(10)} → ${result.experimental.tokenMetrics.totalTokens.toString().padStart(10)} (${result.tokenReductionPercent.toFixed(2)}% reduction)`
  );
  lines.push("");

  // Time comparison
  const baselineMinutes = (result.baseline.durationMs / (1000 * 60)).toFixed(1);
  const experimentalMinutes = (result.experimental.durationMs / (1000 * 60)).toFixed(1);
  const timeDiffMinutes = (result.timeDifferenceMs / (1000 * 60)).toFixed(1);
  lines.push("Execution Time:");
  lines.push("-".repeat(80));
  lines.push(`  Baseline:     ${baselineMinutes.padStart(10)} minutes`);
  lines.push(`  Experimental: ${experimentalMinutes.padStart(10)} minutes`);
  lines.push(`  Difference:  ${timeDiffMinutes.padStart(10)} minutes`);
  lines.push("");

  // Summary
  lines.push("Summary:");
  lines.push("-".repeat(80));
  lines.push(`  Token Reduction: ${result.tokenReductionPercent.toFixed(2)}%`);
  lines.push(`  Absolute Reduction: ${result.tokenReductionAbsolute} tokens`);
  lines.push(`  Meets Success Criteria (≥30%): ${result.analysis.meetsSuccessCriteria ? "✓ YES" : "✗ NO"}`);
  lines.push("");

  // Analysis
  if (result.analysis.observations.length > 0) {
    lines.push("Observations:");
    lines.push("-".repeat(80));
    result.analysis.observations.forEach((obs) => {
      lines.push(`  • ${obs}`);
    });
    lines.push("");
  }

  if (result.analysis.recommendations && result.analysis.recommendations.length > 0) {
    lines.push("Recommendations:");
    lines.push("-".repeat(80));
    result.analysis.recommendations.forEach((rec) => {
      lines.push(`  • ${rec}`);
    });
    lines.push("");
  }

  lines.push("=".repeat(80));

  return lines.join("\n");
}

/**
 * Validates a benchmark result to ensure it's complete and consistent.
 * 
 * @param result - Benchmark result to validate
 * @returns Validation result with errors and warnings
 */
export function validateBenchmarkResult(result: BenchmarkResult): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check scenario
  if (!result.scenario.id || !result.scenario.name || !result.scenario.goal) {
    errors.push("Scenario is missing required fields (id, name, or goal)");
  }

  // Check baseline
  if (!result.baseline.id || !result.baseline.scenarioId) {
    errors.push("Baseline execution is missing required fields (id or scenarioId)");
  }
  if (result.baseline.executionType !== "baseline") {
    errors.push("Baseline execution type must be 'baseline'");
  }
  if (result.baseline.tokenMetrics.totalTokens <= 0) {
    warnings.push("Baseline total tokens is 0 or negative - may indicate measurement issue");
  }

  // Check experimental
  if (!result.experimental.id || !result.experimental.scenarioId) {
    errors.push("Experimental execution is missing required fields (id or scenarioId)");
  }
  if (result.experimental.executionType !== "experimental") {
    errors.push("Experimental execution type must be 'experimental'");
  }
  if (result.experimental.tokenMetrics.totalTokens <= 0) {
    warnings.push("Experimental total tokens is 0 or negative - may indicate measurement issue");
  }

  // Check scenario ID consistency
  if (result.baseline.scenarioId !== result.scenario.id) {
    errors.push("Baseline scenarioId does not match scenario.id");
  }
  if (result.experimental.scenarioId !== result.scenario.id) {
    errors.push("Experimental scenarioId does not match scenario.id");
  }

  // Check timestamps
  if (result.baseline.startTime >= result.baseline.endTime) {
    errors.push("Baseline startTime must be before endTime");
  }
  if (result.experimental.startTime >= result.experimental.endTime) {
    errors.push("Experimental startTime must be before endTime");
  }

  // Check calculated values
  const expectedReduction = calculateTokenReduction(
    result.baseline.tokenMetrics,
    result.experimental.tokenMetrics
  );
  if (Math.abs(result.tokenReductionPercent - expectedReduction) > 0.01) {
    errors.push(
      `Token reduction percentage mismatch: expected ${expectedReduction}, got ${result.tokenReductionPercent}`
    );
  }

  const expectedAbsolute = calculateTokenReductionAbsolute(
    result.baseline.tokenMetrics,
    result.experimental.tokenMetrics
  );
  if (result.tokenReductionAbsolute !== expectedAbsolute) {
    errors.push(
      `Token reduction absolute mismatch: expected ${expectedAbsolute}, got ${result.tokenReductionAbsolute}`
    );
  }

  // Check analysis
  if (!result.analysis.observations || result.analysis.observations.length === 0) {
    warnings.push("No observations in analysis - consider running analyzeResults()");
  }

  // Check success criteria
  const expectedMeetsCriteria = result.tokenReductionPercent >= 30;
  if (result.analysis.meetsSuccessCriteria !== expectedMeetsCriteria) {
    warnings.push(
      `Success criteria flag may be incorrect: ${result.tokenReductionPercent}% ${expectedMeetsCriteria ? "meets" : "does not meet"} ≥30% criteria`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Generates a unique execution ID.
 * 
 * @param scenarioId - Scenario identifier
 * @param executionType - Type of execution (baseline or experimental)
 * @returns Unique execution ID
 */
export function generateExecutionId(
  scenarioId: string,
  executionType: "baseline" | "experimental"
): string {
  const timestamp = Date.now();
  return `${scenarioId}-${executionType}-${timestamp}`;
}

/**
 * Creates a BenchmarkResult from baseline and experimental executions.
 * 
 * @param scenario - Benchmark scenario
 * @param baseline - Baseline execution
 * @param experimental - Experimental execution
 * @returns Complete benchmark result with analysis
 */
export function createBenchmarkResult(
  scenario: BenchmarkResult["scenario"],
  baseline: ScenarioExecution,
  experimental: ScenarioExecution
): BenchmarkResult {
  const tokenReductionPercent = calculateTokenReduction(
    baseline.tokenMetrics,
    experimental.tokenMetrics
  );
  const tokenReductionAbsolute = calculateTokenReductionAbsolute(
    baseline.tokenMetrics,
    experimental.tokenMetrics
  );
  const timeDifferenceMs = experimental.durationMs - baseline.durationMs;
  const meetsSuccessCriteria = tokenReductionPercent >= 30;

  const analysis = analyzeResults({
    scenario,
    baseline,
    experimental,
    tokenReductionPercent,
    tokenReductionAbsolute,
    timeDifferenceMs,
    analysis: { meetsSuccessCriteria: false, observations: [] },
  });

  return {
    scenario,
    baseline,
    experimental,
    tokenReductionPercent,
    tokenReductionAbsolute,
    timeDifferenceMs,
    analysis: {
      meetsSuccessCriteria,
      observations: analysis.observations,
      recommendations: analysis.recommendations,
    },
  };
}

