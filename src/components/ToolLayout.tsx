import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';

interface Props {
  title: string;
  description: string;
  children: ReactNode;
  action?: ReactNode;
}

export function ToolLayout({ title, description, children, action }: Props) {
  return (
    <div className="space-y-6 pb-24 sm:pb-0">
      <div className="space-y-2">
        <Link to="/" className="inline-flex min-h-11 items-center gap-1 text-sm text-slate-600 hover:text-blue-600 dark:text-slate-400">
          <ArrowLeft aria-hidden className="size-4" /> All tools
        </Link>
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        <p className="text-slate-600 dark:text-slate-400">{description}</p>
        <p className="flex items-center gap-2 text-xs text-slate-500">
          <Lock aria-hidden className="size-3.5 text-emerald-600" />
          Files are processed on your device. Nothing is uploaded.
        </p>
      </div>
      {children}
      {action && (
        <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 p-4 backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0 dark:border-slate-800 dark:bg-slate-900/95 sm:dark:bg-transparent">
          {action}
        </div>
      )}
    </div>
  );
}
