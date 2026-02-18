/**
 * Hook for CP prefs (canonical layer). Debounced set. Fallback to defaultValue if API down.
 */

import React from "react";
import { getPref, setPref } from "./cpPrefs";

const DEBOUNCE_MS = 400;

export function useCpPref<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void, { loading: boolean; error: boolean; offline: boolean }] {
  const [value, setValue] = React.useState<T>(defaultValue);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [offline, setOffline] = React.useState(false);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    let alive = true;
    getPref<T>(key)
      .then((data) => {
        if (!alive) return;
        setLoading(false);
        if (data !== null && data !== undefined) setValue(data as T);
      })
      .catch(() => {
        if (!alive) return;
        setLoading(false);
        setError(true);
        setOffline(true);
      });
    return () => {
      alive = false;
    };
  }, [key]);

  const set = React.useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (prev: T) => T)(prev) : next;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          setPref(key, resolved).catch(() => setOffline(true));
          debounceRef.current = null;
        }, DEBOUNCE_MS);
        return resolved;
      });
    },
    [key]
  );

  return [value, set, { loading, error, offline }];
}
