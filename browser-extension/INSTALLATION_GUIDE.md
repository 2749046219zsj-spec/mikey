# 安装配置指南

## 完整安装步骤

### 前置要求

- Chrome 88+ 或 Firefox 90+ 浏览器
- 已部署的Supabase项目
- 已部署的Edge Function: `competitor-image-upload`

### 第一部分：准备图标文件

浏览器扩展需要图标文件才能正常显示。

**选项1：使用在线工具快速生成**

```bash
cd browser-extension/icons

# 使用curl下载临时占位图标
curl "https://via.placeholder.com/128x128/4CAF50/ffffff?text=图库" -o icon128.png
curl "https://via.placeholder.com/48x48/4CAF50/ffffff?text=图库" -o icon48.png
curl "https://via.placeholder.com/16x16/4CAF50/ffffff" -o icon16.png
```

**选项2：自己设计图标**

查看 `icons/ICON_README.md` 了解详细的图标设计指南。

需要创建三个PNG文件：
- icon16.png (16x16像素)
- icon48.png (48x48像素)
- icon128.png (128x128像素)

### 第二部分：安装浏览器扩展

#### Chrome浏览器

1. **打开扩展管理页面**
   - 地址栏输入：`chrome://extensions/`
   - 或：菜单 → 更多工具 → 扩展程序

2. **启用开发者模式**
   - 页面右上角，打开"开发者模式"开关

3. **加载扩展**
   - 点击"加载已解压的扩展程序"
   - 选择 `browser-extension` 文件夹
   - 确认加载

4. **固定图标**
   - 点击拼图图标（扩展列表）
   - 找到"竞品图库上传助手"
   - 点击图钉图标固定到工具栏

#### Firefox浏览器

1. **打开调试页面**
   - 地址栏输入：`about:debugging#/runtime/this-firefox`

2. **临时加载**
   - 点击"临时载入附加组件"
   - 浏览到 `browser-extension` 文件夹
   - 选择 `manifest.json` 文件
   - 确认加载

**注意**：Firefox中的临时加载在浏览器重启后会失效，需要重新加载。

### 第三部分：配置API地址

1. **获取Supabase项目URL**

   从项目根目录的 `.env` 文件中查看：
   ```
   VITE_SUPABASE_URL=https://tvghcqbgktwummwjiexp.supabase.co
   ```

2. **构建完整的API端点**

   格式：
   ```
   {SUPABASE_URL}/functions/v1/competitor-image-upload
   ```

   对于这个项目，完整地址是：
   ```
   https://tvghcqbgktwummwjiexp.supabase.co/functions/v1/competitor-image-upload
   ```

3. **打开插件配置**
   - 点击浏览器工具栏中的插件图标
   - 打开配置面板

4. **输入API地址**
   - 在"API上传地址"输入框中粘贴完整的API地址
   - 确保没有多余的空格

5. **测试连接**
   - 点击"测试连接"按钮
   - 等待响应
   - 看到"连接成功"提示

6. **保存配置**
   - 点击"保存配置"按钮
   - 确认状态显示为"已启用"

### 第四部分：测试上传功能

1. **访问测试网站**

   推荐的测试网站（无版权问题）：
   - https://unsplash.com
   - https://pexels.com

2. **执行上传测试**
   - 右键点击任意图片
   - 选择"上传到竞品图库"
   - 等待通知提示

3. **验证上传结果**

   **方式1：查看浏览器通知**
   - 应该看到"上传中"通知
   - 随后看到"上传成功"通知

   **方式2：查看插件统计**
   - 点击插件图标
   - 查看"总上传数"是否增加
   - 查看"最后上传"时间是否更新

   **方式3：在主应用中查看**
   - 打开主应用
   - 登录账号
   - 进入"参考图库"
   - 切换到"公共数据库"标签
   - 查找最新上传的图片

### 第五部分：在实际网站使用

现在可以在各种电商网站使用：

**支持的网站示例**：
- SHEIN (https://shein.com)
- 淘宝 (https://taobao.com)
- 天猫 (https://tmall.com)
- 亚马逊 (https://amazon.com)
- 京东 (https://jd.com)
- 以及其他任意包含图片的网页

**使用方法**：
1. 浏览商品页面
2. 右键点击商品图片
3. 选择"上传到竞品图库"
4. 等待上传完成

## 常见问题解决

### 问题1：插件图标不显示

**原因**：缺少图标文件

**解决**：
```bash
cd browser-extension/icons
# 生成临时占位图标
curl "https://via.placeholder.com/128x128/4CAF50/ffffff?text=图库" -o icon128.png
curl "https://via.placeholder.com/48x48/4CAF50/ffffff?text=图库" -o icon48.png
curl "https://via.placeholder.com/16x16/4CAF50/ffffff" -o icon16.png
```

然后在扩展管理页面重新加载扩展。

### 问题2：上传失败 - 连接错误

**原因**：API地址配置错误或Edge Function未部署

**解决**：
1. 检查API地址格式是否正确
2. 确认Edge Function已部署：
   ```bash
   # 在项目根目录执行
   ls supabase/functions/competitor-image-upload/
   ```
3. 测试Edge Function是否可访问：
   ```bash
   curl -X OPTIONS https://tvghcqbgktwummwjiexp.supabase.co/functions/v1/competitor-image-upload
   ```

### 问题3：上传失败 - CORS错误

**原因**：Edge Function的CORS配置问题

**检查**：
- Edge Function已正确部署
- verify_jwt设置为false（公共访问）

### 问题4：无法获取商品信息

**原因**：某些网站使用特殊的DOM结构

**说明**：
- 这是正常现象
- 插件会继续上传图片
- 只是缺少商品名称、价格等额外信息

### 问题5：某些图片无法上传

**可能原因**：
1. 图片使用了防盗链保护
2. 图片需要登录才能访问
3. 图片URL过期
4. CORS限制

**解决**：
- 先在浏览器中单独打开图片，确认可以正常访问
- 如果图片需要登录，确保已登录该网站

## 卸载插件

### Chrome

1. 打开 `chrome://extensions/`
2. 找到"竞品图库上传助手"
3. 点击"移除"按钮

### Firefox

1. 打开 `about:addons`
2. 找到插件
3. 点击"移除"

## 数据清理

卸载插件不会自动清理上传的图片数据。如需清理：

1. 在主应用的"参考图库"中手动删除
2. 或在Supabase控制台中清理 `public_reference_images` 表

## 更新插件

如果插件代码有更新：

1. 替换 `browser-extension` 文件夹中的文件
2. 在扩展管理页面点击"重新加载"按钮
3. 无需重新配置API地址（配置保存在浏览器本地）

## 技术支持

### 查看日志

**Chrome**：
1. 右键点击插件图标
2. 选择"检查弹出内容"
3. 或在扩展管理页面点击"背景页"

**Firefox**：
1. 打开 `about:debugging#/runtime/this-firefox`
2. 找到插件
3. 点击"检查"按钮

### 常用调试命令

```javascript
// 在浏览器控制台执行

// 查看配置
chrome.storage.local.get(['config'], console.log)

// 查看统计
chrome.storage.local.get(['statistics'], console.log)

// 清除配置
chrome.storage.local.clear()
```

## 安全提醒

- 不要在公共电脑上使用
- 不要上传包含敏感信息的图片
- 定期检查上传历史
- 仅在可信网站使用

---

安装完成！开始使用"竞品图库上传助手"收集参考图片吧！
