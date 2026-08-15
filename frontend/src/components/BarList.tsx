interface BarListProps {
  items: { label: string; value: number }[];
}

/**
 * 最简单的横向条形图，纯 CSS 实现，不引入图表库——
 * 这几组看板数据用条形图展示足够了，没必要为此多装一个依赖。
 */
export default function BarList({ items }: BarListProps) {
  const max = Math.max(1, ...items.map((i) => i.value));

  return (
    <div className="bar-list">
      {items.map((item) => (
        <div key={item.label} className="bar-row">
          <span className="bar-label">{item.label}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
          <span className="bar-value">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
