import { ContentStatus } from '../types';
import { CONTENT_STATUSES } from '../constants/options';

export interface StatusOption {
  value: ContentStatus;
  label: string;
  type: '正常推进' | '审核回退';
}

/**
 * 根据当前状态，算出所有"合法"的下一步选项，用来在详情页的下拉菜单里
 * 只展示允许的操作。这只是前端的一层 UX 友好提示，真正说了算的校验
 * 在后端 statusService.validateTransition，前端这份是它的镜像，
 * 规则改了两边都要同步改。
 */
export function getStatusOptions(current: ContentStatus): StatusOption[] {
  if (current === '发布') return [];

  const idx = CONTENT_STATUSES.indexOf(current);
  const forward = CONTENT_STATUSES.slice(idx + 1).map((s) => ({
    value: s as ContentStatus,
    label: `推进到「${s}」`,
    type: '正常推进' as const,
  }));

  if (current === '审核') {
    const backward = CONTENT_STATUSES.slice(0, idx).map((s) => ({
      value: s as ContentStatus,
      label: `退回到「${s}」`,
      type: '审核回退' as const,
    }));
    return [...forward, ...backward];
  }

  return forward;
}
