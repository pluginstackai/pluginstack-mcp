# PluginStack MCP server

Search [PluginStack](https://www.pluginstackai.com), a free, hand-checked directory of MCP servers, AI plugins and agent tools, from inside Claude, Cursor, VS Code, Codex or any other MCP client.

Ask things like "find me an MCP server for Postgres" or "how do I add Playwright MCP to Codex?" and get short answers with copy-paste install config and a link to the full PluginStack page.

- Free and open source (MIT). No account, no API key, no tracking.
- Read-only. It only reads PluginStack's own public listings and guides.
- Works offline: if the site can't be reached it falls back to a snapshot bundled with the package.

## Tools

| Tool | What it does |
| --- | --- |
| `search_tools` | Search listings by keyword (`query`), optionally within a `category`. Returns name, category, maker, a one-line summary, the slug and the PluginStack link. |
| `get_tool` | Full details for one listing by `slug` (or its PluginStack URL): what it does, who it's for, install config for Claude Code, Claude Desktop, Cursor, VS Code and Codex (or setup steps), example prompts, FAQ and related guides. Optional `client` returns one client's config only. |
| `list_categories` | All categories with a short description, listing count and link. |
| `search_guides` | Search PluginStack's setup and troubleshooting guides (for example "spawn npx ENOENT" or "codex config.toml"). |
| `get_guide` | Read one guide as Markdown by `slug`, with its sources. Long guides are trimmed to `max_chars` (default 12000) with a link to the full page. |

Every response ends with a link back to the canonical page on pluginstackai.com.

## Install

Requires Node.js 18 or newer. The server runs with `npx`, so there is nothing else to install.

### Claude Code

```bash
claude mcp add --transport stdio pluginstack -- npx -y pluginstack-mcp
```

Run `/mcp` inside Claude Code to check it connected.

### Claude Desktop

Settings → Developer → Edit Config, then add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "pluginstack": {
      "command": "npx",
      "args": ["-y", "pluginstack-mcp"]
    }
  }
}
```

Fully quit and reopen Claude Desktop. (A one-click `.mcpb` bundle is also available on the [releases page](https://github.com/pluginstackai/pluginstack-mcp/releases).)

### Cursor

Add to `.cursor/mcp.json` in a project, or `~/.cursor/mcp.json` for all projects:

```json
{
  "mcpServers": {
    "pluginstack": {
      "command": "npx",
      "args": ["-y", "pluginstack-mcp"]
    }
  }
}
```

### VS Code

Add to `.vscode/mcp.json` (note the top-level `servers` key):

```json
{
  "servers": {
    "pluginstack": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "pluginstack-mcp"]
    }
  }
}
```

### Codex

```bash
codex mcp add pluginstack -- npx -y pluginstack-mcp
```

Or in `~/.codex/config.toml`:

```toml
[mcp_servers.pluginstack]
command = "npx"
args = ["-y", "pluginstack-mcp"]
```

### Windows

If you see `spawn npx ENOENT`, wrap the command in `cmd /c`: use `"command": "cmd"` and `"args": ["/c", "npx", "-y", "pluginstack-mcp"]`. See [Fix "spawn npx ENOENT" for MCP servers on Windows](https://www.pluginstackai.com/guides/fix-spawn-npx-enoent-windows-mcp/).

## Example prompts

- "Use PluginStack to find an MCP server that lets Claude control a browser."
- "What MCP servers does PluginStack list for databases? Give me the install config for Cursor."
- "How do I add the Context7 MCP server to Codex?"
- "List PluginStack's categories."
- "I'm getting MCP error -32000 Connection closed. Find the PluginStack guide and walk me through it."
- "Compare the coding agents on PluginStack and tell me which are open source."

## Settings (optional)

| Environment variable | Default | Effect |
| --- | --- | --- |
| `PLUGINSTACK_OFFLINE` | unset | Set to `1` to use only the bundled snapshot and make no network requests. |
| `PLUGINSTACK_DIRECTORY_URL` | `https://www.pluginstackai.com/directory.json` | Where to load the directory from. |

## How it works

The server fetches PluginStack's public [`/directory.json`](https://www.pluginstackai.com/directory.json) (the same data as the website) and caches it for an hour. If that fails it uses the copy in `data/directory.json`, and says so in its answers. It sends no data about you or your conversations; the only network request is that one GET.

## Development

```bash
npm install
npm test                      # build, then call every tool through the official MCP SDK client
npm run snapshot              # refresh data/directory.json from the live site
npm run validate:server-json  # check server.json against the MCP Registry schema
npm run bundle                # build pluginstack-mcp.mcpb (Claude Desktop / Smithery)
npx @modelcontextprotocol/inspector node dist/index.js
```

## Links

- Website: https://www.pluginstackai.com
- Suggest a tool or report a problem: [open an issue](https://github.com/pluginstackai/pluginstack-mcp/issues) or email pluginstackai@gmail.com

## License

MIT © PluginStack
