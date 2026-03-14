"use client";

import { useEffect, useState } from "react";
import RecruiterCard from "@/components/recruiter/RecruiterCard";
import type { RecruiterData } from "@/components/recruiter/types";
import { useSaveList } from "@/lib/hooks/useSaveList";

export default function SavedPage() {
  const { savedIds } = useSaveList();
  const [results, setResults] = useState<RecruiterData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSavedRecruiters(ids: string[]) {
      if (ids.length === 0) {
        setResults([]);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/recruiters/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        });

        if (!res.ok) {
          throw new Error("Failed to load saved recruiters");
        }

        const data: RecruiterData[] = await res.json();
        setResults(data);
      } catch {
        setError("Could not load saved recruiters right now.");
      } finally {
        setLoading(false);
      }
    }

    void fetchSavedRecruiters(savedIds);
  }, [savedIds]);

  if (loading) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm font-sans text-muted">Loading saved recruiters...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm font-sans text-terracotta">{error}</p>
      </div>
    );
  }

  if (savedIds.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg font-display text-ink">No saved recruiters yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {results.map((r) => (
        <RecruiterCard key={r.id} recruiter={r} />
      ))}
    </div>
  );
}
