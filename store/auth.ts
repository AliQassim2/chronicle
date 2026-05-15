"use client";

import { create } from "zustand";
import pb from "@/lib/pocketbase";

interface AuthState {
  user: Record<string, unknown> | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const authData = await pb.collection("users").authWithPassword(email, password);
      const record = authData.record as Record<string, unknown>;
      if (!record.approved) {
        pb.authStore.clear();
        set({ error: "Your account is waiting for admin approval.", isLoading: false });
        throw new Error("not approved");
      }
      set({
        user: record,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      if (message !== "not approved") {
        set({ error: message, isLoading: false });
      }
      throw err;
    }
  },

  register: async (username: string, email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      await pb.collection("users").create({ username, email, password, passwordConfirm: password });
      set({ isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed";
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  logout: () => {
    pb.authStore.clear();
    set({ user: null, isAuthenticated: false, error: null });
  },

  refreshAuth: async () => {
    if (!pb.authStore.isValid || !pb.authStore.token) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }
    try {
      const authData = await pb.collection("users").authRefresh();
      set({
        user: authData.record as unknown as Record<string, unknown>,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      pb.authStore.clear();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
