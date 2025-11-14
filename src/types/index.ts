/**
 * Shared TypeScript types for the Itok MCP server
 * @module types
 * 
 * This module contains type definitions for hierarchical task planning (HRM-inspired)
 * and dynamic chunking (H-Net-inspired).
 * 
 * Phase 2: Defines the data structure contract for TaskPlan, PlanPhase, PlanScope, and PlanStep.
 */

/**
 * Hierarchical Reasoning Model (HRM) level for plan components.
 * 
 * Represents the abstraction level of reasoning:
 * - Level 0: Abstract reasoning - goal definition, success criteria, general strategy
 * - Level 1: Concrete planning - specific code areas, specific strategy
 * - Level 2: Direct execution - edits, tests, concrete operations
 * 
 * @enum {number}
 */
export enum PlanLevel {
  /** Abstract reasoning: goal definition, success criteria, general strategy */
  Abstract = 0,
  /** Concrete planning: specific code areas, specific strategy */
  Planning = 1,
  /** Direct execution: edits, tests, concrete operations */
  Execution = 2,
}

/**
 * Type of step in a task plan.
 * 
 * Each step kind represents a different type of work or reasoning activity.
 * 
 * @enum {string}
 */
export enum StepKind {
  /** Clarify or refine the goal/objective */
  ClarifyGoal = "clarify_goal",
  /** Gather information from context */
  GatherContext = "gather_context",
  /** Scan code to understand structure */
  ScanCode = "scan_code",
  /** Design the solution approach */
  DesignSolution = "design_solution",
  /** Edit code */
  EditCode = "edit_code",
  /** Run tests */
  RunTests = "run_tests",
  /** Refine or adjust previous work */
  Refine = "refine",
}

/**
 * Type of scope for work boundaries.
 * 
 * Defines the granularity of the work area.
 * 
 * @enum {string}
 */
export enum ScopeKind {
  /** Entire workspace */
  Global = "global",
  /** A specific module or package */
  Module = "module",
  /** A specific file */
  File = "file",
  /** A specific symbol (function, class, etc.) */
  Symbol = "symbol",
}

/**
 * Type of task being planned.
 * 
 * Different task kinds require different planning strategies and phase structures.
 * 
 * @enum {string}
 */
export enum TaskKind {
  /** Bug fix: locate → fix → validate */
  Bugfix = "bugfix",
  /** New feature: understand → integrate → validate */
  Feature = "feature",
  /** Refactoring: analyze → redesign → refactor */
  Refactor = "refactor",
  /** Other/unspecified task type */
  Other = "other",
}

/**
 * Status of a plan step during execution.
 * 
 * Used to track progress when executing a plan.
 * 
 * @enum {string}
 */
export enum StepStatus {
  /** Step not yet started */
  Todo = "todo",
  /** Step currently in progress */
  InProgress = "in_progress",
  /** Step completed successfully */
  Done = "done",
  /** Step blocked (waiting for dependencies or external factors) */
  Blocked = "blocked",
}

/**
 * Individual step in a hierarchical task plan.
 * 
 * Represents a single unit of work within a phase. Steps are the H-L local iterations
 * within each phase (macro-subroutine of HRM-H).
 * 
 * @interface
 */
export interface PlanStep {
  /** Unique identifier for this step */
  id: string;
  /** ID of the phase this step belongs to */
  phaseId: string;
  /** HRM level of this step (0=abstract, 1=planning, 2=execution) */
  level: PlanLevel;
  /** Order within the phase (lower numbers execute first) */
  order: number;
  /** Type of step */
  kind: StepKind;
  /** Short title describing the step */
  title: string;
  /** Brief description of what this step does */
  summary: string;
  /** ID of the scope this step operates on (null if global) */
  scopeId: string | null;
  /** Array of step IDs that must complete before this step can start */
  dependencies: string[];
  /** Suggested MCP tools for this step (e.g., "serena.find_symbol", "filesystem.read_file") */
  suggestedTools: string[];
  /** Execution status (optional, used during plan execution) */
  status?: StepStatus;
}

/**
 * Work scope defining boundaries for plan steps.
 * 
 * Scopes help organize work by defining what part of the codebase is relevant.
 * 
 * @interface
 */
export interface PlanScope {
  /** Unique identifier for this scope */
  id: string;
  /** Type of scope (granularity level) */
  kind: ScopeKind;
  /** Human-readable label for this scope */
  label: string;
  /** 
   * Description of how to select/resolve this scope.
   * Examples:
   * - "use serena.find_symbol('AuthController')"
   * - "files in src/server/"
   * - "workspace root"
   */
  selector: string;
  /** Optional detailed description of the scope */
  description?: string;
}

/**
 * Phase in a hierarchical task plan.
 * 
 * A phase is a macro-subroutine of HRM-H, representing a high-level stage of work.
 * Each phase contains multiple steps that execute within it.
 * 
 * @interface
 */
export interface PlanPhase {
  /** Unique identifier for this phase */
  id: string;
  /** Name of the phase (e.g., "Localize Bug", "Implement Feature") */
  name: string;
  /** HRM level of this phase (typically 0 for phases) */
  level: PlanLevel;
  /** Order of execution (lower numbers execute first) */
  order: number;
  /** Optional summary describing what this phase accomplishes */
  summary?: string;
}

/**
 * Metadata for a task plan.
 * 
 * Additional information about the plan itself.
 * 
 * @interface
 */
export interface TaskPlanMetadata {
  /** Timestamp when the plan was created */
  createdAt?: string;
  /** Version of the plan structure/schema */
  version?: string;
  /** Optional notes or additional information */
  notes?: string;
}

/**
 * Complete hierarchical task plan.
 * 
 * This is the "high-level memory" inspired by HRM, representing the abstract
 * planning state. The plan organizes work into phases, scopes, and steps.
 * 
 * @interface
 */
export interface TaskPlan {
  /** Main goal/objective of the task */
  goal: string;
  /** Type of task (determines planning strategy) */
  taskKind: TaskKind;
  /** Optional summary of the context/situation */
  contextSummary?: string;
  /** Ordered list of phases */
  phases: PlanPhase[];
  /** List of work scopes */
  scopes: PlanScope[];
  /** Ordered list of all steps across all phases */
  steps: PlanStep[];
  /** Optional metadata about the plan */
  metadata?: TaskPlanMetadata;
}

/**
 * Options for plan validation and compression.
 * 
 * @interface
 */
export interface ValidatePlanOptions {
  /** Maximum number of phases to keep (truncate if exceeded) */
  targetMaxPhases?: number;
  /** Maximum number of steps per phase (truncate if exceeded) */
  targetMaxSteps?: number;
  /** Maximum micro-steps per phase before chunking (H-Net-style compression) */
  maxMicroStepsPerPhase?: number;
}

/**
 * A single change applied during plan validation.
 * 
 * @interface
 */
export interface PlanChange {
  /** Type of change (e.g., "level_corrected", "scope_reassigned", "steps_merged") */
  type: string;
  /** Description of what changed */
  description: string;
  /** ID of the affected component (step, phase, scope) */
  componentId?: string;
}

/**
 * A warning generated during plan validation.
 * 
 * @interface
 */
export interface PlanWarning {
  /** Type of warning (e.g., "invalid_scope", "level_mismatch") */
  type: string;
  /** Warning message */
  message: string;
  /** ID of the affected component */
  componentId?: string;
}

/**
 * Statistics about plan validation and compression.
 * 
 * @interface
 */
export interface PlanStats {
  /** Number of phases before validation */
  phasesBefore: number;
  /** Number of phases after validation */
  phasesAfter: number;
  /** Number of steps before validation */
  stepsBefore: number;
  /** Number of steps after validation */
  stepsAfter: number;
  /** Number of chunks created during dynamic chunking */
  chunksCreated: number;
  /** Number of steps merged into chunks */
  stepsMerged: number;
  /** Number of levels corrected */
  levelsCorrected: number;
  /** Number of scopes reassigned */
  scopesReassigned: number;
}

/**
 * Result of plan validation and compression.
 * 
 * @interface
 */
export interface ValidatePlanResult {
  /** The optimized plan after validation and compression */
  plan: TaskPlan;
  /** Array of warnings generated during validation */
  warnings: PlanWarning[];
  /** Array of changes applied during validation */
  changes: PlanChange[];
  /** Statistics about the validation process */
  stats: PlanStats;
  /** TOON representation of the optimized plan */
  toon: string;
}

/**
 * Result of translating a scope selector to actionable information.
 * 
 * Represents how a scope.selector should be interpreted and resolved.
 * 
 * @interface
 */
export interface ScopeResolution {
  /** The original scope */
  scope: PlanScope;
  /** Type of resolution (what the selector represents) */
  resolutionType: "global" | "module" | "file" | "symbol" | "pattern" | "serena_action";
  /** Parsed information from the selector */
  parsedInfo: {
    /** For serena_action: the tool name (e.g., "serena.find_symbol") */
    toolName?: string;
    /** For serena_action: the tool arguments */
    toolArgs?: Record<string, unknown>;
    /** For pattern: the path pattern (e.g., "src/server/**") */
    pathPattern?: string;
    /** For symbol: the symbol name */
    symbolName?: string;
    /** For module: the module description */
    moduleDescription?: string;
  };
  /** Instructions for resolving this scope (human-readable) */
  instructions: string;
}

/**
 * Represents a Serena tool action to be executed.
 * 
 * Maps a StepKind to concrete Serena tool calls.
 * 
 * @interface
 */
export interface SerenaAction {
  /** The Serena tool name (e.g., "serena.find_symbol") */
  tool: string;
  /** Arguments for the tool call */
  args: Record<string, unknown>;
  /** Description of what this action does */
  description: string;
  /** Priority/order for executing multiple actions */
  priority?: number;
}

/**
 * Result of executing a plan step.
 * 
 * @interface
 */
export interface ExecutionResult {
  /** Whether the step execution was successful */
  success: boolean;
  /** The step that was executed */
  step: PlanStep;
  /** The updated plan with step status updated */
  updatedPlan: TaskPlan;
  /** Optional error message if execution failed */
  error?: string;
  /** Optional output/result from the execution */
  output?: unknown;
  /** Suggested next steps or actions */
  nextSteps?: string[];
}

/**
 * Type of code chunk.
 */
export enum ChunkType {
  /** Chunk based on symbol (function, class, method) via Serena */
  Symbol = "symbol",
  /** Sub-chunk within a large symbol (logical block) */
  SubSymbol = "sub_symbol",
  /** Range of lines from a file */
  FileRange = "file_range",
  /** Summary of merged chunks (dechunking) */
  Summary = "summary",
}

/**
 * Information about a logical block in code.
 * 
 * @interface
 */
export interface BlockInfo {
  /** Type of block (if, for, switch, while, try-catch, etc.) */
  type: string;
  /** Starting line number (1-based) */
  startLine: number;
  /** Ending line number (1-based, inclusive) */
  endLine: number;
  /** Depth/nesting level of the block */
  depth: number;
}

/**
 * Metadata for a code chunk.
 * 
 * @interface
 */
export interface ChunkMetadata {
  /** Type of chunk */
  type: ChunkType;
  /** Number of lines in the chunk */
  lineCount: number;
  /** Estimated token count (approximate) */
  estimatedTokens?: number;
  /** Summary/description of the chunk */
  summary?: string;
  /** Symbol name if chunk is based on a symbol */
  symbolName?: string;
  /** Symbol kind if chunk is based on a symbol */
  symbolKind?: string;
  /** Parent symbol name if this is a sub-chunk */
  parentSymbolName?: string;
  /** Array of original chunk IDs if this chunk was created by merging */
  mergedFrom?: string[];
}

/**
 * Represents a chunk of code.
 * 
 * A chunk can be:
 * - A symbol (function, class, method) via Serena LSP
 * - A sub-chunk within a large symbol (logical block)
 * - A range of lines from a file
 * - A summary of merged chunks (dechunking)
 * 
 * @interface
 */
export interface CodeChunk {
  /** Unique identifier for this chunk */
  id: string;
  /** File path containing the chunk */
  filePath: string;
  /** Starting line number (1-based) */
  startLine: number;
  /** Ending line number (1-based, inclusive) */
  endLine: number;
  /** Type of chunk */
  type: ChunkType;
  /** Metadata about the chunk */
  metadata: ChunkMetadata;
  /** Actual code content (optional, may be summary for merged chunks) */
  content?: string;
  /** Array of logical blocks within this chunk (for sub-chunks) */
  blocks?: BlockInfo[];
}

/**
 * Options for code chunking.
 * 
 * @interface
 */
export interface ChunkingOptions {
  /** Maximum number of chunks per step (default: 5) */
  maxChunksPerStep?: number;
  /** Maximum lines per chunk (default: 100) */
  maxLinesPerChunk?: number;
  /** Maximum tokens per chunk (optional, estimated) */
  maxTokensPerChunk?: number;
  /** Whether to include code content in chunks (default: true) */
  includeContent?: boolean;
  /** Whether to apply dechunking if limits exceeded (default: true) */
  applyDechunking?: boolean;
}

/**
 * Result of code chunking operation.
 * 
 * @interface
 */
export interface ChunkingResult {
  /** Array of code chunks */
  chunks: CodeChunk[];
  /** Statistics about the chunking process */
  stats: {
    /** Total number of chunks created */
    totalChunks: number;
    /** Number of chunks merged (dechunking) */
    chunksMerged: number;
    /** Total lines chunked */
    totalLines: number;
    /** Estimated total tokens */
    estimatedTokens: number;
  };
  /** Array of warnings generated during chunking */
  warnings: string[];
}

/**
 * Token metrics for a benchmark execution.
 * 
 * @interface
 */
export interface TokenMetrics {
  /** Input tokens (prompts sent to the model) */
  inputTokens: number;
  /** Output tokens (responses from the model) */
  outputTokens: number;
  /** Total tokens (input + output) */
  totalTokens: number;
  /** Timestamp when measurement was taken */
  timestamp: string;
}

/**
 * Definition of a benchmark scenario.
 * 
 * @interface
 */
export interface BenchmarkScenario {
  /** Unique identifier for the scenario */
  id: string;
  /** Name of the scenario */
  name: string;
  /** Type of task (bugfix, feature, refactor) */
  taskKind: TaskKind;
  /** Description of the scenario */
  description: string;
  /** Goal statement for the task */
  goal: string;
  /** Context or additional information */
  context?: string;
  /** Files/code involved in the scenario */
  filesInvolved?: string[];
  /** Estimated complexity (low, medium, high) */
  complexity: "low" | "medium" | "high";
  /** Estimated time to complete (in minutes) */
  estimatedTimeMinutes: number;
  /** Criteria for task completion */
  completionCriteria: string[];
}

/**
 * Execution record of a benchmark scenario.
 * 
 * @interface
 */
export interface ScenarioExecution {
  /** Unique identifier for this execution */
  id: string;
  /** Scenario that was executed */
  scenarioId: string;
  /** Type of execution (baseline or experimental) */
  executionType: "baseline" | "experimental";
  /** Start timestamp */
  startTime: string;
  /** End timestamp */
  endTime: string;
  /** Duration in milliseconds */
  durationMs: number;
  /** Token metrics */
  tokenMetrics: TokenMetrics;
  /** Additional metadata */
  metadata: {
    /** Plan used (if experimental) */
    planId?: string;
    /** Steps executed (if experimental) */
    stepsExecuted?: number;
    /** Chunks used (if experimental) */
    chunksUsed?: number;
    /** Prompts/key operations */
    keyOperations?: string[];
    /** Success status */
    success: boolean;
    /** Error message if failed */
    error?: string;
  };
}

/**
 * Result of a benchmark comparison.
 * 
 * @interface
 */
export interface BenchmarkResult {
  /** Scenario that was benchmarked */
  scenario: BenchmarkScenario;
  /** Baseline execution result */
  baseline: ScenarioExecution;
  /** Experimental execution result */
  experimental: ScenarioExecution;
  /** Token reduction percentage */
  tokenReductionPercent: number;
  /** Absolute token reduction */
  tokenReductionAbsolute: number;
  /** Time difference (experimental - baseline) in milliseconds */
  timeDifferenceMs: number;
  /** Analysis and conclusions */
  analysis: {
    /** Whether the benchmark met success criteria (≥30% reduction) */
    meetsSuccessCriteria: boolean;
    /** Observations about the results */
    observations: string[];
    /** Recommendations for parameter adjustment */
    recommendations?: string[];
  };
}
