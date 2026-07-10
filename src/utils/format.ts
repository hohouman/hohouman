/** 把可能是数组/字符串/空值的字段统一成展示用字符串 */
export const asText = (value: unknown): string =>
  Array.isArray(value) ? value.join(', ') : value == null ? '' : String(value);

/** 判断字段是否“有值”：数组看是否非空，其它看真值 */
export const hasValue = (value: unknown): boolean =>
  Array.isArray(value) ? value.length > 0 : Boolean(value);
