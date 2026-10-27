import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Directory } from './types.js';

export const DEFAULT_URL = 'https://www.pluginstackai.com/directory.json';
const SUPPORTED_SCHEMA = 1;
const TTL_MS = 60 * 60 * 1000; // refetch at most once an hour
const TIMEOUT_MS = 5000;

export type Source = { kind: 'live' | 'snapshot'; url?: string; note?: string };
export type Loaded = { dir: Directory; source: Source };

function isDirectory(d: unknown): d is Directory {
  const x = d as Directory;
  return !!x && typeof x === 'object' && x.schema === SUPPORTED_SCHEMA && Array.isArray(x.tools) && Array.isArray(x.guides) && Array.isArray(x.categories);
}

let snapshot: Directory | undefined;
export function loadSnapshot(): Directory {
  if (!snapshot) {
    const file = fileURLToPath(new URL('../data/directory.json', import.meta.url));
    const parsed = JSON.parse(readFileSync(file, 'utf8'));
    if (!isDirectory(parsed)) throw new Error('Bundled snapshot data/directory.json is missing or has an unsupported schema');
    snapshot = parsed;
  }
  return snapshot;
}

/**
 * Loads the public PluginStack directory. Order: live JSON from pluginstackai.com (cached for an hour),
 * else the snapshot bundled with this package. Env:
 *   PLUGINSTACK_OFFLINE=1        never touch the network, use the bundled snapshot
 *   PLUGINSTACK_DIRECTORY_URL    fetch from another URL (e.g. a local dev build)
 */
export class DirectoryStore {
  private cache?: { at: number; loaded: Loaded };
  private inflight?: Promise<Loaded>;
  constructor(private url = process.env.PLUGINSTACK_DIRECTORY_URL || DEFAULT_URL, private offline = /^(1|true|yes)$/i.test(process.env.PLUGINSTACK_OFFLINE ?? '')) {}

  async get(): Promise<Loaded> {
    if (this.cache && Date.now() - this.cache.at < TTL_MS) return this.cache.loaded;
    if (!this.inflight) this.inflight = this.load().finally(() => { this.inflight = undefined; });
    return this.inflight;
  }

  private async load(): Promise<Loaded> {
    let loaded: Loaded;
    if (this.offline) loaded = { dir: loadSnapshot(), source: { kind: 'snapshot', note: 'offline mode' } };
    else {
      try {
        const res = await fetch(this.url, { headers: { accept: 'application/json', 'user-agent': 'pluginstack-mcp' }, signal: AbortSignal.timeout(TIMEOUT_MS) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!isDirectory(json)) throw new Error('unsupported schema');
        loaded = { dir: json, source: { kind: 'live', url: this.url } };
      } catch (err) {
        loaded = { dir: loadSnapshot(), source: { kind: 'snapshot', note: `live fetch failed (${(err as Error).message})` } };
      }
    }
    this.cache = { at: Date.now(), loaded };
    return loaded;
  }
}
