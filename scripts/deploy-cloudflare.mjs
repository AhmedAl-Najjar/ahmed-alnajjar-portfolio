import { spawnSync } from 'node:child_process';

const id = process.env.GITHUB_OAUTH_ID;
const secret = process.env.GITHUB_OAUTH_SECRET;

if (!id || !secret) {
  console.error('Missing GITHUB_OAUTH_ID or GITHUB_OAUTH_SECRET in Cloudflare build variables.');
  process.exit(1);
}

const payload = JSON.stringify({
  GITHUB_OAUTH_ID: id,
  GITHUB_OAUTH_SECRET: secret
});

const put = spawnSync('npx', ['wrangler', 'secret', 'bulk'], {
  input: payload,
  encoding: 'utf8',
  stdio: ['pipe', 'inherit', 'inherit'],
  shell: process.platform === 'win32'
});
if (put.status !== 0) process.exit(put.status ?? 1);

const deploy = spawnSync('npx', ['wrangler', 'deploy'], {
  stdio: 'inherit',
  shell: process.platform === 'win32'
});
process.exit(deploy.status ?? 1);
