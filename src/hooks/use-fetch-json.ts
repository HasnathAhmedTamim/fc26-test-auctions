"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, fetchJson } from "@/lib/api/fetch-json";

type UseFetchJsonOptions<T> = {
  enabled?: boolean;
  initialData?: T;
  fetchInit?: RequestInit;
};

export function useFetchJson<T>(
  url: string | null,
  options: UseFetchJsonOptions<T> = {}
) {
  const { enabled = true, initialData, fetchInit } = options;
  const [data, setData] = useState<T | undefined>(initialData);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(Boolean(enabled && url));

  const reload = useCallback(async () => {
    if (!url || !enabled) return;

    setLoading(true);
    setError("");

    try {
      const payload = await fetchJson<T>(url, {
        cache: "no-store",
        ...fetchInit,
      });
      setData(payload);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Request failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [enabled, fetchInit, url]);

  useEffect(() => {
    if (!enabled || !url) return;
    void reload();
  }, [enabled, reload, url]);

  return { data, error, loading, reload, setData };
}
