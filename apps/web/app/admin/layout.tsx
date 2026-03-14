import Link from "next/link";

const navLinks = [
  { href: "/admin/recruiters", label: "Recruiters" },
  { href: "/admin/contributions", label: "Contributions" },
  { href: "/admin/metrics", label: "Metrics" },
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-page">
      <nav className="border-b border-rule bg-card/60 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
          <Link href="/admin" className="text-ink font-display text-lg tracking-tight">
            Rolodex Admin
          </Link>
          <div className="flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted hover:text-ink text-[11px] font-mono font-medium tracking-[0.12em] uppercase transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
      <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
    </div>
  );
}
