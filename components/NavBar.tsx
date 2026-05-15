"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/auth";

export default function NavBar() {
  const { isAuthenticated, user, logout } = useAuthStore();

  return (
    <nav className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold tracking-tight text-zinc-900">
          Chronicle
        </Link>
        {isAuthenticated && (
          <div className="flex items-center gap-3">
            <Link
              href="/create"
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700"
            >
              New Story
            </Link>
            <span className="text-sm text-zinc-500">
              {typeof user?.username === "string" ? user.username : ""}
            </span>
            <button
              onClick={logout}
              className="text-sm text-zinc-500 hover:text-zinc-900"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
