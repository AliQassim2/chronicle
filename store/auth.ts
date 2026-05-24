"use client";

import { create } from "zustand";
import pb from "@/lib/pocketbase";

interface AuthState {
  user: Record<string, unknown> | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (identity: string, password: string) => Promise<void>;
  register: (username: string, name: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (identity: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const authData = await pb.collection("users").authWithPassword(identity, password);
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
      if (message === "not approved") throw err;
      set({ error: "Invalid username or password.", isLoading: false });
      throw err;
    }
  },

  register: async (username: string, name: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      await pb.collection("users").create({ username, name, password, passwordConfirm: password });
      set({ isLoading: false });
    } catch (err: unknown) {
      let friendly = "Registration failed. Please check your details.";
      if (err && typeof err === "object" && "data" in err) {
        console.log("Registration error data:", (err as any).data);
        const data = (err as any).data;
        if (data?.data?.username?.code === "validation_not_unique") {
          friendly = "Username already taken.";
        } else if (data?.data?.username) {
          friendly = "Username is invalid or already taken.";
        }
      }
      set({ error: friendly, isLoading: false });
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
