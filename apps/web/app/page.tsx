"use client";

import { useEffect, useRef, useState } from "react";
import RecruiterCard from "@/components/recruiter/RecruiterCard";
import type { RecruiterData } from "@/components/recruiter/RecruiterCard";

interface RecruiterListResponse {
  data: RecruiterData[];
  count: number;
  page: number;
  totalPages: number;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RecruiterData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      fetchRecruiters(query);
    }, query ? 300 : 0);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  async function fetchRecruiters(q: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      params.set("limit", "50");
      const res = await fetch(`/api/recruiters?${params}`);
      const json: RecruiterListResponse = await res.json();
      setResults(json.data);
      setTotal(json.count);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* search bar */}
      <div className="mb-8">
        <input
          type="text"
          placeholder="Search by name, company, or email..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border border-rule bg-card/60 backdrop-blur-sm px-4 py-2.5 text-sm font-sans text-ink placeholder:text-muted/60 focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
        />
        {!loading && (
          <p className="mt-2 text-[10px] font-mono font-medium tracking-[0.15em] uppercase text-muted">
            {total} recruiter{total !== 1 ? "s" : ""} found
          </p>
        )}
      </div>

      {/* results */}
      {loading ? (
        <div className="flex flex-col gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-card rounded-xl shadow-[var(--shadow-card)] p-8 sm:p-10"
            >
              <div className="flex gap-5">
                <div className="w-[72px] h-[72px] rounded-md bg-card-light" />
                <div className="flex flex-col gap-3 flex-1 pt-1">
                  <div className="h-6 w-2/3 rounded bg-card-light" />
                  <div className="h-4 w-1/3 rounded bg-card-light" />
                  <div className="h-3 w-1/2 rounded bg-card-light" />
                </div>
              </div>
              <hr className="h-[2px] border-0 bg-card-light my-8" />
              <div className="grid grid-cols-3 gap-4">
                <div className="h-10 rounded bg-card-light" />
                <div className="h-10 rounded bg-card-light" />
                <div className="h-10 rounded bg-card-light" />
              </div>
            </div>
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-lg font-display text-ink">No recruiters found</p>
          <p className="mt-2 text-sm font-sans text-muted">Try a different search term</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {results.map((r) => (
            <RecruiterCard key={r.id} recruiter={r} />
          ))}
        </div>
      )}
    </div>
  );
}
