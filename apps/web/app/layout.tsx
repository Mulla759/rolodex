import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rolodex",
  description: "Recruiter discovery for CS students",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-page font-sans antialiased bg-[linear-gradient(to_right,var(--color-grid)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-grid)_1px,transparent_1px)] bg-[size:4rem_4rem]">
        <nav className="border-b border-rule bg-card/60 backdrop-blur-sm px-6 py-3 flex items-center justify-between">
          <Link href="/" className="text-lg font-display text-ink tracking-tight">
            Rolodex
          </Link>
          <div className="flex gap-4 text-[11px] font-mono font-medium tracking-[0.15em] uppercase">
            <Link href="/" className="text-ink hover:text-terracotta transition-colors">
              Search
            </Link>
            <Link href="/saved" className="text-muted hover:text-terracotta transition-colors">
              Saved
            </Link>
          </div>
        </nav>
        <main className="mx-auto max-w-3xl px-4 sm:px-12 py-10">{children}</main>
      </body>
    </html>
  );
}
