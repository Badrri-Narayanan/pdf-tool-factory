import { Link } from 'react-router-dom';
import { Combine, Images, Lock, Minimize2, type LucideIcon } from 'lucide-react';

interface ToolCard {
  to: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

const TOOLS: ToolCard[] = [
  { to: '/images-to-pdf', title: 'Images → PDF', description: 'Turn JPG, PNG, WebP, HEIC and more into one PDF.', icon: Images },
  { to: '/merge-pdf', title: 'Merge PDFs', description: 'Combine several PDFs into one, in the order you choose.', icon: Combine },
  { to: '/compress-pdf', title: 'Compress PDF', description: 'Shrink a PDF with the quality trade-off you pick.', icon: Minimize2 },
];

export function HomePage() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold sm:text-3xl">Your private PDF toolkit</h1>
        <p className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Lock aria-hidden className="size-4 shrink-0 text-emerald-600" />
          Files are processed on your device. Nothing is uploaded.
        </p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-3">
        {TOOLS.map(({ to, title, description, icon: Icon }) => (
          <li key={to}>
            <Link
              to={to}
              className="flex h-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-400 hover:shadow-md focus-visible:outline-2 focus-visible:outline-blue-600 dark:border-slate-800 dark:bg-slate-900"
            >
              <Icon aria-hidden className="size-8 text-blue-600" />
              <span className="text-lg font-semibold">{title}</span>
              <span className="text-sm text-slate-600 dark:text-slate-400">{description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
