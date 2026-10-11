import * as RadioGroup from '@radix-ui/react-radio-group';

interface Option<T extends string> {
  value: T;
  label: string;
  description?: string;
}

interface Props<T extends string> {
  label: string;
  value: T;
  options: Option<T>[];
  onChange(value: T): void;
}

export function OptionGroup<T extends string>({ label, value, options, onChange }: Props<T>) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold">{label}</legend>
      <RadioGroup.Root
        value={value}
        onValueChange={(v) => onChange(v as T)}
        aria-label={label}
        className={`grid gap-2 ${options.length > 2 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}
      >
        {options.map((option) => (
          <RadioGroup.Item
            key={option.value}
            value={option.value}
            className="flex min-h-11 flex-col items-start rounded-xl border border-slate-300 bg-white px-4 py-2 text-left hover:border-blue-400 focus-visible:outline-2 focus-visible:outline-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:data-[state=checked]:bg-blue-950"
          >
            <span className="font-medium">{option.label}</span>
            {option.description && <span className="text-xs text-slate-600 dark:text-slate-400">{option.description}</span>}
          </RadioGroup.Item>
        ))}
      </RadioGroup.Root>
    </fieldset>
  );
}
