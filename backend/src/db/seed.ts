/**
 * 种子数据脚本：往数据库里灌一批贴近真实业务场景的示例数据，用于本地开发和演示。
 *
 * 场景设定：一个虚构的农机/农业设备品牌，做海外市场（北美/东南亚/欧洲等）的社媒内容运营。
 * 所有内容、人名、数据均为虚构，不含任何真实公司、真实人物或真实商业数据(README 第七节已说明)。
 *
 * 用法：npm run seed -w backend
 * 这个脚本会先清空 4 张业务表，再重新插入一批数据，可以反复执行。
 */
import { db } from './connection';
import { ContentStatus, ReviewerRole, RejectReason } from '../types';

function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

function hoursAgo(n: number): string {
  const d = new Date();
  d.setUTCHours(d.getUTCHours() - n);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

interface SeedReview {
  reviewer_role: ReviewerRole;
  reviewer_name: string;
  round_number: number;
  result: '通过' | '打回';
  comment: string;
  reject_reasons?: RejectReason[];
  reviewed_at: string;
}

interface SeedContent {
  planned_publish_date: string | null;
  platform: string;
  topic: string;
  content_type: string;
  content_format: string;
  content_goal: string;
  campaign: string;
  language_market: string;
  owner: string;
  copywriting: string | null;
  material_source: string | null;
  current_status: ContentStatus;
  status_entered_at: string;
  current_owner: string;
  is_paid_promotion: number;
  paid_amount: number | null;
  actual_publish_date: string | null;
  publish_url: string | null;
  impressions: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves?: number | null; // 可选：不是每条记录都要显式写，未写的默认存 NULL(不是 0)
  dm_count: number | null;
  new_followers: number | null;
  metrics_captured_at: string | null;
  reviews?: SeedReview[];
}

const OWNERS = ['Amy', 'Ben', 'Cathy', 'David', 'Ella', 'Frank'];

const records: SeedContent[] = [
  // ---------- 选题阶段(3条) ----------
  {
    planned_publish_date: '2026-08-25', platform: 'Facebook', topic: '农场主使用案例:玉米收获季效率提升实录',
    content_type: '客户案例', content_format: '短视频', content_goal: '线索转化', campaign: '季节性节点',
    language_market: '英语/北美市场', owner: 'Amy', copywriting: null, material_source: null,
    current_status: '选题', status_entered_at: hoursAgo(6), current_owner: 'Amy',
    is_paid_promotion: 0, paid_amount: null, actual_publish_date: null, publish_url: null,
    impressions: null, likes: null, comments: null, shares: null, dm_count: null, new_followers: null, metrics_captured_at: null,
  },
  {
    planned_publish_date: '2026-08-27', platform: 'Instagram', topic: '秋收特辑:多平台联动传播计划',
    content_type: '活动预告', content_format: '轮播图', content_goal: '活动引流', campaign: '季节性节点',
    language_market: '英语/北美市场', owner: 'Ben', copywriting: null, material_source: null,
    current_status: '选题', status_entered_at: hoursAgo(20), current_owner: 'Ben',
    is_paid_promotion: 0, paid_amount: null, actual_publish_date: null, publish_url: null,
    impressions: null, likes: null, comments: null, shares: null, dm_count: null, new_followers: null, metrics_captured_at: null,
  },
  {
    planned_publish_date: '2026-09-02', platform: 'LinkedIn', topic: '行业热点:全球农机市场趋势解读',
    content_type: '行业热点', content_format: '图文', content_goal: '品牌曝光', campaign: '行业热点',
    language_market: '英语/欧洲市场', owner: 'Cathy', copywriting: null, material_source: null,
    current_status: '选题', status_entered_at: daysAgo(1), current_owner: 'Cathy',
    is_paid_promotion: 0, paid_amount: null, actual_publish_date: null, publish_url: null,
    impressions: null, likes: null, comments: null, shares: null, dm_count: null, new_followers: null, metrics_captured_at: null,
  },

  // ---------- 收集素材阶段(2条) ----------
  {
    planned_publish_date: '2026-08-24', platform: 'YouTube', topic: '收获季作业实拍:多机协同收割全记录',
    content_type: '应用场景', content_format: '长视频', content_goal: '品牌曝光', campaign: '季节性节点',
    language_market: '英语/北美市场', owner: 'David', copywriting: null, material_source: '海外经销商拍摄团队',
    current_status: '收集素材', status_entered_at: daysAgo(2), current_owner: 'David',
    is_paid_promotion: 0, paid_amount: null, actual_publish_date: null, publish_url: null,
    impressions: null, likes: null, comments: null, shares: null, dm_count: null, new_followers: null, metrics_captured_at: null,
  },
  {
    planned_publish_date: '2026-08-26', platform: 'Instagram', topic: '农忙日记:凌晨四点的收获季',
    content_type: '应用场景', content_format: 'Reels', content_goal: '品牌曝光', campaign: '季节性节点',
    language_market: '英语/北美市场', owner: 'Ella', copywriting: null, material_source: '客户自拍素材',
    current_status: '收集素材', status_entered_at: hoursAgo(10), current_owner: 'Ella',
    is_paid_promotion: 0, paid_amount: null, actual_publish_date: null, publish_url: null,
    impressions: null, likes: null, comments: null, shares: null, dm_count: null, new_followers: null, metrics_captured_at: null,
  },

  // ---------- 写文案阶段(3条,1条阻塞) ----------
  {
    planned_publish_date: '2026-08-20', platform: 'Facebook', topic: '设备保养教程:换季前的5项检查清单',
    content_type: '用户教育', content_format: '图文', content_goal: '用户教育', campaign: '季节性节点',
    language_market: '英语/北美市场', owner: 'Frank', copywriting: null, material_source: '内部技术团队提供',
    current_status: '写文案', status_entered_at: daysAgo(5), current_owner: 'Frank', // 阻塞
    is_paid_promotion: 0, paid_amount: null, actual_publish_date: null, publish_url: null,
    impressions: null, likes: null, comments: null, shares: null, dm_count: null, new_followers: null, metrics_captured_at: null,
    reviews: [
      { reviewer_role: '英语母语者', reviewer_name: 'Olivia', round_number: 1, result: '打回',
        comment: '术语翻译不够准确,建议找本地农机行业顾问核对专业词汇',
        reject_reasons: ['语言准确性'], reviewed_at: daysAgo(4) },
    ],
  },
  {
    planned_publish_date: '2026-08-23', platform: 'LinkedIn', topic: '客户故事:家庭农场三年设备升级之路',
    content_type: '客户案例', content_format: '图文', content_goal: '线索转化', campaign: '新品推广',
    language_market: '英语/北美市场', owner: 'Amy', copywriting: '初稿已完成,等待润色', material_source: '客户采访录音',
    current_status: '写文案', status_entered_at: daysAgo(1), current_owner: 'Amy',
    is_paid_promotion: 0, paid_amount: null, actual_publish_date: null, publish_url: null,
    impressions: null, likes: null, comments: null, shares: null, dm_count: null, new_followers: null, metrics_captured_at: null,
  },
  {
    planned_publish_date: '2026-08-29', platform: 'Instagram', topic: '驾驶室舒适性升级:长时间作业不再疲惫',
    content_type: '产品卖点', content_format: '短视频', content_goal: '品牌曝光', campaign: '新品推广',
    language_market: '英语/澳新市场', owner: 'Ben', copywriting: null, material_source: null,
    current_status: '写文案', status_entered_at: hoursAgo(14), current_owner: 'Ben',
    is_paid_promotion: 0, paid_amount: null, actual_publish_date: null, publish_url: null,
    impressions: null, likes: null, comments: null, shares: null, dm_count: null, new_followers: null, metrics_captured_at: null,
  },

  // ---------- 制作阶段(3条,1条阻塞) ----------
  {
    planned_publish_date: '2026-08-19', platform: 'YouTube', topic: '配件更换教程:易损件更换步骤图解',
    content_type: '用户教育', content_format: '长视频', content_goal: '用户教育', campaign: '行业热点',
    language_market: '英语/北美市场', owner: 'Cathy', copywriting: '文案已定稿', material_source: '内部技术团队提供',
    current_status: '制作', status_entered_at: daysAgo(6), current_owner: 'Cathy', // 阻塞
    is_paid_promotion: 0, paid_amount: null, actual_publish_date: null, publish_url: null,
    impressions: null, likes: null, comments: null, shares: null, dm_count: null, new_followers: null, metrics_captured_at: null,
    reviews: [
      { reviewer_role: '同事/mentor', reviewer_name: 'Grace', round_number: 1, result: '打回',
        comment: '步骤演示画面剪辑节奏太快,观众可能跟不上操作顺序',
        reject_reasons: ['视听呈现', '内容结构'], reviewed_at: daysAgo(5) },
    ],
  },
  {
    planned_publish_date: '2026-08-28', platform: 'Facebook', topic: '精准农业:GPS自动驾驶功能演示',
    content_type: '产品卖点', content_format: '短视频', content_goal: '线索转化', campaign: '新品推广',
    language_market: '英语/北美市场', owner: 'David', copywriting: '文案已定稿', material_source: '产品团队提供演示素材',
    current_status: '制作', status_entered_at: daysAgo(2), current_owner: 'David',
    is_paid_promotion: 0, paid_amount: null, actual_publish_date: null, publish_url: null,
    impressions: null, likes: null, comments: null, shares: null, dm_count: null, new_followers: null, metrics_captured_at: null,
  },
  {
    planned_publish_date: '2026-08-30', platform: 'Instagram', topic: '土壤适配:粘土地块的设备选型建议',
    content_type: '用户教育', content_format: '轮播图', content_goal: '用户教育', campaign: '行业热点',
    language_market: '西班牙语/拉美市场', owner: 'Ella', copywriting: '文案已定稿', material_source: null,
    current_status: '制作', status_entered_at: hoursAgo(8), current_owner: 'Ella',
    is_paid_promotion: 0, paid_amount: null, actual_publish_date: null, publish_url: null,
    impressions: null, likes: null, comments: null, shares: null, dm_count: null, new_followers: null, metrics_captured_at: null,
  },

  // ---------- 审核阶段(3条,1条阻塞) ----------
  {
    planned_publish_date: '2026-08-18', platform: 'LinkedIn', topic: '农场主问答:关于质保政策的十个问题',
    content_type: '用户教育', content_format: '图文', content_goal: '用户教育', campaign: '行业热点',
    language_market: '英语/北美市场', owner: 'Frank', copywriting: '文案已定稿', material_source: null,
    current_status: '审核', status_entered_at: daysAgo(4), current_owner: 'Robert', // 阻塞
    is_paid_promotion: 0, paid_amount: null, actual_publish_date: null, publish_url: null,
    impressions: null, likes: null, comments: null, shares: null, dm_count: null, new_followers: null, metrics_captured_at: null,
    reviews: [
      { reviewer_role: '老板', reviewer_name: 'Robert', round_number: 1, result: '打回',
        comment: '质保政策这类内容风险较高,建议先明确哪些问题可以公开回答,重新梳理选题范围',
        reject_reasons: ['受众适配'], reviewed_at: daysAgo(4) },
    ],
  },
  {
    planned_publish_date: '2026-08-31', platform: 'Facebook', topic: '新品预告:下一代智能拖拉机即将发布',
    content_type: '活动预告', content_format: '短视频', content_goal: '活动引流', campaign: '新品推广',
    language_market: '英语/北美市场', owner: 'Amy', copywriting: '文案已定稿', material_source: null,
    current_status: '审核', status_entered_at: daysAgo(1), current_owner: 'Robert',
    is_paid_promotion: 1, paid_amount: 500, actual_publish_date: null, publish_url: null,
    impressions: null, likes: null, comments: null, shares: null, dm_count: null, new_followers: null, metrics_captured_at: null,
    reviews: [
      { reviewer_role: '同事/mentor', reviewer_name: 'Henry', round_number: 1, result: '通过',
        comment: '内容质量没问题', reviewed_at: daysAgo(1) },
    ],
  },
  {
    planned_publish_date: '2026-09-01', platform: 'YouTube', topic: '远程诊断系统功能演示',
    content_type: '产品卖点', content_format: '长视频', content_goal: '线索转化', campaign: '新品推广',
    language_market: '英语/欧洲市场', owner: 'Ben', copywriting: '文案已定稿', material_source: null,
    current_status: '审核', status_entered_at: hoursAgo(16), current_owner: 'Robert',
    is_paid_promotion: 0, paid_amount: null, actual_publish_date: null, publish_url: null,
    impressions: null, likes: null, comments: null, shares: null, dm_count: null, new_followers: null, metrics_captured_at: null,
  },

  // ---------- 排期阶段(3条) ----------
  {
    planned_publish_date: '2026-08-17', platform: 'Facebook', topic: '新手上路:拖拉机安全操作指南',
    content_type: '用户教育', content_format: '短视频', content_goal: '用户教育', campaign: '行业热点',
    language_market: '英语/北美市场', owner: 'Cathy', copywriting: '文案已定稿', material_source: null,
    current_status: '排期', status_entered_at: daysAgo(1), current_owner: 'Cathy',
    is_paid_promotion: 0, paid_amount: null, actual_publish_date: null, publish_url: null,
    impressions: null, likes: null, comments: null, shares: null, dm_count: null, new_followers: null, metrics_captured_at: null,
    reviews: [
      { reviewer_role: '老板', reviewer_name: 'Robert', round_number: 1, result: '通过', comment: '可以发布', reviewed_at: daysAgo(2) },
      { reviewer_role: '英语母语者', reviewer_name: 'Liam', round_number: 2, result: '通过', comment: '语言没问题', reviewed_at: daysAgo(1) },
    ],
  },
  {
    planned_publish_date: '2026-08-19', platform: 'Instagram', topic: '展会花絮:国际农机展参展实录',
    content_type: '活动预告', content_format: 'Story', content_goal: '活动引流', campaign: '展会宣传',
    language_market: '英语/北美市场', owner: 'David', copywriting: '文案已定稿', material_source: null,
    current_status: '排期', status_entered_at: hoursAgo(20), current_owner: 'David',
    is_paid_promotion: 0, paid_amount: null, actual_publish_date: null, publish_url: null,
    impressions: null, likes: null, comments: null, shares: null, dm_count: null, new_followers: null, metrics_captured_at: null,
  },
  {
    planned_publish_date: '2026-08-21', platform: 'LinkedIn', topic: '客户案例:牧场主的机械化转型故事',
    content_type: '客户案例', content_format: '图文', content_goal: '线索转化', campaign: '新品推广',
    language_market: '英语/澳新市场', owner: 'Ella', copywriting: '文案已定稿', material_source: null,
    current_status: '排期', status_entered_at: hoursAgo(5), current_owner: 'Ella',
    is_paid_promotion: 0, paid_amount: null, actual_publish_date: null, publish_url: null,
    impressions: null, likes: null, comments: null, shares: null, dm_count: null, new_followers: null, metrics_captured_at: null,
  },

  // ---------- 发布阶段(9条,含复盘数据) ----------
  {
    planned_publish_date: '2026-08-05', platform: 'Facebook', topic: '产品对比:如何选择适合小地块的收割机',
    content_type: '产品卖点', content_format: '图文', content_goal: '品牌曝光', campaign: '新品推广',
    language_market: '英语/北美市场', owner: 'Frank', copywriting: '文案已定稿', material_source: null,
    current_status: '发布', status_entered_at: daysAgo(9), current_owner: 'Frank',
    is_paid_promotion: 1, paid_amount: 800, actual_publish_date: '2026-08-05', publish_url: 'https://example-social.test/post/1001',
    impressions: 38500, likes: 620, comments: 45, shares: 32, dm_count: 4, new_followers: 41, metrics_captured_at: daysAgo(2),
    reviews: [
      { reviewer_role: '老板', reviewer_name: 'Robert', round_number: 1, result: '通过', comment: '方向没问题', reviewed_at: daysAgo(10) },
    ],
  },
  {
    planned_publish_date: '2026-08-06', platform: 'Instagram', topic: '低温作业:寒区农机使用注意事项',
    content_type: '用户教育', content_format: 'Reels', content_goal: '用户教育', campaign: '行业热点',
    language_market: '英语/北美市场', owner: 'Amy', copywriting: '文案已定稿', material_source: null,
    current_status: '发布', status_entered_at: daysAgo(8), current_owner: 'Amy',
    is_paid_promotion: 0, paid_amount: null, actual_publish_date: '2026-08-06', publish_url: 'https://example-social.test/post/1002',
    impressions: 9200, likes: 210, comments: 38, shares: 22, saves: 46, dm_count: 9, new_followers: 12, metrics_captured_at: daysAgo(1),
  },
  {
    planned_publish_date: '2026-08-07', platform: 'LinkedIn', topic: '二手设备翻新案例分享',
    content_type: '客户案例', content_format: '图文', content_goal: '线索转化', campaign: '季节性节点',
    language_market: '英语/欧洲市场', owner: 'Ben', copywriting: '文案已定稿', material_source: null,
    current_status: '发布', status_entered_at: daysAgo(7), current_owner: 'Ben',
    is_paid_promotion: 0, paid_amount: null, actual_publish_date: '2026-08-07', publish_url: 'https://example-social.test/post/1003',
    impressions: 4100, likes: 95, comments: 18, shares: 9, saves: 15, dm_count: 27, new_followers: 6, metrics_captured_at: daysAgo(1),
    reviews: [
      { reviewer_role: '老板', reviewer_name: 'Robert', round_number: 1, result: '打回',
        comment: '案例主角背景跟目标客户画像不太匹配,换一个案例', reject_reasons: ['受众适配'], reviewed_at: daysAgo(9) },
      { reviewer_role: '老板', reviewer_name: 'Robert', round_number: 2, result: '通过', comment: '这个案例可以', reviewed_at: daysAgo(8) },
    ],
  },
  {
    planned_publish_date: '2026-08-08', platform: 'YouTube', topic: '客户故事:小型家庭农场的升级之路(往期)',
    content_type: '客户案例', content_format: '长视频', content_goal: '品牌曝光', campaign: '新品推广',
    language_market: '英语/北美市场', owner: 'Cathy', copywriting: '文案已定稿', material_source: null,
    current_status: '发布', status_entered_at: daysAgo(6), current_owner: 'Cathy',
    is_paid_promotion: 1, paid_amount: 1200, actual_publish_date: '2026-08-08', publish_url: 'https://example-social.test/post/1004',
    impressions: 44200, likes: 880, comments: 61, shares: 47, saves: 132, dm_count: 6, new_followers: 58, metrics_captured_at: daysAgo(1),
  },
  {
    planned_publish_date: '2026-08-09', platform: 'Facebook', topic: '农忙前准备清单:开季检查全攻略',
    content_type: '用户教育', content_format: '轮播图', content_goal: '用户教育', campaign: '季节性节点',
    language_market: '英语/北美市场', owner: 'David', copywriting: '文案已定稿', material_source: null,
    current_status: '发布', status_entered_at: daysAgo(5), current_owner: 'David',
    is_paid_promotion: 0, paid_amount: null, actual_publish_date: '2026-08-09', publish_url: 'https://example-social.test/post/1005',
    impressions: 7600, likes: 165, comments: 29, shares: 18, dm_count: 11, new_followers: 9, metrics_captured_at: daysAgo(1),
    reviews: [
      { reviewer_role: '英语母语者', reviewer_name: 'Olivia', round_number: 1, result: '打回',
        comment: '部分表达是直译过来的,读起来不够地道', reject_reasons: ['本地化表达'], reviewed_at: daysAgo(6) },
      { reviewer_role: '英语母语者', reviewer_name: 'Olivia', round_number: 2, result: '通过', comment: '修改后没问题', reviewed_at: daysAgo(5) },
    ],
  },
  {
    planned_publish_date: '2026-08-10', platform: 'Instagram', topic: '夜间作业:大功率照明系统介绍',
    content_type: '产品卖点', content_format: '短视频', content_goal: '线索转化', campaign: '新品推广',
    language_market: '英语/澳新市场', owner: 'Ella', copywriting: '文案已定稿', material_source: null,
    current_status: '发布', status_entered_at: daysAgo(4), current_owner: 'Ella',
    is_paid_promotion: 0, paid_amount: null, actual_publish_date: '2026-08-10', publish_url: 'https://example-social.test/post/1006',
    impressions: 5300, likes: 130, comments: 14, shares: 8, saves: 28, dm_count: 33, new_followers: 4, metrics_captured_at: daysAgo(1),
  },
  {
    planned_publish_date: '2026-08-11', platform: 'LinkedIn', topic: '可持续农业:节油设备如何降低运营成本',
    content_type: '行业热点', content_format: '图文', content_goal: '品牌曝光', campaign: '行业热点',
    language_market: '英语/欧洲市场', owner: 'Frank', copywriting: '文案已定稿', material_source: null,
    current_status: '发布', status_entered_at: daysAgo(3), current_owner: 'Frank',
    is_paid_promotion: 0, paid_amount: null, actual_publish_date: '2026-08-11', publish_url: 'https://example-social.test/post/1007',
    impressions: 15800, likes: 340, comments: 52, shares: 29, saves: 61, dm_count: 3, new_followers: 21, metrics_captured_at: daysAgo(1),
  },
  {
    planned_publish_date: '2026-08-12', platform: 'Facebook', topic: '老客户回访:十年设备使用心得',
    content_type: '客户案例', content_format: '短视频', content_goal: '品牌曝光', campaign: '季节性节点',
    language_market: '英语/北美市场', owner: 'Amy', copywriting: '文案已定稿', material_source: null,
    current_status: '发布', status_entered_at: daysAgo(2), current_owner: 'Amy',
    is_paid_promotion: 1, paid_amount: 600, actual_publish_date: '2026-08-12', publish_url: 'https://example-social.test/post/1008',
    impressions: 27300, likes: 510, comments: 40, shares: 25, dm_count: 5, new_followers: 33, metrics_captured_at: daysAgo(1),
    reviews: [
      { reviewer_role: '同事/mentor', reviewer_name: 'Grace', round_number: 1, result: '打回',
        comment: '内容有点冗长,前半段可以精简', reject_reasons: ['内容结构'], reviewed_at: daysAgo(3) },
      { reviewer_role: '同事/mentor', reviewer_name: 'Grace', round_number: 2, result: '通过', comment: '精简后节奏好多了', reviewed_at: daysAgo(2) },
    ],
  },
  {
    planned_publish_date: '2026-08-13', platform: 'Instagram', topic: '灌溉系统联动方案介绍',
    content_type: '产品卖点', content_format: '轮播图', content_goal: '活动引流', campaign: '展会宣传',
    language_market: '西班牙语/拉美市场', owner: 'Ben', copywriting: '文案已定稿', material_source: null,
    current_status: '发布', status_entered_at: daysAgo(1), current_owner: 'Ben',
    is_paid_promotion: 0, paid_amount: null, actual_publish_date: '2026-08-13', publish_url: 'https://example-social.test/post/1009',
    impressions: 6100, likes: 145, comments: 20, shares: 12, saves: 31, dm_count: 19, new_followers: 7, metrics_captured_at: hoursAgo(6),
  },

  // ---------- 设备融资方案(2条,展示同一选题在不同平台的排期) ----------
  {
    planned_publish_date: '2026-09-03', platform: 'LinkedIn', topic: '设备融资方案介绍:租赁与购买对比',
    content_type: '产品卖点', content_format: '图文', content_goal: '线索转化', campaign: '新品推广',
    language_market: '英语/北美市场', owner: 'David', copywriting: null, material_source: null,
    current_status: '写文案', status_entered_at: hoursAgo(3), current_owner: 'David',
    is_paid_promotion: 0, paid_amount: null, actual_publish_date: null, publish_url: null,
    impressions: null, likes: null, comments: null, shares: null, dm_count: null, new_followers: null, metrics_captured_at: null,
  },
  {
    planned_publish_date: '2026-09-04', platform: 'Facebook', topic: '设备融资方案介绍:常见问题解答',
    content_type: '用户教育', content_format: '图文', content_goal: '用户教育', campaign: '新品推广',
    language_market: '英语/北美市场', owner: 'Frank', copywriting: null, material_source: null,
    current_status: '收集素材', status_entered_at: hoursAgo(2), current_owner: 'Frank',
    is_paid_promotion: 0, paid_amount: null, actual_publish_date: null, publish_url: null,
    impressions: null, likes: null, comments: null, shares: null, dm_count: null, new_followers: null, metrics_captured_at: null,
  },
];

function main() {
  console.log(`[seed] 准备写入 ${records.length} 条示例内容...`);

  const clear = db.transaction(() => {
    db.exec(`
      DELETE FROM review_reject_reasons;
      DELETE FROM reviews;
      DELETE FROM status_history;
      DELETE FROM contents;
    `);
  });
  clear();

  const insertContent = db.prepare(`
    INSERT INTO contents (
      planned_publish_date, platform, topic, content_type, content_format,
      content_goal, campaign, language_market, owner,
      copywriting, material_source, current_status, status_entered_at, current_owner,
      is_paid_promotion, paid_amount,
      actual_publish_date, publish_url, impressions, likes, comments, shares, saves,
      dm_count, new_followers, metrics_captured_at
    ) VALUES (
      @planned_publish_date, @platform, @topic, @content_type, @content_format,
      @content_goal, @campaign, @language_market, @owner,
      @copywriting, @material_source, @current_status, @status_entered_at, @current_owner,
      @is_paid_promotion, @paid_amount,
      @actual_publish_date, @publish_url, @impressions, @likes, @comments, @shares, @saves,
      @dm_count, @new_followers, @metrics_captured_at
    )
  `);

  const insertHistory = db.prepare(`
    INSERT INTO status_history (content_id, from_status, to_status, transition_type, changed_by, changed_at)
    VALUES (?, NULL, ?, '正常推进', ?, ?)
  `);

  const insertReview = db.prepare(`
    INSERT INTO reviews (content_id, reviewer_role, reviewer_name, round_number, result, comment, reviewed_at)
    VALUES (@content_id, @reviewer_role, @reviewer_name, @round_number, @result, @comment, @reviewed_at)
  `);

  const insertReason = db.prepare(`
    INSERT INTO review_reject_reasons (review_id, reason) VALUES (?, ?)
  `);

  const insertAll = db.transaction(() => {
    for (const record of records) {
      const { reviews, ...contentFields } = record;
      // saves 是可选字段，没写的记录(比如 Facebook 平台没有收藏功能)显式补成 null，
      // 而不是 undefined——better-sqlite3 绑定具名参数时要求每个 @xxx 都有值。
      const result = insertContent.run({ ...contentFields, saves: contentFields.saves ?? null });
      const contentId = Number(result.lastInsertRowid);

      // 简化处理：种子数据只记一条"直接进入当前状态"的历史记录，
      // 不还原完整的中间跳转过程(这只影响时间线展示，不影响看板统计)。
      insertHistory.run(contentId, record.current_status, record.owner, record.status_entered_at);

      for (const review of reviews ?? []) {
        const reviewResult = insertReview.run({
          content_id: contentId,
          reviewer_role: review.reviewer_role,
          reviewer_name: review.reviewer_name,
          round_number: review.round_number,
          result: review.result,
          comment: review.comment,
          reviewed_at: review.reviewed_at,
        });
        const reviewId = Number(reviewResult.lastInsertRowid);
        for (const reason of review.reject_reasons ?? []) {
          insertReason.run(reviewId, reason);
        }
      }
    }
  });

  insertAll();

  const contentCount = (db.prepare('SELECT COUNT(*) AS c FROM contents').get() as { c: number }).c;
  const reviewCount = (db.prepare('SELECT COUNT(*) AS c FROM reviews').get() as { c: number }).c;
  console.log(`[seed] 完成：写入 ${contentCount} 条内容、${reviewCount} 条审核记录。`);
  console.log(`[seed] 涉及负责人: ${OWNERS.join(' / ')}`);
}

main();
