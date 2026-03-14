"use client";

import { useState } from "react";

interface ContributeFormProps {
  recruiterId: string;
  onClose: () => void;
}

type FormTab = "interaction" | "profile_edit";

function getStudentId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("rolodex_student_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("rolodex_student_id", id);
  }
  return id;
}

export default function ContributeForm({ recruiterId, onClose }: ContributeFormProps) {
  const [tab, setTab] = useState<FormTab>("interaction");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // interaction fields
  const [didReply, setDidReply] = useState<boolean | null>(null);
  const [replyDays, setReplyDays] = useState("");
  const [role, setRole] = useState("");
  const [gotOffer, setGotOffer] = useState<boolean | null>(null);

  // profile edit fields
  const [fullName, setFullName] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [title, setTitle] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();

    const studentId = getStudentId();
    let type: string;
    let payload: Record<string, unknown>;

    if (tab === "interaction") {
      if (didReply === null) {
        setError("Please indicate whether they replied.");
        return;
      }
      type = "interaction";
      payload = {
        did_reply: didReply,
        reply_days: didReply && replyDays ? parseInt(replyDays, 10) : null,
        role: role || null,
        got_offer: gotOffer,
      };
    } else {
      if (!fullName && !linkedinUrl && !title) {
        setError("Please fill in at least one field.");
        return;
      }
      type = "profile_edit";
      payload = {
        name: fullName || null,
        linkedin_url: linkedinUrl || null,
        title: title || null,
      };
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recruiter_id: recruiterId,
          student_id: studentId,
          type,
          payload: JSON.stringify(payload),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to submit.");
      }

      setSuccess(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div
        className="mt-4 pt-4 border-t border-dashed border-dashed"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm text-ink font-sans text-center mb-2">
          Thanks &mdash; your report helps other students
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="block mx-auto text-[10px] font-mono text-muted hover:text-ink transition-colors"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div
      className="mt-4 pt-4 border-t border-dashed border-dashed"
      onClick={(e) => e.stopPropagation()}
    >
      {/* tab selector */}
      <div className="flex gap-1 mb-4">
        {(
          [
            ["interaction", "Interaction"],
            ["profile_edit", "Profile Suggestion"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setTab(value);
              setError(null);
            }}
            className={`px-3 py-1 text-[10px] font-mono font-medium tracking-[0.1em] uppercase rounded-[3px] transition-colors ${
              tab === value
                ? "bg-ink text-card"
                : "text-muted hover:text-ink border border-rule"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {tab === "interaction" ? (
          <>
            {/* did they reply? */}
            <div>
              <label className="block text-[10px] font-mono font-medium tracking-[0.12em] uppercase text-muted mb-1.5">
                Did they reply?
              </label>
              <div className="flex gap-2">
                {([true, false] as const).map((val) => (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => setDidReply(val)}
                    className={`px-3 py-1 text-[10px] font-mono font-medium rounded-[3px] border transition-colors ${
                      didReply === val
                        ? "bg-ink text-card border-ink"
                        : "text-muted border-rule hover:border-ink hover:text-ink"
                    }`}
                  >
                    {val ? "Yes" : "No"}
                  </button>
                ))}
              </div>
            </div>

            {/* days to reply (conditional) */}
            {didReply && (
              <div>
                <label className="block text-[10px] font-mono font-medium tracking-[0.12em] uppercase text-muted mb-1.5">
                  Days to reply
                </label>
                <input
                  type="number"
                  min="0"
                  value={replyDays}
                  onChange={(e) => setReplyDays(e.target.value)}
                  className="w-24 px-2 py-1 text-xs font-mono border border-rule rounded bg-page text-ink focus:outline-none focus:border-terracotta"
                />
              </div>
            )}

            {/* role */}
            <div>
              <label className="block text-[10px] font-mono font-medium tracking-[0.12em] uppercase text-muted mb-1.5">
                What role?
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. SWE Intern"
                className="w-full px-2 py-1 text-xs font-mono border border-rule rounded bg-page text-ink focus:outline-none focus:border-terracotta"
              />
            </div>

            {/* got offer? */}
            <div>
              <label className="block text-[10px] font-mono font-medium tracking-[0.12em] uppercase text-muted mb-1.5">
                Did you get an offer?
              </label>
              <div className="flex gap-2">
                {([true, false] as const).map((val) => (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => setGotOffer(val)}
                    className={`px-3 py-1 text-[10px] font-mono font-medium rounded-[3px] border transition-colors ${
                      gotOffer === val
                        ? "bg-ink text-card border-ink"
                        : "text-muted border-rule hover:border-ink hover:text-ink"
                    }`}
                  >
                    {val ? "Yes" : "No"}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* full name */}
            <div>
              <label className="block text-[10px] font-mono font-medium tracking-[0.12em] uppercase text-muted mb-1.5">
                Recruiter&apos;s full name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-2 py-1 text-xs font-mono border border-rule rounded bg-page text-ink focus:outline-none focus:border-terracotta"
              />
            </div>

            {/* linkedin url */}
            <div>
              <label className="block text-[10px] font-mono font-medium tracking-[0.12em] uppercase text-muted mb-1.5">
                LinkedIn URL
              </label>
              <input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/..."
                className="w-full px-2 py-1 text-xs font-mono border border-rule rounded bg-page text-ink focus:outline-none focus:border-terracotta"
              />
            </div>

            {/* title */}
            <div>
              <label className="block text-[10px] font-mono font-medium tracking-[0.12em] uppercase text-muted mb-1.5">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Recruiter"
                className="w-full px-2 py-1 text-xs font-mono border border-rule rounded bg-page text-ink focus:outline-none focus:border-terracotta"
              />
            </div>
          </>
        )}

        {error && (
          <p className="text-[11px] font-mono text-terracotta">{error}</p>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={submitting}
            className="text-[10px] font-mono font-medium tracking-[0.1em] uppercase px-4 py-1.5 rounded-md bg-ink text-card hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="text-[10px] font-mono text-muted hover:text-ink transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
