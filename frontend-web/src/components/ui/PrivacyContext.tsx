"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

interface PrivacyContextValue {
  hidden: boolean;
  toggle: () => void;
  setHidden: (v: boolean) => void;
}

const PrivacyContext = createContext<PrivacyContextValue | null>(null);

const STORAGE_KEY = "fc:privacy";

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const [hidden, setHiddenState] = useState(false);

  // Hydrate from localStorage once on mount (microtask to avoid sync setState in effect)
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === "1") setHiddenState(true);
      } catch {
        /* ignore */
      }
    });
  }, []);

  const setHidden = useCallback((v: boolean) => {
    setHiddenState(v);
    try {
      localStorage.setItem(STORAGE_KEY, v ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => {
    setHidden(!hidden);
  }, [hidden, setHidden]);

  return (
    <PrivacyContext.Provider value={{ hidden, toggle, setHidden }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy(): PrivacyContextValue {
  const ctx = useContext(PrivacyContext);
  if (!ctx) {
    throw new Error("usePrivacy must be used inside <PrivacyProvider>");
  }
  return ctx;
}

/**
 * Masks a formatted value when privacy mode is on.
 * Keeps "R$ " prefix if present, replaces digits with bullets.
 */
export function maskValue(formatted: string, hidden: boolean): string {
  if (!hidden) return formatted;
  // Preserve currency prefix if any (e.g. "R$ ", "-R$ ", "+R$ ")
  const m = formatted.match(/^([+-]?R\$\s*)/);
  const prefix = m ? m[1] : "";
  return `${prefix}•••`;
}
