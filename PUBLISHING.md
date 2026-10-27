# Publishing checklist (nothing below has been done yet)

Order matters: GitHub repo → npm → MCP Registry → Glama → awesome-mcp-servers → mcp.so → Smithery.
Use the faceless PluginStack accounts only (GitHub `pluginstackai`, email pluginstackai@gmail.com).

## 0. Make /directory.json live
Deploy the site branch `mcp-directory-json` so https://www.pluginstackai.com/directory.json returns 200.
Until then the server works but answers from its bundled snapshot (and says so).

## 1. GitHub repo
1. Signed in as `pluginstackai`, create the public repo `pluginstackai/pluginstack-mcp` (no README/license; they're here already).
   Add topics: `mcp`, `mcp-server`, `model-context-protocol`, `mcp-directory`.
2. `git remote add origin https://github.com/pluginstackai/pluginstack-mcp.git && git push -u origin main`
3. Check the commit author shows "PluginStack" (not a personal name).

## 2. npm (owner does this: account + 2FA)
1. Create an npm account at https://www.npmjs.com/signup with pluginstackai@gmail.com (username e.g. `pluginstackai`) and turn on 2FA.
2. `npm login`, then in this folder: `npm publish` (runs the tests first via prepublishOnly; asks for the 2FA code).
3. Check: `npx -y pluginstack-mcp --version` prints 0.1.0.

## 3. Official MCP Registry
1. Install the publisher: https://github.com/modelcontextprotocol/registry/releases (`mcp-publisher`), or `brew install mcp-publisher`.
2. `npm run validate:server-json`
3. `mcp-publisher login github` — device flow; approve it while signed in to GitHub as `pluginstackai`. This grants the `io.github.pluginstackai/*` namespace (pluginstackai is a personal account, so no org setup needed).
4. `mcp-publisher publish`
5. Check: `curl "https://registry.modelcontextprotocol.io/v0.1/servers?search=pluginstack"`
   (The registry checks that the npm package's `mcpName` equals `io.github.pluginstackai/pluginstack-mcp`, so npm must be published first.)
   Later, to use `com.pluginstackai/...` instead, use `mcp-publisher login dns` or `login http` with a key published on the domain.

## 4. Glama
1. Glama indexes public GitHub MCP repos on its own; or add it at https://glama.ai/mcp/servers (Add server).
2. Sign in to Glama with GitHub as `pluginstackai`; `glama.json` lists that account as maintainer so the listing can be claimed.
3. In the server's admin page, set the build: Node, build steps `npm ci` and `npm run build`, command `node dist/index.js`, no env vars. (A Dockerfile is also in the repo.) Glama then starts it and checks the tools, which earns the score badge.

## 5. awesome-mcp-servers (punkpeye)
After the Glama listing exists (the list wants the Glama badge), open a PR from a fork as `pluginstackai` adding this line in alphabetical order under **Aggregators** (or Search & Data Extraction):

```
- [pluginstackai/pluginstack-mcp](https://github.com/pluginstackai/pluginstack-mcp) [![pluginstackai/pluginstack-mcp MCP server](https://glama.ai/mcp/servers/pluginstackai/pluginstack-mcp/badges/score.svg)](https://glama.ai/mcp/servers/pluginstackai/pluginstack-mcp) 📇 ☁️ 🍎 🪟 🐧 - Search PluginStack's hand-checked directory of MCP servers, AI agent tools and setup guides, with install config for Claude, Cursor, VS Code and Codex.
```
Use the exact badge URL Glama shows. Read CONTRIBUTING.md first; one server per PR.

## 6. mcp.so
Submit https://github.com/pluginstackai/pluginstack-mcp at https://mcp.so/submit (free, reviewed; there's an optional paid fast track, not needed).

## 7. Smithery
- Local bundle: `npm run bundle`, then `npx @smithery/cli mcp publish ./pluginstack-mcp.mcpb -n pluginstackai/pluginstack` (after signing in to smithery.ai with GitHub as pluginstackai). The manifest has no `tools` list on purpose (a populated list has broken Smithery's MCPB publish).
- Also attach `pluginstack-mcp.mcpb` to a GitHub release (v0.1.0) so Claude Desktop users can install it with a double-click; the README links the releases page.
- If a remote HTTP endpoint is added later, publish that URL at https://smithery.ai/new instead.

## Releasing a new version
1. `npm run snapshot` (refresh data), bump `version` in package.json, server.json (both places) and manifest.json.
2. `npm test && npm run validate:server-json && npm run bundle`
3. Commit, tag `vX.Y.Z`, push, `npm publish`, `mcp-publisher publish`, attach the new .mcpb to a release.
