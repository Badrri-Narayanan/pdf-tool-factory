interface Props {
  message: string;
  onRetry?(): void;
}

export function ErrorBanner({ message, onRetry }: Props) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
      <p className="flex-1">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="min-h-11 rounded-lg border border-red-400 px-4 font-medium">
          Try again
        </button>
      )}
    </div>
  );
}
