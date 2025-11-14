/**
 * Test script for code chunking
 * @module test-code-chunking
 * 
 * Tests the code chunking module: symbol chunking, sub-chunking,
 * file range chunking, dechunking, and integration with scopes.
 */

import {
  TaskKind,
  ChunkType,
  type TaskPlan,
} from "./types/index.js";
import { buildTaskPlan } from "./tools/plan-task.js";
import {
  chunkByFileRange,
  applyDechunking,
  chunkScope,
  getChunksForStep,
} from "./tools/code-chunking.js";
import { chunkLargeSymbol } from "./tools/code-chunking-impl.js";
import { translateScopeSelector } from "./tools/scope-resolver.js";

/**
 * Test cases for chunking
 */
const testCases = [
  {
    name: "File range chunking",
    description: "Chunk file by line range",
  },
  {
    name: "Large symbol sub-chunking",
    description: "Divide large symbol into sub-chunks",
  },
  {
    name: "Dechunking (merging)",
    description: "Merge chunks when limits exceeded",
  },
  {
    name: "Scope chunking",
    description: "Chunk based on scope",
  },
  {
    name: "Step chunking",
    description: "Get chunks for step execution",
  },
];

/**
 * Creates a large code sample for testing
 */
function createLargeCodeSample(): string {
  return `
// Large function for testing sub-chunking
function processLargeData(data: any[]) {
  // Initial setup
  const results: any[] = [];
  let index = 0;

  // First processing block
  if (data.length > 0) {
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      if (item.valid) {
        results.push(item);
      }
    }
  }

  // Second processing block
  while (index < results.length) {
    const current = results[index];
    try {
      processItem(current);
    } catch (error) {
      handleError(error);
    }
    index++;
  }

  // Final processing
  switch (results.length) {
    case 0:
      return [];
    case 1:
      return [results[0]];
    default:
      return results;
  }
}
`.trim();
}

/**
 * Runs all test cases
 */
async function runTests() {
  console.log("🧪 Testing Phase 6: Code Chunking\n");

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    console.log(`\n📋 Test: ${testCase.name}`);
    console.log(`   Description: ${testCase.description}`);

    try {
      if (testCase.name === "File range chunking") {
        // Test 1: File range chunking
        const chunks = chunkByFileRange("test.ts", 1, 250, {
          maxLinesPerChunk: 100,
        });

        if (chunks.length === 0) {
          throw new Error("No chunks created");
        }

        console.log(`   ✓ Created ${chunks.length} chunks`);
        console.log(`   ✓ First chunk: lines ${chunks[0].startLine}-${chunks[0].endLine}`);
        console.log(`   ✓ Last chunk: lines ${chunks[chunks.length - 1].startLine}-${chunks[chunks.length - 1].endLine}`);

        // Verify chunks don't exceed limit
        for (const chunk of chunks) {
          if (chunk.metadata.lineCount > 100) {
            throw new Error(`Chunk exceeds maxLinesPerChunk: ${chunk.metadata.lineCount}`);
          }
        }
        console.log(`   ✓ All chunks respect maxLinesPerChunk`);

      } else if (testCase.name === "Large symbol sub-chunking") {
        // Test 2: Large symbol sub-chunking
        const code = createLargeCodeSample();
        const lines = code.split("\n");
        const subChunks = chunkLargeSymbol(
          "test.ts",
          "processLargeData",
          "function",
          1,
          lines.length,
          code,
          { maxLinesPerChunk: 20 }
        );

        if (subChunks.length === 0) {
          throw new Error("No sub-chunks created");
        }

        console.log(`   ✓ Created ${subChunks.length} sub-chunks`);
        for (const chunk of subChunks) {
          console.log(`     - ${chunk.metadata.summary}`);
          if (chunk.metadata.parentSymbolName !== "processLargeData") {
            throw new Error("Parent symbol name not set correctly");
          }
        }

      } else if (testCase.name === "Dechunking (merging)") {
        // Test 3: Dechunking
        const chunks = [];
        for (let i = 0; i < 10; i++) {
          chunks.push({
            id: `chunk-${i}`,
            filePath: "test.ts",
            startLine: i * 10 + 1,
            endLine: (i + 1) * 10,
            type: ChunkType.Symbol,
            metadata: {
              type: ChunkType.Symbol,
              lineCount: 10,
              symbolName: `symbol${i}`,
            },
          });
        }

        const dechunked = applyDechunking(chunks, {
          maxChunksPerStep: 5,
          maxLinesPerChunk: 100,
          includeContent: true,
          applyDechunking: true,
        });

        if (dechunked.chunks.length > 5) {
          throw new Error(`Dechunking failed: ${dechunked.chunks.length} chunks (expected ≤5)`);
        }

        console.log(`   ✓ Merged ${chunks.length} chunks into ${dechunked.chunks.length}`);
        console.log(`   ✓ Warnings: ${dechunked.warnings.length}`);

        // Verify merged chunks are summaries
        const summaryChunks = dechunked.chunks.filter((c) => c.type === ChunkType.Summary);
        if (summaryChunks.length === 0 && dechunked.chunks.length < chunks.length) {
          throw new Error("Expected summary chunks after merging");
        }

      } else if (testCase.name === "Scope chunking") {
        // Test 4: Scope chunking
        const plan = buildTaskPlan({ goal: "Test chunking", maxPhases: 2, maxSteps: 3 });
        const scope = plan.scopes[0];

        const result = await chunkScope(scope, plan, {
          maxChunksPerStep: 5,
          maxLinesPerChunk: 100,
        });

        console.log(`   ✓ Chunking result: ${result.chunks.length} chunks`);
        console.log(`   ✓ Stats: ${result.stats.totalChunks} total, ${result.stats.chunksMerged} merged`);
        console.log(`   ✓ Warnings: ${result.warnings.length}`);

      } else if (testCase.name === "Step chunking") {
        // Test 5: Step chunking
        const plan = buildTaskPlan({ goal: "Test step chunking", maxPhases: 2, maxSteps: 3 });
        const step = plan.steps[0];

        const result = await getChunksForStep(step, plan, {
          maxChunksPerStep: 5,
          maxLinesPerChunk: 100,
        });

        console.log(`   ✓ Chunks for step: ${result.chunks.length}`);
        console.log(`   ✓ Step: ${step.title}`);
        console.log(`   ✓ Stats: ${JSON.stringify(result.stats)}`);

        if (result.warnings.length > 0) {
          console.log(`   ⚠ Warnings: ${result.warnings.join(", ")}`);
        }
      }

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
    console.log("\n✅ All Phase 6 tests passed!");
  }
}

// Run tests
runTests().catch((error) => {
  console.error("Fatal error running tests:", error);
  process.exit(1);
});

