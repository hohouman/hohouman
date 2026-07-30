import fs from 'fs/promises';
import path from 'path';
import { Buffer } from 'buffer';
import sharp from 'sharp';
import { PUBLIC_GENERATED_DIR } from './paths.js';
import { delay } from './util.js';
import { USER_AGENT } from './constants.js';

const MAX_RETRIES = 5;

/**
 * 带抖动的退避：基础 2^attempt 秒，乘以 [0.5, 1.5] 随机系数，
 * 避免在豆瓣限流窗口内所有重试集中在同一时刻撞墙。
 */
function jitteredBackoff(attempt) {
  const base = 2 ** attempt * 1000;
  return delay(Math.floor(base * (0.5 + Math.random())));
}

/** 豆瓣图片需带 Referer 绕过防盗链 */
function buildHeaders(url) {
  if (url.includes('doubanio.com') || url.includes('douban.com')) {
    return { Referer: 'https://www.douban.com/', 'User-Agent': USER_AGENT };
  }
  return {};
}

/**
 * 下载图片并转换为优化后的 WebP，存入 public/generated。
 * @returns {Promise<string|null>} 站点内的相对路径，失败返回 null
 */
export async function downloadAndConvertImage(url, fileName, options = {}) {
  if (!url) return null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, { headers: buildHeaders(url) });

      if (!response.ok) {
        if (response.status === 403 || response.status === 404) {
          console.error(`图片不可用 (${response.status})，跳过: ${url}`);
          return null;
        }
        if (attempt < MAX_RETRIES) {
          await jitteredBackoff(attempt);
          continue;
        }
        throw new Error(`下载失败: ${response.statusText}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length === 0) throw new Error('下载的图片数据为空');

      const optimized = await sharp(buffer)
        .resize(options.width || 500, options.height || 750, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 80 })
        .toBuffer();

      await fs.writeFile(path.join(PUBLIC_GENERATED_DIR, fileName), optimized);
      console.log(`✓ 图片已保存: ${fileName}`);
      return `/generated/${fileName}`;
    } catch (error) {
      console.error(`下载/转换失败 (尝试 ${attempt}/${MAX_RETRIES}) ${url}: ${error.message}`);
      if (attempt < MAX_RETRIES) await jitteredBackoff(attempt);
    }
  }

  console.error(`✗ 图片最终失败，已重试 ${MAX_RETRIES} 次: ${url}`);
  return null;
}
