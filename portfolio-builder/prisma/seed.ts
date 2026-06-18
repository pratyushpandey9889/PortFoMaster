import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import * as bcrypt from "bcryptjs";
import path from "path";

const DB_PATH = path.join(__dirname, "dev.db");

const adapter = new PrismaBetterSqlite3({ url: DB_PATH });

async function main() {
  console.log("Seeding database...");

  const prisma = new PrismaClient({ adapter });

  try {
    const passwordHash = await bcrypt.hash("testpassword123", 12);

    const user = await prisma.user.upsert({
      where: { email: "test@example.com" },
      update: {},
      create: {
        email: "test@example.com",
        username: "testuser",
        passwordHash,
        portfolio: {
          create: {
            name: "",
            title: "",
            location: "",
            bio: "",
            theme: "minimal",
          },
        },
      },
    });

    console.log(
      `Seeded test user: ${user.email} (username: ${user.username})`
    );
    console.log("Done.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
