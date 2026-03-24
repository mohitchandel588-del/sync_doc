"use client";

import { create } from "zustand";
import { api } from "@/lib/api";
import type { User } from "@/types";

type AuthState = {
  user: User | null;
  token: string | null;
  isHydrated: boolean;
  isLoading: boolean;
  hydrate: () => Promise<void>;
  login: (input: { email: string; password: string }) => Promise<void>;
  register: (input: {
    email: string;
    password: string;
    name?: string;
  }) => Promise<void>;
  logout: () => void;
};

const persistSession = (token: string, user: User) => {
  window.localStorage.setItem("syncdoc_token", token);
  window.localStorage.setItem("syncdoc_user", JSON.stringify(user));
};

const clearSession = () => {
  window.localStorage.removeItem("syncdoc_token");
  window.localStorage.removeItem("syncdoc_user");
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isHydrated: false,
  isLoading: false,
  hydrate: async () => {
    if (get().isHydrated || typeof window === "undefined") {
      return;
    }

    const token = window.localStorage.getItem("syncdoc_token");

    if (!token) {
      set({
        isHydrated: true,
        token: null,
        user: null
      });
      return;
    }

    set({
      isLoading: true
    });

    try {
      const { data } = await api.get<{ user: User }>("/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      persistSession(token, data.user);
      set({
        token,
        user: data.user,
        isHydrated: true,
        isLoading: false
      });
    } catch (_error) {
      clearSession();
      set({
        token: null,
        user: null,
        isHydrated: true,
        isLoading: false
      });
    }
  },
  login: async (input) => {
    set({
      isLoading: true
    });

    try {
      const { data } = await api.post<{ token: string; user: User }>(
        "/auth/login",
        input
      );

      persistSession(data.token, data.user);
      set({
        token: data.token,
        user: data.user,
        isHydrated: true,
        isLoading: false
      });
    } catch (error) {
      set({
        isLoading: false
      });
      throw error;
    }
  },
  register: async (input) => {
    set({
      isLoading: true
    });

    try {
      const { data } = await api.post<{ token: string; user: User }>(
        "/auth/register",
        input
      );

      persistSession(data.token, data.user);
      set({
        token: data.token,
        user: data.user,
        isHydrated: true,
        isLoading: false
      });
    } catch (error) {
      set({
        isLoading: false
      });
      throw error;
    }
  },
  logout: () => {
    clearSession();
    set({
      user: null,
      token: null,
      isHydrated: true,
      isLoading: false
    });
  }
}));
