import PocketBase from "pocketbase";
import { CookieStore } from "./cookieStore";

const url = process.env.NEXT_PUBLIC_POCKETBASE_URL;

if (!url) {
  throw new Error("NEXT_PUBLIC_POCKETBASE_URL is not defined");
}

const pb = new PocketBase(url);
pb.authStore = new CookieStore("pb_auth");

export default pb;
