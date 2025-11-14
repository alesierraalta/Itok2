/**
 * Benchmark results comparison tool.
 * 
 * Compares baseline and experimental execution results, generates comparison reports,
 * and calculates statistics for benchmark analysis.
 */

import {
  type BenchmarkResult,
  type BenchmarkScenario,
  type ScenarioExecution,
} from "../types/index.js";
import {
  createBenchmarkResult,
  generateComparisonTable,
  validateBenchmarkResult,
  analyzeResults,
} from "./benchmark-helpers.js";

/**
 * Options for comparing benchmark results.
 */
export interface CompareResultsOptions {
  /** Whether to validate results before comparison */
  validate?: boolean;
  /** Whether to generate a detailed report */
  generateReport?: boolean;
  /** Output format for the report */
  reportFormat?: "text" | "json" | "both";
}

/**
 * Compares baseline and experimental execution results.
 * 
 * Creates a BenchmarkResult with analysis, validation, and comparison metrics.
 * 
 * @param scenario - Benchmark scenario that was executed
 * @param baseline - Baseline execution result
 * @param experimental - Experimental execution result
 * @param options - Comparison options
 * @returns Benchmark result with comparison and analysis
 */
export function compareBenchmarkResults(
  scenario: BenchmarkScenario,
  baseline: ScenarioExecution,
  experimental: ScenarioExecution,
  options: CompareResultsOptions = {}
): BenchmarkResult {
  const {
    validate = true,
    generateReport = true,
    reportFormat = "both",
  } = options;

  // Create benchmark result
  const result = createBenchmarkResult(scenario, baseline, experimental);

  // Validate if requested
  if (validate) {
    const validation = validateBenchmarkResult(result);
    if (!validation.valid) {
      console.warn("Benchmark result validation failed:");
      validation.errors.forEach((error) => {
        console.warn(`  - ${error}`);
      });
    }
    if (validation.warnings.length > 0) {
      console.warn("Benchmark result validation warnings:");
      validation.warnings.forEach((warning) => {
        console.warn(`  - ${warning}`);
      });
    }
  }

  // Generate report if requested
  if (generateReport) {
    if (reportFormat === "text" || reportFormat === "both") {
      const report = generateComparisonTable(result);
      console.log(report);
    }
    if (reportFormat === "json" || reportFormat === "both") {
      console.log("\nJSON Report:");
      console.log(JSON.stringify(result, null, 2));
    }
  }

  return result;
}

/**
 * Generates a summary report for multiple benchmark results.
 * 
 * @param results - Array of benchmark results
 * @returns Summary report string
 */
export function generateSummaryReport(results: BenchmarkResult[]): string {
  const lines: string[] = [];

  lines.push("=".repeat(80));
  lines.push("Benchmark Summary Report");
  lines.push("=".repeat(80));
  lines.push("");

  if (results.length === 0) {
    lines.push("No benchmark results to summarize.");
    lines.push("");
    return lines.join("\n");
  }

  // Overall statistics
  const avgReduction = results.reduce((sum, r) => sum + r.tokenReductionPercent, 0) / results.length;
  const minReduction = Math.min(...results.map((r) => r.tokenReductionPercent));
  const maxReduction = Math.max(...results.map((r) => r.tokenReductionPercent));
  const meetsCriteriaCount = results.filter((r) => r.analysis.meetsSuccessCriteria).length;
  const meetsCriteriaPercent = (meetsCriteriaCount / results.length) * 100;

  lines.push("Overall Statistics:");
  lines.push("-".repeat(80));
  lines.push(`  Total Benchmarks: ${results.length}`);
  lines.push(`  Average Token Reduction: ${avgReduction.toFixed(2)}%`);
  lines.push(`  Min Token Reduction: ${minReduction.toFixed(2)}%`);
  lines.push(`  Max Token Reduction: ${maxReduction.toFixed(2)}%`);
  lines.push(`  Benchmarks Meeting Criteria (≥30%): ${meetsCriteriaCount}/${results.length} (${meetsCriteriaPercent.toFixed(1)}%)`);
  lines.push("");

  // Statistics by task type
  const byTaskKind = new Map<string, BenchmarkResult[]>();
  results.forEach((result) => {
    const kind = result.scenario.taskKind;
    if (!byTaskKind.has(kind)) {
      byTaskKind.set(kind, []);
    }
    byTaskKind.get(kind)!.push(result);
  });

  lines.push("Statistics by Task Type:");
  lines.push("-".repeat(80));
  for (const [kind, kindResults] of byTaskKind.entries()) {
    const kindAvg = kindResults.reduce((sum, r) => sum + r.tokenReductionPercent, 0) / kindResults.length;
    const kindMeets = kindResults.filter((r) => r.analysis.meetsSuccessCriteria).length;
    lines.push(`  ${kind}:`);
    lines.push(`    Count: ${kindResults.length}`);
    lines.push(`    Average Reduction: ${kindAvg.toFixed(2)}%`);
    lines.push(`    Meeting Criteria: ${kindMeets}/${kindResults.length}`);
  }
  lines.push("");

  // Individual results
  lines.push("Individual Results:");
  lines.push("-".repeat(80));
  results.forEach((result, index) => {
    lines.push(`${index + 1}. ${result.scenario.name}`);
    lines.push(`   Reduction: ${result.tokenReductionPercent.toFixed(2)}%`);
    lines.push(`   Meets Criteria: ${result.analysis.meetsSuccessCriteria ? "✓" : "✗"}`);
    lines.push(`   Baseline Tokens: ${result.baseline.tokenMetrics.totalTokens}`);
    lines.push(`   Experimental Tokens: ${result.experimental.tokenMetrics.totalTokens}`);
    lines.push("");
  });

  lines.push("=".repeat(80));

  return lines.join("\n");
}

/**
 * Exports benchmark results to a file.
 * 
 * @param results - Array of benchmark results
 * @param filePath - Path to output file
 * @param format - Output format (json or text)
 */
export async function exportResults(
  results: BenchmarkResult[],
  filePath: string,
  format: "json" | "text" = "json"
): Promise<void> {
  const fs = await import("fs/promises");

  let content: string;
  if (format === "json") {
    content = JSON.stringify(results, null, 2);
  } else {
    const summary = generateSummaryReport(results);
    const details = results.map((r) => generateComparisonTable(r)).join("\n\n");
    content = summary + "\n\n" + details;
  }

  await fs.writeFile(filePath, content, "utf-8");
  console.log(`Results exported to ${filePath}`);
}

/**
 * Loads benchmark results from a file.
 * 
 * @param filePath - Path to input file
 * @returns Array of benchmark results
 */
export async function loadResults(filePath: string): Promise<BenchmarkResult[]> {
  const fs = await import("fs/promises");
  const content = await fs.readFile(filePath, "utf-8");
  const results = JSON.parse(content) as BenchmarkResult[];
  return results;
}

