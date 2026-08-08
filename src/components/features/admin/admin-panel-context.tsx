"use client";

import { createContext, useContext } from "react";
import { useAdminPanel } from "./use-admin-panel";

type AdminPanelContextValue = ReturnType<typeof useAdminPanel>;

const AdminPanelContext = createContext<AdminPanelContextValue | null>(null);

export function AdminPanelProvider({ children }: { children: React.ReactNode }) {
  const value = useAdminPanel();
  return <AdminPanelContext.Provider value={value}>{children}</AdminPanelContext.Provider>;
}

export function useAdminPanelContext() {
  const context = useContext(AdminPanelContext);
  if (!context) {
    throw new Error("useAdminPanelContext must be used within AdminPanelProvider");
  }
  return context;
}
