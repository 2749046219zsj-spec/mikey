// Supabase 客户端
let supabaseClient = null;
let currentUser = null;
let config = null;

// 初始化
async function init() {
  try {
    // 加载配置
    config = await loadConfig();

    if (!config || !config.supabaseUrl || !config.supabaseAnonKey) {
      showMessage('请先配置 config.json 文件', 'error');
      return;
    }

    // 初始化 Supabase 客户端
    supabaseClient = supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);

    // 检查登录状态
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (session) {
      currentUser = session.user;
      showMainSection();
    } else {
      showLoginSection();
    }

    // 设置事件监听器
    setupEventListeners();
  } catch (error) {
    console.error('初始化失败:', error);
    showMessage('初始化失败: ' + error.message, 'error');
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
  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('register-form').addEventListener('submit', handleRegister);
  document.getElementById('show-register').addEventListener('click', (e) => {
    e.preventDefault();
    showRegisterSection();
  });
  document.getElementById('show-login').addEventListener('click', (e) => {
    e.preventDefault();
    showLoginSection();
  });
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
  document.getElementById('upload-btn').addEventListener('click', handleUpload);
  document.getElementById('refresh-btn').addEventListener('click', loadUserData);
}

// 登录
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    currentUser = data.user;

    // 保存 session
    await chrome.storage.local.set({
      session: data.session,
      user: data.user
    });

    showMessage('登录成功！', 'success');
    showMainSection();
  } catch (error) {
    showMessage('登录失败: ' + error.message, 'error');
  }
}

// 注册
async function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById('reg-username').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;

  if (password.length < 6) {
    showMessage('密码至少需要6位', 'error');
    return;
  }

  try {
    // 创建用户
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
    showLoginSection();
  } catch (error) {
    showMessage('注册失败: ' + error.message, 'error');
  }
}

// 登出
async function handleLogout() {
  try {
    await supabaseClient.auth.signOut();
    await chrome.storage.local.clear();
    currentUser = null;
    showMessage('已退出登录', 'success');
    showLoginSection();
  } catch (error) {
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
    throw new Error('不支持的文件类型');
  }

  // 检查文件大小（10MB）
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('文件大小超过10MB限制');
  }

  // 检查配额
  const { data: profile } = await supabaseClient
    .from('user_profiles')
    .select('storage_quota_mb, storage_used_mb')
    .eq('id', currentUser.id)
    .single();

  const fileSizeMB = file.size / (1024 * 1024);
  if (profile.storage_used_mb + fileSizeMB > profile.storage_quota_mb) {
    throw new Error('存储空间不足');
  }

  // 生成唯一文件名
  const fileExt = file.name.split('.').pop();
  const fileName = `${currentUser.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

  // 上传到 Storage
  const { data: uploadData, error: uploadError } = await supabaseClient
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
      .select('*')
      .eq('id', currentUser.id)
      .single();

    document.getElementById('username').textContent = profile.username || profile.email;
    document.getElementById('storage-info').textContent =
      `${profile.storage_used_mb.toFixed(2)} / ${profile.storage_quota_mb} MB`;

    // 加载图片列表
    const { data: images, error } = await supabaseClient
      .from('user_images')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    document.getElementById('image-count').textContent = images.length;
    displayImages(images);
  } catch (error) {
    console.error('加载数据失败:', error);
    showMessage('加载数据失败: ' + error.message, 'error');
  }
}

// 显示图片列表
function displayImages(images) {
  const imageList = document.getElementById('image-list');
  imageList.innerHTML = '';

  if (images.length === 0) {
    imageList.innerHTML = '<p class="help-text" style="text-align: center;">暂无图片</p>';
    return;
  }

  images.forEach(image => {
    const div = document.createElement('div');
    div.className = 'image-item';
    div.innerHTML = `
      <img src="${image.thumbnail_url || image.image_url}" alt="${image.file_name}">
      <div class="image-info">
        <p><strong>${image.file_name}</strong></p>
        <p>${new Date(image.created_at).toLocaleString('zh-CN')}</p>
        <button class="delete-btn" data-id="${image.id}" data-path="${image.file_path}">删除</button>
      </div>
    `;
    imageList.appendChild(div);
  });

  // 绑定删除事件
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const imageId = e.target.dataset.id;
      const filePath = e.target.dataset.path;
      await handleDeleteImage(imageId, filePath);
    });
  });
}

// 删除图片
async function handleDeleteImage(imageId, filePath) {
  if (!confirm('确定要删除这张图片吗？')) return;

  try {
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

// UI 控制
function showLoginSection() {
  document.getElementById('login-section').classList.add('active');
  document.getElementById('register-section').classList.remove('active');
  document.getElementById('main-section').classList.remove('active');
}

function showRegisterSection() {
  document.getElementById('login-section').classList.remove('active');
  document.getElementById('register-section').classList.add('active');
  document.getElementById('main-section').classList.remove('active');
}

function showMainSection() {
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

// 启动
document.addEventListener('DOMContentLoaded', init);
