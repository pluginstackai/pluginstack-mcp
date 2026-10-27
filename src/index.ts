#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer, VERSION } from './server.js';

const arg = process.argv[2];
if (arg === '--version' || arg === '-v') { console.log(VERSION); process.exit(0); }
if (arg === '--help' || arg === '-h') {
  console.log(`pluginstack-mcp ${VERSION}: MCP server for the PluginStack directory (https://www.pluginstackai.com)

Usage: npx -y pluginstack-mcp      (speaks MCP over stdio; add it to your MCP client)

Env:
  PLUGINSTACK_OFFLINE=1          use the bundled snapshot only, no network
  PLUGINSTACK_DIRECTORY_URL=...  read the directory JSON from another URL`);
  process.exit(0);
}

const server = createServer();
await server.connect(new StdioServerTransport());
// stdout carries MCP messages; log to stderr only.
console.error(`pluginstack-mcp ${VERSION} running on stdio`);
