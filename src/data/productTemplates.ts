export interface ProductTemplate {
  id: string;
  name: string;
  template: string;
  icon?: string;
}

export const productTemplates: ProductTemplate[] = [
  {
    id: 'zinc-alloy-shell',
    name: '锌合金外壳香水瓶',
    template: '这是一个关于在现有瓶子上设计锌合金外壳的请求，要求保持瓶型不变，并加入以下风格和元素：{风格和元素}，参考图片2的风格。根据他帮我设计10个款式。'
  },
  {
    id: 'leather-wrapped',
    name: '皮革包裹香水瓶',
    template: '这是一个关于在现有瓶子上设计皮革包裹外壳的请求，要求保持瓶型不变，并加入以下风格和元素：{风格和元素}，参考图片2的风格。根据他帮我设计10个款式。'
  },
  {
    id: 'glass-gradient',
    name: '玻璃渐变香水瓶',
    template: '这是一个关于在现有瓶子上设计玻璃渐变效果的请求，要求保持瓶型不变，并加入以下风格和元素：{风格和元素}，参考图片2的风格。根据他帮我设计10个款式。'
  },
  {
    id: 'metal-carved',
    name: '金属雕刻香水瓶',
    template: '这是一个关于在现有瓶子上设计金属雕刻装饰的请求，要求保持瓶型不变，并加入以下风格和元素：{风格和元素}，参考图片2的风格。根据他帮我设计10个款式。'
  },
  {
    id: 'crystal-inlay',
    name: '水晶镶嵌香水瓶',
    template: '这是一个关于在现有瓶子上设计水晶镶嵌装饰的请求，要求保持瓶型不变，并加入以下风格和元素：{风格和元素}，参考图片2的风格。根据他帮我设计10个款式。'
  },
  {
    id: 'ceramic-painted',
    name: '陶瓷彩绘香水瓶',
    template: '这是一个关于在现有瓶子上设计陶瓷彩绘装饰的请求，要求保持瓶型不变，并加入以下风格和元素：{风格和元素}，参考图片2的风格。根据他帮我设计10个款式。'
  }
];
