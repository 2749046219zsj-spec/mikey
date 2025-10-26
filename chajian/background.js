/**
 * 多用户图片管理插件 - 背景脚本
 * 支持用户登录认证和个人图库上传
 */

// 加载 Supabase 库（本地文件）
importScripts('supabase.js');

let config = null;
let supabaseClient = null;

// 初始化：创建右键菜单
chrome.runtime.onInstalled.addListener(async () => {
  // 加载配置
  config = await loadConfig();

  // 创建右键菜单：个人图库上传
  chrome.contextMenus.create({
    id: 'upload-to-my-library',
    title: '上传到我的图库',
    contexts: ['image']
  });

  // 创建右键菜单：竞品图库上传（保留原功能）
  chrome.contextMenus.create({
    id: 'upload-to-competitor',
    title: '上传到竞品图库',
    contexts: ['image']
  });

  // 初始化 Supabase 客户端
  if (config && config.supabaseUrl && config.supabaseAnonKey) {
    supabaseClient = supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
  }
});

// 监听右键菜单点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'upload-to-my-library') {
    handleUserLibraryUpload(info, tab);
  } else if (info.menuItemId === 'upload-to-competitor') {
    handleCompetitorUpload(info, tab);
  }
});

/**
 * 加载配置文件
 */
async function loadConfig() {
  try {
    const response = await fetch(chrome.runtime.getURL('config.json'));
    return await response.json();
  } catch (error) {
    console.error('加载配置失败:', error);
    return null;
  }
}

/**
 * 处理个人图库上传
 */
async function handleUserLibraryUpload(info, tab) {
  try {
    // 检查登录状态
    const { session, user } = await chrome.storage.local.get(['session', 'user']);

    if (!session || !user) {
      showNotification('未登录', '请先登录后再上传图片到个人图库');
      return;
    }

    if (!config) {
      showNotification('配置错误', '请先配置插件');
      return;
    }

    const imageUrl = info.srcUrl;
    showNotification('上传中', '正在上传到我的图库...');

    const imageBlob = await fetchImageAsBlob(imageUrl);

    // 上传到用户个人图库
    await uploadToUserLibrary(imageBlob, user, {
      originalUrl: imageUrl,
      pageUrl: tab.url,
      pageTitle: tab.title
    });

    showNotification('上传成功', '图片已上传到我的图库');
  } catch (error) {
    console.error('上传失败:', error);
    showNotification('上传失败', error.message);
  }
}

/**
 * 处理竞品图库上传（需要登录）
 */
async function handleCompetitorUpload(info, tab) {
  try {
    if (!config || !config.enabled) {
      showNotification('错误', '插件未启用');
      return;
    }

    if (!config.competitorUploadEndpoint) {
      showNotification('配置错误', '请先配置竞品上传接口');
      return;
    }

    // 检查登录状态
    const { session } = await chrome.storage.local.get(['session']);
    if (!session || !session.access_token) {
      showNotification('需要登录', '请先登录才能上传到竞品图库');
      return;
    }

    const imageUrl = info.srcUrl;
    showNotification('上传中', '正在上传到竞品图库...');

    const imageBlob = await fetchImageAsBlob(imageUrl);

    await uploadToCompetitorLibrary(imageBlob, {
      originalUrl: imageUrl,
      pageUrl: tab.url,
      pageTitle: tab.title
    }, session.access_token);

    showNotification('上传成功', '图片已上传到您的竞品图库');

    // 更新统计
    await updateStatistics();
  } catch (error) {
    console.error('上传失败:', error);
    showNotification('上传失败', error.message);
  }
}

/**
 * 获取图片为Blob
 */
async function fetchImageAsBlob(imageUrl) {
  try {
    const response = await fetch(imageUrl, {
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-cache'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const blob = await response.blob();

    if (!blob.type.startsWith('image/')) {
      throw new Error('不是有效的图片');
    }

    return blob;
  } catch (error) {
    throw new Error(`获取图片失败: ${error.message}`);
  }
}

/**
 * 上传到用户个人图库
 */
async function uploadToUserLibrary(imageBlob, user, metadata) {
  // 检查文件类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
  if (!allowedTypes.includes(imageBlob.type)) {
    throw new Error('不支持的文件类型');
  }

  // 检查文件大小（10MB）
  if (imageBlob.size > 10 * 1024 * 1024) {
    throw new Error('文件大小超过10MB限制');
  }

  // 重新初始化 Supabase 客户端（确保有最新 session）
  if (!supabaseClient) {
    if (!config || !config.supabaseUrl || !config.supabaseAnonKey) {
      throw new Error('Supabase 未配置');
    }
    supabaseClient = supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
  }

  // 设置 session
  const { session } = await chrome.storage.local.get(['session']);
  if (session) {
    await supabaseClient.auth.setSession(session);
  }

  // 检查配额
  const { data: profile, error: profileError } = await supabaseClient
    .from('user_profiles')
    .select('storage_quota_mb, storage_used_mb')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) throw new Error('无法获取用户配置');
  if (!profile) throw new Error('用户配置不存在');

  const fileSizeMB = imageBlob.size / (1024 * 1024);
  if (profile.storage_used_mb + fileSizeMB > profile.storage_quota_mb) {
    throw new Error('存储空间不足');
  }

  // 生成唯一文件名
  const fileExt = imageBlob.type.split('/')[1];
  const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

  // 上传到 Storage
  const { error: uploadError } = await supabaseClient
    .storage
    .from('user-images')
    .upload(fileName, imageBlob);

  if (uploadError) throw uploadError;

  // 获取公共 URL
  const { data: { publicUrl } } = supabaseClient
    .storage
    .from('user-images')
    .getPublicUrl(fileName);

  // 提取文件名
  const originalFileName = metadata.originalUrl.split('/').pop().split('?')[0] || 'image';

  // 保存元数据到数据库
  const { error: dbError } = await supabaseClient
    .from('user_images')
    .insert({
      user_id: user.id,
      file_name: originalFileName,
      file_path: fileName,
      file_size_bytes: imageBlob.size,
      mime_type: imageBlob.type,
      image_url: publicUrl,
      thumbnail_url: publicUrl,
      storage_bucket: 'user-images',
      upload_source: 'browser-extension-contextmenu',
      metadata: {
        originalUrl: metadata.originalUrl,
        pageUrl: metadata.pageUrl,
        pageTitle: metadata.pageTitle
      }
    });

  if (dbError) throw dbError;

  return { success: true, url: publicUrl };
}

/**
 * 上传到竞品图库（需要认证 token）
 */
async function uploadToCompetitorLibrary(imageBlob, metadata, accessToken) {
  const formData = new FormData();

  const timestamp = Date.now();
  const extension = imageBlob.type.split('/')[1] || 'jpg';
  const filename = `competitor_${timestamp}.${extension}`;

  formData.append('file', imageBlob, filename);
  formData.append('metadata', JSON.stringify(metadata));
  formData.append('category', 'competitor');

  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'apikey': config.supabaseAnonKey
  };

  const response = await fetch(config.competitorUploadEndpoint, {
    method: 'POST',
    body: formData,
    headers: headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `上传失败: HTTP ${response.status}`);
  }

  return await response.json();
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
 * 更新竞品上传统计数据
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
    return true;
  }
});
