"use client";

import Link from "next/link";
import { useSaveList } from "@/lib/hooks/useSaveList";

export default function AppNav() {
  const { count } = useSaveList();

  return (
    <nav className="border-b border-rule bg-card/60 backdrop-blur-sm px-6 py-3 flex items-center justify-between">
      <Link href="/" className="text-lg font-display text-ink tracking-tight">
        Rolodex
      </Link>
      <div className="flex gap-4 text-[11px] font-mono font-medium tracking-[0.15em] uppercase">
        <Link href="/" className="text-ink hover:text-terracotta transition-colors">
          Search
        </Link>
        <Link href="/saved" className="text-muted hover:text-terracotta transition-colors inline-flex items-center gap-1.5">
          <span>{count > 0 ? `Saved (${count})` : "Saved"}</span>
        </Link>
      </div>
    </nav>
  );
}
