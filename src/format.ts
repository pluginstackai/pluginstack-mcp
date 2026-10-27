import type { Category, Directory, Guide, Tool } from './types.js';
import type { Source } from './data.js';

const clip = (s: string, n: number) => (s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…');
const fence = (code: string, lang = '') => '```' + lang + '\n' + code + '\n```';

export function footer(dir: Directory, source: Source): string {
  const data = source.kind === 'live' ? `live data from ${source.url}` : `bundled snapshot from ${dir.generated.slice(0, 10)}${source.note ? ` (${source.note})` : ''}`;
  return `\n---\nFrom PluginStack (${dir.site.url}), a free, hand-checked directory of MCP servers, AI plugins and agent tools. Source: ${data}.`;
}

export function toolLine(t: Tool, i: number): string {
  return `${i + 1}. **${t.name}** (${t.category}, by ${t.maker}), slug \`${t.slug}\`\n   ${clip(t.what, 220)}\n   ${t.url}`;
}

export function toolList(tools: Tool[], total: number, heading: string): string {
  if (!tools.length) return heading;
  const more = total > tools.length ? `\n\nShowing ${tools.length} of ${total}. Raise \`limit\` or narrow the query to see more.` : '';
  return `${heading}\n\n${tools.map(toolLine).join('\n\n')}${more}\n\nCall \`get_tool\` with a slug for install steps for Claude, Cursor, VS Code and Codex.`;
}

export const CLIENT_IDS = ['claude-code', 'claude-desktop', 'cursor', 'vscode', 'codex'] as const;
export type ClientId = (typeof CLIENT_IDS)[number];

export function toolDetail(t: Tool, client?: ClientId): string {
  const out: string[] = [
    `# ${t.name}`,
    `${t.category} · by ${t.maker}${t.updated ? ` · checked ${t.updated}` : ''}`,
    `PluginStack page: ${t.url}`,
    `Official source: ${t.sourceUrl}`,
    '',
    '## What it does', t.what, '',
    "## Who it's for", t.who, '',
  ];
  if (t.install) {
    const i = t.install;
    out.push('## Install', `Needs: ${i.requires.runtime}. Sign-in: ${i.requires.auth}.`);
    for (const n of i.notes ?? []) out.push(`- ${n}`);
    const clients = client ? i.clients.filter(c => c.id === client) : i.clients;
    if (client && !clients.length) out.push('', `No ${client} snippet for this server (it may not support that client). Available: ${i.clients.map(c => c.id).join(', ')}.`);
    for (const c of clients) {
      out.push('', `### ${c.label}${c.where ? ` (${c.where})` : ''}`);
      for (const b of c.blocks) out.push(...(b.caption ? [b.caption + ':'] : []), fence(b.code, b.language));
      if (c.note) out.push(c.note);
    }
    out.push('', `Checked against ${i.source} on ${i.checked}. One-click Cursor and VS Code install buttons: ${t.url}`, '');
  } else {
    out.push('## How to set it up');
    t.setup.forEach((s, n) => { out.push(`${n + 1}. ${s.text}`); if (s.code) out.push(fence(s.code, s.language ?? '')); });
    out.push('');
  }
  if (t.prompts.length) out.push('## Try asking', ...t.prompts.map(p => `- "${p}"`), '');
  if (t.faq.length) out.push('## FAQ', ...t.faq.slice(0, 4).flatMap(f => [`**${f.q}**`, f.a, '']));
  if (t.guides.length) out.push('## Related guides', ...t.guides.map(g => `- ${g.url}`), '');
  out.push(`Full listing, screenshots and updates: ${t.url}`);
  return out.join('\n');
}

export function categoryList(cats: Category[], siteUrl: string): string {
  return `PluginStack categories (${cats.reduce((n, c) => n + c.count, 0)} listings):\n\n` +
    cats.map(c => `- **${c.name}** (${c.count}): ${c.intro}\n  ${c.url}`).join('\n') +
    `\n\nUse \`search_tools\` with \`category\` set to a name above to list its tools. Browse everything at ${siteUrl}/`;
}

export function guideLine(g: Guide, i: number): string {
  return `${i + 1}. **${g.title}** (${g.kind}, updated ${g.updated}), slug \`${g.slug}\`\n   ${clip(g.description, 220)}\n   ${g.url}`;
}

export function guideDetail(g: Guide, maxChars: number): string {
  const body = g.markdown.length > maxChars ? `${clip(g.markdown, maxChars)}\n\n[Guide truncated. Read the rest at ${g.url}]` : g.markdown;
  return [
    `# ${g.title}`, `${g.kind} · updated ${g.updated}`, `Read on PluginStack: ${g.url}`, '', body, '',
    g.sources.length ? '## Sources\n' + g.sources.map(s => `- [${s.label}](${s.url})`).join('\n') : '',
    g.related.length ? '\n## Tools in this guide\n' + g.related.map(r => `- \`${r.slug}\`: ${r.url}`).join('\n') : '',
  ].filter(Boolean).join('\n');
}
