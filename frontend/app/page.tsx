"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

export default function HomePage() {
  const router = useRouter();
  const { hydrate, token, isHydrated } = useAuthStore();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (token) {
      router.replace("/workspace");
      return;
    }

    router.replace("/login");
  }, [isHydrated, router, token]);

  return null;
}
