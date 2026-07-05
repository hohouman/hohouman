// 由于Astro不直接支持在客户端提取颜色，我们创建一个服务端函数
// 实际的颜色提取将在构建时完成

/**
 * 颜色提取器缓存
 * 用于缓存已提取的颜色，避免重复计算
 */
const colorCache = new Map<string, string>();

/**
 * 从图像URL提取主色调
 * 注意：这是一个示意函数，在实际实现中需要在构建时处理
 */
export function extractDominantColor(imageUrl: string): string {
  // 这里应该使用node-vibrant或colorthief等库在构建时提取颜色
  // 返回一个默认颜色作为占位符
  return '#6c5ce7'; // 默认紫蓝色
}

/**
 * 根据字符串生成确定性的颜色（用于占位符实现）
 */
function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // 生成饱和度适中、亮度良好的颜色
  // 使用更宽的饱和度范围(50-80)和亮度范围(40-70)以获得更丰富的颜色
  const h = Math.abs(hash % 360);
  const s = 50 + Math.abs(hash % 30); // 50-80% 饱和度
  const l = 40 + Math.abs(hash % 30); // 40-70% 亮度
  
  return hslToHex(h, s, l);
}

/**
 * 将HSL颜色转换为十六进制
 */
function hslToHex(h: number, s: number, l: number): string {
  // 转换HSL到RGB
  const c = (1 - Math.abs(2 * l / 100 - 1)) * s / 100;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l / 100 - c / 2;
  
  let r, g, b;
  if (h < 60) {
    [r, g, b] = [c, x, 0];
  } else if (h < 120) {
    [r, g, b] = [x, c, 0];
  } else if (h < 180) {
    [r, g, b] = [0, c, x];
  } else if (h < 240) {
    [r, g, b] = [0, x, c];
  } else if (h < 300) {
    [r, g, b] = [x, 0, c];
  } else {
    [r, g, b] = [c, 0, x];
  }
  
  const toHex = (n: number) => {
    const v = Math.round((n + m) * 255);
    return v.toString(16).padStart(2, '0');
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * 将十六进制颜色转换为RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  // 处理简写形式如 #fff
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (_m, r, g, b) => r + r + g + g + b + b);
  
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

/**
 * 将RGB值转换为十六进制颜色
 */
export function rgbToHex(r: number, g: number, b: number): string {
  // 确保值在有效范围内
  r = Math.max(0, Math.min(255, Math.round(r)));
  g = Math.max(0, Math.min(255, Math.round(g)));
  b = Math.max(0, Math.min(255, Math.round(b)));
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * 计算相对亮度 (用于可访问性检查)
 * 基于WCAG 2.0标准
 */
export function getBrightness(r: number, g: number, b: number): number {
  const rsrgb = r / 255;
  const gsrgb = g / 255;
  const bsrgb = b / 255;
  
  const rLinear = rsrgb <= 0.03928 ? rsrgb / 12.92 : Math.pow((rsrgb + 0.055) / 1.055, 2.4);
  const gLinear = gsrgb <= 0.03928 ? gsrgb / 12.92 : Math.pow((gsrgb + 0.055) / 1.055, 2.4);
  const bLinear = bsrgb <= 0.03928 ? bsrgb / 12.92 : Math.pow((bsrgb + 0.055) / 1.055, 2.4);
  
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * 判断是否使用亮色文本
 * 根据背景亮度决定使用白色还是黑色文本
 */
export function useLightText(color: string): boolean {
  const rgb = hexToRgb(color);
  return getBrightness(rgb.r, rgb.g, rgb.b) < 0.5;
}

/**
 * 混合两种颜色
 * amount: 0 = 完全是color1, 1 = 完全是color2
 * @param color1 - 第一种颜色（十六进制）
 * @param color2 - 第二种颜色（十六进制）
 * @param amount - 混合比例 (0-1)
 * @returns 混合后的颜色（十六进制）
 */
export function blendColors(color1: string, color2: string, amount: number): string {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  const r = Math.round(rgb1.r * (1 - amount) + rgb2.r * amount);
  const g = Math.round(rgb1.g * (1 - amount) + rgb2.g * amount);
  const b = Math.round(rgb1.b * (1 - amount) + rgb2.b * amount);
  
  return rgbToHex(r, g, b);
}

/**
 * 获取颜色的对比色
 * 用于确保文本在背景上的可读性
 * @param color - 输入颜色（十六进制）
 * @param threshold - 亮度阈值 (0-1, 默认0.5)
 * @returns 白色或黑色，取决于哪个在给定颜色上更易读
 */
export function getContrastColor(color: string, threshold: number = 0.5): string {
  const rgb = hexToRgb(color);
  const brightness = getBrightness(rgb.r, rgb.g, rgb.b);
  return brightness < threshold ? '#ffffff' : '#000000';
}

/**
 * 生成随机颜色
 * @returns 随机的十六进制颜色值
 */
export function generateRandomColor(): string {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return rgbToHex(r, g, b);
}

/**
 * 调整颜色亮度
 * @param color - 输入颜色（十六进制）
 * @param factor - 亮度调整因子 (-1到1, 负数变暗，正数变亮)
 * @returns 调整后的颜色（十六进制）
 */
export function adjustBrightness(color: string, factor: number): string {
  const rgb = hexToRgb(color);
  const r = Math.max(0, Math.min(255, Math.round(rgb.r * (1 + factor))));
  const g = Math.max(0, Math.min(255, Math.round(rgb.g * (1 + factor))));
  const b = Math.max(0, Math.min(255, Math.round(rgb.b * (1 + factor))));
  return rgbToHex(r, g, b);
}

/**
 * 生成基于主色调的配色方案
 */
export function generateColorScheme(dominantColor: string): {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
} {
  return {
    primary: dominantColor,
    secondary: shadeColor(dominantColor, -20),
    accent: shadeColor(dominantColor, 20),
    background: '#ffffff',
    text: '#333333'
  };
}

/**
 * 调整颜色明暗度
 * 使用HSL模型进行更自然的颜色调整
 */
function shadeColor(color: string, percent: number): string {
  const rgb = hexToRgb(color);
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  // 调整亮度
  l += percent / 100;
  l = Math.min(1, Math.max(0, l));

  // 转换回RGB
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  
  const R = Math.round(hue2rgb(p, q, h + 1/3) * 255);
  const G = Math.round(hue2rgb(p, q, h) * 255);
  const B = Math.round(hue2rgb(p, q, h - 1/3) * 255);

  const RR = R.toString(16).padStart(2, '0');
  const GG = G.toString(16).padStart(2, '0');
  const BB = B.toString(16).padStart(2, '0');

  return `#${RR}${GG}${BB}`;
}