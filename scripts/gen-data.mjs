#!/usr/bin/env node
/**
 * 从上游 jaywcjlove/linux-command 拉取最新命令数据，
 * 生成 web/app-data.js 和 .last-upstream-sha。
 * 在本地（需 node + tar）和 GitHub Actions 上均可运行。
 */
import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TMP = join(ROOT, 'tmp');
const WEB = join(ROOT, 'web');
const UPSTREAM = 'jaywcjlove/linux-command';

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'linux-command-apk-builder' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

// 1. 获取上游 master 最新 commit
const commit = await fetchJson(`https://api.github.com/repos/${UPSTREAM}/commits/master`);
const sha = commit.sha;
console.log('上游最新 commit:', sha.slice(0, 7), commit.commit.message.split('\n')[0]);

// 2. 下载源码包
mkdirSync(TMP, { recursive: true });
const tarball = join(TMP, 'upstream.tar.gz');
console.log('下载上游仓库...');
const res = await fetch(`https://codeload.github.com/${UPSTREAM}/tar.gz/refs/heads/master`);
if (!res.ok) throw new Error(`下载失败: HTTP ${res.status}`);
writeFileSync(tarball, Buffer.from(await res.arrayBuffer()));

// 3. 解压（tmp/upstream 目录每次重建）
const extractDir = join(TMP, 'upstream');
rmSync(extractDir, { recursive: true, force: true });
mkdirSync(extractDir, { recursive: true });
// Windows 上 PATH 中的 GNU tar 只认 /c/... 风格路径，Windows 系统自带 bsdtar 两者都认
function tarPath(p) {
  if (process.platform !== 'win32') return p;
  return p.replace(/\\/g, '/').replace(/^([A-Za-z]):/, (_, d) => '/' + d.toLowerCase());
}
execSync(`tar xzf "${tarPath(tarball)}" -C "${tarPath(extractDir)}"`, { stdio: 'inherit' });
const src = join(extractDir, 'linux-command-master');

// 4. 打包数据
const idx = JSON.parse(readFileSync(join(src, 'dist', 'data.json'), 'utf8'));
const out = {};
let ok = 0;
const missing = [];
for (const key of Object.keys(idx)) {
  const f = join(src, 'command', `${key}.md`);
  if (existsSync(f)) {
    out[key] = { d: idx[key].d, md: readFileSync(f, 'utf8') };
    ok++;
  } else {
    missing.push(key);
  }
}
mkdirSync(WEB, { recursive: true });
writeFileSync(join(WEB, 'app-data.js'), 'window.CMDDATA=' + JSON.stringify(out) + ';');
writeFileSync(join(ROOT, '.last-upstream-sha'), sha);
console.log(`打包完成: ${ok} 个命令 -> web/app-data.js`);
if (missing.length) console.log('缺文档的命令:', missing.join(', '));
