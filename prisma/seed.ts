import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 14) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 14 characters) before seeding.");
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash, failedLoginCount: 0, lockedUntil: null },
    create: { email, passwordHash }
  });
  console.log(`Admin account configured for ${email}`);
}

main().finally(async () => prisma.$disconnect());
