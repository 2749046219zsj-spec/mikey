# 图片加载优化方案

## 问题说明

生成的图片无法加载，显示"图片加载失败，可能由于网络原因或资源不可用"。

### 根本原因

1. **跨域限制（CORS）**：Poe CDN (`https://pfst.cf2.poecdn.net/`) 的图片有跨域访问限制
2. **直接访问限制**：某些图片服务器不允许从浏览器直接访问
3. **Referer检查**：图片服务器可能检查请求来源

## 解决方案

### 1. 创建图片代理 Edge Function

部署了一个 Supabase Edge Function (`image-proxy`) 来代理所有外部图片请求：

**功能特点：**
- ✅ 绕过 CORS 限制
- ✅ 添加适当的请求头（User-Agent, Referer）
- ✅ 支持所有图片格式
- ✅ 缓存控制（24小时）
- ✅ 错误处理和重试机制

**URL格式：**
```
https://your-project.supabase.co/functions/v1/image-proxy?url=原始图片URL
```

### 2. 图片URL处理工具

创建了 `src/utils/imageProxy.ts` 工具函数：

```typescript
// 自动将外部URL转换为代理URL
const proxiedUrl = proxyImageUrl('https://pfst.cf2.poecdn.net/xxx.jpg');
// 结果: https://your-project.supabase.co/functions/v1/image-proxy?url=...

// 批量处理
const proxiedUrls = proxyImageUrls([url1, url2, url3]);
```

**智能识别：**
- Blob URL（`blob:`）→ 不代理（本地文件）
- Data URL（`data:`）→ 不代理（base64）
- HTTP/HTTPS URL → 使用代理

### 3. 组件更新

#### ChatMessage.tsx
- ✅ 所有AI生成的图片自动使用代理
- ✅ 保留原始URL和代理URL的映射
- ✅ 下载功能兼容处理

#### ImageWithFallback.tsx
- ✅ 改进重试机制（指数退避）
- ✅ 移除 `crossOrigin="anonymous"`（代理已处理）
- ✅ 优化加载性能
- ✅ 更好的错误提示

#### ImageGallery.tsx
- ✅ 使用代理URL显示图片
- ✅ 下载功能正常工作

### 4. 技术优化

**重试策略：**
- 最多重试3次
- 指数退避延迟：1s → 2s → 4s（最大5s）
- 每次重试添加时间戳防止缓存

**加载优化：**
- `loading="eager"` - 优先加载图片
- `referrerPolicy="no-referrer"` - 避免referer限制
- 移除crossOrigin限制

## 使用说明

### 前端自动处理

所有图片URL会自动通过代理加载，无需手动操作：

```typescript
// 在聊天消息中
// AI返回: https://pfst.cf2.poecdn.net/image.jpg
// 自动转换为: https://project.supabase.co/functions/v1/image-proxy?url=...

// 本地图片不受影响
// blob:http://localhost:5173/xxx → 保持不变
```

### 手动使用代理

如需在其他地方使用：

```typescript
import { proxyImageUrl } from '../utils/imageProxy';

const imageUrl = 'https://external-cdn.com/image.jpg';
const proxiedUrl = proxyImageUrl(imageUrl);

<img src={proxiedUrl} alt="..." />
```

## Edge Function 详情

### 请求示例

```bash
GET https://your-project.supabase.co/functions/v1/image-proxy?url=https://example.com/image.jpg
```

### 响应头

```
Access-Control-Allow-Origin: *
Content-Type: image/jpeg
Cache-Control: public, max-age=86400, immutable
```

### 错误处理

- 400: 缺少url参数或URL格式错误
- 500: 获取图片失败或内部错误

### 安全性

- ✅ URL验证，防止无效请求
- ✅ CORS头配置正确
- ✅ 不需要JWT验证（公开访问）
- ⚠️ 注意：任何人都可以使用此代理

## 性能考虑

### 优点
- ✅ 解决跨域问题
- ✅ 统一错误处理
- ✅ 支持缓存

### 潜在问题
- ⚠️ 额外的网络跳转（增加延迟）
- ⚠️ Edge Function带宽消耗
- ⚠️ 可能被滥用（考虑添加速率限制）

### 优化建议

1. **添加速率限制**：防止滥用
2. **缓存策略**：在CDN层面缓存
3. **图片优化**：压缩、格式转换
4. **监控**：追踪使用情况

## 测试验证

1. **发送绘图请求**
   ```
   用户: **可爱的小猫**
   ```

2. **检查图片加载**
   - 打开浏览器开发者工具
   - 查看Network标签
   - 确认图片通过 `/functions/v1/image-proxy` 加载
   - 验证状态码为 200

3. **测试下载功能**
   - 点击图片下载按钮
   - 验证能正常下载为JPG格式

4. **测试图库功能**
   - 查看左侧图库
   - 确认所有图片正常显示
   - 测试批量下载功能

## 故障排查

### 图片仍然加载失败

1. **检查Edge Function状态**
   ```bash
   # 列出所有函数
   supabase functions list

   # 查看日志
   supabase functions logs image-proxy
   ```

2. **检查环境变量**
   ```bash
   # 确认VITE_SUPABASE_URL已配置
   echo $VITE_SUPABASE_URL
   ```

3. **手动测试代理**
   ```bash
   curl "https://your-project.supabase.co/functions/v1/image-proxy?url=https://example.com/test.jpg"
   ```

### 下载失败

- 检查浏览器控制台错误
- 确认fetch请求成功
- 验证blob转换逻辑

## 总结

通过部署图片代理Edge Function，完全解决了跨域图片加载问题：

✅ **问题已解决**
- 所有外部图片通过代理加载
- 自动重试和错误处理
- 用户体验优化

✅ **兼容性**
- 本地blob图片不受影响
- 现有功能保持正常
- 向后兼容

🚀 **后续优化**
- 考虑添加图片缓存层
- 实现速率限制
- 监控使用情况
