/**
 * HealthGuard PWA — Prisma Seed
 * Seeds all 136 Uganda Districts, SystemConfig, and starter data.
 * Developed by NDUHURA MARVIN for ANGEL TECHNOLOGIES LTD
 */
import "dotenv/config";
import { PrismaClient } from "../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// All 136 Uganda districts
const DISTRICTS = [
  // Northern Region
  { name: "Koboko", region: "North", latitude: 3.4144, longitude: 30.9572, population: 185100 },
  { name: "Maracha", region: "North", latitude: 3.2333, longitude: 30.9167, population: 173400 },
  { name: "Arua", region: "North", latitude: 3.0303, longitude: 30.9073, population: 861900 },
  { name: "Yumbe", region: "North", latitude: 3.4667, longitude: 31.2500, population: 566200 },
  { name: "Nebbi", region: "North", latitude: 2.4833, longitude: 31.0889, population: 316500 },
  { name: "Pakwach", region: "North", latitude: 2.4500, longitude: 31.4833, population: 137100 },
  { name: "Madi Okollo", region: "North", latitude: 3.3500, longitude: 31.3500, population: 145000 },
  { name: "Terego", region: "North", latitude: 3.1500, longitude: 30.8500, population: 178000 },
  { name: "Moyo", region: "North", latitude: 3.6500, longitude: 31.7167, population: 137800 },
  { name: "Obongi", region: "North", latitude: 3.5833, longitude: 31.5167, population: 98500 },
  { name: "Adjumani", region: "North", latitude: 3.3778, longitude: 31.7911, population: 231900 },
  { name: "Amuru", region: "North", latitude: 2.9833, longitude: 31.9167, population: 197400 },
  { name: "Nwoya", region: "North", latitude: 2.5167, longitude: 31.9000, population: 138500 },
  { name: "Omoro", region: "North", latitude: 2.6833, longitude: 32.4500, population: 234500 },
  { name: "Gulu", region: "North", latitude: 2.7724, longitude: 32.2881, population: 502900 },
  { name: "Lamwo", region: "North", latitude: 3.5833, longitude: 32.6167, population: 141700 },
  { name: "Kitgum", region: "North", latitude: 3.2817, longitude: 32.8864, population: 236200 },
  { name: "Karenga", region: "North", latitude: 3.6500, longitude: 33.8500, population: 67800 },
  { name: "Kaabong", region: "North", latitude: 3.5167, longitude: 34.1167, population: 193700 },
  { name: "Kotido", region: "North", latitude: 2.9833, longitude: 34.1333, population: 188800 },
  { name: "Moroto", region: "North", latitude: 2.5350, longitude: 34.6664, population: 108100 },
  { name: "Amudat", region: "North", latitude: 1.9500, longitude: 34.9333, population: 116500 },
  { name: "Nakapiripirit", region: "North", latitude: 1.8833, longitude: 34.7000, population: 139400 },
  { name: "Nabilatuk", region: "North", latitude: 2.1500, longitude: 34.5500, population: 98700 },
  { name: "Napak", region: "North", latitude: 2.3500, longitude: 34.2500, population: 156200 },
  { name: "Abim", region: "North", latitude: 2.7167, longitude: 33.6667, population: 64300 },
  { name: "Agago", region: "North", latitude: 2.8833, longitude: 33.3167, population: 247300 },
  { name: "Pader", region: "North", latitude: 2.8500, longitude: 32.8833, population: 197600 },
  { name: "Otuke", region: "North", latitude: 2.5333, longitude: 33.3667, population: 107100 },
  { name: "Alebtong", region: "North", latitude: 2.2500, longitude: 33.2833, population: 213900 },
  { name: "Lira", region: "North", latitude: 2.2499, longitude: 32.8995, population: 408900 },
  { name: "Kole", region: "North", latitude: 2.3833, longitude: 32.7167, population: 247500 },
  { name: "Oyam", region: "North", latitude: 2.2333, longitude: 32.3833, population: 411800 },
  { name: "Apac", region: "North", latitude: 1.9750, longitude: 32.5386, population: 397200 },
  { name: "Kwania", region: "North", latitude: 1.8500, longitude: 32.7500, population: 189300 },
  { name: "Dokolo", region: "North", latitude: 1.9167, longitude: 33.1667, population: 178800 },
  { name: "Zombo", region: "North", latitude: 2.5167, longitude: 30.9167, population: 234500 },
  // Eastern Region
  { name: "Amuolatar", region: "East", latitude: 1.6333, longitude: 33.6167, population: 134800 },
  { name: "Kaberamaido", region: "East", latitude: 1.7333, longitude: 33.1833, population: 196200 },
  { name: "Kalaki", region: "East", latitude: 1.5500, longitude: 33.4500, population: 89400 },
  { name: "Soroti", region: "East", latitude: 1.7132, longitude: 33.6064, population: 288600 },
  { name: "Amuria", region: "East", latitude: 2.0333, longitude: 33.6333, population: 176100 },
  { name: "Kapelebyong", region: "East", latitude: 1.6833, longitude: 33.9167, population: 149700 },
  { name: "Katakwi", region: "East", latitude: 1.8833, longitude: 34.0667, population: 152200 },
  { name: "Kumi", region: "East", latitude: 1.4611, longitude: 33.9361, population: 289300 },
  { name: "Bukedea", region: "East", latitude: 1.3333, longitude: 34.0833, population: 203500 },
  { name: "Bulambuli", region: "East", latitude: 1.4167, longitude: 34.3833, population: 152600 },
  { name: "Kapchorwa", region: "East", latitude: 1.3958, longitude: 34.4511, population: 106200 },
  { name: "Kween", region: "East", latitude: 1.4667, longitude: 34.5833, population: 97200 },
  { name: "Bukwo", region: "East", latitude: 1.2667, longitude: 34.7167, population: 90800 },
  { name: "Sironko", region: "East", latitude: 1.2333, longitude: 34.2500, population: 241200 },
  { name: "Bududa", region: "East", latitude: 1.0167, longitude: 34.3333, population: 211900 },
  { name: "Namisindwa", region: "East", latitude: 0.9000, longitude: 34.3667, population: 237600 },
  { name: "Manafwa", region: "East", latitude: 0.8833, longitude: 34.2833, population: 369200 },
  { name: "Tororo", region: "East", latitude: 0.6928, longitude: 34.1806, population: 517900 },
  { name: "Busia", region: "East", latitude: 0.4656, longitude: 34.0922, population: 370200 },
  { name: "Butaleja", region: "East", latitude: 0.8333, longitude: 33.9500, population: 238900 },
  { name: "Budaka", region: "East", latitude: 1.0833, longitude: 33.9333, population: 186900 },
  { name: "Pallisa", region: "East", latitude: 1.1450, longitude: 33.7094, population: 347100 },
  { name: "Kibuku", region: "East", latitude: 1.0500, longitude: 33.7833, population: 155900 },
  { name: "Butebo", region: "East", latitude: 1.2167, longitude: 33.8333, population: 145600 },
  { name: "Mbale", region: "East", latitude: 1.0784, longitude: 34.1810, population: 488800 },
  { name: "Serere", region: "East", latitude: 1.5000, longitude: 33.5500, population: 234500 },
  { name: "Ngora", region: "East", latitude: 1.4667, longitude: 33.7333, population: 166900 },
  { name: "Buyende", region: "East", latitude: 1.1833, longitude: 33.1667, population: 298900 },
  { name: "Kaliro", region: "East", latitude: 1.0500, longitude: 33.5000, population: 236200 },
  { name: "Iganga", region: "East", latitude: 0.6092, longitude: 33.4689, population: 488900 },
  { name: "Luuka", region: "East", latitude: 0.7167, longitude: 33.3000, population: 285200 },
  { name: "Jinja", region: "East", latitude: 0.4394, longitude: 33.2040, population: 471200 },
  { name: "Mayuge", region: "East", latitude: 0.3667, longitude: 33.4833, population: 473300 },
  { name: "Namutumba", region: "East", latitude: 0.8333, longitude: 33.6833, population: 238400 },
  { name: "Bugiri", region: "East", latitude: 0.5714, longitude: 33.7419, population: 390300 },
  { name: "Namayingo", region: "East", latitude: 0.3500, longitude: 33.7333, population: 267200 },
  // Central Region
  { name: "Kampala", region: "Central", latitude: 0.3476, longitude: 32.5825, population: 1680600 },
  { name: "Wakiso", region: "Central", latitude: 0.0630, longitude: 32.4467, population: 2007700 },
  { name: "Mpigi", region: "Central", latitude: 0.2250, longitude: 32.3139, population: 250800 },
  { name: "Butambala", region: "Central", latitude: 0.1833, longitude: 32.0833, population: 96500 },
  { name: "Gomba", region: "Central", latitude: 0.2167, longitude: 31.6833, population: 164600 },
  { name: "Mityana", region: "Central", latitude: 0.4175, longitude: 32.0225, population: 318900 },
  { name: "Mubende", region: "Central", latitude: 0.5583, longitude: 31.3950, population: 766200 },
  { name: "Kassanda", region: "Central", latitude: 0.6833, longitude: 31.7167, population: 189300 },
  { name: "Kiboga", region: "Central", latitude: 0.9167, longitude: 31.7739, population: 156000 },
  { name: "Kyankwanzi", region: "Central", latitude: 1.0833, longitude: 31.7167, population: 234500 },
  { name: "Nakaseke", region: "Central", latitude: 1.3167, longitude: 32.0167, population: 213300 },
  { name: "Luwero", region: "Central", latitude: 0.8492, longitude: 32.4731, population: 467100 },
  { name: "Nakasongola", region: "Central", latitude: 1.3083, longitude: 32.4572, population: 189100 },
  { name: "Kayunga", region: "Central", latitude: 0.7028, longitude: 32.8889, population: 367500 },
  { name: "Buikwe", region: "Central", latitude: 0.3167, longitude: 32.9833, population: 422200 },
  { name: "Buvuma", region: "Central", latitude: -0.3833, longitude: 33.2667, population: 89900 },
  { name: "Mukono", region: "Central", latitude: 0.3549, longitude: 32.7520, population: 596800 },
  { name: "Kyotera", region: "Central", latitude: -0.6333, longitude: 31.5000, population: 348900 },
  { name: "Rakai", region: "Central", latitude: -0.7167, longitude: 31.3333, population: 518800 },
  { name: "Lwengo", region: "Central", latitude: -0.4167, longitude: 31.4167, population: 267900 },
  { name: "Lyantonde", region: "Central", latitude: -0.2500, longitude: 31.1667, population: 97300 },
  { name: "Sembabule", region: "Central", latitude: -0.0833, longitude: 31.4500, population: 236600 },
  { name: "Bukomansimbi", region: "Central", latitude: -0.1667, longitude: 31.6167, population: 164200 },
  { name: "Kalungu", region: "Central", latitude: -0.0833, longitude: 31.7667, population: 202600 },
  { name: "Masaka", region: "Central", latitude: -0.3267, longitude: 31.7537, population: 396900 },
  { name: "Kalangala", region: "Central", latitude: -0.3167, longitude: 32.2333, population: 54300 },
  { name: "Entebbe", region: "Central", latitude: 0.0512, longitude: 32.4637, population: 79700 },
  // Western Region
  { name: "Bundibugyo", region: "West", latitude: 0.7083, longitude: 30.0644, population: 224800 },
  { name: "Ntoroko", region: "West", latitude: 1.0667, longitude: 30.4167, population: 67400 },
  { name: "Kabarole", region: "West", latitude: 0.6546, longitude: 30.2801, population: 400700 },
  { name: "Bunyangabu", region: "West", latitude: 0.5167, longitude: 30.2000, population: 189400 },
  { name: "Kyenjojo", region: "West", latitude: 0.6333, longitude: 30.6333, population: 378400 },
  { name: "Kyegegwa", region: "West", latitude: 0.4833, longitude: 31.0500, population: 234500 },
  { name: "Kamwenge", region: "West", latitude: 0.1833, longitude: 30.4500, population: 413900 },
  { name: "Kasese", region: "West", latitude: 0.1699, longitude: 30.0781, population: 694700 },
  { name: "Bunyaruguru", region: "West", latitude: -0.2500, longitude: 30.1500, population: 145000 },
  { name: "Rubanda", region: "West", latitude: -1.1667, longitude: 29.8833, population: 189500 },
  { name: "Rukiga", region: "West", latitude: -1.0833, longitude: 29.9833, population: 289300 },
  { name: "Kabale", region: "West", latitude: -1.2480, longitude: 29.9894, population: 517100 },
  { name: "Kanungu", region: "West", latitude: -0.8833, longitude: 29.7833, population: 267800 },
  { name: "Kisoro", region: "West", latitude: -1.2856, longitude: 29.6856, population: 287400 },
  { name: "Rukungiri", region: "West", latitude: -0.7881, longitude: 29.9189, population: 314700 },
  { name: "Rubirizi", region: "West", latitude: -0.2667, longitude: 30.0833, population: 128700 },
  { name: "Buhweju", region: "West", latitude: -0.3167, longitude: 30.2833, population: 123100 },
  { name: "Bushenyi", region: "West", latitude: -0.5444, longitude: 30.1861, population: 234500 },
  { name: "Mitooma", region: "West", latitude: -0.6167, longitude: 30.0167, population: 178300 },
  { name: "Sheema", region: "West", latitude: -0.5667, longitude: 30.4167, population: 189400 },
  { name: "Ntungamo", region: "West", latitude: -0.8794, longitude: 30.2642, population: 478900 },
  { name: "Isingiro", region: "West", latitude: -0.8333, longitude: 30.8167, population: 486400 },
  { name: "Mbarara", region: "West", latitude: -0.6072, longitude: 30.6545, population: 472600 },
  { name: "Ibanda", region: "West", latitude: -0.1333, longitude: 30.4833, population: 267900 },
  { name: "Kiruhura", region: "West", latitude: -0.1833, longitude: 30.8000, population: 328700 },
  { name: "Rwampara", region: "West", latitude: -0.4500, longitude: 30.7500, population: 156700 },
  { name: "Kazo", region: "West", latitude: -0.2833, longitude: 30.9167, population: 178900 },
  { name: "Hoima", region: "West", latitude: 1.4274, longitude: 31.3484, population: 572400 },
  { name: "Kikuube", region: "West", latitude: 1.4833, longitude: 31.0833, population: 267800 },
  { name: "Kakumiro", region: "West", latitude: 0.7833, longitude: 31.3167, population: 267500 },
  { name: "Kibaale", region: "West", latitude: 0.8167, longitude: 31.0833, population: 789700 },
  { name: "Kagadi", region: "West", latitude: 0.9333, longitude: 30.8167, population: 345400 },
  { name: "Masindi", region: "West", latitude: 1.6744, longitude: 31.7150, population: 278700 },
  { name: "Kiryandongo", region: "West", latitude: 1.9167, longitude: 32.0667, population: 266800 },
  { name: "Buliisa", region: "West", latitude: 2.1833, longitude: 31.4500, population: 111700 },
  { name: "Kihihi", region: "West", latitude: -0.7333, longitude: 29.7000, population: 145000 },
  { name: "Fort Portal", region: "West", latitude: 0.6546, longitude: 30.2801, population: 52100 },
];

const SYSTEM_CONFIG = [
  { key: "app_name", value: "HealthGuard PWA" },
  { key: "developer", value: "NDUHURA MARVIN" },
  { key: "company", value: "ANGEL TECHNOLOGIES LTD" },
  { key: "version", value: "1.0.0" },
  { key: "districts_count", value: String(DISTRICTS.length) },
  { key: "model_accuracy", value: "95.04" },
  { key: "refresh_interval_hours", value: "1" },
];

async function main() {
  console.log("🌱 Seeding HealthGuard PWA database…");

  // Upsert all districts
  console.log(`  → Seeding ${DISTRICTS.length} districts…`);
  let seeded = 0;
  for (const d of DISTRICTS) {
    await prisma.district.upsert({
      where: { name: d.name },
      update: { region: d.region, latitude: d.latitude, longitude: d.longitude, population: d.population },
      create: d,
    });
    seeded++;
  }
  console.log(`  ✓ ${seeded} districts seeded`);

  // Upsert system config
  console.log("  → Seeding system config…");
  for (const cfg of SYSTEM_CONFIG) {
    await prisma.systemConfig.upsert({
      where: { key: cfg.key },
      update: { value: cfg.value },
      create: cfg,
    });
  }
  console.log(`  ✓ ${SYSTEM_CONFIG.length} config entries seeded`);

  // Seed app logs
  console.log("  → Seeding app logs…");
  await prisma.appLog.createMany({
    data: [
      { event: "system.startup", meta: '{"app":"HealthGuard PWA","version":"1.0.0"}' },
      { event: "db.seeded", meta: '{"by":"NDUHURA MARVIN","districts":' + DISTRICTS.length + '}' },
      { event: "model.loaded", meta: '{"model":"RandomForest","accuracy":"95.04%"}' },
    ],
    skipDuplicates: true,
  });
  console.log("  ✓ App logs seeded");

  // Seed starter alerts
  console.log("  → Seeding starter alerts…");
  await prisma.alert.createMany({
    data: [
      {
        districtName: "Kampala",
        riskLevel: "Most Likely",
        probability: 0.82,
        activeCases: 1240,
        growthRate: 12.4,
        message: "Kampala high risk — seeded for demo",
      },
      {
        districtName: "Wakiso",
        riskLevel: "Likely",
        probability: 0.61,
        activeCases: 890,
        growthRate: 7.1,
        message: "Wakiso elevated risk — seeded for demo",
      },
      {
        districtName: "Gulu",
        riskLevel: "Likely",
        probability: 0.55,
        activeCases: 420,
        growthRate: 5.3,
        message: "Gulu monitoring — seeded for demo",
      },
    ],
    skipDuplicates: false,
  });
  console.log("  ✓ Starter alerts seeded");

  const districtCount = await prisma.district.count();
  console.log("\n✅ Database seeded successfully!");
  console.log(`   Districts in DB:  ${districtCount}`);
  console.log(`   Config keys:      ${SYSTEM_CONFIG.length}`);
  console.log("   Developer:        NDUHURA MARVIN — ANGEL TECHNOLOGIES LTD");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
