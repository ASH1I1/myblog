/**
 * 仪表盘统计卡片（PRD 3.3.2）。
 * 视觉沿用前台：小标签是「等宽 + 疏排」的 3 级字，数字是 1 级字等宽
 * ——与游戏页那个数字块同一套写法。
 */
export function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <p className="type-label font-mono tracking-[0.3em] text-faint">{label}</p>
      <p className="type-display mt-3 font-mono tabular-nums">
        {value.toLocaleString("zh-CN")}
      </p>
    </div>
  );
}
