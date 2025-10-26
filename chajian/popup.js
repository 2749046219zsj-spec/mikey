// Supabase 客户端和全局变量
let supabaseClient = null;
let currentUser = null;
let config = null;

// 初始化
async function init() {
  try {
    showLoading();

    // 加载配置
    config = await loadConfig();

    if (!config || !config.supabaseUrl || !config.supabaseAnonKey) {
      showMessage('请配置 config.json 文件', 'error');
      hideLoading();
      return;
    }

    // 初始化 Supabase 客户端
    const { createClient } = supabase;
    supabaseClient = createClient(config.supabaseUrl, config.supabaseAnonKey);

    // 检查登录状态
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (session) {
      currentUser = session.user;
      showMainSection();
    } else {
      showLoginSection();
    }

    hideLoading();
    setupEventListeners();
  } catch (error) {
    console.error('初始化失败:', error);
    showMessage('初始化失败: ' + error.message, 'error');
    hideLoading();
  }
}

// 加载配置文件
async function loadConfig() {
  try {
    const response = await fetch(chrome.runtime.getURL('config.json'));
    return await response.json();
  } catch (error) {
    console.error('加载配置失败:', error);
    return null;
  }
}

// 设置事件监听器
function setupEventListeners() {
  document.getElementById('login-form')?.addEventListener('submit', handleLogin);
  document.getElementById('register-form')?.addEventListener('submit', handleRegister);
  document.getElementById('show-register')?.addEventListener('click', (e) => {
    e.preventDefault();
    showRegisterSection();
  });
  document.getElementById('show-login')?.addEventListener('click', (e) => {
    e.preventDefault();
    showLoginSection();
  });
  document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
  document.getElementById('upload-btn')?.addEventListener('click', handleUpload);
  document.getElementById('refresh-btn')?.addEventListener('click', () => loadUserData());
}

// 登录处理
async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  if (!email || !password) {
    showMessage('请填写完整信息', 'error');
    return;
  }

  try {
    showMessage('登录中...', 'info');

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    currentUser = data.user;

    // 保存session
    await chrome.storage.local.set({
      session: data.session,
      user: data.user
    });

    showMessage('登录成功！', 'success');
    showMainSection();
  } catch (error) {
    console.error('登录失败:', error);
    showMessage('登录失败: ' + error.message, 'error');
  }
}

// 注册处理
async function handleRegister(e) {
  e.preventDefault();

  const username = document.getElementById('reg-username').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;

  if (!username || !email || !password) {
    showMessage('请填写完整信息', 'error');
    return;
  }

  if (password.length < 6) {
    showMessage('密码至少需要6位', 'error');
    return;
  }

  try {
    showMessage('注册中...', 'info');

    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username
        }
      }
    });

    if (error) throw error;

    showMessage('注册成功！请登录', 'success');

    // 清空表单
    document.getElementById('reg-username').value = '';
    document.getElementById('reg-email').value = '';
    document.getElementById('reg-password').value = '';

    setTimeout(() => {
      showLoginSection();
      document.getElementById('login-email').value = email;
    }, 1000);
  } catch (error) {
    console.error('注册失败:', error);
    showMessage('注册失败: ' + error.message, 'error');
  }
}

// 登出处理
async function handleLogout() {
  try {
    await supabaseClient.auth.signOut();
    await chrome.storage.local.clear();
    currentUser = null;
    showMessage('已退出登录', 'success');
    showLoginSection();
  } catch (error) {
    console.error('退出失败:', error);
    showMessage('退出失败: ' + error.message, 'error');
  }
}

// 上传图片
async function handleUpload() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.multiple = true;

  input.onchange = async (e) => {
    const files = Array.from(e.target.files);

    if (files.length === 0) return;

    showMessage(`正在上传 ${files.length} 张图片...`, 'info');

    let successCount = 0;
    let failCount = 0;

    for (const file of files) {
      try {
        await uploadImage(file);
        successCount++;
      } catch (error) {
        console.error('上传失败:', file.name, error);
        failCount++;
      }
    }

    if (failCount === 0) {
      showMessage(`成功上传 ${successCount} 张图片`, 'success');
    } else {
      showMessage(`上传完成：成功 ${successCount} 张，失败 ${failCount} 张`, 'warning');
    }

    await loadUserData();
  };

  input.click();
}

// 上传单个图片
async function uploadImage(file) {
  if (!currentUser) throw new Error('未登录');

  // 检查文件类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`${file.name}: 不支持的文件类型`);
  }

  // 检查文件大小（10MB）
  if (file.size > 10 * 1024 * 1024) {
    throw new Error(`${file.name}: 文件大小超过10MB限制`);
  }

  // 检查配额
  const { data: profile } = await supabaseClient
    .from('user_profiles')
    .select('storage_quota_mb, storage_used_mb')
    .eq('id', currentUser.id)
    .maybeSingle();

  if (!profile) throw new Error('无法获取用户配置');

  const fileSizeMB = file.size / (1024 * 1024);
  if (profile.storage_used_mb + fileSizeMB > profile.storage_quota_mb) {
    throw new Error('存储空间不足');
  }

  // 生成唯一文件名
  const fileExt = file.name.split('.').pop() || 'jpg';
  const fileName = `${currentUser.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

  // 上传到 Storage
  const { error: uploadError } = await supabaseClient
    .storage
    .from('user-images')
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  // 获取公共 URL
  const { data: { publicUrl } } = supabaseClient
    .storage
    .from('user-images')
    .getPublicUrl(fileName);

  // 保存元数据到数据库
  const { error: dbError } = await supabaseClient
    .from('user_images')
    .insert({
      user_id: currentUser.id,
      file_name: file.name,
      file_path: fileName,
      file_size_bytes: file.size,
      mime_type: file.type,
      image_url: publicUrl,
      thumbnail_url: publicUrl,
      storage_bucket: 'user-images',
      upload_source: 'browser-extension'
    });

  if (dbError) throw dbError;
}

// 加载用户数据
async function loadUserData() {
  if (!currentUser) return;

  try {
    // 获取用户配置
    const { data: profile } = await supabaseClient
      .from('user_profiles')
      .select('username, email, storage_used_mb, storage_quota_mb')
      .eq('id', currentUser.id)
      .maybeSingle();

    if (profile) {
      document.getElementById('username').textContent = profile.username || profile.email;
      document.getElementById('storage-info').textContent =
        `${profile.storage_used_mb.toFixed(2)} / ${profile.storage_quota_mb} MB`;
    }

    // 加载图片列表
    const { data: images, error } = await supabaseClient
      .from('user_images')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    document.getElementById('image-count').textContent = images?.length || 0;
    displayImages(images || []);

    // 加载竞品上传统计
    const stats = await chrome.storage.local.get(['statistics']);
    document.getElementById('competitor-uploads').textContent =
      stats.statistics?.totalUploads || 0;
  } catch (error) {
    console.error('加载数据失败:', error);
    showMessage('加载数据失败: ' + error.message, 'error');
  }
}

// 显示图片列表
function displayImages(images) {
  const imageList = document.getElementById('image-list');

  if (!images || images.length === 0) {
    imageList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📷</div>
        <div>暂无图片</div>
        <div style="font-size: 12px; margin-top: 8px;">点击上传按钮或右键网页图片上传</div>
      </div>
    `;
    return;
  }

  imageList.innerHTML = '<div class="image-grid"></div>';
  const grid = imageList.querySelector('.image-grid');

  images.forEach(image => {
    const card = document.createElement('div');
    card.className = 'image-card';

    const imgEl = document.createElement('img');
    imgEl.src = image.thumbnail_url || image.image_url;
    imgEl.alt = image.file_name;
    imgEl.loading = 'lazy';

    const footer = document.createElement('div');
    footer.className = 'image-card-footer';

    const name = document.createElement('div');
    name.className = 'image-name';
    name.textContent = image.file_name;
    name.title = image.file_name;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-delete';
    deleteBtn.textContent = '删除';
    deleteBtn.onclick = () => handleDeleteImage(image.id, image.file_path);

    footer.appendChild(name);
    footer.appendChild(deleteBtn);
    card.appendChild(imgEl);
    card.appendChild(footer);
    grid.appendChild(card);
  });
}

// 删除图片
async function handleDeleteImage(imageId, filePath) {
  if (!confirm('确定要删除这张图片吗？')) return;

  try {
    showMessage('删除中...', 'info');

    // 删除存储文件
    await supabaseClient
      .storage
      .from('user-images')
      .remove([filePath]);

    // 删除数据库记录（触发器会自动更新配额）
    const { error } = await supabaseClient
      .from('user_images')
      .delete()
      .eq('id', imageId);

    if (error) throw error;

    showMessage('删除成功', 'success');
    await loadUserData();
  } catch (error) {
    console.error('删除失败:', error);
    showMessage('删除失败: ' + error.message, 'error');
  }
}

// UI 控制函数
function showLoading() {
  document.getElementById('loading-section').style.display = 'block';
  document.getElementById('login-section').classList.remove('active');
  document.getElementById('register-section').classList.remove('active');
  document.getElementById('main-section').classList.remove('active');
}

function hideLoading() {
  document.getElementById('loading-section').style.display = 'none';
}

function showLoginSection() {
  hideLoading();
  document.getElementById('login-section').classList.add('active');
  document.getElementById('register-section').classList.remove('active');
  document.getElementById('main-section').classList.remove('active');
}

function showRegisterSection() {
  hideLoading();
  document.getElementById('login-section').classList.remove('active');
  document.getElementById('register-section').classList.add('active');
  document.getElementById('main-section').classList.remove('active');
}

function showMainSection() {
  hideLoading();
  document.getElementById('login-section').classList.remove('active');
  document.getElementById('register-section').classList.remove('active');
  document.getElementById('main-section').classList.add('active');
  loadUserData();
}

// 显示消息
function showMessage(text, type = 'info') {
  const message = document.getElementById('message');
  message.textContent = text;
  message.className = 'message ' + type;
  message.style.display = 'block';

  setTimeout(() => {
    message.style.display = 'none';
  }, 3000);
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', init);
