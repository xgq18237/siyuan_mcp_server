#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { SiyuanClient } from "./siyuan-client.js";
import { invokeTool, toolDefinitions } from "./tools.js";

export const SERVER_VERSION = "1.1.0";

export function createServer(client = new SiyuanClient()): Server {
  const server = new Server(
    { name: "siyuan-mcp", version: SERVER_VERSION },
    { capabilities: { tools: {}, resources: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: toolDefinitions,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) =>
    invokeTool(client, request.params.name, request.params.arguments));

  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: [
      {
        uri: "siyuan://recent",
        name: "最近更新的 10 篇文档",
        description: "仅返回必要字段，避免将整篇正文注入上下文",
        mimeType: "application/json",
      },
      {
        uri: "siyuan://notebooks",
        name: "所有笔记本",
        mimeType: "application/json",
      },
    ],
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async ({ params: { uri } }) => {
    try {
      if (uri === "siyuan://recent") {
        const data = await client.json(
          "/api/query/sql",
          {
            stmt: "SELECT id, box, hpath, content, created, updated FROM blocks WHERE type = 'd' ORDER BY updated DESC LIMIT 10",
          },
        );
        return {
          contents: [{
            uri,
            mimeType: "application/json",
            text: JSON.stringify(data, null, 2),
          }],
        };
      }
      if (uri === "siyuan://notebooks") {
        const data = await client.json("/api/notebook/lsNotebooks");
        return {
          contents: [{
            uri,
            mimeType: "application/json",
            text: JSON.stringify(data, null, 2),
          }],
        };
      }
      throw new Error(`未知资源：${uri}`);
    } catch (error) {
      return {
        contents: [{
          uri,
          mimeType: "application/json",
          text: JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
          }),
        }],
      };
    }
  });

  return server;
}

async function main(): Promise<void> {
  const server = createServer();
  await server.connect(new StdioServerTransport());
}

const invokedDirectly = process.argv[1]
  && new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")
    === process.argv[1].replace(/\\/g, "/");

if (invokedDirectly) {
  main().catch((error) => {
    console.error("[siyuan-mcp] fatal:", error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
