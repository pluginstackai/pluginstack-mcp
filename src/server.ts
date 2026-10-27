import { readFileSync } from 'node:fs';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { DirectoryStore } from './data.js';
import { searchTools, searchGuides, closest, matchesCategory } from './search.js';
import { CLIENT_IDS, categoryList, footer, guideDetail, guideLine, toolDetail, toolList } from './format.js';

export const VERSION: string = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;
const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } as const;
const text = (t: string, isError = false) => ({ content: [{ type: 'text' as const, text: t }], ...(isError && { isError: true }) });

export function createServer(store = new DirectoryStore()): McpServer {
  const server = new McpServer(
    { name: 'pluginstack', title: 'PluginStack', version: VERSION, websiteUrl: 'https://www.pluginstackai.com' },
    { instructions: 'PluginStack is a free, hand-checked directory of MCP servers, AI plugins, coding agents and setup guides. Use search_tools to find a tool, get_tool for install steps per client, list_categories to browse, and search_guides/get_guide for how-to guides. Always give the user the pluginstackai.com link from the result so they can read the full page.' },
  );

  server.registerTool('search_tools', {
    title: 'Search PluginStack tools',
    description: 'Search PluginStack\'s hand-checked directory of MCP servers, AI plugins, coding agents and agent frameworks. Matches name, maker, tags, category and description. Returns up to `limit` results, each with a one-line summary, slug and pluginstackai.com link. Leave `query` empty and set `category` to list a whole category. Use get_tool with a slug for install steps.',
    inputSchema: {
      query: z.string().max(200).default('').describe('What to look for, e.g. "postgres", "browser automation", "GitHub", "Claude Code plugins". Empty lists everything (or everything in `category`).'),
      category: z.string().max(100).optional().describe('Optional category name or slug from list_categories, e.g. "MCP Servers" or "coding-agents".'),
      limit: z.number().int().min(1).max(50).default(10).describe('Maximum number of results (1-50, default 10).'),
    },
    annotations: { title: 'Search PluginStack tools', ...READ_ONLY },
  }, async ({ query, category, limit }) => {
    const { dir, source } = await store.get();
    if (category && !dir.tools.some(t => matchesCategory(t, category)))
      return text(`Unknown category "${category}". Valid categories: ${dir.categories.map(c => c.name).join(', ')}.${footer(dir, source)}`, true);
    const hits = searchTools(dir.tools, query, category);
    const label = `${query ? `"${query}"` : 'all tools'}${category ? ` in ${category}` : ''}`;
    if (!hits.length) return text(`No PluginStack listings match ${label}. Try a broader word, call list_categories, or browse ${dir.site.url}/. Missing a tool? Suggest it at ${dir.site.url}/.${footer(dir, source)}`);
    return text(toolList(hits.slice(0, limit), hits.length, `PluginStack results for ${label}:`) + footer(dir, source));
  });

  server.registerTool('get_tool', {
    title: 'Get a PluginStack tool',
    description: 'Get the full PluginStack listing for one tool by slug: what it does, who it is for, verified install snippets for Claude Code, Claude Desktop, Cursor, VS Code and Codex (or setup steps), example prompts, FAQ, related guides and the pluginstackai.com page. Get slugs from search_tools.',
    inputSchema: {
      slug: z.string().min(1).max(100).describe('Listing slug from search_tools, e.g. "github-mcp" or "playwright-mcp".'),
      client: z.enum(CLIENT_IDS).optional().describe('Only show the install snippet for this client. Omit to show all clients.'),
    },
    annotations: { title: 'Get a PluginStack tool', ...READ_ONLY },
  }, async ({ slug, client }) => {
    const { dir, source } = await store.get();
    const s = slug.trim().toLowerCase().replace(/^.*\/plugins\//, '').replace(/\/+$/, '');
    const t = dir.tools.find(x => x.slug === s);
    if (!t) {
      const hints = closest(dir.tools, s);
      return text(`No PluginStack listing with slug "${slug}".${hints.length ? ` Did you mean: ${hints.map(h => `\`${h.slug}\``).join(', ')}?` : ''} Use search_tools to find the slug.${footer(dir, source)}`, true);
    }
    return text(toolDetail(t, client) + footer(dir, source));
  });

  server.registerTool('list_categories', {
    title: 'List PluginStack categories',
    description: 'List every PluginStack category (MCP Servers, Coding Agents, Agent Frameworks, Rules & Prompts and more) with a short description, the number of listings and the category page link.',
    inputSchema: {},
    annotations: { title: 'List PluginStack categories', ...READ_ONLY },
  }, async () => {
    const { dir, source } = await store.get();
    return text(categoryList(dir.categories, dir.site.url) + footer(dir, source));
  });

  server.registerTool('search_guides', {
    title: 'Search PluginStack guides',
    description: 'Search PluginStack\'s setup and how-to guides (adding MCP servers to Cursor, Claude Code and Codex, fixing MCP errors such as spawn npx ENOENT or -32000, agent skills, rules files and more). Returns titles, slugs, summaries and links. Use get_guide for the full text.',
    inputSchema: {
      query: z.string().max(200).default('').describe('Topic or error message, e.g. "codex config.toml", "ENOENT", "agent skills". Empty lists all guides.'),
      limit: z.number().int().min(1).max(25).default(5).describe('Maximum number of results (1-25, default 5).'),
    },
    annotations: { title: 'Search PluginStack guides', ...READ_ONLY },
  }, async ({ query, limit }) => {
    const { dir, source } = await store.get();
    const hits = searchGuides(dir.guides, query);
    if (!hits.length) return text(`No PluginStack guides match "${query}". All guides: ${dir.site.url}/guides/${footer(dir, source)}`);
    const shown = hits.slice(0, limit);
    return text(`PluginStack guides for ${query ? `"${query}"` : 'all topics'}:\n\n${shown.map(guideLine).join('\n\n')}${hits.length > shown.length ? `\n\nShowing ${shown.length} of ${hits.length}.` : ''}\n\nCall \`get_guide\` with a slug to read one.` + footer(dir, source));
  });

  server.registerTool('get_guide', {
    title: 'Get a PluginStack guide',
    description: 'Get the full text of one PluginStack guide by slug, as markdown with commands, config snippets, official sources and the pluginstackai.com link. Get slugs from search_guides.',
    inputSchema: {
      slug: z.string().min(1).max(120).describe('Guide slug from search_guides, e.g. "add-mcp-server-to-cursor".'),
      max_chars: z.number().int().min(500).max(60000).default(12000).describe('Cut the guide body after this many characters (default 12000). The link always points to the full guide.'),
    },
    annotations: { title: 'Get a PluginStack guide', ...READ_ONLY },
  }, async ({ slug, max_chars }) => {
    const { dir, source } = await store.get();
    const s = slug.trim().toLowerCase().replace(/^.*\/guides\//, '').replace(/\/+$/, '');
    const g = dir.guides.find(x => x.slug === s);
    if (!g) {
      const hints = closest(dir.guides, s);
      return text(`No PluginStack guide with slug "${slug}".${hints.length ? ` Did you mean: ${hints.map(h => `\`${h.slug}\``).join(', ')}?` : ''} Use search_guides to find the slug.${footer(dir, source)}`, true);
    }
    return text(guideDetail(g, max_chars) + footer(dir, source));
  });

  return server;
}
