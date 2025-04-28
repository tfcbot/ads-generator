import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-4xl font-bold mb-4 text-fg-primary">404 - Page Not Found</h1>
      <p className="text-fg-secondary mb-8">The page you are looking for doesn&apos;t exist or has been moved.</p>
      <Link
        href="/"
        className="px-6 py-3 bg-accent-primary text-fg-primary rounded-md hover:bg-opacity-90 transition-colors"
      >
        Return Home
      </Link>
    </div>
  );
} 