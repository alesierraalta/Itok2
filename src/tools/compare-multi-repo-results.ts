/**
 * Multi-repository benchmark result comparison and analysis.
 * 
 * Provides functions to analyze, compare, and export multi-repository
 * benchmark results in various formats.
 * 
 * @module tools/compare-multi-repo-results
 */

import type { MultiRepoBenchmarkResult } from "../types/index.js";

/**
 * Analysis report for multi-repository benchmark results.
 */
export interface MultiRepoAnalysisReport {
  /** Summary statistics */
  summary: {
    /** Average token reduction across all repositories */
    averageTokenReduction: number;
    /** Number of repositories tested */
    repositoriesTested: number;
    /** Total number of executions */
    totalExecutions: number;
    /** Number of successful executions */
    successfulExecutions: number;
    /** Number of failed executions */
    failedExecutions: number;
  };
  /** Best performing repository (highest token reduction) */
  bestPerformer?: {
    repository: string;
    tokenReduction: number;
  };
  /** Worst performing repository (lowest token reduction) */
  worstPerformer?: {
    repository: string;
    tokenReduction: number;
  };
  /** Repository-specific insights */
  insights: Array<{
    repository: string;
    observation: string;
    recommendation?: string;
  }>;
  /** Overall recommendations */
  recommendations: string[];
}

/**
 * Generates a markdown comparison table for multi-repository benchmark results.
 * 
 * @param result - Multi-repository benchmark result
 * @returns Markdown-formatted comparison table
 */
export function generateMultiRepoComparisonTable(
  result: MultiRepoBenchmarkResult
): string {
  const lines: string[] = [];

  lines.push("# Multi-Repository Benchmark Results");
  lines.push("");
  lines.push(`**Base Scenario:** ${result.baseScenario.name}`);
  lines.push(`**Completed At:** ${result.completedAt}`);
  lines.push("");

  // Summary statistics
  lines.push("## Summary Statistics");
  lines.push("");
  lines.push(`- **Repositories Tested:** ${result.statistics.repositoriesTested}`);
  lines.push(`- **Total Executions:** ${result.statistics.totalExecutions}`);
  if (result.statistics.averageTokenReduction > 0) {
    lines.push(
      `- **Average Token Reduction:** ${result.statistics.averageTokenReduction.toFixed(1)}%`
    );
  }
  lines.push("");

  // Detailed results table
  lines.push("## Detailed Results");
  lines.push("");
  lines.push("| Repository | Baseline Tokens | Experimental Tokens | Reduction | Reduction % | Baseline Duration | Experimental Duration | Status |");
  lines.push("|------------|----------------|---------------------|-----------|-------------|-------------------|----------------------|--------|");

  for (const repoResult of result.results) {
    const baseline = repoResult.baseline;
    const experimental = repoResult.experimental;
    const reduction = repoResult.tokenReduction;

    const baselineTokens = baseline?.tokenMetrics.totalTokens ?? "N/A";
    const experimentalTokens = experimental?.tokenMetrics.totalTokens ?? "N/A";
    const reductionAbs = reduction?.absolute ?? "N/A";
    const reductionPct = reduction?.percentage 
      ? `${reduction.percentage.toFixed(1)}%` 
      : "N/A";
    const baselineDuration = baseline 
      ? `${(baseline.durationMs / 1000 / 60).toFixed(1)} min` 
      : "N/A";
    const experimentalDuration = experimental 
      ? `${(experimental.durationMs / 1000 / 60).toFixed(1)} min` 
      : "N/A";
    
    const baselineSuccess = baseline?.metadata.success ?? false;
    const experimentalSuccess = experimental?.metadata.success ?? false;
    const status = baseline && experimental
      ? baselineSuccess && experimentalSuccess 
        ? "✅ Both" 
        : baselineSuccess || experimentalSuccess 
          ? "⚠️ Partial" 
          : "❌ Failed"
      : baseline 
        ? baselineSuccess ? "✅ Baseline" : "❌ Baseline"
        : experimental 
          ? experimentalSuccess ? "✅ Experimental" : "❌ Experimental"
          : "N/A";

    lines.push(
      `| ${repoResult.repository} | ${baselineTokens} | ${experimentalTokens} | ${reductionAbs} | ${reductionPct} | ${baselineDuration} | ${experimentalDuration} | ${status} |`
    );
  }

  lines.push("");

  return lines.join("\n");
}

/**
 * Analyzes multi-repository benchmark results and generates insights.
 * 
 * @param result - Multi-repository benchmark result
 * @returns Analysis report with insights and recommendations
 */
export function analyzeMultiRepoResults(
  result: MultiRepoBenchmarkResult
): MultiRepoAnalysisReport {
  const insights: MultiRepoAnalysisReport["insights"] = [];
  const recommendations: string[] = [];

  // Find best and worst performers
  const reposWithReduction = result.results
    .filter((r) => r.tokenReduction !== undefined)
    .map((r) => ({
      repository: r.repository,
      reduction: r.tokenReduction!.percentage,
    }));

  let bestPerformer: MultiRepoAnalysisReport["bestPerformer"] | undefined;
  let worstPerformer: MultiRepoAnalysisReport["worstPerformer"] | undefined;

  if (reposWithReduction.length > 0) {
    const sorted = [...reposWithReduction].sort((a, b) => b.reduction - a.reduction);
    bestPerformer = {
      repository: sorted[0].repository,
      tokenReduction: sorted[0].reduction,
    };
    worstPerformer = {
      repository: sorted[sorted.length - 1].repository,
      tokenReduction: sorted[sorted.length - 1].reduction,
    };
  }

  // Generate insights for each repository
  for (const repoResult of result.results) {
    const observations: string[] = [];

    if (repoResult.baseline && repoResult.experimental) {
      const reduction = repoResult.tokenReduction!;
      
      if (reduction.percentage >= 30) {
        observations.push(
          `Excellent token reduction (${reduction.percentage.toFixed(1)}%). The planner significantly optimized token usage.`
        );
      } else if (reduction.percentage >= 15) {
        observations.push(
          `Good token reduction (${reduction.percentage.toFixed(1)}%). The planner provided moderate optimization.`
        );
      } else if (reduction.percentage > 0) {
        observations.push(
          `Modest token reduction (${reduction.percentage.toFixed(1)}%). The planner provided some optimization but could be improved.`
        );
      } else {
        observations.push(
          `No token reduction (${Math.abs(reduction.percentage).toFixed(1)}% increase). The planner may need adjustment for this repository type.`
        );
      }

      // Compare durations
      const baselineDuration = repoResult.baseline.durationMs;
      const experimentalDuration = repoResult.experimental.durationMs;
      const durationDiff = experimentalDuration - baselineDuration;
      const durationDiffPct = (durationDiff / baselineDuration) * 100;

      if (durationDiffPct > 20) {
        observations.push(
          `Experimental mode took ${durationDiffPct.toFixed(1)}% longer. Consider optimizing plan execution.`
        );
      } else if (durationDiffPct < -10) {
        observations.push(
          `Experimental mode was ${Math.abs(durationDiffPct).toFixed(1)}% faster. Great efficiency improvement!`
        );
      }

      // Check success status
      const baselineSuccess = repoResult.baseline.metadata.success;
      const experimentalSuccess = repoResult.experimental.metadata.success;

      if (!baselineSuccess && !experimentalSuccess) {
        observations.push("Both baseline and experimental executions failed. Review task requirements.");
      } else if (!baselineSuccess) {
        observations.push("Baseline execution failed but experimental succeeded. Planner may have helped.");
      } else if (!experimentalSuccess) {
        observations.push("Experimental execution failed. Review planner configuration or plan quality.");
      }
    } else if (repoResult.baseline) {
      observations.push("Only baseline execution completed. Run experimental mode for comparison.");
    } else if (repoResult.experimental) {
      observations.push("Only experimental execution completed. Run baseline mode for comparison.");
    } else {
      observations.push("No executions completed for this repository.");
    }

    if (observations.length > 0) {
      insights.push({
        repository: repoResult.repository,
        observation: observations.join(" "),
      });
    }
  }

  // Generate overall recommendations
  if (result.statistics.averageTokenReduction >= 30) {
    recommendations.push(
      "Excellent overall performance! The planner consistently provides significant token optimization."
    );
  } else if (result.statistics.averageTokenReduction >= 15) {
    recommendations.push(
      "Good overall performance. Consider fine-tuning planner parameters for even better results."
    );
  } else if (result.statistics.averageTokenReduction > 0) {
    recommendations.push(
      "Modest token reduction achieved. Review planner configuration and plan validation settings."
    );
    recommendations.push(
      "Consider adjusting chunking parameters (maxChunksPerStep, maxLinesPerChunk) for better optimization."
    );
  } else {
    recommendations.push(
      "Token reduction not achieved. Review planner strategy and consider adjusting task planning approach."
    );
    recommendations.push(
      "Check if scenario adaptations are appropriate for each repository structure."
    );
  }

  if (bestPerformer && worstPerformer && bestPerformer.tokenReduction - worstPerformer.tokenReduction > 20) {
    recommendations.push(
      `Large variance in performance (${bestPerformer.repository}: ${bestPerformer.tokenReduction.toFixed(1)}% vs ${worstPerformer.repository}: ${worstPerformer.tokenReduction.toFixed(1)}%). Investigate repository-specific factors.`
    );
  }

  // Count successes
  let successfulExecutions = 0;
  let failedExecutions = 0;

  for (const repoResult of result.results) {
    if (repoResult.baseline?.metadata.success) successfulExecutions++;
    else if (repoResult.baseline) failedExecutions++;
    if (repoResult.experimental?.metadata.success) successfulExecutions++;
    else if (repoResult.experimental) failedExecutions++;
  }

  return {
    summary: {
      averageTokenReduction: result.statistics.averageTokenReduction,
      repositoriesTested: result.statistics.repositoriesTested,
      totalExecutions: result.statistics.totalExecutions,
      successfulExecutions,
      failedExecutions,
    },
    bestPerformer,
    worstPerformer,
    insights,
    recommendations,
  };
}

/**
 * Exports multi-repository benchmark results in the specified format.
 * 
 * @param result - Multi-repository benchmark result
 * @param format - Export format ("json" or "markdown")
 * @returns Exported result as string
 */
export function exportMultiRepoResults(
  result: MultiRepoBenchmarkResult,
  format: "json" | "markdown" = "markdown"
): string {
  if (format === "json") {
    return JSON.stringify(result, null, 2);
  }

  // Markdown format
  const lines: string[] = [];

  lines.push("# Multi-Repository Benchmark Results");
  lines.push("");
  lines.push(`**Base Scenario:** ${result.baseScenario.name}`);
  lines.push(`**Scenario ID:** ${result.baseScenario.id}`);
  lines.push(`**Task Kind:** ${result.baseScenario.taskKind}`);
  lines.push(`**Completed At:** ${result.completedAt}`);
  lines.push("");

  // Summary
  lines.push("## Summary");
  lines.push("");
  lines.push(`- **Repositories Tested:** ${result.statistics.repositoriesTested}`);
  lines.push(`- **Total Executions:** ${result.statistics.totalExecutions}`);
  if (result.statistics.averageTokenReduction > 0) {
    lines.push(
      `- **Average Token Reduction:** ${result.statistics.averageTokenReduction.toFixed(1)}%`
    );
  }
  lines.push("");

  // Comparison table
  lines.push(generateMultiRepoComparisonTable(result));

  // Analysis
  const analysis = analyzeMultiRepoResults(result);
  lines.push("## Analysis");
  lines.push("");

  if (analysis.bestPerformer) {
    lines.push(
      `**Best Performer:** ${analysis.bestPerformer.repository} (${analysis.bestPerformer.tokenReduction.toFixed(1)}% reduction)`
    );
  }
  if (analysis.worstPerformer) {
    lines.push(
      `**Worst Performer:** ${analysis.worstPerformer.repository} (${analysis.worstPerformer.tokenReduction.toFixed(1)}% reduction)`
    );
  }
  lines.push("");

  // Insights
  if (analysis.insights.length > 0) {
    lines.push("### Repository Insights");
    lines.push("");
    for (const insight of analysis.insights) {
      lines.push(`#### ${insight.repository}`);
      lines.push(insight.observation);
      if (insight.recommendation) {
        lines.push(`**Recommendation:** ${insight.recommendation}`);
      }
      lines.push("");
    }
  }

  // Recommendations
  if (analysis.recommendations.length > 0) {
    lines.push("### Overall Recommendations");
    lines.push("");
    for (const recommendation of analysis.recommendations) {
      lines.push(`- ${recommendation}`);
    }
    lines.push("");
  }

  // Detailed results
  lines.push("## Detailed Results");
  lines.push("");
  for (const repoResult of result.results) {
    lines.push(`### ${repoResult.repository}`);
    lines.push("");

    if (repoResult.baseline) {
      lines.push("#### Baseline Execution");
      lines.push(`- **Start Time:** ${repoResult.baseline.startTime}`);
      lines.push(`- **End Time:** ${repoResult.baseline.endTime}`);
      lines.push(`- **Duration:** ${(repoResult.baseline.durationMs / 1000 / 60).toFixed(1)} minutes`);
      lines.push(`- **Input Tokens:** ${repoResult.baseline.tokenMetrics.inputTokens}`);
      lines.push(`- **Output Tokens:** ${repoResult.baseline.tokenMetrics.outputTokens}`);
      lines.push(`- **Total Tokens:** ${repoResult.baseline.tokenMetrics.totalTokens}`);
      lines.push(`- **Success:** ${repoResult.baseline.metadata.success ? "✅" : "❌"}`);
      if (repoResult.baseline.metadata.error) {
        lines.push(`- **Error:** ${repoResult.baseline.metadata.error}`);
      }
      lines.push("");
    }

    if (repoResult.experimental) {
      lines.push("#### Experimental Execution");
      lines.push(`- **Start Time:** ${repoResult.experimental.startTime}`);
      lines.push(`- **End Time:** ${repoResult.experimental.endTime}`);
      lines.push(`- **Duration:** ${(repoResult.experimental.durationMs / 1000 / 60).toFixed(1)} minutes`);
      lines.push(`- **Input Tokens:** ${repoResult.experimental.tokenMetrics.inputTokens}`);
      lines.push(`- **Output Tokens:** ${repoResult.experimental.tokenMetrics.outputTokens}`);
      lines.push(`- **Total Tokens:** ${repoResult.experimental.tokenMetrics.totalTokens}`);
      lines.push(`- **Success:** ${repoResult.experimental.metadata.success ? "✅" : "❌"}`);
      if (repoResult.experimental.metadata.planId) {
        lines.push(`- **Plan ID:** ${repoResult.experimental.metadata.planId}`);
      }
      if (repoResult.experimental.metadata.stepsExecuted !== undefined) {
        lines.push(`- **Steps Executed:** ${repoResult.experimental.metadata.stepsExecuted}`);
      }
      if (repoResult.experimental.metadata.chunksUsed !== undefined) {
        lines.push(`- **Chunks Used:** ${repoResult.experimental.metadata.chunksUsed}`);
      }
      if (repoResult.experimental.metadata.error) {
        lines.push(`- **Error:** ${repoResult.experimental.metadata.error}`);
      }
      lines.push("");
    }

    if (repoResult.tokenReduction) {
      lines.push("#### Token Reduction");
      lines.push(`- **Absolute Reduction:** ${repoResult.tokenReduction.absolute} tokens`);
      lines.push(`- **Percentage Reduction:** ${repoResult.tokenReduction.percentage.toFixed(1)}%`);
      lines.push("");
    }
  }

  return lines.join("\n");
}

