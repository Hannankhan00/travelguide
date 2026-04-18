import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email    = "admin@gmail.com";
  const name     = "admin";
  const password = "qwerty1234";

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where:  { email },
    update: { hashedPassword, role: "ADMIN", name },
    create: {
      email,
      name,
      role:           "ADMIN",
      hashedPassword,
      emailVerified:  new Date(),
    },
  });

  console.log("✅ Admin user created / updated:");
  console.log("   Email   :", user.email);
  console.log("   Name    :", user.name);
  console.log("   Role    :", user.role);
  console.log("   Password: qwerty1234  (hashed stored in DB)");
}

main()
  .catch((e) => { console.error("❌", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
