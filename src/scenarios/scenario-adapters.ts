/**
 * Helpers for adapting benchmark scenarios to different repositories
 * @module scenarios/scenario-adapters
 * 
 * Provides functionality to adapt a base scenario to work with different
 * repository structures and technologies.
 */

import type { BenchmarkScenario } from "../types/index.js";

/**
 * Repository-specific adaptation mappings.
 * 
 * Maps repository identifiers to adaptation functions that modify
 * scenario properties based on repository structure.
 */
const REPOSITORY_ADAPTATIONS: Record<
  string,
  (scenario: BenchmarkScenario) => Partial<BenchmarkScenario>
> = {
  /**
   * Adapts scenario for pyTodo (Python console TODO app)
   * Structure: main.py, todolist/ module
   */
  pytodo: (scenario) => ({
    repository: "pytodo",
    goal: scenario.goal.replace(/analyze-tokens|analyze/gi, "analyze-tasks"),
    context: scenario.context
      ? scenario.context.replace(/ITok|tokens/gi, (match) => {
          if (match.toLowerCase() === "itok") return "pyTodo";
          if (match.toLowerCase() === "tokens") return "tasks";
          return match;
        })
      : "Python console TODO application with simple structure (main.py, todolist/ module).",
    filesInvolved: [
      "main.py",
      "todolist/cli.py",
      "todolist/ListBackend.py",
    ],
  }),

  /**
   * Adapts scenario for flaskToDo (Flask web TODO app)
   * Structure: app.py, templates/, static/, todos.db
   */
  flasktodo: (scenario) => ({
    repository: "flasktodo",
    goal: scenario.goal.replace(/analyze-tokens|analyze/gi, "analyze-todos"),
    context: scenario.context
      ? scenario.context.replace(/ITok|tokens|CLI command/gi, (match) => {
          if (match.toLowerCase() === "itok") return "flaskToDo";
          if (match.toLowerCase() === "tokens") return "todos";
          if (match.toLowerCase().includes("cli")) return "endpoint or view";
          return match;
        }) + " Flask web application with SQLite database (todos.db)."
      : "Flask web TODO application with app.py, templates/, static/, and SQLite database.",
    filesInvolved: [
      "app.py",
      "templates/index.html",
      "todos.db",
    ],
  }),

  /**
   * Adapts scenario for django-htmx-todo-list (Django + HTMX)
   * Structure: tasker/ and tasker2/ apps, manage.py
   */
  "django-htmx": (scenario) => ({
    repository: "django-htmx",
    goal: scenario.goal.replace(/analyze-tokens|analyze/gi, "analyze-tasklists"),
    context: scenario.context
      ? scenario.context.replace(/ITok|tokens|CLI command/gi, (match) => {
          if (match.toLowerCase() === "itok") return "django-htmx-todo-list";
          if (match.toLowerCase() === "tokens") return "task lists";
          if (match.toLowerCase().includes("cli")) return "HTMX view";
          return match;
        }) + " Django application with HTMX integration (tasker/ and tasker2/ apps)."
      : "Django TODO application with HTMX integration. Structure includes tasker/ and tasker2/ apps with models, views, templates, and HTMX endpoints.",
    filesInvolved: [
      "tasker/manage.py",
      "tasker/tasker/tasks/models.py",
      "tasker/tasker/tasks/views.py",
      "tasker/tasker/tasks/templates/tasks/tasklist_list.html",
    ],
  }),

  /**
   * Adapts scenario for ITok (TypeScript MCP server)
   * Structure: src/ with TypeScript modules
   */
  itok: (scenario) => ({
    // ITok scenarios typically don't need adaptation, but we ensure repository is set
    repository: "itok",
  }),
};

/**
 * Adapts a benchmark scenario for a specific repository.
 * 
 * Modifies the scenario's goal, context, and filesInvolved to match
 * the structure and conventions of the target repository.
 * 
 * @param scenario - Base scenario to adapt
 * @param repository - Repository identifier (e.g., "pytodo", "flasktodo", "django-htmx", "itok")
 * @returns Adapted scenario with repository-specific modifications
 */
export function adaptScenarioForRepository(
  scenario: BenchmarkScenario,
  repository: string
): BenchmarkScenario {
  const normalizedRepo = repository.toLowerCase().replace(/-/g, "");
  
  // Get adaptation function for this repository
  const adaptation = REPOSITORY_ADAPTATIONS[normalizedRepo];
  
  if (!adaptation) {
    // If no specific adaptation, just set the repository field
    return {
      ...scenario,
      repository: normalizedRepo,
    };
  }
  
  // Apply adaptation
  const adaptations = adaptation(scenario);
  
  // Merge adaptations with original scenario
  return {
    ...scenario,
    ...adaptations,
    repository: adaptations.repository || normalizedRepo,
  };
}

/**
 * Gets the list of supported repository identifiers.
 * 
 * @returns Array of supported repository identifiers
 */
export function getSupportedRepositories(): string[] {
  return Object.keys(REPOSITORY_ADAPTATIONS);
}

