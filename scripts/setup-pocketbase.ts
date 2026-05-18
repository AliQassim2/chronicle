import PocketBase from "pocketbase";

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090";
const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || "admin@chronicle.app";
const ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || "admin123456";

const pb = new PocketBase(PB_URL);

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log(`\nConnecting to ${PB_URL}...`);

  // Wait for PocketBase to be ready
  for (let i = 0; i < 30; i++) {
    try {
      await pb.health.check();
      break;
    } catch {
      console.log("  Waiting for PocketBase to start...");
      await sleep(2000);
    }
  }

  // Try to auth as superuser
  let superuserToken: string | null = null;
  try {
    // PocketBase v0.38+ uses _superusers instead of admins
    // Try both the new _superusers auth and the legacy admins auth
    try {
      const auth = await pb.collection("_superusers").authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
      superuserToken = auth.token;
      console.log(`  Authenticated as superuser: ${ADMIN_EMAIL}`);
    } catch {
      const auth = await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
      superuserToken = auth.token;
      console.log(`  Authenticated as admin: ${ADMIN_EMAIL}`);
    }
  } catch {
    console.log(`\n  ⚠ Could not login as admin/superuser.`);
    console.log(`  Please do one of the following then re-run:`);
    console.log(`\n  Option A: Use the CLI to create a superuser:`);
    console.log(`    pocketbase.exe superuser upsert ${ADMIN_EMAIL} ${ADMIN_PASSWORD}`);
    console.log(`\n  Option B: Open ${PB_URL}/_/ in your browser`);
    console.log(`    Create admin with email: ${ADMIN_EMAIL} / password: ${ADMIN_PASSWORD}\n`);
    process.exit(1);
  }

  // Helper: find or create collection
  const existing = await pb.collections.getFullList();

  function colExists(name: string) {
    return existing.some((c) => c.name === name);
  }

  function getColId(name: string) {
    return existing.find((c) => c.name === name)?.id;
  }

  // --- users collection (configure auth) ---
  const usersCol = existing.find((c) => c.name === "users");
  if (usersCol) {
    const hasUsername = usersCol.fields?.some((f: any) => f.name === "username");
    if (!hasUsername) {
      console.log("  Adding 'username' field to users...");
      const updatedFields = [...(usersCol.fields || []), { type: "text", name: "username", required: false, min: 0, max: 255 }];
      await pb.collections.update(usersCol.id, {
        fields: updatedFields,
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
      });
      console.log("  ✓ username field added to users");
    }

    const hasApproved = usersCol.fields?.some((f: any) => f.name === "approved");
    if (!hasApproved) {
      console.log("  Adding 'approved' field to users...");
      const updatedFields = [...(usersCol.fields || []), { type: "bool", name: "approved", required: false }];
      await pb.collections.update(usersCol.id, { fields: updatedFields });
      console.log("  ✓ approved field added to users");
    }
  }

  // --- stories collection ---
  if (!colExists("stories")) {
    console.log("  Creating 'stories' collection...");
    const payload: any = {
      name: "stories",
      type: "base",
      fields: [
        { type: "text", name: "title", required: true, min: 1, max: 500 },
        { type: "text", name: "original_author", required: true, min: 1, max: 500 },
        { type: "text", name: "content", required: true },
        { type: "relation", name: "user_id", required: true, maxSelect: 1, collectionId: "_pb_users_auth_" },
        { type: "file", name: "images", maxSelect: 10, maxSize: 52428800, mimeTypes: ["image/png", "image/jpeg", "image/gif", "image/webp"] },
        { type: "file", name: "videos", maxSelect: 5, maxSize: 104857600, mimeTypes: ["video/mp4", "video/webm"] },
        { type: "json", name: "links" },
        { type: "autodate", name: "created", onCreate: true, onUpdate: false },
        { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
      ],
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
    };
    await pb.collections.create(payload);
    console.log("  ✓ stories collection created");
  } else {
    console.log("  ✓ stories collection already exists");
  }

  // --- comments collection ---
  if (!colExists("comments")) {
    console.log("  Creating 'comments' collection...");
    const payload: any = {
      name: "comments",
      type: "base",
      fields: [
        { type: "relation", name: "story_id", required: true, maxSelect: 1, collectionId: "stories" },
        { type: "relation", name: "user_id", required: true, maxSelect: 1, collectionId: "_pb_users_auth_" },
        { type: "select", name: "stance", required: true, maxSelect: 1, values: ["for", "against", "neutral"] },
        { type: "text", name: "content", required: true },
        { type: "file", name: "images", maxSelect: 5, maxSize: 10485760, mimeTypes: ["image/png", "image/jpeg", "image/gif", "image/webp"] },
        { type: "autodate", name: "created", onCreate: true, onUpdate: false },
        { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
      ],
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
    };
    await pb.collections.create(payload);
    console.log("  ✓ comments collection created");
  } else {
    console.log("  ✓ comments collection already exists");
  }

  // --- Seed sample data ---
  const storyCount = await pb.collection("stories").getList(1, 1);
  if (storyCount.totalItems === 0) {
    console.log("  Seeding sample data...");

    let authorUser: any;
    try {
      const users = await pb.collection("users").getList(1, 1);
      if (users.totalItems > 0) {
        authorUser = users.items[0];
      }
    } catch {
      // no users yet
    }

    if (authorUser) {
      const sampleStories = [
        {
          user_id: authorUser.id,
          original_author: "Jane Doe",
          title: "The Rise of Renewable Energy",
          content: "Renewable energy sources like solar and wind are transforming the global energy landscape. In 2025, renewable energy accounted for over 30% of global electricity generation, up from 20% just five years prior.\n\nThis shift is driven by falling costs, government incentives, and growing awareness of climate change. Countries like Denmark and Uruguay now generate more than 90% of their electricity from renewables.\n\nHowever, challenges remain in energy storage and grid infrastructure. Battery technology continues to improve, but large-scale storage solutions are still expensive.",
        },
        {
          user_id: authorUser.id,
          original_author: "John Smith",
          title: "Understanding Quantum Computing",
          content: "Quantum computing represents a fundamental shift in how we process information. Unlike classical computers that use bits (0 or 1), quantum computers use qubits that can exist in multiple states simultaneously.\n\nThis property, known as superposition, allows quantum computers to solve certain problems exponentially faster than classical computers. Applications include drug discovery, cryptography, and climate modeling.\n\nWhile still in its early stages, companies like IBM, Google, and Microsoft are making rapid progress. Error correction remains a significant hurdle.",
        },
        {
          user_id: authorUser.id,
          original_author: "Maria Garcia",
          title: "The Future of Urban Farming",
          content: "Urban farming is revolutionizing food production in cities worldwide. Vertical farms, rooftop gardens, and hydroponic systems are bringing fresh produce closer to consumers.\n\nThese methods use up to 95% less water than traditional agriculture and eliminate the need for pesticides. Cities like Singapore, Tokyo, and New York are leading the way.\n\nThe challenge now is scaling these operations to make a meaningful impact on food security while keeping costs competitive with conventional farming.",
        },
      ];

      for (const storyData of sampleStories) {
        await pb.collection("stories").create(storyData);
      }
      console.log(`  ✓ Created ${sampleStories.length} sample stories`);
    } else {
      console.log("  ⚠ No users found — register an account at the app first, then re-run to seed stories");
    }
  } else {
    console.log("  ✓ Stories already exist, skipping seed");
  }

  console.log(`\n✓ Setup complete!`);
  console.log(`  Admin UI: ${PB_URL}/_/`);
  console.log(`  App:      http://localhost:3000\n`);
}

main().catch((err) => {
  console.error("✗ Setup failed:", err instanceof Error ? err.message : err);
  if (typeof err === "object" && err !== null) {
    try { console.error("Details:", JSON.stringify(err)); } catch { console.error("Raw:", err); }
  }
  process.exit(1);
});
