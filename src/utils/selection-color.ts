/**
 * 动态计算和设置选中文字背景色
 */

/**
 * 将十六进制颜色转换为RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // 处理简写形式如 #fff
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * RGB颜色值转换为十六进制
 * @param rgb - RGB颜色值，例如 "rgb(255, 255, 255)" 或 "rgba(255, 255, 255, 1)"
 * @returns 十六进制颜色值
 */
function rgbToHex(rgb: string): string {
  // 匹配rgb或rgba格式
  const match = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*\d+(?:\.\d+)?)?\)$/);
  
  if (!match) return '#000000'; // 默认黑色
  
  const [_, r, g, b] = match.map(Number);
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * 生成选中文字背景色
 * @param backgroundColor 背景色
 * @param textColor 文字颜色
 * @param opacity 透明度 (0-1，默认0.2)
 * @returns RGBA格式的颜色值
 */
function generateSelectionColor(backgroundColor: string, textColor: string, opacity: number = 0.2): string {
  // 统一处理颜色值
  const bgRgb = backgroundColor.startsWith('rgb') 
    ? hexToRgb(rgbToHex(backgroundColor)) 
    : hexToRgb(backgroundColor);
    
  const textRgb = textColor.startsWith('rgb') 
    ? hexToRgb(rgbToHex(textColor)) 
    : hexToRgb(textColor);
  
  if (!bgRgb || !textRgb) {
    // 如果转换失败，返回默认值
    return `rgba(143, 78, 43, ${opacity})`; // 默认的项目主题色
  }
  
  // 计算背景色和文字色的混合色，偏向文字色以确保可读性
  const r = Math.round(bgRgb.r * (1 - opacity) + textRgb.r * opacity);
  const g = Math.round(bgRgb.g * (1 - opacity) + textRgb.g * opacity);
  const b = Math.round(bgRgb.b * (1 - opacity) + textRgb.b * opacity);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * 动态设置选中文字背景色
 * @param backgroundColor - 背景色
 * @param textColor - 文字颜色
 * @param opacity - 透明度 (0-1，默认0.2)
 */
export function setSelectionColor(backgroundColor: string, textColor: string = '#fff7ef', opacity: number = 0.2): void {
  // 生成选中文字背景色
  const selectionColor = generateSelectionColor(backgroundColor, textColor, opacity);
  
  // 更新CSS变量
  document.documentElement.style.setProperty('--selection-bg', selectionColor);
  
  // 同时也设置一个针对特定容器的样式
  updateSelectionStyle(backgroundColor, textColor, opacity);
}

/**
 * 更新选中文字样式
 * @param backgroundColor - 背景色
 * @param textColor - 文字颜色
 * @param opacity - 透明度 (0-1，默认0.2)
 */
function updateSelectionStyle(backgroundColor: string, textColor: string, opacity: number): void {
  // 尝试移除之前的样式
  const existingStyle = document.getElementById('dynamic-selection-style');
  if (existingStyle) {
    existingStyle.remove();
  }
  
  // 创建新的样式
  const style = document.createElement('style');
  style.id = 'dynamic-selection-style';
  
  const selectionColor = generateSelectionColor(backgroundColor, textColor, opacity);
  
  style.textContent = `
    ::selection {
      background: ${selectionColor};
    }
    
    ::-moz-selection {
      background: ${selectionColor};
    }
  `;
  
  document.head.appendChild(style);
}

/**
 * 根据页面背景自动计算选中文字背景色
 */
export function initAutoSelectionColor(): void {
  // 监听页面加载完成
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', calculateSelectionColorFromPage);
  } else {
    calculateSelectionColorFromPage();
  }
  
  // 监听可能影响背景的页面变化
  const observer = new MutationObserver(calculateSelectionColorFromPage);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style']
  });
}

/**
 * 从页面元素计算背景色并设置选中文字颜色
 */
function calculateSelectionColorFromPage(): void {
  // 获取页面的主要背景色（这里可以根据实际情况调整策略）
  const heroBanner = document.querySelector('.hero-banner');
  const body = document.body;
  
  let bgColor = '#f4efe6'; // 默认背景色
  let textColor = '#1f1a17'; // 默认文字色
  
  // 如果有英雄横幅，尝试从那里获取颜色
  if (heroBanner) {
    // 尝试获取背景图片或颜色
    const computedStyle = window.getComputedStyle(heroBanner);
    const bg = computedStyle.backgroundColor;
    
    // 如果是rgba格式，转换为hex
    if (bg && bg.startsWith('rgb')) {
      bgColor = rgbToHex(bg);
    } else if (bg && bg.startsWith('#')) {
      bgColor = bg;
    }
  } else {
    // 获取body背景色
    const computedStyle = window.getComputedStyle(body);
    const bg = computedStyle.backgroundColor;
    
    if (bg && bg.startsWith('rgb')) {
      bgColor = rgbToHex(bg);
    } else if (bg && bg.startsWith('#')) {
      bgColor = bg;
    }
  }
  
  // 获取主要文字颜色
  const mainContent = document.querySelector('.page-main') || document.body;
  if (mainContent) {
    const computedStyle = window.getComputedStyle(mainContent);
    const color = computedStyle.color;
    
    if (color && color.startsWith('rgb')) {
      textColor = rgbToHex(color);
    } else if (color && color.startsWith('#')) {
      textColor = color;
    }
  }
  
  setSelectionColor(bgColor, textColor, 0.2);
}

// 自动初始化
initAutoSelectionColor();