// Validates server.json against the official MCP Registry schema it declares, plus the registry's extra rules.
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'node:fs';

const server = JSON.parse(readFileSync('server.json', 'utf8'));
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const schema = await (await fetch(server.$schema)).json();
delete schema.$schema; // draft-07 / 2020-12 meta-schema not needed for validation
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const ok = ajv.validate(schema, server);
const problems = ok ? [] : ajv.errors.map(e => `${e.instancePath || '/'} ${e.message}`);
if (server.name !== pkg.mcpName) problems.push(`name ${server.name} must equal package.json mcpName ${pkg.mcpName}`);
if (server.version !== pkg.version) problems.push(`version ${server.version} != package.json ${pkg.version}`);
for (const p of server.packages) {
  if (p.identifier !== pkg.name) problems.push(`package identifier ${p.identifier} != ${pkg.name}`);
  if (p.version !== pkg.version) problems.push(`package version ${p.version} != ${pkg.version}`);
}
if (server.description.length > 100) problems.push(`description is ${server.description.length} chars (max 100)`);
if (problems.length) { console.error('server.json INVALID:\n- ' + problems.join('\n- ')); process.exit(1); }
console.log(`server.json valid against ${server.$schema}`);
