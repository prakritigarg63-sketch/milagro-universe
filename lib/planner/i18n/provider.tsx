"use client";

import { createContext, useContext, useSyncExternalStore } from "react";
import type { Language } from "@/lib/planner/types";
import { dictionaries, type Dictionary } from "./dictionaries";

const STORAGE_KEY = "milagro.lang";

let current: Language | null = null;
const listeners = new Set<() => void>();

function readInitial(): Language {
  if (typeof window === "undefined") return "en";
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY) as Language | null;
    if (saved === "en" || saved === "hi") return saved;
  } catch {
    /* ignore */
  }
  return "en";
}

function getSnapshot(): Language {
  if (current === null) current = readInitial();
  return current;
}

function getServerSnapshot(): Language {
  return "en";
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function setLangValue(lang: Language) {
  current = lang;
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* ignore */
  }
  listeners.forEach((cb) => cb());
}

interface I18nContextValue {
  lang: Language;
  t: Dictionary;
  toggleLanguage: () => void;
  setLanguage: (l: Language) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const lang = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const value: I18nContextValue = {
    lang,
    t: dictionaries[lang],
    setLanguage: setLangValue,
    toggleLanguage: () => setLangValue(lang === "en" ? "hi" : "en"),
  };
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
