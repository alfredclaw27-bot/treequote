import Link from "next/link";
import { ReactNode } from "react";
import { siteConfig } from "@/config/site";

/**
 * Shared shell for static legal pages (Terms, Privacy).
 * Server component — no client hooks. Dark mode inherits from the html class.
 */
export function LegalPage({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}) {
  const { brand } = siteConfig;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <header className="px-6 py-4 flex items-center justify-between max-w-3xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">{brand.emoji}</span>
          <span className="font-bold text-xl text-gray-900 dark:text-white">{brand.name}</span>
        </Link>
        <Link href="/" className="text-sm text-primary hover:underline">
          ← Back home
        </Link>
      </header>

      <article className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-2">{title}</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-10">Last updated: {lastUpdated}</p>
        <div className="legal-body space-y-6 text-gray-600 dark:text-gray-300 leading-relaxed">{children}</div>
      </article>

      <footer className="px-6 py-10 border-t border-gray-100 dark:border-gray-700 text-gray-400 dark:text-gray-500 text-sm">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 {brand.name}</p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link href="/" className="text-primary hover:underline">Home</Link>
            <Link href="/terms" className="text-primary hover:underline">Terms</Link>
            <Link href="/privacy" className="text-primary hover:underline">Privacy</Link>
            <a href={`mailto:${brand.supportEmail}`} className="text-primary hover:underline">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

/** Section heading used inside legal bodies. */
export function LegalHeading({ children }: { children: ReactNode }) {
  return <h2 className="text-xl font-bold text-gray-900 dark:text-white pt-4">{children}</h2>;
}
