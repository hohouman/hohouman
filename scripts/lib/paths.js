import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url)); // scripts/lib
const ROOT = path.join(__dirname, '../..');

export const CONFIG_DIR = path.join(ROOT, 'src/config');
export const CONTENT_DIR = path.join(ROOT, 'src/content');
export const GENERATED_DIR = path.join(CONTENT_DIR, '_generated');
export const PUBLIC_GENERATED_DIR = path.join(ROOT, 'public/generated');

/** 排除非 URL 列表的配置文件 */
const CONFIG_EXCLUDE = new Set(['profile.json']);

/**
 * 扫描 src/config，返回所有 URL 列表配置文件名（按文件名排序）。
 * 新增集合只需放入一个同名 .json 即可被自动抓取，无需维护硬编码列表。
 */
export async function listConfigFiles() {
  let entries;
  try {
    entries = await fs.readdir(CONFIG_DIR);
  } catch {
    return [];
  }
  return entries.filter((name) => name.endsWith('.json') && !CONFIG_EXCLUDE.has(name)).sort();
}

/** 确保生成目录存在 */
export async function ensureDirs() {
  await fs.mkdir(GENERATED_DIR, { recursive: true });
  await fs.mkdir(PUBLIC_GENERATED_DIR, { recursive: true });
}
