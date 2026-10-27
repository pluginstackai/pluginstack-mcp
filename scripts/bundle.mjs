// Builds an MCPB bundle (pluginstack-mcp.mcpb) for Claude Desktop one-click install and Smithery's local publish.
// Layout: manifest.json, icon.png, package.json, server/index.js (single esbuild file), data/directory.json.
import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));
if (manifest.version !== pkg.version) throw new Error(`manifest.json version ${manifest.version} != package.json ${pkg.version}`);

rmSync('build', { recursive: true, force: true });
mkdirSync('build/bundle/server', { recursive: true });
await build({ entryPoints: ['src/index.ts'], bundle: true, platform: 'node', format: 'esm', target: 'node18', outfile: 'build/bundle/server/index.js', banner: { js: "import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);" }, legalComments: 'none', minify: true });
cpSync('data/directory.json', 'build/bundle/data/directory.json');
cpSync('manifest.json', 'build/bundle/manifest.json');
cpSync('icon.png', 'build/bundle/icon.png');
cpSync('LICENSE', 'build/bundle/LICENSE');
writeFileSync('build/bundle/package.json', JSON.stringify({ name: pkg.name, version: pkg.version, type: 'module', private: true, license: pkg.license }, null, 2) + '\n');

const mcpb = new URL('../node_modules/.bin/mcpb', import.meta.url).pathname;
execFileSync(mcpb, ['validate', 'build/bundle/manifest.json'], { stdio: 'inherit' });
execFileSync(mcpb, ['pack', 'build/bundle', `${pkg.name}.mcpb`], { stdio: 'inherit' });
