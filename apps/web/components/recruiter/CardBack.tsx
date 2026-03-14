"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RecruiterData } from "./types";
import ContributeForm from "./ContributeForm";

interface CardBackProps {
  recruiter: RecruiterData;
  flipped: boolean;
  shellClassName: string;
}

function getDraftBodyOnly(draft: string): string {
  const lines = draft.split("\n");
  if (lines.length === 0) return "";

  if (lines[0].trim().toLowerCase().startsWith("subject:")) {
    return lines.slice(1).join("\n").replace(/^\s+/, "");
  }

  return draft;
}

export default function CardBack({ recruiter, flipped, shellClassName }: CardBackProps) {
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showContributeForm, setShowContributeForm] = useState(false);
  const hasRequestedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const generateDraft = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setDraft("");

    try {
      const response = await fetch("/api/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recruiter }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to generate draft.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        setDraft((current) => current + decoder.decode(value, { stream: true }));
      }

      setDraft((current) => current + decoder.decode());
      hasRequestedRef.current = true;
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError("Unable to generate draft right now.");
      }
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
      setLoading(false);
    }
  }, [recruiter]);

  useEffect(() => {
    hasRequestedRef.current = false;
    setDraft("");
    setError(null);
    abortRef.current?.abort();
  }, [recruiter.id]);

  useEffect(() => {
    if (flipped && !hasRequestedRef.current && !loading) {
      void generateDraft();
    }
  }, [flipped, loading, generateDraft]);

  useEffect(() => () => abortRef.current?.abort(), []);

  return (
    <div className={shellClassName + " h-full"}>
      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-24 h-2 bg-ink rounded-full" />

      <div className="mb-6">
        <h2 className="text-xl text-ink font-display tracking-tight">{recruiter.name || recruiter.company}</h2>
        <p className="text-sm text-muted font-sans mt-1">{recruiter.company}</p>
      </div>

      <hr className="h-[2px] border-0 bg-gradient-to-r from-terracotta from-[25%] to-ink to-[25%] mb-6" />

      <div className="flex-1 rounded-lg border border-dashed border-dashed bg-card-light/50 p-5 min-h-[120px]">
        {error ? (
          <p className="text-sm text-terracotta font-sans">{error}</p>
        ) : draft ? (
          <p className="whitespace-pre-wrap text-sm text-ink font-sans leading-relaxed">
            {draft}
            {loading && <span className="inline-block ml-1 animate-pulse">|</span>}
          </p>
        ) : (
          <p className="text-sm text-muted font-sans">
            {loading ? "Drafting outreach..." : "Flip to generate an outreach draft."}
          </p>
        )}
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={(e) => {
            e.stopPropagation();
            void navigator.clipboard.writeText(getDraftBodyOnly(draft));
          }}
          disabled={!draft}
          className="flex-1 border border-ink text-ink text-[11px] font-mono font-medium tracking-[0.1em] uppercase py-2.5 rounded-md hover:bg-ink hover:text-card transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-ink"
        >
          Copy Body
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            void generateDraft();
          }}
          disabled={loading}
          className="flex-1 bg-terracotta text-card text-[11px] font-mono font-medium tracking-[0.1em] uppercase py-2.5 rounded-md hover:opacity-90 transition-opacity disabled:opacity-70"
        >
          Regenerate
        </button>
      </div>

      {showContributeForm ? (
        <ContributeForm
          recruiterId={recruiter.id}
          onClose={() => setShowContributeForm(false)}
        />
      ) : (
        <div className="flex justify-center mt-4">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowContributeForm(true);
            }}
            className="text-[10px] font-mono text-muted hover:text-ink transition-colors"
          >
            Report interaction
          </button>
        </div>
      )}

      <div className="flex justify-center items-center gap-1.5 mt-6 text-muted text-[10px] font-mono font-medium uppercase tracking-[0.15em]">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 256 256" className="mt-0.5 rotate-180">
          <path d="M205.66,149.66l-72,72a8,8,0,0,1-11.32,0l-72-72a8,8,0,0,1,11.32-11.32L120,196.69V40a8,8,0,0,1,16,0V196.69l58.34-58.35a8,8,0,0,1,11.32,11.32Z" />
        </svg>
        <span>tap to go back</span>
      </div>
    </div>
  );
}
