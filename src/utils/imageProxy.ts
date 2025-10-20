const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const IMAGE_PROXY_URL = `${SUPABASE_URL}/functions/v1/image-proxy`;

export const proxyImageUrl = (url: string): string => {
  if (!url) return url;

  // 如果是本地blob URL或data URL，直接返回
  if (url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }

  // 检查是否需要代理（外部URL）
  const needsProxy =
    url.startsWith('http://') ||
    url.startsWith('https://');

  if (needsProxy && SUPABASE_URL) {
    // 使用代理URL
    return `${IMAGE_PROXY_URL}?url=${encodeURIComponent(url)}`;
  }

  return url;
};

export const proxyImageUrls = (urls: string[]): string[] => {
  return urls.map(proxyImageUrl);
};
