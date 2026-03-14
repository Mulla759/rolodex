"use client";

import { useCallback, useEffect, useState } from "react";

interface ContributionRow {
  id: string;
  recruiter_id: string;
  student_id: string;
  type: string;
  payload: string;
  status: string;
  notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  recruiter_email: string;
  recruiter_company: string;
}

type StatusFilter = "all" | "pending" | "approved" | "rejected";

const TABS: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max) + "..." : str;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ContributionsPage() {
  const [tab, setTab] = useState<StatusFilter>("pending");
  const [rows, setRows] = useState<ContributionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const qs = tab === "all" ? "" : `?status=${tab}`;
      const res = await fetch(`/api/admin/contributions${qs}`);
      if (res.ok) setRows(await res.json());
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  async function handleApprove(id: string) {
    const res = await fetch(`/api/admin/contributions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "approved" }),
    });
    if (res.ok) void fetchRows();
  }

  async function handleReject(id: string) {
    const res = await fetch(`/api/admin/contributions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "rejected", notes: rejectNotes }),
    });
    if (res.ok) {
      setRejectingId(null);
      setRejectNotes("");
      void fetchRows();
    }
  }

  return (
    <div>
      <h1 className="text-2xl text-ink font-display tracking-tight mb-6">
        Contribution Queue
      </h1>

      {/* filter tabs */}
      <div className="flex gap-1 mb-6 border-b border-rule">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-4 py-2 text-[11px] font-mono font-medium tracking-[0.1em] uppercase transition-colors border-b-2 -mb-[1px] ${
              tab === t.value
                ? "border-terracotta text-ink"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted font-mono">Loading...</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted font-mono">No contributions found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-rule">
                {["Recruiter", "Type", "Payload", "Submitted", "Status", "Actions"].map(
                  (h) => (
                    <th
                      key={h}
                      className="py-3 px-3 text-[10px] font-mono font-medium tracking-[0.12em] uppercase text-muted"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-rule/50 hover:bg-card-light/30">
                  <td className="py-3 px-3">
                    <div className="text-xs font-mono text-ink">{row.recruiter_email}</div>
                    <div className="text-[10px] font-mono text-muted">{row.recruiter_company}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-[10px] font-mono font-medium tracking-[0.1em] uppercase text-ink border border-rule px-2 py-0.5 rounded-[3px]">
                      {row.type}
                    </span>
                  </td>
                  <td className="py-3 px-3 max-w-[200px]">
                    <span className="text-xs font-mono text-muted break-all">
                      {truncate(row.payload, 80)}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-xs font-mono text-muted whitespace-nowrap">
                    {formatDate(row.created_at)}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`text-[10px] font-mono font-medium tracking-[0.1em] uppercase px-2 py-0.5 rounded-[3px] ${
                        row.status === "approved"
                          ? "bg-ink/10 text-ink"
                          : row.status === "rejected"
                            ? "bg-terracotta/10 text-terracotta"
                            : "bg-card-light text-muted"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    {row.status === "pending" && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApprove(row.id)}
                          className="text-[10px] font-mono font-medium tracking-[0.1em] uppercase px-3 py-1.5 rounded-md bg-ink text-card hover:opacity-90 transition-opacity"
                        >
                          Approve
                        </button>
                        {rejectingId === row.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={rejectNotes}
                              onChange={(e) => setRejectNotes(e.target.value)}
                              placeholder="Reason..."
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs font-mono border border-rule rounded px-2 py-1 bg-page text-ink w-36 focus:outline-none focus:border-terracotta"
                            />
                            <button
                              onClick={() => handleReject(row.id)}
                              className="text-[10px] font-mono font-medium tracking-[0.1em] uppercase px-2 py-1.5 rounded-md bg-terracotta text-card hover:opacity-90"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => {
                                setRejectingId(null);
                                setRejectNotes("");
                              }}
                              className="text-[10px] font-mono text-muted hover:text-ink"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setRejectingId(row.id)}
                            className="text-[10px] font-mono font-medium tracking-[0.1em] uppercase px-3 py-1.5 rounded-md border border-terracotta text-terracotta hover:bg-terracotta hover:text-card transition-colors"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    )}
                    {row.status !== "pending" && row.notes && (
                      <span className="text-[10px] font-mono text-muted italic">
                        {row.notes}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
