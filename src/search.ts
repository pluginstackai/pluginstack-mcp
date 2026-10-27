import type { Guide, Tool } from './types.js';

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
const STOP = new Set(['a', 'an', 'the', 'for', 'to', 'of', 'and', 'or', 'in', 'on', 'with', 'my', 'me', 'i', 'is', 'it', 'how', 'do', 'what', 'best', 'tool', 'tools', 'server', 'servers']);
export const tokens = (s: string) => norm(s).split(/[^a-z0-9.+#]+/).filter(t => t && !STOP.has(t));

type Field = { text: string; weight: number };

function score(query: string, fields: Field[], exact: string[]): number {
  const q = norm(query).trim();
  if (!q) return 0;
  const qt = tokens(q);
  const hit = new Set<string>();
  let s = 0;
  for (const e of exact) if (norm(e) === q) s += 50;
  for (const f of fields) {
    const text = norm(f.text);
    if (q.length > 2 && text.includes(q)) s += f.weight * 3; // whole phrase
    const words = text.split(/[^a-z0-9.+#]+/).filter(Boolean);
    for (const t of qt) {
      if (words.includes(t)) { s += f.weight * 2; hit.add(t); }
      else if (t.length > 2 && words.some(w => w.startsWith(t))) { s += f.weight; hit.add(t); } // prefix, e.g. "postgres" in "postgresql"
    }
  }
  if (qt.length > 1) {
    // Drop weak matches (fewer than half the query words), prefer results that match every word.
    if (hit.size * 2 < qt.length) return 0;
    if (hit.size === qt.length) s *= 1.5;
  }
  return s;
}

export function searchTools(tools: Tool[], query: string, category?: string): Tool[] {
  const inCat = category ? tools.filter(t => matchesCategory(t, category)) : tools;
  if (!query.trim()) return [...inCat].sort((a, b) => a.name.localeCompare(b.name));
  return inCat
    .map(t => ({ t, s: score(query, [
      { text: t.name, weight: 6 }, { text: t.slug.replace(/-/g, ' '), weight: 4 }, { text: t.tags.join(' '), weight: 4 },
      { text: t.maker, weight: 3 }, { text: t.category, weight: 2 }, { text: t.what, weight: 1.5 }, { text: t.who, weight: 0.5 },
    ], [t.name, t.slug, t.maker]) }))
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s || a.t.name.localeCompare(b.t.name))
    .map(x => x.t);
}

export function matchesCategory(t: Tool, category: string): boolean {
  const c = norm(category).replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return norm(t.category) === norm(category) || t.categoryUrl.endsWith(`/categories/${c}/`);
}

export function searchGuides(guides: Guide[], query: string): Guide[] {
  if (!query.trim()) return guides;
  return guides
    .map(g => ({ g, s: score(query, [
      { text: g.title, weight: 6 }, { text: g.slug.replace(/-/g, ' '), weight: 4 }, { text: g.description, weight: 3 },
      { text: g.kind, weight: 1 }, { text: g.markdown, weight: 0.3 },
    ], [g.slug, g.title]) }))
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map(x => x.g);
}

/** Closest slugs for "did you mean" hints. */
export function closest<T extends { slug: string; name?: string; title?: string }>(items: T[], input: string, n = 3): T[] {
  const q = norm(input).replace(/[^a-z0-9]+/g, ' ').trim();
  const qt = q.split(' ').filter(Boolean);
  return items
    .map(it => {
      const hay = norm(`${it.slug} ${it.name ?? ''} ${it.title ?? ''}`);
      return { it, s: qt.filter(t => hay.includes(t)).length + (hay.includes(q) ? 2 : 0) };
    })
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, n)
    .map(x => x.it);
}
