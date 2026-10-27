// Refreshes the bundled fallback snapshot from the live site (or PLUGINSTACK_DIRECTORY_URL).
import { writeFileSync } from 'node:fs';
const url = process.env.PLUGINSTACK_DIRECTORY_URL || 'https://www.pluginstackai.com/directory.json';
const res = await fetch(url, { headers: { 'user-agent': 'pluginstack-mcp snapshot' } });
if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
const dir = await res.json();
if (dir.schema !== 1 || !Array.isArray(dir.tools) || !Array.isArray(dir.guides)) throw new Error('Unexpected directory format');
writeFileSync(new URL('../data/directory.json', import.meta.url), JSON.stringify(dir) + '\n');
console.log(`Saved ${dir.tools.length} tools, ${dir.categories.length} categories, ${dir.guides.length} guides (generated ${dir.generated}).`);
