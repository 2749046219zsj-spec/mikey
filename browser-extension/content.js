/**
 * 竞品图库上传助手 - 内容脚本
 * 负责在网页中获取图片的额外信息
 */

// 监听来自background的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getImageInfo') {
    const imageInfo = extractImageInfo(request.imageUrl);
    sendResponse(imageInfo);
  }
  return true;
});

/**
 * 提取图片的额外信息
 */
function extractImageInfo(imageUrl) {
  try {
    // 查找页面中所有图片
    const images = document.querySelectorAll('img');
    let targetImage = null;

    // 找到匹配的图片元素
    for (const img of images) {
      if (img.src === imageUrl || img.currentSrc === imageUrl) {
        targetImage = img;
        break;
      }
    }

    if (!targetImage) {
      return {};
    }

    // 提取图片信息
    const info = {
      alt: targetImage.alt || '',
      title: targetImage.title || '',
      width: targetImage.naturalWidth || targetImage.width || 0,
      height: targetImage.naturalHeight || targetImage.height || 0,
      className: targetImage.className || '',
      id: targetImage.id || ''
    };

    // 尝试获取图片周围的文本信息（商品名称、价格等）
    const additionalInfo = extractSurroundingInfo(targetImage);

    return {
      ...info,
      ...additionalInfo
    };

  } catch (error) {
    console.error('提取图片信息失败:', error);
    return {};
  }
}

/**
 * 提取图片周围的上下文信息
 */
function extractSurroundingInfo(imageElement) {
  const info = {
    productName: '',
    price: '',
    description: ''
  };

  try {
    // 获取父容器
    let parent = imageElement.parentElement;
    let searchDepth = 0;
    const maxDepth = 5;

    // 向上查找包含商品信息的容器
    while (parent && searchDepth < maxDepth) {
      // 查找商品名称
      if (!info.productName) {
        const nameElement = parent.querySelector('[class*="title"], [class*="name"], [class*="product"], h1, h2, h3');
        if (nameElement) {
          info.productName = nameElement.textContent.trim();
        }
      }

      // 查找价格信息
      if (!info.price) {
        const priceElement = parent.querySelector('[class*="price"], [class*="cost"], [class*="amount"]');
        if (priceElement) {
          info.price = priceElement.textContent.trim();
        }
      }

      // 查找描述信息
      if (!info.description) {
        const descElement = parent.querySelector('[class*="desc"], [class*="detail"], p');
        if (descElement) {
          const text = descElement.textContent.trim();
          if (text.length > 10 && text.length < 200) {
            info.description = text;
          }
        }
      }

      parent = parent.parentElement;
      searchDepth++;
    }

    // 检测特定网站（SHEIN、淘宝等）的特殊结构
    detectSpecialWebsites(imageElement, info);

  } catch (error) {
    console.error('提取周围信息失败:', error);
  }

  return info;
}

/**
 * 检测特定网站的特殊结构
 */
function detectSpecialWebsites(imageElement, info) {
  const hostname = window.location.hostname;

  // SHEIN网站特殊处理
  if (hostname.includes('shein.com')) {
    const productCard = imageElement.closest('[class*="product"], [class*="goods-item"]');
    if (productCard) {
      const nameEl = productCard.querySelector('[class*="goods-title"], [class*="product-title"]');
      const priceEl = productCard.querySelector('[class*="price"]');

      if (nameEl) info.productName = nameEl.textContent.trim();
      if (priceEl) info.price = priceEl.textContent.trim();
    }
  }

  // 淘宝/天猫网站特殊处理
  if (hostname.includes('taobao.com') || hostname.includes('tmall.com')) {
    const productCard = imageElement.closest('.item, .product');
    if (productCard) {
      const nameEl = productCard.querySelector('.title, .name');
      const priceEl = productCard.querySelector('.price');

      if (nameEl) info.productName = nameEl.textContent.trim();
      if (priceEl) info.price = priceEl.textContent.trim();
    }
  }

  // 亚马逊网站特殊处理
  if (hostname.includes('amazon.com')) {
    const productCard = imageElement.closest('[data-asin], .s-result-item');
    if (productCard) {
      const nameEl = productCard.querySelector('h2, .a-text-normal');
      const priceEl = productCard.querySelector('.a-price .a-offscreen');

      if (nameEl) info.productName = nameEl.textContent.trim();
      if (priceEl) info.price = priceEl.textContent.trim();
    }
  }
}

/**
 * 在页面加载完成后初始化
 */
(function init() {
  console.log('竞品图库上传助手已加载');
})();
