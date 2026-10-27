// End-to-end test: spawns the built server over stdio with the official SDK client and calls every tool.
// Usage: node test/smoke.mjs [--print]   (env PLUGINSTACK_DIRECTORY_URL / PLUGINSTACK_OFFLINE are passed through)
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import assert from 'node:assert/strict';

const print = process.argv.includes('--print');
const transport = new StdioClientTransport({ command: process.execPath, args: [process.env.SMOKE_SERVER || new URL('../dist/index.js', import.meta.url).pathname], env: { ...process.env }, stderr: 'pipe' });
const client = new Client({ name: 'pluginstack-smoke', version: '0.0.0' });
await client.connect(transport);

const SITE = 'https://www.pluginstackai.com';
let n = 0;
async function call(name, args, check) {
  const res = await client.callTool({ name, arguments: args });
  const t = res.content.map(c => c.text).join('\n');
  if (print) console.log(`\n===== ${name} ${JSON.stringify(args)}${res.isError ? ' (isError)' : ''}\n${t}`);
  assert.ok(t.includes(SITE), `${name}: response must link to ${SITE}`);
  check(t, res);
  n++;
  return t;
}

const info = client.getServerVersion();
assert.equal(info.name, 'pluginstack');
const { tools } = await client.listTools();
assert.deepEqual(tools.map(t => t.name).sort(), ['get_guide', 'get_tool', 'list_categories', 'search_guides', 'search_tools']);
for (const t of tools) { assert.ok(t.description.length > 60, `${t.name} description`); assert.equal(t.annotations?.readOnlyHint, true); }

await call('search_tools', { query: 'github' }, (t, r) => { assert.ok(!r.isError); assert.match(t, /^1\. \*\*GitHub MCP Server\*\*/m); assert.match(t, /\/plugins\/github-mcp-server\//); });
await call('search_tools', { query: 'browser automation', limit: 3 }, (t) => { assert.match(t, /playwright|browser|chrome/i); assert.ok((t.match(/^\d+\. \*\*/gm) || []).length <= 3); });
await call('search_tools', { query: '', category: 'coding-agents', limit: 50 }, (t) => { assert.match(t, /in coding-agents/); assert.match(t, /\(Coding Agents,/); });
await call('search_tools', { query: 'qqzx unicorn spreadsheet' }, (t) => assert.match(t, /No PluginStack listings match/));
await call('search_tools', { query: 'x', category: 'Nope' }, (t, r) => { assert.equal(r.isError, true); assert.match(t, /Unknown category/); });

await call('get_tool', { slug: 'playwright-mcp' }, (t, r) => { assert.ok(!r.isError); for (const c of ['Claude Code', 'Claude Desktop', 'Cursor', 'VS Code', 'Codex']) assert.ok(t.includes(`### ${c}`), c); assert.match(t, /PluginStack page: https:\/\/www\.pluginstackai\.com\/plugins\/playwright-mcp\//); });
await call('get_tool', { slug: 'brave-search-mcp', client: 'codex' }, (t) => { assert.match(t, /### Codex/); assert.ok(!t.includes('### Cursor')); assert.match(t, /codex mcp add/); });
await call('get_tool', { slug: 'github-mcp-server' }, (t) => assert.match(t, /## (How to set it up|Install)/));
await call('get_tool', { slug: `${SITE}/plugins/context7/` }, (t, r) => { assert.ok(!r.isError); assert.match(t, /^# /); });
await call('get_tool', { slug: 'githb' }, (t, r) => { assert.equal(r.isError, true); assert.match(t, /No PluginStack listing/); });

await call('list_categories', {}, (t) => { assert.match(t, /\*\*MCP Servers\*\*/); assert.match(t, /\/categories\/mcp-servers\//); });

await call('search_guides', { query: 'ENOENT' }, (t) => assert.match(t, /fix-spawn-npx-enoent-windows-mcp/));
await call('search_guides', { query: 'codex config.toml', limit: 2 }, (t) => assert.match(t, /add-mcp-server-to-codex-config-toml/));
await call('search_guides', {}, (t) => assert.match(t, /add-mcp-server-to-cursor/));
await call('get_guide', { slug: 'add-mcp-server-to-cursor' }, (t, r) => { assert.ok(!r.isError); assert.match(t, /mcp\.json/); assert.match(t, /## Sources/); });
await call('get_guide', { slug: 'fix-mcp-error-32000-connection-closed', max_chars: 600 }, (t) => assert.match(t, /Guide truncated/));
await call('get_guide', { slug: 'cursor-guide' }, (t, r) => { assert.equal(r.isError, true); assert.match(t, /Did you mean/); });

const last = await call('list_categories', {}, () => {});
console.log(`OK: ${tools.length} tools listed, ${n} calls passed. Data: ${/Source: (.*)\./.exec(last)?.[1]}`);
await client.close();
