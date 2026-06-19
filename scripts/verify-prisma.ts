/**
 * HealthGuard PWA — Prisma Connection Verifier
 * Run: npx tsx scripts/verify-prisma.ts
 */
import "dotenv/config";
import { PrismaClient } from "../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

async function verify() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("❌ DATABASE_URL not set in .env");
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // Read operations
    const [districtCount, configCount, logCount, alertCount] = await Promise.all([
      prisma.district.count(),
      prisma.systemConfig.count(),
      prisma.appLog.count(),
      prisma.alert.count(),
    ]);

    const config = await prisma.systemConfig.findMany({ take: 4 });
    const sampleDistricts = await prisma.district.findMany({ take: 3, select: { name: true, region: true, population: true } });

    console.log("\n✅ Connected to Prisma Postgres successfully!\n");
    console.log("─".repeat(50));
    console.log("📊 Table counts:");
    console.log(`   districts:          ${districtCount}`);
    console.log(`   system_config:      ${configCount}`);
    console.log(`   app_logs:           ${logCount}`);
    console.log(`   alerts:             ${alertCount}`);
    console.log("\n⚙️  System config:");
    config.forEach(c => console.log(`   ${c.key}: ${c.value}`));
    console.log("\n📍 Sample districts:");
    sampleDistricts.forEach(d => console.log(`   ${d.name} (${d.region}) — pop: ${d.population.toLocaleString()}`));
    console.log("─".repeat(50));
    console.log("\n🎉 Prisma Postgres fully operational!");
    console.log("   Next steps:");
    console.log("   1. npx prisma studio               → Open visual DB browser");
    console.log("   2. import { prisma } from '@/lib/prisma'  → Use in server code");
    console.log("   3. Add models to prisma/schema.prisma and run migrate dev");

  } catch (e) {
    console.error("\n❌ Connection failed:", e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

verify();
