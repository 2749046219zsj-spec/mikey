export interface StyleCategory {
  name: string;
  styles: string[];
}

export const stylePresets: StyleCategory[] = [
  {
    name: '古典艺术风格',
    styles: [
      '文艺复兴风格',
      '巴洛克风格',
      '洛可可风格',
      '新古典主义风格',
      '维多利亚风格',
      '拜占庭风格',
      '哥特风格',
      '古希腊罗马风格'
    ]
  },
  {
    name: '东方艺术风格',
    styles: [
      '中国水墨风格',
      '国潮风格',
      '日本浮世绘风格',
      '和风极简风格',
      '韩风清新风格',
      '新中式风格'
    ]
  },
  {
    name: '现代艺术风格',
    styles: [
      '装饰艺术风格（Art Deco）',
      '新艺术风格（Art Nouveau）',
      '印象派风格',
      '后印象派风格',
      '立体主义风格',
      '抽象主义风格',
      '表现主义风格',
      '未来主义风格',
      '波普艺术风格（Pop Art）',
      '极简主义风格',
      '包豪斯风格（Bauhaus）',
      '超现实主义风格',
      '现代复古风格（Modern Retro）'
    ]
  },
  {
    name: '当代设计风格',
    styles: [
      '马卡龙风格',
      '梦幻粉彩风格（Pastel Dream）',
      'Y2K风格',
      '赛博朋克风格',
      '蒸汽波风格（Vaporwave）',
      '孟菲斯风格（Memphis Style）',
      '街头潮流风格（Street Style）',
      '未来极简风格（Futuristic Minimal）',
      '复古未来主义（Retro Futurism）',
      '极繁主义风格（Maximalism）',
      '暗黑哥特风格（Dark Gothic）',
      '金属机械风格（Industrial Metallic）'
    ]
  },
  {
    name: '自然与浪漫风格',
    styles: [
      '田园风格',
      '波西米亚风格',
      '梦幻童话风格',
      '森林精灵风格',
      '花卉浪漫风格',
      '轻复古风格',
      '地中海风格',
      '北欧极简风格',
      '法式浪漫风格',
      '英伦古典风格'
    ]
  },
  {
    name: '潮流视觉风格',
    styles: [
      '迪士尼风格',
      '可爱卡通风格（Kawaii Style）',
      '韩系软萌风格（Soft Girl Style）',
      '糖果色风格（Candy Color）',
      '手绘插画风格',
      '漫画风格',
      '像素风格',
      '3D塑料风（Plastic Pop）',
      '2.5D浮雕风格',
      '盲盒潮玩风格',
      '玩具艺术风格（Toy Art）',
      '艺术涂鸦风格（Graffiti Style）',
      '拼贴混搭风格（Collage Style）'
    ]
  }
];
