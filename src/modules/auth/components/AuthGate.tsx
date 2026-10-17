"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getToken } from "@/lib/auth-token";
import { useUserStore } from "@/shared/store/useUserStore";
import { authService, toStoreUser } from "../services/authService";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const setCurrentUser = useUserStore((s) => s.setCurrentUser);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }

    let cancelled = false;
    authService
      .me()
      .then((user) => {
        if (cancelled) return;
        setCurrentUser(toStoreUser(user));
        useUserStore.getState().fetchDepartments().catch(() => {});
        useUserStore.getState().fetchUsers().catch(() => {});
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) router.replace("/login");
      });

    return () => {
      cancelled = true;
    };
  }, [router, setCurrentUser]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
