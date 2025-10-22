# 专业模式UI修复说明

## 修复的问题

### 1. 工具栏按钮与输入框未绑定
**问题描述**: 点击产品/风格/工艺等按钮后，生成的文本没有显示在输入框中

**解决方案**:
- 在ChatInput组件中添加`professionalModeText`和`onProfessionalTextChange` props
- 专业模式下使用外部传入的文本状态(`inputText`)
- AppContent管理专业模式的文本状态
- 所有工具栏按钮通过`updateTexts`函数更新`inputText`状态

**实现细节**:
```typescript
// ChatInput.tsx
const displayText = isProfessionalMode ? professionalModeText : text;

<textarea
  value={displayText}
  onChange={(e) => {
    if (isProfessionalMode && onProfessionalTextChange) {
      onProfessionalTextChange(e.target.value);
    } else {
      setText(e.target.value);
    }
  }}
/>
```

### 2. 参考图显示位置错误
**问题描述**: 参考图显示在错误的位置，应该在输入框上方

**解决方案**:
- 将参考图预览从独立的区域移到输入框的相对定位容器内
- 使用`absolute bottom-full`定位在输入框正上方
- 添加白色背景和边框，增强视觉层次

**实现细节**:
```tsx
<div className="flex-1 relative">
  {/* 参考图显示在输入框上方 */}
  {referenceImages.length > 0 && (
    <div className="absolute bottom-full mb-2 left-0 right-0">
      <div className="flex items-center gap-2 flex-wrap p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
        {/* 参考图列表 */}
      </div>
    </div>
  )}

  <textarea ... />
</div>
```

## 工作流程

### 用户使用专业模式的完整流程

1. **切换到专业模式**
   - 点击顶部的"专业模式"标签
   - 工具栏自动显示

2. **选择产品模板**（可选）
   - 点击"产品"按钮
   - 选择产品模板（如"香水瓶"）
   - 输入框自动填充完整的产品模板文本

3. **添加风格**（可选）
   - 点击"风格"按钮
   - 选择风格（如"洛可可风格"）
   - 文本自动追加到输入框

4. **添加工艺**（可选）
   - 点击"工艺"按钮
   - 在弹窗中选择多个工艺
   - 点击确认，工艺追加到输入框

5. **设置款式数量**
   - 直接修改"款式数量"输入框
   - 如果有产品模板，自动更新模板中的数量

6. **添加参考图**
   - 点击"参考图库"按钮
   - 从图库选择参考图
   - 参考图显示在输入框上方

7. **发送消息**
   - 输入框中的文本会发送给客服助手AI
   - AI返回优化后的提示词列表

8. **生成图像**
   - AI回复下方显示"发现N个提示词"按钮
   - 点击按钮
   - 选择参考图模式（统一或独立）
   - 系统自动批量生成

## 技术实现

### 状态管理

**AppContent.tsx**管理以下状态：
```typescript
const [inputText, setInputText] = useState('');           // 输入框文本
const [fullPromptTemplate, setFullPromptTemplate] = useState(''); // 完整模板
const [selectedItems, setSelectedItems] = useState({      // 选中的元素
  product?: string,
  styles: string[],
  crafts: string[]
});
const [styleCount, setStyleCount] = useState(3);          // 款式数量
```

### 文本更新逻辑

```typescript
const updateTexts = useCallback((newSelectedItems) => {
  if (fullPromptTemplate) {
    // 有模板：替换占位符
    const styleAndCraftElements = [...styles, ...crafts].join('、');
    let finalText = fullPromptTemplate.replace('{风格和元素}', styleAndCraftElements);
    finalText = finalText.replace(/设计\d+个款式/, `设计${styleCount}个款式`);
    setInputText(finalText);
  } else {
    // 无模板：简单拼接
    const displayParts = [product, ...styles, ...crafts];
    setInputText(displayParts.join('、'));
  }
}, [fullPromptTemplate, styleCount]);
```

### 工具栏按钮回调

```typescript
// 产品选择
handleProductSelect(product) {
  setFullPromptTemplate(product.template);
  setInputText(product.template.replace(/设计\d+个款式/, `设计${styleCount}个款式`));
}

// 风格选择
handleStyleSelect(style) {
  const newItems = {...selectedItems, styles: [...selectedItems.styles, style]};
  setSelectedItems(newItems);
  updateTexts(newItems);
}

// 工艺确认
handleCraftsConfirm(crafts) {
  const newItems = {...selectedItems, crafts};
  setSelectedItems(newItems);
  updateTexts(newItems);
}
```

## 视觉效果

### 专业模式特征
- **工具栏**: 橙红渐变背景
- **输入框**: 橙色边框和淡橙色背景
- **发送按钮**: 橙红渐变
- **参考图预览**: 白色背景，位于输入框正上方

### 普通模式特征
- **输入框**: 紫色边框和白色背景
- **发送按钮**: 紫蓝渐变
- **参考图预览**: 同样位置，保持一致性

## 测试清单

- [x] 点击"产品"按钮，文本填充到输入框
- [x] 点击"风格"按钮，风格追加到输入框
- [x] 点击"工艺"按钮，工艺追加到输入框
- [x] 修改款式数量，模板中的数量自动更新
- [x] 点击"参考图库"，参考图显示在输入框上方
- [x] 发送消息后，输入框清空
- [x] AI返回提示词后，显示"发送到生成"按钮
- [x] 切换模式时，输入状态独立

## 与客服助手的对比

| 功能 | 客服助手（旧） | 专业模式（新） |
|------|--------------|--------------|
| 位置 | 浮动窗口 | 集成在主界面 |
| 工具栏 | 底部多行布局 | 顶部单行布局 |
| 参考图 | 输入框内预览 | 输入框上方预览 |
| 文本状态 | 组件内部管理 | 父组件管理 |
| 发送方式 | 直接AI对话 | AI对话+生成 |
| 权限控制 | 独立权限 | 同一权限 |

## 优势

1. **统一体验**: 所有功能在一个界面中
2. **清晰布局**: 工具栏在顶部，输入在底部
3. **状态同步**: 所有工具栏操作实时反映在输入框
4. **视觉反馈**: 参考图在输入框正上方，直观易见
5. **流畅操作**: 无需在多个窗口间切换
