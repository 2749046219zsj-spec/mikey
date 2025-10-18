# AI 图片生成器

一个基于 Gemini AI 的智能图片生成应用，支持自定义提示词结构、风格预设和图片管理。

## 功能特点

- 🎨 多种风格预设（水彩、油画、赛博朋克等）
- 🛠️ 可自定义的提示词结构
- 📸 图片库管理和预览
- 💬 AI 聊天助手
- 🎯 产品、工艺、模型选择器
- 💾 数据持久化存储（Supabase）

## 技术栈

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Supabase
- Google Gemini AI
- Zustand（状态管理）

## 本地开发

1. 克隆项目
```bash
git clone https://github.com/103MIKEY/ai-image-generator.git
cd ai-image-generator
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量

创建 `.env` 文件并添加以下内容：
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

4. 启动开发服务器
```bash
npm run dev
```

## 部署到 GitHub Pages

### 配置 GitHub Secrets

在仓库的 **Settings > Secrets and variables > Actions** 中添加以下 secrets：

- `VITE_SUPABASE_URL` - Supabase 项目 URL
- `VITE_SUPABASE_ANON_KEY` - Supabase 匿名密钥
- `VITE_GEMINI_API_KEY` - Google Gemini API 密钥（可选）

### 启用 GitHub Pages

1. 进入仓库的 **Settings > Pages**
2. 在 **Source** 下选择 **GitHub Actions**
3. 保存设置

### 自动部署

每次推送到 `main` 分支时，GitHub Actions 会自动构建并部署应用。

部署完成后，访问：
```
https://103mikey.github.io/ai-image-generator/
```

## 推送代码到 GitHub

```bash
# 初始化 Git（如果还没有）
git init

# 添加所有文件
git add .

# 提交代码
git commit -m "Initial commit"

# 添加远程仓库
git remote add origin https://github.com/103MIKEY/ai-image-generator.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

## 许可证

MIT License
