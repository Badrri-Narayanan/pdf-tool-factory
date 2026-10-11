import { Link, Outlet } from 'react-router-dom';
import { FileStack } from 'lucide-react';

export function Layout() {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex h-14 max-w-5xl items-center px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <FileStack aria-hidden className="size-5 text-blue-600" />
            PDF Tool Factory
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
        <Outlet />
      </main>
    </div>
  );
}
