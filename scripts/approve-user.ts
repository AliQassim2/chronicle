import PocketBase from "pocketbase";

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090";
const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || "";
const ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || "";

const pb = new PocketBase(PB_URL);

async function main() {
  const emailArg = process.argv[2];

  // Auth as superuser
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error("Set PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD in .env.local");
    process.exit(1);
  }
  await pb.collection("_superusers").authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);

  const users = await pb.collection("users").getFullList();

  const unapproved = users.filter((u: any) => !u.approved);

  if (emailArg) {
    const user = users.find((u: any) => u.email === emailArg);
    if (!user) {
      console.error(`User not found: ${emailArg}`);
      console.log("Existing users:");
      users.forEach((u: any) => console.log(`  ${u.email} (approved: ${!!u.approved})`));
      process.exit(1);
    }
    await pb.collection("users").update(user.id, { approved: true });
    console.log(`✓ Approved: ${user.email}`);
    return;
  }

  if (unapproved.length === 0) {
    console.log("No unapproved users.");
    console.log("\nUsage:");
    console.log("  pnpm approve:user someone@email.com");
    console.log("\nAll users:");
    users.forEach((u: any) => console.log(`  ${u.email} — ${u.approved ? "✓ approved" : "✗ pending"}`));
    return;
  }

  console.log(`\nUnapproved users (${unapproved.length}):`);
  unapproved.forEach((u: any, i: number) => console.log(`  ${i + 1}. ${u.email}`));
  console.log("\nApprove with:");
  console.log("  pnpm approve:user user@email.com\n");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
