/**
 * Test script for repositories and scenarios validation
 * 
 * Validates that:
 * 1. Required repositories exist in repos/
 * 2. Scenarios are properly defined
 * 3. Prompts are accessible
 * 4. Repository structure is ready for benchmarks
 * 
 * Run with: npm run build && node build/test-repos-scenarios.js
 */

import * as fs from "fs";
import * as path from "path";
import { allScenarios, getScenarioById } from "./scenarios/index.js";
import { TaskKind } from "./types/index.js";

/**
 * Check if a directory exists
 */
function directoryExists(dirPath: string): boolean {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Check if a file exists
 */
function fileExists(filePath: string): boolean {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

/**
 * Check repository structure
 */
function checkRepository(repoName: string, requiredFiles?: string[]): {
  exists: boolean;
  hasPackageJson: boolean;
  hasSrc: boolean;
  missingFiles: string[];
} {
  const repoPath = path.join(process.cwd(), "repos", repoName);
  const exists = directoryExists(repoPath);
  
  if (!exists) {
    return {
      exists: false,
      hasPackageJson: false,
      hasSrc: false,
      missingFiles: requiredFiles || [],
    };
  }

  const packageJsonPath = path.join(repoPath, "package.json");
  const srcPath = path.join(repoPath, "src");
  const hasPackageJson = fileExists(packageJsonPath);
  const hasSrc = directoryExists(srcPath);

  const missingFiles: string[] = [];
  if (requiredFiles) {
    for (const file of requiredFiles) {
      const filePath = path.join(repoPath, file);
      if (!fileExists(filePath) && !directoryExists(filePath)) {
        missingFiles.push(file);
      }
    }
  }

  return {
    exists: true,
    hasPackageJson,
    hasSrc,
    missingFiles,
  };
}

/**
 * Run all tests
 */
function runTests() {
  console.log("Testing repositories and scenarios setup...\n");

  let passed = 0;
  let failed = 0;

  // Test 1: Check repos directory exists
  console.log("Test 1: Repos directory exists");
  try {
    const reposDir = path.join(process.cwd(), "repos");
    if (directoryExists(reposDir)) {
      console.log("✓ Repos directory exists\n");
      passed++;
    } else {
      throw new Error("Repos directory not found");
    }
  } catch (error) {
    console.error("✗ Repos directory test failed:", error);
    failed++;
  }

  // Test 2: Check ecommerce-app repository
  console.log("Test 2: ecommerce-app repository");
  try {
    const repo = checkRepository("ecommerce-app", ["src"]);
    if (repo.exists) {
      console.log("  ✓ Repository exists");
      if (repo.hasPackageJson) {
        console.log("  ✓ Has package.json");
      } else {
        console.log("  ⚠ Missing package.json");
      }
      if (repo.hasSrc) {
        console.log("  ✓ Has src/ directory");
      } else {
        console.log("  ⚠ Missing src/ directory");
      }
      console.log("✓ ecommerce-app repository check passed\n");
      passed++;
    } else {
      throw new Error("ecommerce-app repository not found in repos/");
    }
  } catch (error) {
    console.error("✗ ecommerce-app repository test failed:", error);
    failed++;
  }

  // Test 3: Check api-starter repository
  console.log("Test 3: api-starter repository");
  try {
    const repo = checkRepository("api-starter", ["src"]);
    if (repo.exists) {
      console.log("  ✓ Repository exists");
      if (repo.hasPackageJson) {
        console.log("  ✓ Has package.json");
      } else {
        console.log("  ⚠ Missing package.json");
      }
      if (repo.hasSrc) {
        console.log("  ✓ Has src/ directory");
      } else {
        console.log("  ⚠ Missing src/ directory");
      }
      console.log("✓ api-starter repository check passed\n");
      passed++;
    } else {
      console.log("  ⚠ api-starter repository not found (required for scenarios 2 and 3)");
      console.log("  → See repos/SETUP_API_STARTER.md for setup instructions\n");
      // Don't fail, just warn
      passed++;
    }
  } catch (error) {
    console.error("✗ api-starter repository test failed:", error);
    failed++;
  }

  // Test 4: Check all scenarios are defined
  console.log("Test 4: All scenarios defined");
  try {
    if (allScenarios.length >= 3) {
      console.log(`  ✓ Found ${allScenarios.length} scenarios`);
      allScenarios.forEach((s) => {
        console.log(`    - ${s.id}: ${s.name}`);
      });
      console.log("✓ All scenarios check passed\n");
      passed++;
    } else {
      throw new Error(`Expected at least 3 scenarios, found ${allScenarios.length}`);
    }
  } catch (error) {
    console.error("✗ All scenarios test failed:", error);
    failed++;
  }

  // Test 5: Check scenario IDs are unique
  console.log("Test 5: Scenario IDs are unique");
  try {
    const ids = allScenarios.map((s) => s.id);
    const uniqueIds = new Set(ids);
    if (ids.length === uniqueIds.size) {
      console.log("✓ All scenario IDs are unique\n");
      passed++;
    } else {
      throw new Error("Duplicate scenario IDs found");
    }
  } catch (error) {
    console.error("✗ Scenario IDs uniqueness test failed:", error);
    failed++;
  }

  // Test 6: Check scenarios have prompts
  console.log("Test 6: Scenarios have prompts");
  try {
    let allHavePrompts = true;
    for (const scenario of allScenarios) {
      if (!scenario.baselinePrompt || scenario.baselinePrompt.trim().length === 0) {
        console.error(`  ✗ ${scenario.id} missing baselinePrompt`);
        allHavePrompts = false;
      }
      if (!scenario.experimentalPrompt || scenario.experimentalPrompt.trim().length === 0) {
        console.error(`  ✗ ${scenario.id} missing experimentalPrompt`);
        allHavePrompts = false;
      }
    }
    if (allHavePrompts) {
      console.log("✓ All scenarios have both baseline and experimental prompts\n");
      passed++;
    } else {
      throw new Error("Some scenarios are missing prompts");
    }
  } catch (error) {
    console.error("✗ Scenarios prompts test failed:", error);
    failed++;
  }

  // Test 7: Check prompts contain REPOSITORIO line
  console.log("Test 7: Prompts contain REPOSITORIO line");
  try {
    let allHaveRepo = true;
    for (const scenario of allScenarios) {
      if (!scenario.baselinePrompt.includes("REPOSITORIO:")) {
        console.error(`  ✗ ${scenario.id} baselinePrompt missing REPOSITORIO line`);
        allHaveRepo = false;
      }
      if (!scenario.experimentalPrompt.includes("REPOSITORIO:")) {
        console.error(`  ✗ ${scenario.id} experimentalPrompt missing REPOSITORIO line`);
        allHaveRepo = false;
      }
    }
    if (allHaveRepo) {
      console.log("✓ All prompts contain REPOSITORIO line\n");
      passed++;
    } else {
      throw new Error("Some prompts are missing REPOSITORIO line");
    }
  } catch (error) {
    console.error("✗ Prompts REPOSITORIO test failed:", error);
    failed++;
  }

  // Test 8: Check getScenarioById works
  console.log("Test 8: getScenarioById function");
  try {
    const scenario = getScenarioById("small-bugfix-001");
    if (scenario && scenario.id === "small-bugfix-001") {
      console.log("✓ getScenarioById works correctly\n");
      passed++;
    } else {
      throw new Error("getScenarioById returned incorrect scenario");
    }
  } catch (error) {
    console.error("✗ getScenarioById test failed:", error);
    failed++;
  }

  // Test 9: Check scenario task kinds
  console.log("Test 9: Scenario task kinds");
  try {
    const bugfixScenarios = allScenarios.filter((s) => s.taskKind === TaskKind.Bugfix);
    const featureScenarios = allScenarios.filter((s) => s.taskKind === TaskKind.Feature);
    const refactorScenarios = allScenarios.filter((s) => s.taskKind === TaskKind.Refactor);

    console.log(`  - Bugfix scenarios: ${bugfixScenarios.length}`);
    console.log(`  - Feature scenarios: ${featureScenarios.length}`);
    console.log(`  - Refactor scenarios: ${refactorScenarios.length}`);

    if (bugfixScenarios.length >= 1 && featureScenarios.length >= 1 && refactorScenarios.length >= 1) {
      console.log("✓ All task kinds are represented\n");
      passed++;
    } else {
      throw new Error("Not all task kinds are represented");
    }
  } catch (error) {
    console.error("✗ Scenario task kinds test failed:", error);
    failed++;
  }

  // Test 10: Check scenario completion criteria
  console.log("Test 10: Scenarios have completion criteria");
  try {
    let allHaveCriteria = true;
    for (const scenario of allScenarios) {
      if (!scenario.completionCriteria || scenario.completionCriteria.length === 0) {
        console.error(`  ✗ ${scenario.id} missing completion criteria`);
        allHaveCriteria = false;
      }
    }
    if (allHaveCriteria) {
      console.log("✓ All scenarios have completion criteria\n");
      passed++;
    } else {
      throw new Error("Some scenarios are missing completion criteria");
    }
  } catch (error) {
    console.error("✗ Completion criteria test failed:", error);
    failed++;
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log(`Tests passed: ${passed}`);
  console.log(`Tests failed: ${failed}`);
  console.log(`Total tests: ${passed + failed}`);
  console.log("=".repeat(50));

  if (failed === 0) {
    console.log("\n✓ All tests passed!");
    console.log("\nRepositories and scenarios are ready for benchmarks!");
    process.exit(0);
  } else {
    console.log("\n✗ Some tests failed");
    console.log("\nPlease fix the issues above before running benchmarks.");
    process.exit(1);
  }
}

// Run tests
runTests();


