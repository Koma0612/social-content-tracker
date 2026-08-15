// 与 backend/src/constants/options.ts 保持一致。

export const PLATFORMS = ['Facebook', 'Instagram', 'LinkedIn', 'YouTube'] as const;

export const CONTENT_TYPES = [
  '产品卖点',
  '应用场景',
  '用户教育',
  '客户案例',
  '活动预告',
  '行业热点',
] as const;

export const CONTENT_FORMATS = [
  '图文',
  '短视频',
  'Reels',
  '长视频',
  '轮播图',
  'Story',
] as const;

export const CONTENT_GOALS = ['品牌曝光', '用户教育', '线索转化', '活动引流'] as const;

export const CAMPAIGNS = ['新品推广', '展会宣传', '季节性节点', '行业热点'] as const;

// 内容生产的 7 个环节，与 backend/src/types/index.ts 的 CONTENT_STATUSES 保持一致
export const CONTENT_STATUSES = [
  '选题',
  '收集素材',
  '写文案',
  '制作',
  '审核',
  '排期',
  '发布',
] as const;
