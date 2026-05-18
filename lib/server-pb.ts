import PocketBase from "pocketbase";
import { cookies } from "next/headers";
import { parseAuthCookie } from "./cookieStore";

export async function createServerPB(): Promise<PocketBase> {
  const url = process.env.POCKETBASE_URL || process.env.NEXT_PUBLIC_POCKETBASE_URL;

  if (!url) {
    throw new Error("POCKETBASE_URL or NEXT_PUBLIC_POCKETBASE_URL must be defined");
  }

  const pb = new PocketBase(url);
  const cookieStore = await cookies();
  const raw = cookieStore.get("pb_auth")?.value;
  const parsed = parseAuthCookie(raw);

  if (parsed?.token) {
    pb.authStore.save(parsed.token, parsed.model ?? null);
  }

  return pb;
}
