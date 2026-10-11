interface Props {
  value: number;
  label: string;
}

export function ProgressBar({ value, label }: Props) {
  const percent = Math.round(value * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span aria-hidden>{percent}%</span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
      >
        <div className="h-full bg-blue-600 transition-[width]" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
