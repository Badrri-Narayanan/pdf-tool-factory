import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <Link to="/" className="inline-flex min-h-11 items-center text-blue-600 underline">
        Back to all tools
      </Link>
    </div>
  );
}
