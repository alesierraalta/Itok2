/**
 * Medium feature scenario definition.
 * 
 * Represents a moderate functionality implementation task.
 */

import { type BenchmarkScenario, TaskKind } from "../types/index.js";

export const mediumFeatureScenario: BenchmarkScenario = {
  id: "medium-feature-001",
  name: "Add User Authentication with JWT Tokens",
  taskKind: TaskKind.Feature,
  description: "Implement user authentication system using JWT (JSON Web Tokens). This includes login endpoint, token generation, token validation middleware, and protected route handling. The system should integrate with existing user database and follow security best practices.",
  goal: "Add user authentication with JWT tokens including login, token generation, validation middleware, and protected routes",
  context: "The application currently has no authentication system. Users need to be able to log in, receive JWT tokens, and access protected routes. The system should validate tokens on each request and handle token expiration gracefully.",
  filesInvolved: [
    "src/auth/auth.service.ts",
    "src/auth/auth.controller.ts",
    "src/auth/auth.middleware.ts",
    "src/auth/auth.types.ts",
    "src/auth/auth.test.ts",
  ],
  complexity: "medium",
  estimatedTimeMinutes: 25,
  completionCriteria: [
    "Login endpoint generates valid JWT tokens",
    "Token validation middleware correctly validates tokens",
    "Protected routes require valid authentication",
    "Token expiration is handled gracefully",
    "Unit tests cover authentication flow",
    "Security best practices are followed (token signing, expiration, refresh)",
  ],
};

