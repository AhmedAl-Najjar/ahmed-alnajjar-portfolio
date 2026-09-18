import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const id = process.env.GITHUB_OAUTH_ID;
const secret = process.env.GITHUB_OAUTH_SECRET;

if (!id || !secret) {
  console.error('Missing GITHUB_OAUTH_ID or GITHUB_OAUTH_SECRET in Cloudflare Build variables.');
  process.exit(1);
}

const file = '.cloudflare-secrets.json';
fs.writeFileSync(file, JSON.stringify({
  GITHUB_OAUTH_ID: id,
  GITHUB_OAUTH_SECRET: secret
}));

const deploy = spawnSync('npx', ['wrangler', 'deploy', '--secrets-file', file], {
  stdio: 'inherit',
  shell: process.platform === 'win32'
});

try { fs.unlinkSync(file); } catch {}
process.exit(deploy.status ?? 1);
