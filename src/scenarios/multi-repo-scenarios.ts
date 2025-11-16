/**
 * Multi-repository benchmark scenarios
 * @module scenarios/multi-repo-scenarios
 * 
 * Base scenarios that can be adapted to work with different repositories.
 * Based on the standard task from MCP Testing Guide: adding analysis functionality.
 */

import { type BenchmarkScenario, TaskKind } from "../types/index.js";

/**
 * Base scenario for ITok: Add analyze-tokens CLI command
 * 
 * Task: Add a CLI subcommand "analyze-tokens" that receives a text file path,
 * counts tokens using ITok's tokenization logic, and prints a summary.
 */
export const analyzeTokensScenario: BenchmarkScenario = {
  id: "analyze-tokens-itok-001",
  name: "Add analyze-tokens CLI Command to ITok",
  taskKind: TaskKind.Feature,
  description: "Add a new CLI subcommand 'analyze-tokens' to ITok that receives a text file path, counts tokens using ITok's tokenization logic, and prints a summary including total tokens, line count, and brief content summary.",
  goal: "Add analyze-tokens CLI subcommand to ITok that counts tokens in a text file and displays summary",
  context: "ITok is a TypeScript MCP server for tokenization optimization. The CLI currently exists but needs a new subcommand for analyzing token counts in files. The subcommand should integrate with existing CLI structure and use ITok's tokenization logic.",
  filesInvolved: [
    "src/server/index.ts",
    "src/config/constants.ts",
    "package.json",
  ],
  complexity: "low",
  estimatedTimeMinutes: 15,
  completionCriteria: [
    "analyze-tokens subcommand is added to CLI",
    "Subcommand accepts file path as parameter",
    "Token counting uses ITok's tokenization logic",
    "Output includes: total tokens, line count, brief summary (2-3 sentences)",
    "Subcommand is integrated with existing CLI structure",
    "Code follows ITok's TypeScript patterns and style",
  ],
  repository: "itok",
};

/**
 * Base scenario for pyTodo: Add analyze-tasks functionality
 * 
 * Task: Add functionality to analyze tasks in the TODO list (count, creation time, etc.)
 */
export const analyzeTasksScenario: BenchmarkScenario = {
  id: "analyze-tasks-pytodo-001",
  name: "Add Task Analysis to pyTodo",
  taskKind: TaskKind.Feature,
  description: "Add functionality to analyze tasks in the pyTodo console application. The analysis should count total tasks, show creation times, and provide a brief summary of task status.",
  goal: "Add task analysis functionality to pyTodo that counts tasks and shows creation times",
  context: "pyTodo is a Python console TODO application using curses. It has a simple structure with main.py and todolist/ module. The analysis should integrate with the existing CLI interface.",
  filesInvolved: [
    "main.py",
    "todolist/cli.py",
    "todolist/ListBackend.py",
  ],
  complexity: "low",
  estimatedTimeMinutes: 12,
  completionCriteria: [
    "Analysis functionality counts total tasks in list",
    "Shows creation time information for tasks",
    "Provides brief summary of task status",
    "Integrates with existing pyTodo CLI interface",
    "Code follows Python best practices",
  ],
  repository: "pytodo",
};

/**
 * Base scenario for flaskToDo: Add analyze-todos endpoint
 * 
 * Task: Add an endpoint or view that analyzes todos in the database and returns analysis in JSON or HTML
 */
export const analyzeTodosScenario: BenchmarkScenario = {
  id: "analyze-todos-flasktodo-001",
  name: "Add Todo Analysis Endpoint to flaskToDo",
  taskKind: TaskKind.Feature,
  description: "Add an endpoint or view to flaskToDo that analyzes todos in the SQLite database, counts them, and returns a small analysis in JSON or HTML format.",
  goal: "Add endpoint/view to flaskToDo that analyzes todos in database and returns analysis",
  context: "flaskToDo is a Flask web application with SQLite database (todos.db). It has app.py, templates/, and static/ directories. The analysis should integrate with existing Flask routes and can return JSON or HTML.",
  filesInvolved: [
    "app.py",
    "templates/index.html",
    "todos.db",
  ],
  complexity: "low",
  estimatedTimeMinutes: 15,
  completionCriteria: [
    "Endpoint/view analyzes todos in database",
    "Counts total todos and provides statistics",
    "Returns analysis in JSON or HTML format",
    "Integrates with existing Flask routes",
    "Follows Flask best practices",
  ],
  repository: "flasktodo",
};

/**
 * Base scenario for django-htmx-todo-list: Add analyze-tasklists HTMX view
 * 
 * Task: Add a view + HTMX template that analyzes a specific task list and shows simple statistics in the UI
 */
export const analyzeTaskListsScenario: BenchmarkScenario = {
  id: "analyze-tasklists-django-htmx-001",
  name: "Add Task List Analysis View to django-htmx-todo-list",
  taskKind: TaskKind.Feature,
  description: "Add a Django view with HTMX template that analyzes a specific task list, calculates statistics (total tasks, completion status, etc.), and displays them in the UI using HTMX.",
  goal: "Add HTMX view to django-htmx-todo-list that analyzes task lists and shows statistics",
  context: "django-htmx-todo-list is a Django application with HTMX integration. It has tasker/ and tasker2/ apps with models, views, templates, and HTMX endpoints. The analysis should integrate with existing HTMX patterns.",
  filesInvolved: [
    "tasker/manage.py",
    "tasker/tasker/tasks/models.py",
    "tasker/tasker/tasks/views.py",
    "tasker/tasker/tasks/templates/tasks/tasklist_list.html",
  ],
  complexity: "medium",
  estimatedTimeMinutes: 20,
  completionCriteria: [
    "Django view analyzes specific task list",
    "Calculates statistics (total tasks, completion status, etc.)",
    "HTMX template displays statistics in UI",
    "Integrates with existing HTMX patterns",
    "Follows Django and HTMX best practices",
  ],
  repository: "django-htmx",
};

/**
 * All multi-repository scenarios
 */
export const allMultiRepoScenarios: BenchmarkScenario[] = [
  analyzeTokensScenario,
  analyzeTasksScenario,
  analyzeTodosScenario,
  analyzeTaskListsScenario,
];

/**
 * Get a scenario by repository identifier
 * 
 * @param repository - Repository identifier
 * @returns Scenario for the repository, or undefined if not found
 */
export function getScenarioByRepository(repository: string): BenchmarkScenario | undefined {
  const normalizedRepo = repository.toLowerCase().replace(/-/g, "");
  return allMultiRepoScenarios.find(
    (s) => s.repository?.toLowerCase().replace(/-/g, "") === normalizedRepo
  );
}

