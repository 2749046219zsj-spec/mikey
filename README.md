# DeepSeek AI Chat 应用

这是一个基于 DeepSeek AI 的聊天应用，专为中国用户优化，无需翻墙即可使用。

## 功能特点

- 💬 智能对话：与 DeepSeek AI 进行自然语言对话
- 🖼️ 图片分析：上传图片让 AI 进行分析和描述
- 🔄 重新发送：可以编辑和重新发送之前的消息
- 📱 响应式设计：支持手机和电脑访问
- 🎨 美观界面：现代化的用户界面设计

## 本地部署步骤

### 1. 获取 API 密钥

访问 [DeepSeek 官网](https://platform.deepseek.com/) 注册账号并获取 API 密钥。

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

在项目根目录创建 `.env` 文件：

```
VITE_DEEPSEEK_API_KEY=你的DeepSeek_API密钥
```

### 4. 启动开发服务器

```bash
npm run dev
```

### 5. 构建生产版本

```bash
npm run build
```

## 使用说明

1. 在输入框中输入你的问题或消息
2. 可以点击上传区域添加图片
3. 按 Enter 发送，Shift+Enter 换行
4. 点击用户消息下的"重新发送"按钮可以编辑并重新发送消息
5. 点击"Clear Chat"可以清空对话历史

## 技术栈

- React 18
- TypeScript
- Tailwind CSS
- Vite
- DeepSeek API

## 注意事项

- 需要有效的 DeepSeek API 密钥才能使用
- 图片分析功能需要 API 支持
- 建议在稳定的网络环境下使用