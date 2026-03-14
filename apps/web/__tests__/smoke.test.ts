import { describe, it, expect } from "vitest";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

describe("Recruiter API smoke tests", () => {
  it("Test 1 — API returns recruiters", async () => {
    const res = await fetch(`${BASE_URL}/api/recruiters`);
    expect(res.ok).toBe(true);
    const json = await res.json();
    expect(json.data.length).toBeGreaterThan(0);
  });

  it("Test 2 — Search filters correctly", async () => {
    const res = await fetch(`${BASE_URL}/api/recruiters?q=apple`);
    expect(res.ok).toBe(true);
    const json = await res.json();
    expect(json.data.length).toBeGreaterThan(0);
    for (const r of json.data) {
      const haystack = [r.company, r.name, r.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      expect(haystack).toContain("apple");
    }
  });

  it("Test 3 — Batch endpoint works", async () => {
    const listRes = await fetch(`${BASE_URL}/api/recruiters?limit=3`);
    const listJson = await listRes.json();
    const ids = listJson.data.slice(0, 3).map((r: { id: string }) => r.id);
    expect(ids.length).toBe(3);

    const batchRes = await fetch(`${BASE_URL}/api/recruiters/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    expect(batchRes.ok).toBe(true);
    const batchData = await batchRes.json();
    expect(batchData.length).toBe(3);
  });

  it("Test 4 — Name/company contamination check", async () => {
    const res = await fetch(`${BASE_URL}/api/recruiters?limit=50`);
    const json = await res.json();

    for (const r of json.data) {
      if (r.name !== null) {
        expect(r.name.toLowerCase()).not.toContain(r.company.toLowerCase());
        expect(r.company.toLowerCase()).not.toContain(r.name.toLowerCase());
      }
    }
  });

  it("Test 5 — Null metrics shape check", async () => {
    const res = await fetch(`${BASE_URL}/api/recruiters?limit=50`);
    const json = await res.json();

    for (const r of json.data) {
      expect(r.id).toBeDefined();
      expect(r.company).toBeDefined();
      expect(r.email).toBeDefined();
    }
  });
});
