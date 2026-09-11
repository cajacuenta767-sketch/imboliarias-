"use client";

import { createContext, useContext } from "react";

const Ctx = createContext<Record<string, string>>({});

export function SettingsProvider({ settings, children }: { settings: Record<string, string>; children: React.ReactNode }) {
  return <Ctx.Provider value={settings}>{children}</Ctx.Provider>;
}

export const useSettings = () => useContext(Ctx);
