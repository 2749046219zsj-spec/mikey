export const updateShareMetaTags = (
  title: string,
  description: string,
  imageUrl: string,
  url: string
) => {
  const metaTags = [
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:image', content: imageUrl },
    { property: 'og:url', content: url },
    { property: 'twitter:title', content: title },
    { property: 'twitter:description', content: description },
    { property: 'twitter:image', content: imageUrl },
    { property: 'twitter:url', content: url },
  ];

  metaTags.forEach(({ property, content }) => {
    let element = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;

    if (!element) {
      element = document.createElement('meta');
      element.setAttribute('property', property);
      document.head.appendChild(element);
    }

    element.content = content;
  });

  document.title = title;

  const descriptionMeta = document.querySelector('meta[name="description"]') as HTMLMetaElement;
  if (descriptionMeta) {
    descriptionMeta.content = description;
  }
};

export const resetMetaTags = () => {
  const defaultTitle = 'AI创意画廊 - 探索无限创意可能';
  const defaultDescription = '使用AI生成独特的香水瓶设计、产品渲染和创意图片。加入我们的创意社区，探索无限可能。';

  document.title = defaultTitle;

  const descriptionMeta = document.querySelector('meta[name="description"]') as HTMLMetaElement;
  if (descriptionMeta) {
    descriptionMeta.content = defaultDescription;
  }
};
