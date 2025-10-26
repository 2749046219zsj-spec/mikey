# 快速开始指南

## 5分钟快速配置

### 步骤1: 安装插件

**Chrome用户：**
1. 打开 `chrome://extensions/`
2. 开启"开发者模式"（右上角）
3. 点击"加载已解压的扩展程序"
4. 选择 `browser-extension` 文件夹

**Firefox用户：**
1. 打开 `about:debugging#/runtime/this-firefox`
2. 点击"临时载入附加组件"
3. 选择 `manifest.json` 文件

### 步骤2: 配置API地址

1. **点击插件图标**（浏览器工具栏）

2. **输入API地址**
   ```
   https://your-project.supabase.co/functions/v1/competitor-image-upload
   ```

   替换 `your-project` 为你的实际Supabase项目ID

   可以从项目的 `.env` 文件查看：
   ```bash
   # 项目根目录/.env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   ```

3. **点击"测试连接"**
   - 验证配置是否正确

4. **点击"保存配置"**

### 步骤3: 开始使用

1. 访问任意网页（如 https://shein.com）
2. 右键点击任意商品图片
3. 选择"上传到竞品图库"
4. 等待上传完成提示

### 步骤4: 查看上传的图片

1. 打开主应用（http://localhost:5173）
2. 登录账号
3. 进入"参考图库"
4. 切换到"公共数据库"标签
5. 查看已上传的图片

## 配置检查清单

- [ ] 插件已安装到浏览器
- [ ] API地址已正确配置
- [ ] 测试连接成功
- [ ] 启用上传功能开关已开启
- [ ] 能看到插件图标在工具栏

## 常见配置错误

### ❌ 错误的API地址格式

```
http://localhost:54321/functions/v1/competitor-image-upload  ❌
your-project.supabase.co/functions/v1/competitor-image-upload  ❌
```

### ✅ 正确的API地址格式

```
https://your-project.supabase.co/functions/v1/competitor-image-upload  ✅
```

## 测试上传

建议先在以下网站测试：

1. **SHEIN** - https://shein.com
   - 图片清晰，加载快速
   - 商品信息完整

2. **Unsplash** - https://unsplash.com
   - 高质量图片
   - 无版权限制

3. **Pexels** - https://pexels.com
   - 免费图片素材
   - 测试上传功能

## 验证上传成功

1. **浏览器通知**
   - 看到"上传成功"通知

2. **统计数据**
   - 点击插件图标
   - 查看"总上传数"是否增加

3. **主应用**
   - 在参考图库中查看新上传的图片
   - 检查图片是否包含元数据

## 需要帮助？

查看完整的 `README.md` 文档获取详细说明。
