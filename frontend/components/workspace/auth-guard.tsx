"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { hydrate, token, isHydrated } = useAuthStore();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!token) {
      router.replace("/login");
    }
  }, [isHydrated, router, token]);

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="panel rounded-[2rem] px-8 py-6 text-sm text-slate-600">
          Preparing your workspace...
        </div>
      </div>
    );
  }

  if (!token) {
    return null;
  }

  return <>{children}</>;
};

