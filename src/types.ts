/** Shape of https://www.pluginstackai.com/directory.json (schema 1). Extra fields are ignored. */
export type SnippetBlock = { code: string; language: string; caption?: string };
export type ClientSnippet = { id: string; label: string; where?: string; blocks: SnippetBlock[]; note?: string };
export type Install = {
  name: string; transport: 'stdio' | 'http'; command?: string; args?: string[]; env?: Record<string, string>; url?: string;
  requires: { runtime: string; auth: string }; notes?: string[]; source: string; checked: string; clients: ClientSnippet[];
};
export type Tool = {
  slug: string; name: string; category: string; categoryUrl: string; tags: string[]; maker: string;
  sourceUrl: string; url: string; updated: string | null; what: string; who: string;
  setup: { text: string; code?: string; language?: string }[]; prompts: string[];
  install: Install | null;
  sections: { heading: string; paragraphs?: string[]; bullets?: string[]; code?: string; language?: string }[];
  faq: { q: string; a: string }[];
  guides: { slug: string; url: string }[];
};
export type Category = { name: string; slug: string; url: string; intro: string; count: number; updated: string | null };
export type Guide = {
  slug: string; title: string; seoTitle: string; description: string; kind: string; url: string;
  published: string; updated: string; markdown: string; sources: { label: string; url: string }[];
  related: { slug: string; url: string }[];
};
export type Directory = {
  schema: number; generated: string;
  site: { name: string; url: string; tagline: string; contact?: string };
  categories: Category[]; tools: Tool[]; guides: Guide[];
};
