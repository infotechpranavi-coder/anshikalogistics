import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@fleetfuel.com";
  const user = await prisma.user.findUnique({ where: { email } });
  console.log(
    JSON.stringify(
      {
        found: Boolean(user),
        email: user?.email,
        isActive: user?.isActive,
        hasPassword: Boolean(user?.password),
        role: user?.role,
        companyId: user?.companyId,
        passwordOk: user?.password
          ? await bcrypt.compare("password123", user.password)
          : false,
        totalUsers: await prisma.user.count(),
      },
      null,
      2
    )
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
