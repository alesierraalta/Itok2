/**
 * Main entry point for the Itok MCP server
 * @module server/index
 */

import express from "express";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpServer } from "./mcp-server.js";
import { DEFAULT_PORT } from "../config/constants.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";

/**
 * Starts the MCP server with HTTP transport
 * @param port - Optional port number (defaults to DEFAULT_PORT)
 */
export async function startServer(port?: number): Promise<void> {
  const serverPort = port || DEFAULT_PORT;

  try {
    // Create Express app
    const app = express();
    app.use(express.json());


    // Note: Transport will be created per-request in the handler

    // Map to store transports by session ID
    const transports: Record<string, StreamableHTTPServerTransport> = {};

    // MCP POST endpoint handler
    const mcpPostHandler = async (
      req: express.Request,
      res: express.Response
    ) => {
      const sessionId = req.headers["mcp-session-id"] as string | undefined;

      try {
        let transport: StreamableHTTPServerTransport;

        if (sessionId && transports[sessionId]) {
          // Reuse existing transport
          transport = transports[sessionId];
        } else if (!sessionId && isInitializeRequest(req.body)) {
          // New initialization request - create transport and connect server
          transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: (sid) => {
              console.log(`[Itok MCP Server] Session initialized: ${sid}`);
              transports[sid] = transport;
            },
            onsessionclosed: (sid) => {
              console.log(`[Itok MCP Server] Session closed: ${sid}`);
              delete transports[sid];
            },
          });

          // Set up onclose handler
          transport.onclose = () => {
            const sid = transport.sessionId;
            if (sid && transports[sid]) {
              delete transports[sid];
            }
          };

          // Create and connect MCP server to transport
          const mcpServer = createMcpServer();
          await mcpServer.connect(transport);

          // Handle the initialization request
          await transport.handleRequest(req, res, req.body);
          return;
        } else {
          // Invalid request
          res.status(400).json({
            jsonrpc: "2.0",
            error: {
              code: -32000,
              message: "Bad Request: No valid session ID provided",
            },
            id: null,
          });
          return;
        }

        // Handle request with existing transport
        await transport.handleRequest(req, res, req.body);
      } catch (error) {
        console.error("[Itok MCP Server] Error handling request:", error);
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: "2.0",
            error: {
              code: -32603,
              message: "Internal server error",
            },
            id: null,
          });
        }
      }
    };

    // Set up POST route for MCP requests
    app.post("/mcp", mcpPostHandler);

    // Health check endpoint
    app.get("/health", (req, res) => {
      res.json({ status: "ok", server: "itok", version: "0.1.0" });
    });

    // Start HTTP server
    app.listen(serverPort, () => {
      console.log(`[Itok MCP Server] Starting on port ${serverPort}`);
      console.log(`[Itok MCP Server] MCP endpoint: http://localhost:${serverPort}/mcp`);
      console.log(`[Itok MCP Server] Health check: http://localhost:${serverPort}/health`);
    });

    // Handle server shutdown
    process.on("SIGINT", async () => {
      console.log("[Itok MCP Server] Shutting down...");
      for (const sid in transports) {
        try {
          await transports[sid].close();
          delete transports[sid];
        } catch (error) {
          console.error(`[Itok MCP Server] Error closing transport ${sid}:`, error);
        }
      }
      process.exit(0);
    });
  } catch (error) {
    console.error("[Fatal Error] Failed to start server:", error);
    process.exit(1);
  }
}

// Start server if this file is run directly
// Check if running as main module (for stdio) or if PORT is set (for HTTP)
const isMainModule = import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}` ||
                      import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, '/') || '') ||
                      process.argv[1]?.endsWith('index.js');

if (isMainModule) {
  // If PORT is set, use HTTP transport
  if (process.env.PORT) {
    const port = parseInt(process.env.PORT, 10);
    startServer(port).catch((error) => {
      console.error("Failed to start server:", error);
      process.exit(1);
    });
  } else {
    // Otherwise, use stdio transport for Cursor
    import("@modelcontextprotocol/sdk/server/stdio.js").then(({ StdioServerTransport }) => {
      const transport = new StdioServerTransport();
      const mcpServer = createMcpServer();
      mcpServer.connect(transport).catch((error) => {
        console.error("Failed to connect server to transport:", error);
        process.exit(1);
      });
    }).catch((error) => {
      console.error("Failed to load stdio transport:", error);
      process.exit(1);
    });
  }
}

