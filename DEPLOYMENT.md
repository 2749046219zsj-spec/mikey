# 部署到 GitHub Pages 指南

本指南将帮助你将这个 AI 聊天应用部署到 GitHub Pages。

## 前提条件

- 已有 GitHub 账号
- 已安装 Git
- 已有 Gemini API Key

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
