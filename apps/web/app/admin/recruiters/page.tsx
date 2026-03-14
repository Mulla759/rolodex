"use client";

import { useCallback, useEffect, useState } from "react";
import { ACCOLADE_LABELS } from "@rolodex/db/constants";
import type { Accolade } from "@rolodex/db/constants";

interface RecruiterRow {
  id: string;
  company: string;
  name: string | null;
  email: string;
  title: string | null;
  linkedin_url: string | null;
  location: string | null;
  status: string | null;
  verified_at: string | null;
  accolades: string[] | null;
  interaction_count: number | null;
}

interface EditState {
  name: string;
  title: string;
  location: string;
  linkedin_url: string;
  status: string;
  accolades: string[];
}

const ALL_ACCOLADES = Object.keys(ACCOLADE_LABELS) as Accolade[];

export default function RecruitersPage() {
  const [rows, setRows] = useState<RecruiterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [enriching, setEnriching] = useState<string | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const qs = search ? `?company=${encodeURIComponent(search)}` : "";
      const res = await fetch(`/api/admin/recruiters${qs}`);
      if (res.ok) setRows(await res.json());
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => void fetchRows(), 300);
    return () => clearTimeout(t);
  }, [fetchRows]);

  function expandRow(row: RecruiterRow) {
    if (expandedId === row.id) {
      setExpandedId(null);
      setEdit(null);
      return;
    }
    setExpandedId(row.id);
    setEdit({
      name: row.name ?? "",
      title: row.title ?? "",
      location: row.location ?? "",
      linkedin_url: row.linkedin_url ?? "",
      status: row.status ?? "active",
      accolades: row.accolades ?? [],
    });
  }

  async function handleSave(id: string) {
    if (!edit) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/recruiters/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(edit),
      });
      if (res.ok) {
        setExpandedId(null);
        setEdit(null);
        void fetchRows();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleEnrich(id: string) {
    setEnriching(id);
    try {
      await fetch(`/api/admin/recruiters/${id}/enrich`, { method: "POST" });
      void fetchRows();
    } finally {
      setEnriching(null);
    }
  }

  function toggleAccolade(a: string) {
    if (!edit) return;
    setEdit({
      ...edit,
      accolades: edit.accolades.includes(a)
        ? edit.accolades.filter((x) => x !== a)
        : [...edit.accolades, a],
    });
  }

  return (
    <div>
      <h1 className="text-2xl text-ink font-display tracking-tight mb-6">
        Recruiters
      </h1>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Filter by company..."
        className="w-full max-w-sm mb-6 px-4 py-2 text-sm font-mono border border-rule rounded-md bg-page text-ink focus:outline-none focus:border-terracotta"
      />

      {loading ? (
        <p className="text-sm text-muted font-mono">Loading...</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted font-mono">No recruiters found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-rule">
                {["Company", "Name", "Email", "LinkedIn", "Verified", "Interactions"].map(
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
            {rows.map((row) => (
              <tbody key={row.id}>
                <tr
                    onClick={() => expandRow(row)}
                    className="border-b border-rule/50 hover:bg-card-light/30 cursor-pointer"
                  >
                    <td className="py-3 px-3 text-xs font-mono text-ink font-medium">
                      {row.company}
                    </td>
                    <td className="py-3 px-3 text-xs font-mono text-ink">
                      {row.name ?? "\u2014"}
                    </td>
                    <td className="py-3 px-3 text-xs font-mono text-muted">
                      {row.email}
                    </td>
                    <td className="py-3 px-3 text-xs font-mono text-muted">
                      {row.linkedin_url ? (
                        <a
                          href={row.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-terracotta hover:underline"
                        >
                          Profile
                        </a>
                      ) : (
                        "\u2014"
                      )}
                    </td>
                    <td className="py-3 px-3 text-xs font-mono text-muted whitespace-nowrap">
                      {row.verified_at
                        ? new Date(row.verified_at).toLocaleDateString("en-US", {
                            month: "short",
                            year: "numeric",
                          })
                        : "\u2014"}
                    </td>
                    <td className="py-3 px-3 text-xs font-mono text-ink text-center">
                      {row.interaction_count ?? 0}
                    </td>
                  </tr>

                  {expandedId === row.id && edit && (
                    <tr>
                      <td colSpan={6} className="p-4 bg-card-light/20 border-b border-rule">
                        <div className="grid grid-cols-2 gap-4 max-w-2xl">
                          {(
                            [
                              ["name", "Name"],
                              ["title", "Title"],
                              ["location", "Location"],
                              ["linkedin_url", "LinkedIn URL"],
                            ] as const
                          ).map(([key, label]) => (
                            <div key={key}>
                              <label className="block text-[10px] font-mono font-medium tracking-[0.12em] uppercase text-muted mb-1">
                                {label}
                              </label>
                              <input
                                type="text"
                                value={edit[key]}
                                onChange={(e) =>
                                  setEdit({ ...edit, [key]: e.target.value })
                                }
                                className="w-full px-3 py-1.5 text-xs font-mono border border-rule rounded bg-page text-ink focus:outline-none focus:border-terracotta"
                              />
                            </div>
                          ))}

                          <div>
                            <label className="block text-[10px] font-mono font-medium tracking-[0.12em] uppercase text-muted mb-1">
                              Status
                            </label>
                            <select
                              value={edit.status}
                              onChange={(e) =>
                                setEdit({ ...edit, status: e.target.value })
                              }
                              className="w-full px-3 py-1.5 text-xs font-mono border border-rule rounded bg-page text-ink focus:outline-none focus:border-terracotta"
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                            </select>
                          </div>

                          <div className="col-span-2">
                            <label className="block text-[10px] font-mono font-medium tracking-[0.12em] uppercase text-muted mb-2">
                              Accolades
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {ALL_ACCOLADES.map((a) => (
                                <button
                                  key={a}
                                  type="button"
                                  onClick={() => toggleAccolade(a)}
                                  className={`text-[10px] font-mono font-medium tracking-[0.08em] px-3 py-1 rounded-[3px] border transition-colors ${
                                    edit.accolades.includes(a)
                                      ? "bg-ink text-card border-ink"
                                      : "bg-transparent text-muted border-rule hover:border-ink hover:text-ink"
                                  }`}
                                >
                                  {ACCOLADE_LABELS[a]}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                          <button
                            onClick={() => handleSave(row.id)}
                            disabled={saving}
                            className="text-[11px] font-mono font-medium tracking-[0.1em] uppercase px-5 py-2 rounded-md bg-ink text-card hover:opacity-90 transition-opacity disabled:opacity-50"
                          >
                            {saving ? "Saving..." : "Save"}
                          </button>
                          <button
                            onClick={() => handleEnrich(row.id)}
                            disabled={enriching === row.id || !row.linkedin_url}
                            className="text-[11px] font-mono font-medium tracking-[0.1em] uppercase px-5 py-2 rounded-md border border-terracotta text-terracotta hover:bg-terracotta hover:text-card transition-colors disabled:opacity-50"
                          >
                            {enriching === row.id
                              ? "Enriching..."
                              : "Run AI Enrichment"}
                          </button>
                          <button
                            onClick={() => {
                              setExpandedId(null);
                              setEdit(null);
                            }}
                            className="text-[11px] font-mono text-muted hover:text-ink transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
              </tbody>
            ))}
          </table>
        </div>
      )}
    </div>
  );
}
