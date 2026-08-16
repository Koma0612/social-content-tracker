export interface BarListItem {
  label: string;
  value: number; // 用于计算条形宽度
  displayValue?: string; // 右侧展示的文字，不传就直接显示 value
  warning?: boolean; // 该条是否要标成警示色(比如"数据不足"、"等太久了")
}

interface BarListProps {
  items: BarListItem[];
  max?: number; // 不传就用 items 里的最大值——用于比"数量"；
  // 传固定值(比如 100)用于比"百分比"这种本身有界的指标，不该跟着数据大小变
}

/**
 * 最简单的横向条形图，纯 CSS 实现，不引入图表库——
 * 这几组看板数据用条形图展示足够了，没必要为此多装一个依赖。
 */
export default function BarList({ items, max }: BarListProps) {
  const effectiveMax = max ?? Math.max(1, ...items.map((i) => i.value));

  return (
    <div className="bar-list">
      {items.map((item) => (
        <div key={item.label} className="bar-row">
          <span className="bar-label">{item.label}</span>
          <div className="bar-track">
            <div
              className={item.warning ? 'bar-fill bar-fill-warning' : 'bar-fill'}
              style={{ width: `${Math.min(100, (item.value / effectiveMax) * 100)}%` }}
            />
          </div>
          <span className="bar-value">{item.displayValue ?? item.value}</span>
        </div>
      ))}
    </div>
  );
}
