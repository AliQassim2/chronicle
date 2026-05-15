import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  const pbAuth = request.cookies.get("pb_auth")?.value;

  if (!pbAuth) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const parsed = JSON.parse(pbAuth);
    if (!parsed.token) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  } catch {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
