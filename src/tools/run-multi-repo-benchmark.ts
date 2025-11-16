/**
 * Multi-repository benchmark runner.
 * 
 * Executes the same base scenario across multiple repositories in both
 * baseline and experimental modes, collecting metrics for comparison.
 * 
 * @module tools/run-multi-repo-benchmark
 */

import {
  type BenchmarkScenario,
  type MultiRepoBenchmarkResult,
  type ScenarioExecution,
  type TokenMetrics,
} from "../types/index.js";
import { adaptScenarioForRepository } from "../scenarios/scenario-adapters.js";
import {
  runBaselineScenario,
  type RunBaselineScenarioOptions,
} from "./run-baseline-scenario.js";
import {
  runExperimentalScenario,
  type RunExperimentalScenarioOptions,
} from "./run-experimental-scenario.js";

/**
 * Options for running a multi-repository benchmark.
 */
export interface RunMultiRepoBenchmarkOptions {
  /** Whether to prompt for token metrics interactively */
  interactive?: boolean;
  /** Whether to provide instructions for project activation */
  activateProjects?: boolean;
  /** Additional metadata to include in all executions */
  metadata?: {
    keyOperations?: string[];
    notes?: string;
  };
}

/**
 * Runs a benchmark scenario across multiple repositories.
 * 
 * For each repository:
 * 1. Adapts the base scenario to the repository structure
 * 2. Runs baseline execution (if "baseline" is in modes)
 * 3. Runs experimental execution (if "experimental" is in modes)
 * 4. Calculates token reduction metrics
 * 
 * @param scenarioBase - Base scenario to adapt and run
 * @param repositories - Array of repository identifiers (e.g., ["itok", "pytodo", "flasktodo"])
 * @param modes - Execution modes to run ("baseline", "experimental", or both)
 * @param options - Execution options
 * @returns Multi-repository benchmark result with all metrics
 */
export async function runMultiRepoBenchmark(
  scenarioBase: BenchmarkScenario,
  repositories: string[],
  modes: ("baseline" | "experimental")[],
  options: RunMultiRepoBenchmarkOptions = {}
): Promise<MultiRepoBenchmarkResult> {
  const results: MultiRepoBenchmarkResult["results"] = [];
  const startTime = new Date().toISOString();

  console.log("=".repeat(80));
  console.log("Multi-Repository Benchmark");
  console.log("=".repeat(80));
  console.log("");
  console.log(`Base Scenario: ${scenarioBase.name}`);
  console.log(`Repositories: ${repositories.join(", ")}`);
  console.log(`Modes: ${modes.join(", ")}`);
  console.log(`Start Time: ${startTime}`);
  console.log("");

  // Process each repository
  for (const repository of repositories) {
    console.log("=".repeat(80));
    console.log(`Repository: ${repository}`);
    console.log("=".repeat(80));
    console.log("");

    // Adapt scenario for this repository
    const adaptedScenario = adaptScenarioForRepository(scenarioBase, repository);
    console.log(`Adapted Goal: ${adaptedScenario.goal}`);
    if (adaptedScenario.context) {
      console.log(`Context: ${adaptedScenario.context}`);
    }
    console.log("");

    const repoResult: MultiRepoBenchmarkResult["results"][0] = {
      repository,
      baseline: undefined,
      experimental: undefined,
      tokenReduction: undefined,
    };

    // Run baseline if requested
    if (modes.includes("baseline")) {
      console.log("-".repeat(80));
      console.log("BASELINE MODE");
      console.log("-".repeat(80));
      console.log("");

      if (options.activateProjects) {
        console.log("NOTE: Ensure the project is discovered and activated before starting.");
        console.log(`You can use: itok::discover_projects with rootPath pointing to repos/${repository}`);
        console.log("");
      }

      const baselineOptions: RunBaselineScenarioOptions = {
        interactive: options.interactive,
        metadata: options.metadata,
      };

      // In interactive mode, we'll prompt for metrics
      // In non-interactive mode, user should provide metrics via options
      const baselineExecution = await runBaselineScenario(
        adaptedScenario,
        baselineOptions
      );

      repoResult.baseline = baselineExecution;
      console.log("");
    }

    // Run experimental if requested
    if (modes.includes("experimental")) {
      console.log("-".repeat(80));
      console.log("EXPERIMENTAL MODE");
      console.log("-".repeat(80));
      console.log("");

      if (options.activateProjects) {
        console.log("NOTE: Ensure the project is discovered and activated before starting.");
        console.log(`You can use: itok::discover_projects with rootPath pointing to repos/${repository}`);
        console.log("");
      }

      const experimentalOptions: RunExperimentalScenarioOptions = {
        interactive: options.interactive,
        metadata: options.metadata,
      };

      const experimentalExecution = await runExperimentalScenario(
        adaptedScenario,
        experimentalOptions
      );

      repoResult.experimental = experimentalExecution;
      console.log("");
    }

    // Calculate token reduction if both modes were executed
    if (repoResult.baseline && repoResult.experimental) {
      const baselineTotal = repoResult.baseline.tokenMetrics.totalTokens;
      const experimentalTotal = repoResult.experimental.tokenMetrics.totalTokens;
      const absolute = baselineTotal - experimentalTotal;
      const percentage = baselineTotal > 0 
        ? (absolute / baselineTotal) * 100 
        : 0;

      repoResult.tokenReduction = {
        absolute,
        percentage,
      };

      console.log(`Token Reduction for ${repository}:`);
      console.log(`  Baseline: ${baselineTotal} tokens`);
      console.log(`  Experimental: ${experimentalTotal} tokens`);
      console.log(`  Reduction: ${absolute} tokens (${percentage.toFixed(1)}%)`);
      console.log("");
    }

    results.push(repoResult);
  }

  // Calculate overall statistics
  const tokenReductions = results
    .map((r) => r.tokenReduction?.percentage)
    .filter((p): p is number => p !== undefined);

  const averageTokenReduction = tokenReductions.length > 0
    ? tokenReductions.reduce((sum, p) => sum + p, 0) / tokenReductions.length
    : 0;

  const totalExecutions = results.reduce((sum, r) => {
    return sum + (r.baseline ? 1 : 0) + (r.experimental ? 1 : 0);
  }, 0);

  const completedAt = new Date().toISOString();

  const benchmarkResult: MultiRepoBenchmarkResult = {
    baseScenario: scenarioBase,
    results,
    statistics: {
      averageTokenReduction,
      repositoriesTested: repositories.length,
      totalExecutions,
    },
    completedAt,
  };

  console.log("=".repeat(80));
  console.log("Benchmark Summary");
  console.log("=".repeat(80));
  console.log("");
  console.log(`Repositories Tested: ${benchmarkResult.statistics.repositoriesTested}`);
  console.log(`Total Executions: ${benchmarkResult.statistics.totalExecutions}`);
  if (averageTokenReduction > 0) {
    console.log(`Average Token Reduction: ${averageTokenReduction.toFixed(1)}%`);
  }
  console.log(`Completed At: ${completedAt}`);
  console.log("");

  return benchmarkResult;
}

/**
 * Creates a multi-repo benchmark result from provided execution data.
 * 
 * This is a convenience function for when you already have execution records
 * and just need to create the benchmark result structure.
 * 
 * @param baseScenario - Base scenario used
 * @param executions - Array of execution records organized by repository
 * @returns Multi-repository benchmark result
 */
export function createMultiRepoBenchmarkResult(
  baseScenario: BenchmarkScenario,
  executions: Array<{
    repository: string;
    baseline?: ScenarioExecution;
    experimental?: ScenarioExecution;
  }>
): MultiRepoBenchmarkResult {
  const results = executions.map((exec) => {
    const result: MultiRepoBenchmarkResult["results"][0] = {
      repository: exec.repository,
      baseline: exec.baseline,
      experimental: exec.experimental,
      tokenReduction: undefined,
    };

    // Calculate token reduction if both exist
    if (exec.baseline && exec.experimental) {
      const baselineTotal = exec.baseline.tokenMetrics.totalTokens;
      const experimentalTotal = exec.experimental.tokenMetrics.totalTokens;
      const absolute = baselineTotal - experimentalTotal;
      const percentage = baselineTotal > 0 
        ? (absolute / baselineTotal) * 100 
        : 0;

      result.tokenReduction = {
        absolute,
        percentage,
      };
    }

    return result;
  });

  // Calculate statistics
  const tokenReductions = results
    .map((r) => r.tokenReduction?.percentage)
    .filter((p): p is number => p !== undefined);

  const averageTokenReduction = tokenReductions.length > 0
    ? tokenReductions.reduce((sum, p) => sum + p, 0) / tokenReductions.length
    : 0;

  const totalExecutions = results.reduce((sum, r) => {
    return sum + (r.baseline ? 1 : 0) + (r.experimental ? 1 : 0);
  }, 0);

  return {
    baseScenario,
    results,
    statistics: {
      averageTokenReduction,
      repositoriesTested: executions.length,
      totalExecutions,
    },
    completedAt: new Date().toISOString(),
  };
}

