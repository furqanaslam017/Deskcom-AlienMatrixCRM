import fs from "fs";
import path from "path";

// Load .env.local before importing any application code
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const idx = trimmed.indexOf("=");
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).replace(/^"|"$/g, "").trim();
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

async function run() {
  const { ensureBuiltInObjects, applyIndustryTemplate, createCustomRecord, getCustomObjectBySlug } =
    await import("../lib/alien-matrix/service");
  const { createAdminClient } = await import("../lib/supabase/admin");

  const DEMO_ORG_ID = "27728f33-73f5-4ebf-a23d-a2a0fbc855d2";
  const admin = createAdminClient();
  const { data: userData } = await admin.auth.admin.listUsers();
  const demoUser = userData?.users?.find(u => u.email === "admin@whitehouseforexacademy.com") || userData?.users?.[0];
  const DEMO_USER_ID = demoUser?.id || "00000000-0000-0000-0000-000000000000";

  console.log("Seeding AlienMatrix Phase 1 Demo Data for organization:", DEMO_ORG_ID, "User:", DEMO_USER_ID);

  // 1. Ensure Built-in objects
  console.log("Ensuring built-in core objects...");
  await ensureBuiltInObjects(DEMO_ORG_ID);
  console.log("Built-in objects verified!");

  // 2. Apply Real Estate template pack
  console.log("Applying Real Estate industry template pack...");
  await applyIndustryTemplate(DEMO_ORG_ID, DEMO_USER_ID, "real-estate");
  console.log("Real estate template pack applied!");

  // 3. Get Properties object
  const propObj = await getCustomObjectBySlug(DEMO_ORG_ID, "properties");
  if (!propObj) throw new Error("Properties object not found after template application");

  // 4. Seed demo property records
  const sampleProperties = [
    {
      title: "Luxury Waterfront Villa Palm Jumeirah",
      values: {
        title: "Luxury Waterfront Villa Palm Jumeirah",
        property_type: "villa",
        price: 3200000,
        status: "available",
        location: "Frond G, Palm Jumeirah, Dubai",
        bedrooms: 5,
        bathrooms: 6,
        area_sqft: 6500,
        features: "Private beach access, infinity pool, smart home automation, rooftop terrace",
      },
    },
    {
      title: "Skyline View Penthouse Downtown",
      values: {
        title: "Skyline View Penthouse Downtown",
        property_type: "apartment",
        price: 1850000,
        status: "under_offer",
        location: "Downtown Boulevard Tower 1",
        bedrooms: 3,
        bathrooms: 4,
        area_sqft: 3400,
        features: "Burj Khalifa view, concierge service, private elevator, marble finishes",
      },
    },
    {
      title: "Green Valley Prime Commercial Plot",
      values: {
        title: "Green Valley Prime Commercial Plot",
        property_type: "plot",
        price: 950000,
        status: "available",
        location: "Green Valley Phase 2, Sector B",
        bedrooms: 0,
        bathrooms: 0,
        area_sqft: 10800,
        features: "Corner plot, main boulevard facing, commercial approval granted",
      },
    },
    {
      title: "Executive Grade-A Office Floor",
      values: {
        title: "Executive Grade-A Office Floor",
        property_type: "office",
        price: 1200000,
        status: "reserved",
        location: "Business Bay Financial Tower, Level 24",
        bedrooms: 0,
        bathrooms: 4,
        area_sqft: 4200,
        features: "Fully fitted, 45 workstations, 3 executive cabins, conference hall",
      },
    },
    {
      title: "Modern Sunset Heights 2-Bed Residence",
      values: {
        title: "Modern Sunset Heights 2-Bed Residence",
        property_type: "apartment",
        price: 480000,
        status: "sold",
        location: "Sunset Heights Tower B, Unit 1204",
        bedrooms: 2,
        bathrooms: 2,
        area_sqft: 1250,
        features: "Balcony garden, equipped modern kitchen, high rental yield",
      },
    },
  ];

  console.log("Seeding properties records...");
  for (const prop of sampleProperties) {
    await createCustomRecord(DEMO_ORG_ID, DEMO_USER_ID, propObj.id, prop);
  }
  console.log(`Seeded ${sampleProperties.length} demo properties successfully!`);

  // 5. Seed Viewings
  const viewObj = await getCustomObjectBySlug(DEMO_ORG_ID, "viewings");
  if (viewObj) {
    const sampleViewings = [
      {
        title: "VIP Client Inspection: Waterfront Villa",
        values: {
          title: "VIP Client Inspection: Waterfront Villa",
          scheduled_at: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
          client_name: "Sheikh Mansoor",
          client_phone: "+971501234567",
          status: "scheduled",
          feedback: "Interested in cash purchase; requested title deed copy.",
        },
      },
      {
        title: "Second Viewing: Downtown Penthouse",
        values: {
          title: "Second Viewing: Downtown Penthouse",
          scheduled_at: new Date(Date.now() + 172800000).toISOString().slice(0, 16),
          client_name: "Dr. Alexander Wright",
          client_phone: "+447911123456",
          status: "scheduled",
          feedback: "Wife visiting today to inspect interior finishes.",
        },
      },
    ];

    for (const view of sampleViewings) {
      await createCustomRecord(DEMO_ORG_ID, DEMO_USER_ID, viewObj.id, view);
    }
    console.log(`Seeded ${sampleViewings.length} demo viewings successfully!`);
  }

  console.log("AlienMatrix Phase 1 Demo Data seeding completed successfully!");
}

run().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
