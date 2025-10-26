/**
 * 竞品图库上传助手 - 背景脚本
 * 负责处理右键菜单、图片上传和通知
 */

// 默认配置
const DEFAULT_CONFIG = {
  apiEndpoint: '', // 将在popup中配置
  supabaseAnonKey: '', // Supabase匿名密钥
  enabled: true
};

// 初始化：创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
  // 创建右键菜单项
  chrome.contextMenus.create({
    id: 'upload-to-library',
    title: '上传到竞品图库',
    contexts: ['image']
  });

  // 初始化配置
  chrome.storage.local.get(['config'], (result) => {
    if (!result.config) {
      chrome.storage.local.set({ config: DEFAULT_CONFIG });
    }
  });
});

// 监听右键菜单点击事件
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'upload-to-library') {
    handleImageUpload(info, tab);
  }
});

/**
 * 处理图片上传
 */
async function handleImageUpload(info, tab) {
  try {
    // 获取配置
    const { config } = await chrome.storage.local.get(['config']);

    if (!config || !config.enabled) {
      showNotification('错误', '插件未启用，请在配置中启用');
      return;
    }

    if (!config.apiEndpoint) {
      showNotification('配置错误', '请先在插件设置中配置API地址');
      return;
    }

    // 获取图片URL
    const imageUrl = info.srcUrl;
    if (!imageUrl) {
      showNotification('错误', '无法获取图片URL');
      return;
    }

    // 显示上传中通知
    showNotification('上传中', '正在上传图片到竞品图库...');

    // 发送消息到content script获取图片的额外信息
    let imageInfo = {};
    try {
      imageInfo = await chrome.tabs.sendMessage(tab.id, {
        action: 'getImageInfo',
        imageUrl: imageUrl
      });
    } catch (e) {
      console.log('无法获取图片额外信息:', e);
    }

    // 下载图片并转换为blob
    const imageBlob = await fetchImageAsBlob(imageUrl);

    // 上传到服务器
    await uploadToServer(imageBlob, {
      originalUrl: imageUrl,
      pageUrl: tab.url,
      pageTitle: tab.title,
      ...imageInfo
    });

    // 显示成功通知
    showNotification('上传成功', '图片已成功上传到竞品图库');

    // 更新统计
    updateStatistics();

  } catch (error) {
    console.error('上传失败:', error);
    showNotification('上传失败', error.message || '请检查网络连接和配置');
  }
}

/**
 * 获取图片为Blob对象
 */
async function fetchImageAsBlob(imageUrl) {
  try {
    const response = await fetch(imageUrl, {
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-cache'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const blob = await response.blob();

    // 验证是否为图片
    if (!blob.type.startsWith('image/')) {
      throw new Error('URL不是有效的图片');
    }

    return blob;
  } catch (error) {
    throw new Error(`获取图片失败: ${error.message}`);
  }
}

/**
 * 上传图片到服务器
 */
async function uploadToServer(imageBlob, metadata) {
  const { config } = await chrome.storage.local.get(['config']);
  const { apiEndpoint, supabaseAnonKey } = config;

  // 创建FormData
  const formData = new FormData();

  // 生成文件名
  const timestamp = Date.now();
  const extension = imageBlob.type.split('/')[1] || 'jpg';
  const filename = `competitor_${timestamp}.${extension}`;

  formData.append('file', imageBlob, filename);
  formData.append('metadata', JSON.stringify(metadata));
  formData.append('category', 'competitor');
  formData.append('uploadedAt', new Date().toISOString());

  try {
    // 构建请求头
    const headers = {};

    // 添加Supabase授权头（如果配置了）
    if (supabaseAnonKey) {
      headers['Authorization'] = `Bearer ${supabaseAnonKey}`;
      headers['apikey'] = supabaseAnonKey;
    }

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      body: formData,
      headers: headers
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `上传失败: HTTP ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    throw new Error(`网络错误: ${error.message}`);
  }
}

/**
 * 显示通知
 */
function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: title,
    message: message,
    priority: 2
  });
}

/**
 * 更新统计数据
 */
async function updateStatistics() {
  const { statistics } = await chrome.storage.local.get(['statistics']);
  const stats = statistics || { totalUploads: 0, lastUploadTime: null };

  stats.totalUploads += 1;
  stats.lastUploadTime = new Date().toISOString();

  await chrome.storage.local.set({ statistics: stats });
}

/**
 * 监听来自popup的消息
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getStatistics') {
    chrome.storage.local.get(['statistics'], (result) => {
      sendResponse(result.statistics || { totalUploads: 0, lastUploadTime: null });
    });
    return true; // 保持消息通道开放
  }

  if (request.action === 'testConnection') {
    testApiConnection(request.apiEndpoint)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

/**
 * 测试API连接
 */
async function testApiConnection(apiEndpoint) {
  try {
    const response = await fetch(apiEndpoint, {
      method: 'OPTIONS',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (response.ok) {
      return '连接成功';
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    throw new Error(`连接失败: ${error.message}`);
  }
}
