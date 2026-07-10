export interface ProfileActionLink {
  href: string;
  label: string;
  target?: '_blank' | '_self' | '_parent' | '_top';
  rel?: string;
}

export type SocialLinks = Record<string, string>;

/** 归一化“其他链接”配置：过滤无效项、补全 target / rel */
export function normalizeProfileLinks(links: unknown): ProfileActionLink[] {
  const list = (links as Partial<ProfileActionLink>[] | undefined) ?? [];
  return list
    .filter((link): link is ProfileActionLink => Boolean(link?.href?.trim() && link?.label?.trim()))
    .map((link) => {
      const href = link.href.trim();
      const target = link.target ?? (/^https?:\/\//i.test(href) ? '_blank' : undefined);
      return {
        ...link,
        href,
        label: link.label.trim(),
        target,
        rel: link.rel ?? (target === '_blank' ? 'noreferrer' : undefined),
      };
    });
}

/** 把社交账号配置转为可用的链接列表（邮箱自动补 mailto:） */
export function getSocialLinks(social: unknown): { platform: string; url: string }[] {
  const entries = Object.entries((social as Record<string, string>) ?? {});
  return entries
    .filter(([, url]) => Boolean(url))
    .map(([platform, url]) => ({
      platform,
      url: platform === 'email' && !url.startsWith('mailto:') ? `mailto:${url}` : url,
    }));
}
