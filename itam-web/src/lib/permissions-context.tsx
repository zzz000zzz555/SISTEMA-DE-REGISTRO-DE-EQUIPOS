"use client";

import { createContext, useContext } from "react";

const Ctx = createContext<string[]>([]);

export function PermissionsProvider({ permissions, children }: { permissions: string[]; children: React.ReactNode }) {
  return <Ctx.Provider value={permissions}>{children}</Ctx.Provider>;
}

export function usePermissions() {
  return useContext(Ctx);
}

export function PermissionGuard({ permiso, children, fallback }: { permiso: string; children: React.ReactNode; fallback?: React.ReactNode }) {
  const perms = usePermissions();
  if (perms.includes(permiso)) return <>{children}</>;
  return <>{fallback ?? null}</>;
}