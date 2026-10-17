"use client";

import * as React from "react";
import { PermissionKey } from "./permissions";
import { useUserStore } from "../store/useUserStore";
import { can, hasPermission, PermissionContext } from "./can";

interface PermissionGuardProps {
  permission: PermissionKey;
  context?: PermissionContext;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGuard({
  permission,
  context,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const { currentUser } = useUserStore();

  const isAllowed = can(currentUser, permission, undefined, context);

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export function usePermission(
  permission: PermissionKey,
  context?: PermissionContext
): boolean {
  const { currentUser } = useUserStore();
  return can(currentUser, permission, undefined, context);
}
