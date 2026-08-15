import { ContentFilter } from '../api/client';
import { PLATFORMS, CONTENT_TYPES, CONTENT_STATUSES } from '../constants/options';

interface FilterBarProps {
  value: ContentFilter;
  onChange: (next: ContentFilter) => void;
  onApply: () => void;
  onReset: () => void;
}

export default function FilterBar({ value, onChange, onApply, onReset }: FilterBarProps) {
  return (
    <div className="filter-bar">
      <select
        value={value.platform ?? ''}
        onChange={(e) => onChange({ ...value, platform: e.target.value })}
      >
        <option value="">全部平台</option>
        {PLATFORMS.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      <select
        value={value.status ?? ''}
        onChange={(e) => onChange({ ...value, status: e.target.value })}
      >
        <option value="">全部状态</option>
        {CONTENT_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <select
        value={value.content_type ?? ''}
        onChange={(e) => onChange({ ...value, content_type: e.target.value })}
      >
        <option value="">全部内容类型</option>
        {CONTENT_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      <input
        type="text"
        placeholder="按负责人搜索"
        value={value.owner ?? ''}
        onChange={(e) => onChange({ ...value, owner: e.target.value })}
      />

      <button type="button" className="btn-primary" onClick={onApply}>
        筛选
      </button>
      <button type="button" className="btn-secondary" onClick={onReset}>
        重置
      </button>
    </div>
  );
}
