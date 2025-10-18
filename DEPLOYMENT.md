# 系统部署指南

本指南涵盖系统的完整部署流程，包括用户管理、支付系统和管理员功能。

## 系统概述

这是一个基于 AI 的图片生成系统，具有：
- 用户注册/登录（全屏界面）
- 管理员审批制度
- 20 次免费额度
- 微信支付购买额度
- 完整的用户管理后台

## 前提条件

- Supabase 账号和项目
- Gemini API Key
- 微信支付二维码图片
- GitHub 账号（可选，用于部署）

## 用户流程

### 1. 首次访问
用户打开网站后，会看到：
- **全屏登录/注册界面**（不是聊天界面）
- 欢迎标语："欢迎使用 AI 绘图系统"
- 可以在登录和注册之间切换

### 2. 用户注册
1. 点击"注册"标签
2. 填写姓名（可选）、邮箱、密码
3. 看到提示："注册福利：成功注册并通过审核后，即可免费获得 20 次绘图机会！"
4. 注册成功后自动切换到登录页

### 3. 用户登录与审批
登录后根据账户状态：
- **待审批** → 显示"账户待审批"页面，提示等待管理员审批
- **已拒绝** → 显示"账户已被拒绝"页面
- **已批准** → 进入聊天界面，可以使用 20 次免费额度

### 4. 使用绘图功能
- 每生成一张图片消耗 1 个额度
- 右上角显示剩余额度
- 额度不足时提示购买

### 5. 购买额度
1. 点击"我的账户"
2. 选择套餐（39/79/99元）
3. 显示微信支付二维码
4. 扫码支付
5. 点击"我已完成支付"
6. 额度自动充值

## 管理员流程

### 管理员账号
- 邮箱: `2749046219@qq.com`
- 密码: `6308001Zha`

### 设置管理员权限
注册后在 Supabase 执行：
```sql
UPDATE profiles
SET is_admin = true, is_approved = true, approval_status = 'approved'
WHERE email = '2749046219@qq.com';
```

### 管理员功能
- 审批/拒绝新用户
- 设置用户额度
- 注销用户账号
- 查看使用统计

详见 `ADMIN_SETUP.md`

## 部署步骤

### 1. 创建 GitHub 仓库

1. 登录 GitHub
2. 点击右上角 "+" 按钮，选择 "New repository"
3. 输入仓库名称（例如：`ai-chat-app`）
4. 选择 Public（必须是 Public 才能免费使用 GitHub Pages）
5. 不要勾选 "Initialize this repository with a README"
6. 点击 "Create repository"

### 2. 推送代码到 GitHub

在项目目录中运行以下命令：

```bash
# 初始化 Git 仓库（如果还没初始化）
git init

# 添加所有文件
git add .

# 提交代码
git commit -m "Initial commit"

# 添加远程仓库（替换为你的 GitHub 用户名和仓库名）
git remote add origin https://github.com/你的用户名/你的仓库名.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

### 3. 配置 GitHub Secrets

1. 在 GitHub 仓库页面，点击 "Settings" 标签
2. 在左侧菜单找到 "Secrets and variables" > "Actions"
3. 点击 "New repository secret"
4. 添加以下 Secret：
   - Name: `VITE_GEMINI_API_KEY`
   - Value: 你的 Gemini API Key
5. 点击 "Add secret"

### 4. 启用 GitHub Pages

1. 在仓库的 "Settings" 页面
2. 在左侧菜单找到 "Pages"
3. 在 "Source" 下拉菜单中选择 "GitHub Actions"
4. 保存设置

### 5. 触发部署

代码推送后，GitHub Actions 会自动开始构建和部署：

1. 进入仓库的 "Actions" 标签
2. 你会看到 "Deploy to GitHub Pages" 工作流正在运行
3. 等待构建完成（通常需要 2-3 分钟）
4. 构建成功后，回到 "Settings" > "Pages"
5. 你会看到网站地址，类似：`https://你的用户名.github.io/你的仓库名/`

### 6. 访问你的应用

点击上面的 URL 即可访问你部署的 AI 聊天应用！

## 后续更新

每次你修改代码并推送到 main 分支时，GitHub Actions 会自动重新构建和部署：

```bash
git add .
git commit -m "更新说明"
git push
```

## 常见问题

### Q: 部署失败怎么办？

1. 检查 GitHub Actions 的错误日志
2. 确认 VITE_GEMINI_API_KEY Secret 已正确设置
3. 确认仓库是 Public 的

### Q: 页面显示 404？

1. 确保 GitHub Pages 的 Source 设置为 "GitHub Actions"
2. 等待几分钟让 GitHub 处理部署
3. 检查 vite.config.ts 中的 base 路径配置

### Q: API Key 安全吗？

API Key 是在构建时嵌入到代码中的，所以会暴露在前端代码中。对于生产环境，建议：
- 使用 API Key 的访问限制功能
- 设置使用配额限制
- 或使用后端代理来保护 API Key

### Q: 可以使用自定义域名吗？

可以！在 GitHub Pages 设置中可以配置自定义域名。

## 技术说明

- 使用 GitHub Actions 自动化部署
- Vite 构建优化
- 静态文件托管
- 免费的 HTTPS 支持

## 支持

如有问题，请检查：
1. GitHub Actions 工作流日志
2. 浏览器控制台错误信息
3. GitHub Pages 设置是否正确
