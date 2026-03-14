"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "rolodex_saves";

function parseSavedIds(rawValue: string | null): string[] {
  if (!rawValue) return [];

  try {
    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

function readSavedIds(): string[] {
  if (typeof window === "undefined") return [];
  return parseSavedIds(window.localStorage.getItem(STORAGE_KEY));
}

export function useSaveList() {
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    setSavedIds(readSavedIds());

    function onStorage(event: StorageEvent) {
      if (event.key !== STORAGE_KEY) return;
      setSavedIds(parseSavedIds(event.newValue));
    }

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggle = useCallback((id: string) => {
    setSavedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((savedId) => savedId !== id) : [...prev, id];
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const isSaved = useCallback((id: string) => savedIds.includes(id), [savedIds]);
  const count = useMemo(() => savedIds.length, [savedIds]);

  return { savedIds, toggle, isSaved, count };
}
