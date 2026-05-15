import { BaseAuthStore, AuthModel } from "pocketbase";

function serializeCookie(name: string, value: string, days: number): string {
  const maxAge = days * 86400;
  return `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

function deleteCookie(name: string): void {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

export class CookieStore extends BaseAuthStore {
  private cookieName: string;
  private cookieDays: number;

  constructor(cookieName = "pb_auth", cookieDays = 7) {
    super();
    this.cookieName = cookieName;
    this.cookieDays = cookieDays;

    const raw = getCookie(this.cookieName);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.token) {
          this.save(parsed.token, parsed.model ?? null);
        }
      } catch {
        deleteCookie(this.cookieName);
      }
    }
  }

  save(token: string, model?: AuthModel | null): void {
    super.save(token, model);
    const payload = JSON.stringify({ token, model: model ?? null });
    document.cookie = serializeCookie(this.cookieName, payload, this.cookieDays);
  }

  clear(): void {
    super.clear();
    deleteCookie(this.cookieName);
  }
}

export function parseAuthCookie(cookie: string | undefined): { token: string; model: any } | null {
  if (!cookie) return null;
  try {
    const decoded = typeof window === "undefined" ? decodeURIComponent(cookie) : cookie;
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}
