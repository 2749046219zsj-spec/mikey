/**
 * 竞品图库上传助手 - 弹窗脚本
 */

// DOM元素
const elements = {
  statusDot: document.getElementById('statusDot'),
  statusText: document.getElementById('statusText'),
  totalUploads: document.getElementById('totalUploads'),
  lastUpload: document.getElementById('lastUpload'),
  enabledSwitch: document.getElementById('enabledSwitch'),
  apiEndpoint: document.getElementById('apiEndpoint'),
  supabaseAnonKey: document.getElementById('supabaseAnonKey'),
  testBtn: document.getElementById('testBtn'),
  saveBtn: document.getElementById('saveBtn'),
  message: document.getElementById('message')
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  loadConfig();
  loadStatistics();
  bindEvents();
});

/**
 * 加载配置
 */
async function loadConfig() {
  try {
    const { config } = await chrome.storage.local.get(['config']);

    if (config) {
      elements.enabledSwitch.checked = config.enabled !== false;
      elements.apiEndpoint.value = config.apiEndpoint || '';
      elements.supabaseAnonKey.value = config.supabaseAnonKey || '';
      updateStatus(config);
    }
  } catch (error) {
    console.error('加载配置失败:', error);
  }
}

/**
 * 加载统计信息
 */
async function loadStatistics() {
  try {
    const statistics = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'getStatistics' }, resolve);
    });

    if (statistics) {
      elements.totalUploads.textContent = statistics.totalUploads || 0;

      if (statistics.lastUploadTime) {
        const lastTime = new Date(statistics.lastUploadTime);
        elements.lastUpload.textContent = formatDateTime(lastTime);
      } else {
        elements.lastUpload.textContent = '未上传过';
      }
    }
  } catch (error) {
    console.error('加载统计信息失败:', error);
  }
}

/**
 * 更新状态显示
 */
function updateStatus(config) {
  if (config && config.enabled && config.apiEndpoint && config.supabaseAnonKey) {
    elements.statusDot.classList.add('active');
    elements.statusText.textContent = '已启用';
  } else {
    elements.statusDot.classList.remove('active');
    elements.statusText.textContent = config?.enabled ? '未配置' : '已禁用';
  }
}

/**
 * 绑定事件
 */
function bindEvents() {
  // 保存配置
  elements.saveBtn.addEventListener('click', saveConfig);

  // 测试连接
  elements.testBtn.addEventListener('click', testConnection);

  // 启用开关
  elements.enabledSwitch.addEventListener('change', () => {
    saveConfig();
  });

  // 回车保存
  elements.apiEndpoint.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      saveConfig();
    }
  });
}

/**
 * 保存配置
 */
async function saveConfig() {
  const config = {
    enabled: elements.enabledSwitch.checked,
    apiEndpoint: elements.apiEndpoint.value.trim(),
    supabaseAnonKey: elements.supabaseAnonKey.value.trim()
  };

  // 验证必填字段
  if (config.enabled) {
    if (!config.apiEndpoint) {
      showMessage('请输入API上传地址', 'error');
      return;
    }
    if (!config.supabaseAnonKey) {
      showMessage('请输入Supabase匿名密钥', 'error');
      return;
    }
  }

  if (config.apiEndpoint && !isValidUrl(config.apiEndpoint)) {
    showMessage('请输入有效的URL地址', 'error');
    return;
  }

  try {
    await chrome.storage.local.set({ config });
    updateStatus(config);
    showMessage('配置已保存', 'success');
  } catch (error) {
    console.error('保存配置失败:', error);
    showMessage('保存失败，请重试', 'error');
  }
}

/**
 * 测试连接
 */
async function testConnection() {
  const apiEndpoint = elements.apiEndpoint.value.trim();

  if (!apiEndpoint) {
    showMessage('请先输入API地址', 'error');
    return;
  }

  if (!isValidUrl(apiEndpoint)) {
    showMessage('请输入有效的URL地址', 'error');
    return;
  }

  // 禁用按钮
  elements.testBtn.disabled = true;
  elements.testBtn.textContent = '测试中...';

  try {
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { action: 'testConnection', apiEndpoint },
        resolve
      );
    });

    if (response.success) {
      showMessage('连接成功！', 'success');
    } else {
      showMessage(`连接失败: ${response.error}`, 'error');
    }
  } catch (error) {
    showMessage('测试失败，请检查网络', 'error');
  } finally {
    // 恢复按钮
    elements.testBtn.disabled = false;
    elements.testBtn.textContent = '测试连接';
  }
}

/**
 * 显示消息
 */
function showMessage(text, type = 'info') {
  elements.message.textContent = text;
  elements.message.className = `message ${type} show`;

  setTimeout(() => {
    elements.message.classList.remove('show');
  }, 3000);
}

/**
 * 验证URL
 */
function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

/**
 * 格式化日期时间
 */
function formatDateTime(date) {
  const now = new Date();
  const diff = now - date;

  // 小于1分钟
  if (diff < 60000) {
    return '刚刚';
  }

  // 小于1小时
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}分钟前`;
  }

  // 小于24小时
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}小时前`;
  }

  // 小于7天
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days}天前`;
  }

  // 格式化为日期
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hour}:${minute}`;
}
