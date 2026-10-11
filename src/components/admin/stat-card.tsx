/** 仪表盘统计卡片（PRD 3.3.2） */
export function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-background p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums">
        {value.toLocaleString("zh-CN")}
      </p>
    </div>
  );
}
