"use client";

import { useState } from "react";
import type { Accolade } from "@rolodex/db/constants";
import { ACCOLADE_LABELS } from "@rolodex/db/constants";
import CardBack from "./CardBack";
import { useSaveList } from "@/lib/hooks/useSaveList";
import type { RecruiterData } from "./types";

export type { RecruiterData } from "./types";

function initials(name: string | null, company: string): string {
  if (name) {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  }
  return company.slice(0, 2).toUpperCase();
}

function formatVerified(date: Date | string | null): string | null {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

/* ── shared card chrome (spindle tab + shadow + paper bg) ── */
const cardShell =
  "relative bg-card w-full rounded-xl shadow-[var(--shadow-card)] p-8 sm:p-10 flex flex-col";

/* ────────────────────────────────────────── */

export default function RecruiterCard({ recruiter }: { recruiter: RecruiterData }) {
  const [flipped, setFlipped] = useState(false);
  const { toggle, isSaved } = useSaveList();
  const r = recruiter;
  const saved = isSaved(r.id);
  const shellClassName = saved ? `${cardShell} border-2 border-terracotta` : cardShell;

  const hasMetrics =
    r.responseRate != null || r.avgReplyDays != null || r.studentsPlaced != null;
  const hasAccolades = r.accolades && r.accolades.length > 0;
  const hasRoleTags = r.roleTags && r.roleTags.length > 0;
  const verified = formatVerified(r.verifiedAt);

  return (
    <div
      className="w-full cursor-pointer"
      style={{ perspective: "var(--perspective-card)" }}
      onClick={() => setFlipped((f) => !f)}
    >
      {/* inner wrapper — both faces are absolute inside, sized by a hidden sizer */}
      <div
        className="relative w-full"
        style={{
          transformStyle: "preserve-3d",
          transformOrigin: "center center",
          transitionProperty: "transform",
          transitionDuration: "var(--flip-duration)",
          transitionTimingFunction: "var(--flip-easing)",
          transform: flipped ? "rotateX(-180deg)" : "rotateX(0deg)",
        }}
      >
        {/* ═══ FRONT FACE ═══ */}
        <div style={{ backfaceVisibility: "hidden" }}>
          <div className={shellClassName}>
            {/* spindle tab */}
            <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-24 h-2 bg-ink rounded-full" />

            {/* ── header row ── */}
            <div className="flex justify-between items-start w-full">
              <div className="flex gap-5 min-w-0">
                <div className="w-[72px] h-[72px] rounded-md border-2 border-ink bg-card-light flex items-center justify-center text-ink text-2xl font-display shrink-0">
                  {initials(r.name, r.company)}
                </div>
                <div className="flex flex-col justify-center gap-1.5 pt-0.5 min-w-0">
                  {r.name && (
                    <h2 className="text-[26px] text-ink leading-none font-display tracking-tight truncate">
                      {r.name}
                    </h2>
                  )}
                  <div className="flex items-center gap-2.5 mt-0.5 flex-wrap">
                    <span className="border border-ink text-ink text-[10px] px-2 py-0.5 rounded-[3px] font-mono font-medium tracking-[0.15em] uppercase">
                      {r.company}
                    </span>
                    {r.title && (
                      <span className="text-sm text-muted font-sans font-medium truncate">
                        {r.title}
                      </span>
                    )}
                  </div>
                  <div className="text-[13px] text-muted mt-1 font-mono font-medium truncate">
                    {r.email}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5 pt-1 shrink-0 ml-4">
                <button
                  type="button"
                  aria-label={saved ? "Unsave recruiter" : "Save recruiter"}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(r.id);
                  }}
                  className="text-ink hover:text-terracotta transition-colors"
                >
                  {saved ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                      <path d="M184,32H72A16,16,0,0,0,56,48V224a8,8,0,0,0,12.24,6.74L128,193.3l59.76,37.44A8,8,0,0,0,200,224V48A16,16,0,0,0,184,32Z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 256 256">
                      <path d="M184,32H72A16,16,0,0,0,56,48V224a8,8,0,0,0,12.24,6.74L128,193.3l59.76,37.44A8,8,0,0,0,200,224V48A16,16,0,0,0,184,32Z" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                {r.status === "active" && (
                  <span className="text-terracotta text-[10px] font-mono font-medium tracking-[0.15em] uppercase">
                    Active
                  </span>
                )}
                {verified && (
                  <div className="flex items-center gap-1.5 text-ink text-[10px] font-mono font-medium tracking-[0.15em] uppercase mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 256 256">
                      <path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z" />
                    </svg>
                    <span>Verified</span>
                  </div>
                )}
              </div>
            </div>

            {/* gradient rule */}
            <hr className="h-[2px] border-0 bg-gradient-to-r from-terracotta from-[25%] to-ink to-[25%] my-8" />

            {/* ── metrics row ── */}
            {hasMetrics ? (
              <>
                <div className="grid grid-cols-3 divide-x divide-rule text-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-ink text-[28px] leading-none font-display">
                      {r.responseRate != null ? `${Math.round(Number(r.responseRate))}%` : "\u2014"}
                    </span>
                    <span className="text-[10px] tracking-[0.15em] text-muted uppercase font-mono font-medium mt-2">
                      Response
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-ink text-[28px] leading-none font-display">
                      {r.avgReplyDays != null ? `${r.avgReplyDays}d` : "\u2014"}
                    </span>
                    <span className="text-[10px] tracking-[0.15em] text-muted uppercase font-mono font-medium mt-2">
                      Avg Reply
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-ink text-[28px] leading-none font-display">
                      {r.studentsPlaced != null && r.studentsPlaced > 0 ? r.studentsPlaced : "\u2014"}
                    </span>
                    <span className="text-[10px] tracking-[0.15em] text-muted uppercase font-mono font-medium mt-2">
                      Placed
                    </span>
                  </div>
                </div>
                <hr className="border-t border-rule mt-8 mb-6" />
              </>
            ) : (
              /* still show the metrics row with dashes when no data */
              <>
                <div className="grid grid-cols-3 divide-x divide-rule text-center">
                  {["Response", "Avg Reply", "Placed"].map((label) => (
                    <div key={label} className="flex flex-col items-center gap-1.5">
                      <span className="text-ink text-[28px] leading-none font-display">{"\u2014"}</span>
                      <span className="text-[10px] tracking-[0.15em] text-muted uppercase font-mono font-medium mt-2">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
                <hr className="border-t border-rule mt-8 mb-6" />
              </>
            )}

            {/* ── accolades ── */}
            {hasAccolades && (
              <>
                <div>
                  <h3 className="text-[10px] tracking-[0.15em] text-terracotta font-mono font-medium uppercase mb-4">
                    Works With
                  </h3>
                  <div className="flex flex-wrap gap-2.5">
                    {r.accolades!.map((a) => (
                      <span
                        key={a}
                        className="border border-badge-border text-ink text-xs px-3.5 py-1.5 rounded-[4px] font-mono font-medium tracking-wide"
                      >
                        {ACCOLADE_LABELS[a as Accolade] ?? a}
                      </span>
                    ))}
                  </div>
                </div>
                <hr className="border-t border-rule my-8" />
              </>
            )}

            {/* ── role tags ── */}
            {hasRoleTags && (
              <div>
                <h3 className="text-[10px] tracking-[0.15em] text-terracotta font-mono font-medium uppercase mb-4">
                  Roles
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {r.roleTags!.map((tag) => (
                    <span
                      key={tag}
                      className="border border-rule text-muted text-[10px] px-2 py-0.5 rounded-[3px] font-mono font-medium tracking-[0.1em] uppercase"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ── footer ── */}
            <div className="mt-12 pt-6 border-t border-dashed border-dashed flex flex-col gap-8">
              <div className="flex justify-between items-end w-full">
                <div className="text-[10px] tracking-[0.15em] font-mono font-medium uppercase text-muted">
                  {[r.linkedinUrl && "LinkedIn", r.githubUrl && "GitHub"]
                    .filter(Boolean)
                    .join(" \u00B7 ") || "\u00A0"}
                </div>
                {verified && (
                  <div className="text-[10px] tracking-[0.15em] font-mono font-medium uppercase text-ink">
                    Verified {verified}
                  </div>
                )}
              </div>
              <div className="flex justify-end items-center gap-1.5 text-ink text-[10px] font-mono font-medium uppercase tracking-[0.15em]">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 256 256" className="mt-0.5">
                  <path d="M205.66,149.66l-72,72a8,8,0,0,1-11.32,0l-72-72a8,8,0,0,1,11.32-11.32L120,196.69V40a8,8,0,0,1,16,0V196.69l58.34-58.35a8,8,0,0,1,11.32,11.32Z" />
                </svg>
                <span>tap to draft</span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ BACK FACE ═══ */}
        <div
          className="absolute inset-0"
          style={{ backfaceVisibility: "hidden", transform: "rotateX(180deg)" }}
        >
          <CardBack recruiter={r} flipped={flipped} shellClassName={shellClassName} />
        </div>
      </div>
    </div>
  );
}
