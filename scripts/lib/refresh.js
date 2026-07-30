/**
 * 每种类型判定“数据是否完整”的必需字段。
 * `foo[]` 表示必须是非空数组；`foo` 表示必须为真值（字符串需非空）。
 */
const REQUIRED_FIELDS = {
  // 注意：不要在此要求 localPosterPath。Steam 的 library_600x900.jpg 对部分
  // app 不存在，下载会返回 null，导致永远不满足刷新条件、每次都重复抓取。
  // 以远程 posterUrl + 本地封面 localCoverPath 作为完整性判据即可。
  steam: ['posterUrl', 'localCoverPath'],
  movie: ['director[]', 'localCoverPath', 'description'],
  book: ['author[]', 'publisher[]', 'localCoverPath', 'description'],
  album: ['artist[]', 'localCoverPath', 'description'],
};

function hasField(item, spec) {
  if (spec.endsWith('[]')) {
    const value = item[spec.slice(0, -2)];
    return Array.isArray(value) && value.length > 0;
  }
  const value = item[spec];
  return typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
}

/**
 * 是否需要重新抓取：无数据、或任一必需字段缺失。
 */
export function shouldRefreshItem(parsed, item) {
  if (!item) return true;
  const kind = parsed.platform === 'steam' ? 'steam' : parsed.type;
  const required = REQUIRED_FIELDS[kind];
  if (!required) return false;
  return required.some((spec) => !hasField(item, spec));
}

/** 图片类字段（仅这些缺失时无需重新抓取元数据） */
const IMAGE_FIELDS = ['localCoverPath', 'localPosterPath'];

/**
 * 图片下载失败（远程 URL 存在但本地路径缺失），可只重试图片下载，
 * 避免重新抓取页面再次触发豆瓣限流。
 *
 * 仅当“元数据本身完整”时返回 true；若同时缺失元数据字段（如 description），
 * 则交给 shouldRefreshItem 走完整重抓流程，以免只补图片而漏掉元数据更新。
 */
export function needsImageOnlyRetry(parsed, item) {
  if (!item) return false;
  const kind = parsed.platform === 'steam' ? 'steam' : parsed.type;
  const required = REQUIRED_FIELDS[kind];
  if (required?.some((spec) => !IMAGE_FIELDS.includes(spec) && !hasField(item, spec))) {
    return false; // 元数据字段缺失，交给完整重抓
  }
  const coverMissing = Boolean(item.coverUrl) && !item.localCoverPath;
  const posterMissing = Boolean(item.posterUrl) && !item.localPosterPath;
  return coverMissing || posterMissing;
}
